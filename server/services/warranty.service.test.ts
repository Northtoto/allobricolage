import { describe, it, expect } from "vitest";
import {
  isUnderWarranty,
  warrantyExpiresAt,
  type WarrantyBooking,
} from "./warranty.service.ts";

// P0-3 anti-arnaque trust stack: a completed job is covered for
// `guaranteePeriodDays` after `actualEndTime`. While covered, the client may
// open a warranty claim that can trigger a free re-visit. These tests pin the
// eligibility policy so the route and UI can rely on it.

const completedAt = new Date("2026-06-01T10:00:00Z");

function booking(overrides: Partial<WarrantyBooking> = {}): WarrantyBooking {
  return {
    status: "completed",
    actualEndTime: completedAt,
    guaranteePeriodDays: 7,
    ...overrides,
  };
}

describe("warrantyExpiresAt", () => {
  it("returns actualEndTime + guaranteePeriodDays for an eligible booking", () => {
    const expiry = warrantyExpiresAt(booking());
    expect(expiry?.toISOString()).toBe("2026-06-08T10:00:00.000Z");
  });

  it("returns null when the booking is not completed", () => {
    expect(warrantyExpiresAt(booking({ status: "in_progress" }))).toBeNull();
  });

  it("returns null when there is no completion timestamp", () => {
    expect(warrantyExpiresAt(booking({ actualEndTime: null }))).toBeNull();
  });

  it("returns null when the guarantee period is zero", () => {
    expect(warrantyExpiresAt(booking({ guaranteePeriodDays: 0 }))).toBeNull();
  });
});

describe("isUnderWarranty", () => {
  it("is true within the guarantee window", () => {
    const oneHourBeforeExpiry = new Date("2026-06-08T09:00:00Z");
    expect(isUnderWarranty(booking(), oneHourBeforeExpiry)).toBe(true);
  });

  it("is false after the window has elapsed", () => {
    const oneDayAfterExpiry = new Date("2026-06-09T10:00:00Z");
    expect(isUnderWarranty(booking(), oneDayAfterExpiry)).toBe(false);
  });

  it("is false for a booking that is not completed", () => {
    const now = new Date("2026-06-02T10:00:00Z");
    expect(isUnderWarranty(booking({ status: "cancelled" }), now)).toBe(false);
  });

  it("is false when no guarantee was granted (0 days)", () => {
    const now = new Date("2026-06-02T10:00:00Z");
    expect(isUnderWarranty(booking({ guaranteePeriodDays: 0 }), now)).toBe(false);
  });
});
