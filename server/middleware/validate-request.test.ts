import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { validateBody, validateParams } from "./validate-request.ts";
import { ValidationError } from "@/utils/errors.ts";

function run(mw: (req: Request, res: Response, next: NextFunction) => void, req: Partial<Request>) {
  const next = vi.fn();
  mw(req as Request, {} as Response, next as NextFunction);
  return next;
}

describe("validateBody", () => {
  const schema = z.object({ email: z.string().email() });

  it("passes valid input and assigns parsed data", () => {
    const req = { body: { email: "a@b.com" } } as Partial<Request>;
    const next = run(validateBody(schema), req);
    expect(next).toHaveBeenCalledWith();
  });

  it("forwards a ValidationError on invalid input", () => {
    const next = run(validateBody(schema), { body: { email: "nope" } });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
  });
});

describe("validateParams", () => {
  const schema = z.object({ id: z.string().uuid() });

  it("rejects a non-UUID id with ValidationError", () => {
    const next = run(validateParams(schema), { params: { id: "not-a-uuid" } });
    expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
  });

  it("accepts a valid UUID", () => {
    const next = run(validateParams(schema), { params: { id: "123e4567-e89b-12d3-a456-426614174000" } });
    expect(next).toHaveBeenCalledWith();
  });
});
