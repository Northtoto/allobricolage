import { describe, it, expect, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { securityHeaders, helmetConfig } from "./security-headers.ts";

function run(mw: (req: Request, res: Response, next: NextFunction) => void, req: Partial<Request> = {}) {
  const headers: Record<string, string> = {};
  const res = {
    setHeader: vi.fn((name: string, value: string) => {
      headers[name] = value;
    }),
  } as unknown as Response;
  const next = vi.fn();
  mw(req as Request, res, next as NextFunction);
  return { res, next, headers };
}

describe("securityHeaders", () => {
  it("calls next()", () => {
    const { next } = run(securityHeaders);
    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("sets X-DNS-Prefetch-Control to off", () => {
    const { headers } = run(securityHeaders);
    expect(headers["X-DNS-Prefetch-Control"]).toBe("off");
  });

  it("sets X-Permitted-Cross-Domain-Policies to none", () => {
    const { headers } = run(securityHeaders);
    expect(headers["X-Permitted-Cross-Domain-Policies"]).toBe("none");
  });

  it("sets a restrictive Permissions-Policy", () => {
    const { headers } = run(securityHeaders);
    expect(headers["Permissions-Policy"]).toBe("geolocation=(self), camera=(), microphone=()");
  });
});

describe("helmetConfig", () => {
  it("is a middleware function", () => {
    expect(typeof helmetConfig).toBe("function");
  });

  it("sets helmet's baseline security headers (non-CSP, non-HSTS — those are prod-only)", () => {
    const req = { headers: {} } as unknown as Request;
    const headers: Record<string, string> = {};
    const res = {
      getHeader: (name: string) => headers[name],
      setHeader: (name: string, value: string | string[]) => {
        headers[name] = Array.isArray(value) ? value.join(", ") : value;
        return res;
      },
      removeHeader: (name: string) => {
        delete headers[name];
      },
    } as unknown as Response;
    const next = vi.fn();

    helmetConfig(req, res, next as NextFunction);

    expect(next).toHaveBeenCalledWith();
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-DNS-Prefetch-Control"]).toBe("off");
    expect(headers["X-Download-Options"]).toBe("noopen");
    expect(headers["X-Permitted-Cross-Domain-Policies"]).toBe("none");
    expect(headers["Cross-Origin-Resource-Policy"]).toBe("cross-origin");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Origin-Agent-Cluster"]).toBe("?1");
    // hidePoweredBy removes X-Powered-By rather than setting it
    expect(headers["X-Powered-By"]).toBeUndefined();
  });

  it("does not set a Content-Security-Policy or HSTS header outside production (isProd is false in test env)", () => {
    const req = { headers: {} } as unknown as Request;
    const headers: Record<string, string> = {};
    const res = {
      getHeader: (name: string) => headers[name],
      setHeader: (name: string, value: string | string[]) => {
        headers[name] = Array.isArray(value) ? value.join(", ") : value;
        return res;
      },
      removeHeader: (name: string) => {
        delete headers[name];
      },
    } as unknown as Response;
    const next = vi.fn();

    helmetConfig(req, res, next as NextFunction);

    expect(headers["Content-Security-Policy"]).toBeUndefined();
    expect(headers["Strict-Transport-Security"]).toBeUndefined();
  });
});
