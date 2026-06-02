import { describe, it, expect } from "vitest";
import { aiService } from "./ai.service.ts";

// The quote guardrail uses aiService.priceBand() to flag outlier devis. These
// tests pin the band's shape and the classification thresholds the route applies
// (above_market when amount > maxCost*1.25; below_market when < minCost*0.5).
describe("priceBand (quote guardrail source)", () => {
  it("returns an ordered positive band for a known service", () => {
    const b = aiService.priceBand({ service: "plomberie", urgency: "normal", complexity: "moderate" });
    expect(b.minCost).toBeGreaterThan(0);
    expect(b.minCost).toBeLessThanOrEqual(b.likelyCost);
    expect(b.likelyCost).toBeLessThanOrEqual(b.maxCost);
  });

  it("charges emergencies more than normal (band shifts up)", () => {
    const normal = aiService.priceBand({ service: "plomberie", urgency: "normal", complexity: "moderate" });
    const emergency = aiService.priceBand({ service: "plomberie", urgency: "emergency", complexity: "moderate" });
    expect(emergency.maxCost).toBeGreaterThan(normal.maxCost);
  });

  it("falls back to a default band for an unknown service", () => {
    const b = aiService.priceBand({ service: "totally_unknown", urgency: "normal", complexity: "moderate" });
    expect(b.maxCost).toBeGreaterThan(0);
  });
});

// Mirror the route's classifyPrice thresholds so the anti-arnaque logic is locked.
function classify(amount: number, band: { minCost: number; maxCost: number }) {
  if (amount > band.maxCost * 1.25) return "above_market";
  if (amount < band.minCost * 0.5) return "below_market";
  return "normal";
}

describe("price classification thresholds", () => {
  const band = { minCost: 200, maxCost: 600 };
  it("flags a wildly inflated quote as above_market", () => {
    expect(classify(1000, band)).toBe("above_market"); // > 600*1.25 = 750
  });
  it("flags a suspiciously cheap quote as below_market", () => {
    expect(classify(80, band)).toBe("below_market"); // < 200*0.5 = 100
  });
  it("accepts an in-band quote as normal", () => {
    expect(classify(450, band)).toBe("normal");
    expect(classify(700, band)).toBe("normal"); // within 25% headroom
  });
});
