/**
 * Commission engine — the platform's revenue model in code.
 *
 * Every completed payment is split into a platform commission (M3allem's
 * take) and a technician payout. The take rate is tier-based, which is what gives
 * the technician subscription its value: higher tiers pay LESS commission. B2B
 * retainer clients get a preferential flat rate (they already pay a monthly
 * retainer, so per-job take is lower). See docs/GO_TO_MARKET.md.
 *
 * Pure & deterministic — no I/O — so it is fully unit-testable and stable.
 */

export type SubscriptionTier = "free" | "bronze" | "silver" | "gold";

// Take rate by technician subscription tier. Lower tier = higher commission;
// upgrading is how a technician keeps more of each job. Bounded to the
// strategy's 12–18% B2C band.
export const COMMISSION_RATES: Record<SubscriptionTier, number> = {
  free: 0.18,
  bronze: 0.16,
  silver: 0.14,
  gold: 0.12,
};

// B2B retainer clients pay a reduced per-job take (they already pay monthly).
export const RETAINER_COMMISSION_RATE = 0.1;

export interface CommissionBreakdown {
  amount: number; // gross paid by client (MAD)
  commissionRate: number; // 0..1
  commissionAmount: number; // platform revenue (MAD)
  technicianPayout: number; // net to technician (MAD)
  basis: SubscriptionTier | "retainer";
}

export function computeCommission(params: {
  amount: number;
  tier?: string | null;
  isRetainerClient?: boolean;
}): CommissionBreakdown {
  const amount = Math.max(0, Math.round(params.amount));

  const tier = (params.tier ?? "free") as SubscriptionTier;
  const rate = params.isRetainerClient
    ? RETAINER_COMMISSION_RATE
    : (COMMISSION_RATES[tier] ?? COMMISSION_RATES.free);

  const commissionAmount = Math.round(amount * rate);
  const technicianPayout = amount - commissionAmount;

  return {
    amount,
    commissionRate: rate,
    commissionAmount,
    technicianPayout,
    basis: params.isRetainerClient ? "retainer" : (COMMISSION_RATES[tier] ? tier : "free"),
  };
}
