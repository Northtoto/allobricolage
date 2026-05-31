import type { Technician } from "@/db/schema.ts";

export interface TrustScoreFactors {
  baseScore: number;
  verificationBonus: number;
  reviewPenalty: number;
  completionBonus: number;
  proBonus: number;
  activityDecay: number;
  disputePenalty: number;
  responseTimeBonus: number;
  finalScore: number;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
}

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 40,
  gold: 60,
  platinum: 75,
  diamond: 90,
} as const;

/** Calculate technician trust score (0-100) using weighted factors */
export function calculateTrustScore(tech: Technician): TrustScoreFactors {
  // Base: rating (0-5) scaled to 30 points max
  const baseScore = (tech.rating / 5) * 30;

  // Verification: 15 points max
  const verificationBonus = tech.isVerified ? 15 : 0;

  // Review volume: logarithmic scale, 15 points max at 50+ reviews
  const reviewCount = tech.reviewCount;
  const reviewPenalty = Math.min(15, Math.log10(Math.max(1, reviewCount)) * 7.5);

  // Completion rate: 15 points max at 95%+
  const completionBonus = tech.completionRate * 15;

  // Pro subscription: 10 points
  const proBonus = tech.isPro ? 10 : 0;

  // Response time: 10 points max (under 30min), decaying to 0 at 2h+
  const responseTimeMin = Math.min(tech.responseTimeMinutes, 120);
  const responseTimeBonus = Math.max(0, 10 - (responseTimeMin / 12));

  // Activity decay: if no recent data, slightly reduce score
  const activityDecay = 0;

  // Dispute penalty (placeholder — linked to future dispute table)
  const disputePenalty = 0;

  let finalScore =
    baseScore +
    verificationBonus +
    reviewPenalty +
    completionBonus +
    proBonus +
    responseTimeBonus -
    activityDecay -
    disputePenalty;

  finalScore = Math.max(0, Math.min(100, Math.round(finalScore * 10) / 10));

  let tier: TrustScoreFactors["tier"] = "bronze";
  if (finalScore >= TIER_THRESHOLDS.diamond) tier = "diamond";
  else if (finalScore >= TIER_THRESHOLDS.platinum) tier = "platinum";
  else if (finalScore >= TIER_THRESHOLDS.gold) tier = "gold";
  else if (finalScore >= TIER_THRESHOLDS.silver) tier = "silver";

  return {
    baseScore: Math.round(baseScore * 10) / 10,
    verificationBonus,
    reviewPenalty: Math.round(reviewPenalty * 10) / 10,
    completionBonus: Math.round(completionBonus * 10) / 10,
    proBonus,
    activityDecay,
    disputePenalty,
    responseTimeBonus: Math.round(responseTimeBonus * 10) / 10,
    finalScore,
    tier,
  };
}

/** Sort technicians by trust score descending */
export function sortByTrustScore(
  technicians: Array<{ technician: Technician; scoreData: TrustScoreFactors }>
): Array<{ technician: Technician; scoreData: TrustScoreFactors }> {
  return [...technicians].sort((a, b) => b.scoreData.finalScore - a.scoreData.finalScore);
}
