import { describe, it, expect } from "vitest";
import { validatePassword, moroccanPhoneSchema } from "./password-policy.ts";

describe("validatePassword", () => {
  it("rejects short passwords", () => {
    const r = validatePassword("Ab1!");
    expect(r.isValid).toBe(false);
  });

  it("accepts a strong password", () => {
    const r = validatePassword("Str0ng!Pass");
    expect(r.isValid).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(3);
  });

  it("zeroes the score for common passwords", () => {
    const r = validatePassword("password123");
    expect(r.score).toBe(0);
    expect(r.isValid).toBe(false);
  });

  it("penalizes repeated characters", () => {
    const repeated = validatePassword("Aaaa1111!!!!");
    const clean = validatePassword("Abcd1234!xZ");
    expect(repeated.score).toBeLessThan(clean.score);
  });
});

describe("moroccanPhoneSchema", () => {
  it("accepts valid Moroccan numbers", () => {
    expect(moroccanPhoneSchema.safeParse("+212612345678").success).toBe(true);
    expect(moroccanPhoneSchema.safeParse("0612345678").success).toBe(true);
  });

  it("rejects invalid numbers", () => {
    expect(moroccanPhoneSchema.safeParse("12345").success).toBe(false);
    expect(moroccanPhoneSchema.safeParse("+33612345678").success).toBe(false);
  });
});
