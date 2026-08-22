import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("@/utils/logger.ts", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { errorHandler, notFoundHandler, asyncHandler } from "./error-handler.ts";
import { logger } from "@/utils/logger.ts";
import { AppError, ValidationError, NotFoundError } from "@/utils/errors.ts";

function mockRes(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

beforeEach(() => vi.clearAllMocks());

describe("errorHandler", () => {
  it("formats a ValidationError as 400 with field details", () => {
    const res = mockRes();
    const err = new ValidationError("Invalid input", { email: "required" });

    errorHandler(err, {} as Request, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: { fields: { email: "required" } },
      },
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("formats an operational AppError using its own status/code and does not log", () => {
    const res = mockRes();
    const err = new NotFoundError("Booking", "b1");

    errorHandler(err, {} as Request, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "NOT_FOUND", message: "Booking 'b1' not found" },
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("logs a non-operational AppError before responding with its status/code", () => {
    const res = mockRes();
    const err = new AppError("DB pool exhausted", 503, "SERVICE_UNAVAILABLE", false);

    errorHandler(err, {} as Request, res, vi.fn() as NextFunction);

    expect(logger.error).toHaveBeenCalledWith(
      "Non-operational error:",
      expect.objectContaining({ message: "DB pool exhausted", code: "SERVICE_UNAVAILABLE" })
    );
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "SERVICE_UNAVAILABLE", message: "DB pool exhausted" },
    });
  });

  it("turns an unknown error into a safe 500 without leaking internals", () => {
    const res = mockRes();
    const err = new Error('relation "users" does not exist at /app/db/pool.ts:42');

    errorHandler(err, {} as Request, res, vi.fn() as NextFunction);

    expect(logger.error).toHaveBeenCalledWith(
      "Unhandled error:",
      expect.objectContaining({ message: err.message, stack: err.stack })
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    });

    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(JSON.stringify(body)).not.toContain("relation");
    expect(JSON.stringify(body)).not.toContain("pool.ts");
  });
});

describe("notFoundHandler", () => {
  it("responds 404 naming the requested method and path", () => {
    const res = mockRes();
    const req = { method: "GET", path: "/api/unknown" } as Request;

    notFoundHandler(req, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "NOT_FOUND", message: "Route GET /api/unknown not found" },
    });
  });
});

describe("asyncHandler", () => {
  it("invokes the wrapped handler with req/res/next and does not call next on success", async () => {
    const handler = vi.fn(async () => {});
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn();

    asyncHandler(handler)(req, res, next as NextFunction);
    await new Promise((resolve) => setImmediate(resolve));

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards a rejected promise's error to next", async () => {
    const err = new Error("boom");
    const handler = vi.fn(async () => {
      throw err;
    });
    const next = vi.fn();

    asyncHandler(handler)({} as Request, {} as Response, next as NextFunction);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(err);
  });
});
