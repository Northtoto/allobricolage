import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  TooManyRequestsError,
  getErrorMessage,
  isAppError,
} from "./errors.ts";

describe("error classes carry the right status code + code", () => {
  it("maps each error type to its HTTP status and code", () => {
    expect([new UnauthorizedError().statusCode, new UnauthorizedError().code]).toEqual([401, "UNAUTHORIZED"]);
    expect([new ForbiddenError().statusCode, new ForbiddenError().code]).toEqual([403, "FORBIDDEN"]);
    expect([new ConflictError("dup").statusCode, new ConflictError("dup").code]).toEqual([409, "CONFLICT"]);
    expect([new TooManyRequestsError().statusCode, new TooManyRequestsError().code]).toEqual([429, "TOO_MANY_REQUESTS"]);
  });

  it("NotFoundError formats resource + identifier", () => {
    const e = new NotFoundError("User", "u1");
    expect(e.statusCode).toBe(404);
    expect(e.message).toMatch(/User 'u1' not found/);
  });

  it("ValidationError is 400 and exposes field errors", () => {
    const e = new ValidationError("bad", { email: "invalid" });
    expect(e.statusCode).toBe(400);
    expect(e.code).toBe("VALIDATION_ERROR");
    expect(e.fields).toEqual({ email: "invalid" });
  });

  it("all are operational AppErrors and real Errors", () => {
    for (const e of [new UnauthorizedError(), new ConflictError("x"), new NotFoundError("X")]) {
      expect(e).toBeInstanceOf(AppError);
      expect(e).toBeInstanceOf(Error);
      expect(e.isOperational).toBe(true);
    }
  });
});

describe("getErrorMessage", () => {
  it("extracts Error.message and falls back for non-errors", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
    expect(getErrorMessage("nope")).toMatch(/unexpected/i);
    expect(getErrorMessage(undefined)).toMatch(/unexpected/i);
  });
});

describe("isAppError", () => {
  it("narrows AppError instances only", () => {
    expect(isAppError(new ForbiddenError())).toBe(true);
    expect(isAppError(new Error("plain"))).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});
