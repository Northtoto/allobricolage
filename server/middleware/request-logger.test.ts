import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("@/utils/logger.ts", () => ({
  requestLogger: { info: vi.fn() },
}));

import { requestLoggerMiddleware } from "./request-logger.ts";
import { requestLogger } from "@/utils/logger.ts";

beforeEach(() => vi.clearAllMocks());

function mockRes(statusCode: number) {
  const listeners: Record<string, () => void> = {};
  const res = {
    statusCode,
    on: vi.fn((event: string, cb: () => void) => {
      listeners[event] = cb;
      return res;
    }),
    emitFinish: () => listeners.finish?.(),
  };
  return res as unknown as Response & { emitFinish: () => void };
}

describe("requestLoggerMiddleware", () => {
  it("calls next synchronously and logs nothing until the response finishes", () => {
    const req = { method: "GET", path: "/api/health", ip: "127.0.0.1" } as Request;
    const res = mockRes(200);
    const next = vi.fn();

    requestLoggerMiddleware(req, res, next as NextFunction);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.on).toHaveBeenCalledWith("finish", expect.any(Function));
    expect(requestLogger.info).not.toHaveBeenCalled();
  });

  it("does not mutate req or res before delegating to next", () => {
    const req = { method: "GET", path: "/api/health", ip: "127.0.0.1" } as Request;
    const reqSnapshot = { ...req };
    const res = mockRes(200);

    requestLoggerMiddleware(req, res, vi.fn() as NextFunction);

    expect(req).toEqual(reqSnapshot);
    expect(res.statusCode).toBe(200);
  });

  it("logs a structured HTTP Request event once the response finishes", () => {
    const req = {
      method: "POST",
      path: "/api/bookings",
      ip: "10.0.0.5",
      user: { id: "user-1" },
    } as unknown as Request;
    const res = mockRes(201);

    requestLoggerMiddleware(req, res, vi.fn() as NextFunction);
    res.emitFinish();

    expect(requestLogger.info).toHaveBeenCalledTimes(1);
    const [message, meta] = (requestLogger.info as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(message).toBe("HTTP Request");
    expect(meta).toMatchObject({
      method: "POST",
      path: "/api/bookings",
      statusCode: 201,
      ip: "10.0.0.5",
      userId: "user-1",
    });
    expect(meta.duration).toBeTypeOf("number");
    expect(meta.duration).toBeGreaterThanOrEqual(0);
  });

  it("logs userId as undefined when the request has no authenticated user", () => {
    const req = { method: "GET", path: "/api/ping", ip: "1.2.3.4" } as Request;
    const res = mockRes(200);

    requestLoggerMiddleware(req, res, vi.fn() as NextFunction);
    res.emitFinish();

    const meta = (requestLogger.info as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(meta.userId).toBeUndefined();
  });
});
