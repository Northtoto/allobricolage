import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("@/utils/logger.ts", () => ({
  logger: { info: vi.fn() },
}));

import { securityAudit, auditMiddleware } from "./audit-logger.ts";
import { logger } from "@/utils/logger.ts";

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

describe("securityAudit", () => {
  it("logs a SECURITY_AUDIT entry with the authenticated user's id and username", () => {
    const req = {
      ip: "10.0.0.5",
      headers: { "user-agent": "test-agent" },
      user: { id: "user-1", username: "alice" },
    } as unknown as Request;

    securityAudit("auth.login.success", req);

    expect(logger.info).toHaveBeenCalledTimes(1);
    const [message, entry] = (logger.info as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(message).toBe("SECURITY_AUDIT");
    expect(entry).toMatchObject({
      event: "auth.login.success",
      userId: "user-1",
      username: "alice",
      ip: "10.0.0.5",
      userAgent: "test-agent",
    });
    expect(entry.timestamp).toBeTypeOf("string");
    expect(() => new Date(entry.timestamp).toISOString()).not.toThrow();
  });

  it("logs userId and username as null when the request has no authenticated user", () => {
    const req = {
      ip: "127.0.0.1",
      headers: {},
    } as unknown as Request;

    securityAudit("access.unauthorized", req);

    const entry = (logger.info as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(entry.userId).toBeNull();
    expect(entry.username).toBeNull();
  });

  it("attaches optional metadata to the entry", () => {
    const req = { ip: "1.2.3.4", headers: {} } as unknown as Request;

    securityAudit("booking.status_changed", req, { bookingId: "b-1", from: "pending", to: "confirmed" });

    const entry = (logger.info as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(entry.metadata).toEqual({ bookingId: "b-1", from: "pending", to: "confirmed" });
  });

  it("does not throw when req is missing ip and headers", () => {
    const req = {} as Request;
    expect(() => securityAudit("security.suspicious_activity", req)).not.toThrow();

    const entry = (logger.info as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(entry.ip).toBeUndefined();
    expect(entry.userAgent).toBeUndefined();
  });
});

describe("auditMiddleware", () => {
  it("calls next synchronously and does not log before the response finishes", () => {
    const mw = auditMiddleware("auth.login.success");
    const req = { ip: "127.0.0.1", headers: {} } as unknown as Request;
    const res = mockRes(200);
    const next = vi.fn();

    mw(req, res, next as NextFunction);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.on).toHaveBeenCalledWith("finish", expect.any(Function));
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("logs the audit event once the response finishes with a 2xx status", () => {
    const mw = auditMiddleware("booking.created");
    const req = {
      ip: "10.0.0.1",
      headers: { "user-agent": "ua" },
      user: { id: "user-9", username: "bob" },
    } as unknown as Request;
    const res = mockRes(201);

    mw(req, res, vi.fn() as NextFunction);
    res.emitFinish();

    expect(logger.info).toHaveBeenCalledTimes(1);
    const [message, entry] = (logger.info as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(message).toBe("SECURITY_AUDIT");
    expect(entry).toMatchObject({ event: "booking.created", userId: "user-9", username: "bob" });
  });

  it("does not log when the response finishes with a non-2xx status", () => {
    const mw = auditMiddleware("payment.processed");
    const req = { ip: "10.0.0.1", headers: {} } as unknown as Request;
    const res = mockRes(500);

    mw(req, res, vi.fn() as NextFunction);
    res.emitFinish();

    expect(logger.info).not.toHaveBeenCalled();
  });

  it("does not log on a 3xx or 4xx response", () => {
    const mw = auditMiddleware("payment.failed");
    const req = { ip: "10.0.0.1", headers: {} } as unknown as Request;

    const redirect = mockRes(302);
    mw(req, redirect, vi.fn() as NextFunction);
    redirect.emitFinish();

    const notFound = mockRes(404);
    mw(req, notFound, vi.fn() as NextFunction);
    notFound.emitFinish();

    expect(logger.info).not.toHaveBeenCalled();
  });
});
