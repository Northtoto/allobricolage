import { describe, it, expect } from "vitest";
import { ApiRequestError, isErrorCode, getErrorMessage } from "./api-client";

describe("ApiRequestError", () => {
  it("carries code, statusCode and details", () => {
    const e = new ApiRequestError("boom", "VALIDATION_ERROR", 400, { field: "email" });
    expect(e.code).toBe("VALIDATION_ERROR");
    expect(e.statusCode).toBe(400);
    expect(e.details).toEqual({ field: "email" });
    expect(e).toBeInstanceOf(Error);
  });
});

describe("isErrorCode", () => {
  it("matches the code on an ApiRequestError and ignores other errors", () => {
    expect(isErrorCode(new ApiRequestError("x", "NOT_FOUND", 404), "NOT_FOUND")).toBe(true);
    expect(isErrorCode(new ApiRequestError("x", "NOT_FOUND", 404), "FORBIDDEN")).toBe(false);
    expect(isErrorCode(new Error("plain"), "NOT_FOUND")).toBe(false);
  });
});

describe("getErrorMessage", () => {
  it("maps known API error codes to French user messages", () => {
    expect(getErrorMessage(new ApiRequestError("x", "UNAUTHORIZED", 401))).toMatch(/reconnecter/i);
    expect(getErrorMessage(new ApiRequestError("x", "FORBIDDEN", 403))).toMatch(/autorisation/i);
    expect(getErrorMessage(new ApiRequestError("x", "TOO_MANY_REQUESTS", 429))).toMatch(/trop de requêtes/i);
    expect(getErrorMessage(new ApiRequestError("x", "TIMEOUT", 0))).toMatch(/lente/i);
  });

  it("prefers the server message for validation errors", () => {
    expect(getErrorMessage(new ApiRequestError("Email invalide", "VALIDATION_ERROR", 400))).toBe("Email invalide");
  });

  it("handles network errors and unknown values", () => {
    expect(getErrorMessage(new Error("NetworkError when fetching"))).toMatch(/connexion/i);
    expect(getErrorMessage("not an error")).toMatch(/inattendue/i);
  });
});
