import { describe, it, expect } from "vitest";
import { computeCommission, COMMISSION_RATES, RETAINER_COMMISSION_RATE } from "./commission.service.ts";

describe("computeCommission", () => {
  it("splits amount into commission + payout that always sum to the gross", () => {
    for (const amount of [100, 250, 999, 12345]) {
      const r = computeCommission({ amount, tier: "free" });
      expect(r.commissionAmount + r.technicianPayout).toBe(amount);
    }
  });

  it("charges the free tier the highest rate (18%)", () => {
    const r = computeCommission({ amount: 1000, tier: "free" });
    expect(r.commissionRate).toBe(0.18);
    expect(r.commissionAmount).toBe(180);
    expect(r.technicianPayout).toBe(820);
  });

  it("rewards higher tiers with lower commission (the upgrade incentive)", () => {
    const free = computeCommission({ amount: 1000, tier: "free" }).commissionAmount;
    const bronze = computeCommission({ amount: 1000, tier: "bronze" }).commissionAmount;
    const silver = computeCommission({ amount: 1000, tier: "silver" }).commissionAmount;
    const gold = computeCommission({ amount: 1000, tier: "gold" }).commissionAmount;
    expect(free).toBeGreaterThan(bronze);
    expect(bronze).toBeGreaterThan(silver);
    expect(silver).toBeGreaterThan(gold);
    expect(gold).toBe(120); // 12%
  });

  it("applies the preferential retainer rate regardless of tier", () => {
    const r = computeCommission({ amount: 1000, tier: "free", isRetainerClient: true });
    expect(r.commissionRate).toBe(RETAINER_COMMISSION_RATE);
    expect(r.commissionAmount).toBe(100);
    expect(r.basis).toBe("retainer");
  });

  it("defaults unknown/missing tiers to the free rate", () => {
    expect(computeCommission({ amount: 500, tier: "platinum" }).commissionRate).toBe(COMMISSION_RATES.free);
    expect(computeCommission({ amount: 500 }).commissionRate).toBe(COMMISSION_RATES.free);
    expect(computeCommission({ amount: 500, tier: null }).commissionRate).toBe(COMMISSION_RATES.free);
  });

  it("handles zero and rounds fractional amounts", () => {
    expect(computeCommission({ amount: 0, tier: "free" })).toMatchObject({ commissionAmount: 0, technicianPayout: 0 });
    const r = computeCommission({ amount: 333, tier: "silver" }); // 14% of 333 = 46.62 → 47
    expect(r.commissionAmount).toBe(47);
    expect(r.technicianPayout).toBe(286);
  });
});
