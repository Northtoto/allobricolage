import { describe, it, expect, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import {
  generalLimiter,
  authLimiter,
  apiLimiter,
  strictLimiter,
  passwordChangeLimiter,
  uploadLimiter,
} from "./rate-limiter.ts";

type Limiter = (req: Request, res: Response, next: NextFunction) => unknown;

// Distinct IPs per test keep each limiter's window state isolated — the
// limiters are module-level singletons shared across the whole file.
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `10.50.${ipCounter}.1`;
}

function makeReq(ip: string): Request {
  return { ip, headers: {}, app: { get: () => undefined } } as unknown as Request;
}

function makeRes(): Response {
  const res: Record<string, unknown> = { headersSent: false };
  res.setHeader = vi.fn();
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res as unknown as Response;
}

async function hit(limiter: Limiter, req: Request, res: Response) {
  const next = vi.fn();
  await limiter(req, res, next as NextFunction);
  return next;
}

// No REDIS_URL in test env (see vitest.setup.ts) → express-rate-limit's own
// in-memory store path, so window state genuinely accumulates per call.
describe("rate limiters (in-memory store)", () => {
  it("exports each limiter as Express middleware", () => {
    for (const l of [generalLimiter, authLimiter, apiLimiter, strictLimiter, passwordChangeLimiter, uploadLimiter]) {
      expect(typeof l).toBe("function");
    }
  });

  it("passwordChangeLimiter allows 5 requests then blocks the 6th", async () => {
    const ip = nextIp();
    for (let i = 0; i < 5; i++) {
      const res = makeRes();
      const next = await hit(passwordChangeLimiter, makeReq(ip), res);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    }
    const res = makeRes();
    const next = await hit(passwordChangeLimiter, makeReq(ip), res);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "TOO_MANY_REQUESTS", message: "Too many password change attempts" },
    });
  });

  it("strictLimiter allows 10 requests then blocks the 11th", async () => {
    const ip = nextIp();
    for (let i = 0; i < 10; i++) {
      await hit(strictLimiter, makeReq(ip), makeRes());
    }
    const res = makeRes();
    const next = await hit(strictLimiter, makeReq(ip), res);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "TOO_MANY_REQUESTS", message: "Rate limit exceeded for this operation" },
    });
  });

  it("authLimiter allows 10 requests then blocks the 11th", async () => {
    const ip = nextIp();
    for (let i = 0; i < 10; i++) {
      await hit(authLimiter, makeReq(ip), makeRes());
    }
    const res = makeRes();
    const next = await hit(authLimiter, makeReq(ip), res);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "TOO_MANY_REQUESTS", message: "Too many authentication attempts, please try again later" },
    });
  });

  it("uploadLimiter allows 10 requests then blocks the 11th", async () => {
    const ip = nextIp();
    for (let i = 0; i < 10; i++) {
      await hit(uploadLimiter, makeReq(ip), makeRes());
    }
    const res = makeRes();
    const next = await hit(uploadLimiter, makeReq(ip), res);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "TOO_MANY_REQUESTS", message: "Too many uploads, please try again later" },
    });
  });

  it("apiLimiter allows 60 requests then blocks the 61st", async () => {
    const ip = nextIp();
    for (let i = 0; i < 60; i++) {
      await hit(apiLimiter, makeReq(ip), makeRes());
    }
    const res = makeRes();
    const next = await hit(apiLimiter, makeReq(ip), res);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "TOO_MANY_REQUESTS", message: "API rate limit exceeded" },
    });
  });

  it("generalLimiter stays permissive across a handful of requests", async () => {
    const ip = nextIp();
    for (let i = 0; i < 5; i++) {
      const res = makeRes();
      const next = await hit(generalLimiter, makeReq(ip), res);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    }
  });

  it("sets standard RateLimit-* headers but not legacy X-RateLimit-* headers", async () => {
    const ip = nextIp();
    const res = makeRes();
    await hit(strictLimiter, makeReq(ip), res);
    expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "10");
    const setHeader = res.setHeader as unknown as ReturnType<typeof vi.fn>;
    const legacyCalls = setHeader.mock.calls.filter(([name]: [string]) => name.startsWith("X-RateLimit"));
    expect(legacyCalls).toHaveLength(0);
  });
});

describe("rate limiter store selection", () => {
  it("wires each limiter to a prefixed RedisStore when a Redis client is configured", async () => {
    vi.resetModules();
    const ctorSpy = vi.fn();
    vi.doMock("@/utils/redis.ts", () => ({ redisClient: { call: vi.fn() }, hasRedis: true }));
    vi.doMock("rate-limit-redis", () => ({
      default: class {
        increment = vi.fn();
        decrement = vi.fn();
        resetKey = vi.fn();
        constructor(opts: unknown) {
          ctorSpy(opts);
        }
      },
    }));

    await import("./rate-limiter.ts");

    expect(ctorSpy).toHaveBeenCalledTimes(6);
    const prefixes = ctorSpy.mock.calls.map(([opts]: [{ prefix: string }]) => opts.prefix).sort();
    expect(prefixes).toEqual(
      ["rl:api:", "rl:auth:", "rl:general:", "rl:pwchange:", "rl:strict:", "rl:upload:"].sort()
    );

    vi.doUnmock("@/utils/redis.ts");
    vi.doUnmock("rate-limit-redis");
    vi.resetModules();
  });

  it("falls back to express-rate-limit's own in-memory store when no Redis client is configured", async () => {
    vi.resetModules();
    const ctorSpy = vi.fn();
    vi.doMock("@/utils/redis.ts", () => ({ redisClient: null, hasRedis: false }));
    vi.doMock("rate-limit-redis", () => ({
      default: class {
        increment = vi.fn();
        decrement = vi.fn();
        resetKey = vi.fn();
        constructor(opts: unknown) {
          ctorSpy(opts);
        }
      },
    }));

    await import("./rate-limiter.ts");

    expect(ctorSpy).not.toHaveBeenCalled();

    vi.doUnmock("@/utils/redis.ts");
    vi.doUnmock("rate-limit-redis");
    vi.resetModules();
  });
});
