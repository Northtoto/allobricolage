/**
 * P0-3 — Service guarantee logic (anti-arnaque trust stack).
 *
 * A completed booking carries a guarantee: for `guaranteePeriodDays` after the
 * job finished (`actualEndTime`), the client can open a warranty claim that may
 * trigger a free re-visit. These pure functions are the single source of truth
 * for "is this booking still covered?" — the route and the client UI both call
 * them, so the policy lives in exactly one place.
 */

/**
 * Default coverage granted when a booking is marked completed. The roadmap calls
 * for an "N-day re-intervention warranty"; 7 days covers the window in which a
 * faulty repair (leak returns, switch fails) typically resurfaces.
 */
export const DEFAULT_GUARANTEE_PERIOD_DAYS = 7;

export interface WarrantyBooking {
  /** Booking lifecycle status: only "completed" jobs can be under warranty. */
  status: string;
  /** When the technician finished the job. Null until completed. */
  actualEndTime: Date | null;
  /** Days of coverage granted at completion. 0 means no active guarantee. */
  guaranteePeriodDays: number;
}

/**
 * The instant the guarantee lapses, or null if the booking was never eligible
 * (not completed, no completion time, or zero guarantee days).
 *
 * TODO(you): implement. Eligibility requires ALL of:
 *   - status === "completed"
 *   - actualEndTime is a real Date (not null)
 *   - guaranteePeriodDays > 0
 * When eligible, return actualEndTime + guaranteePeriodDays (in days).
 * Otherwise return null.
 */
export function warrantyExpiresAt(booking: WarrantyBooking): Date | null {
  if (booking.status !== "completed") return null;
  if (!booking.actualEndTime) return null;
  if (booking.guaranteePeriodDays <= 0) return null;

  const DAY_MS = 86_400_000;
  return new Date(booking.actualEndTime.getTime() + booking.guaranteePeriodDays * DAY_MS);
}

/**
 * Whether `booking` is still under warranty at instant `now`.
 *
 * TODO(you): implement on top of warrantyExpiresAt. Decide the boundary
 * convention (is a claim filed at the exact expiry instant still valid?).
 * The tests check "1h before expiry = true" and "1 day after = false", so the
 * exact millisecond boundary is yours to choose.
 */
export function isUnderWarranty(
  booking: WarrantyBooking,
  now: Date = new Date(),
): boolean {
  const expiry = warrantyExpiresAt(booking);
  if (!expiry) return false;
  // Inclusive boundary: a claim filed at the exact expiry instant still counts.
  // The whole feature is a trust signal, so we resolve ties in the client's favour.
  return now.getTime() <= expiry.getTime();
}
