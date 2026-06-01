import { describe, it, expect } from "vitest";
import { successResponse, errorResponse, paginateResponse } from "./response.ts";

describe("successResponse", () => {
  it("wraps data with success:true and omits meta when absent", () => {
    const r = successResponse({ id: 1 });
    expect(r).toEqual({ success: true, data: { id: 1 } });
    expect(r).not.toHaveProperty("meta");
  });

  it("includes meta when provided", () => {
    const r = successResponse([1], { total: 1, page: 1, limit: 10 });
    expect(r.meta).toEqual({ total: 1, page: 1, limit: 10 });
  });
});

describe("errorResponse", () => {
  it("wraps an error with success:false and the code/message", () => {
    const r = errorResponse("NOT_FOUND", "missing");
    expect(r).toEqual({ success: false, error: { code: "NOT_FOUND", message: "missing" } });
  });

  it("includes details only when provided", () => {
    expect(errorResponse("X", "m", { f: "v" }).error!.details).toEqual({ f: "v" });
    expect(errorResponse("X", "m").error).not.toHaveProperty("details");
  });
});

describe("paginateResponse", () => {
  it("computes totalPages via ceil and carries page/limit", () => {
    const r = paginateResponse([1, 2], 25, 2, 10);
    expect(r.success).toBe(true);
    expect(r.meta).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3 });
  });

  it("handles an empty page (0 total -> 0 pages)", () => {
    expect(paginateResponse([], 0, 1, 10).meta!.totalPages).toBe(0);
  });
});
