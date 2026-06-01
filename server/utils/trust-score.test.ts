import { describe, it, expect } from "vitest";
import { calculateTrustScore, sortByTrustScore } from "./trust-score.ts";
import type { Technician } from "@/db/schema.ts";

function makeTech(overrides: Partial<Technician> = {}): Technician {
  return {
    rating: 0,
    reviewCount: 0,
    completionRate: 0,
    isVerified: false,
    isPro: false,
    responseTimeMinutes: 120,
    ...overrides,
  } as Technician;
}

describe("calculateTrustScore", () => {
  it("clamps score between 0 and 100", () => {
    const worst = calculateTrustScore(makeTech());
    expect(worst.finalScore).toBeGreaterThanOrEqual(0);

    const best = calculateTrustScore(
      makeTech({ rating: 5, reviewCount: 1000, completionRate: 1, isVerified: true, isPro: true, responseTimeMinutes: 5 })
    );
    expect(best.finalScore).toBeLessThanOrEqual(100);
    expect(best.finalScore).toBeGreaterThan(worst.finalScore);
  });

  it("rewards verification and pro status", () => {
    const base = makeTech({ rating: 4, reviewCount: 20, completionRate: 0.9 });
    const plain = calculateTrustScore(base).finalScore;
    const boosted = calculateTrustScore({ ...base, isVerified: true, isPro: true } as Technician).finalScore;
    expect(boosted).toBeGreaterThan(plain);
  });

  it("assigns a higher tier as score rises", () => {
    const low = calculateTrustScore(makeTech({ rating: 1 }));
    const high = calculateTrustScore(
      makeTech({ rating: 5, reviewCount: 500, completionRate: 1, isVerified: true, isPro: true, responseTimeMinutes: 5 })
    );
    const order = ["bronze", "silver", "gold", "platinum", "diamond"];
    expect(order.indexOf(high.tier)).toBeGreaterThan(order.indexOf(low.tier));
  });
});

describe("sortByTrustScore", () => {
  it("sorts descending by finalScore without mutating input", () => {
    const a = { technician: makeTech(), scoreData: calculateTrustScore(makeTech({ rating: 2 })) };
    const b = { technician: makeTech(), scoreData: calculateTrustScore(makeTech({ rating: 5, isVerified: true })) };
    const input = [a, b];
    const sorted = sortByTrustScore(input);
    expect(sorted[0]).toBe(b);
    expect(input[0]).toBe(a); // original order preserved (immutability)
  });
});
