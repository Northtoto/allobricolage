import { describe, it, expect } from "vitest";
import { haversineDistance, findWithinRadius, proximityScore } from "./geo.ts";

describe("haversineDistance", () => {
  it("returns 0 for identical points", () => {
    expect(haversineDistance(33.5731, -7.5898, 33.5731, -7.5898)).toBe(0);
  });

  it("computes a known distance (Casablanca ↔ Rabat ≈ 87km)", () => {
    const d = haversineDistance(33.5731, -7.5898, 34.0209, -6.8416);
    expect(d).toBeGreaterThan(80);
    expect(d).toBeLessThan(95);
  });
});

describe("findWithinRadius", () => {
  const points = [
    { id: "near", latitude: 33.58, longitude: -7.59 },
    { id: "far", latitude: 34.02, longitude: -6.84 },
  ];

  it("includes only points inside the radius, nearest first", () => {
    const res = findWithinRadius(33.5731, -7.5898, points, 10);
    expect(res.map((r) => r.id)).toEqual(["near"]);
  });

  it("orders multiple matches by distance ascending", () => {
    const res = findWithinRadius(33.5731, -7.5898, points, 200);
    expect(res[0].id).toBe("near");
    expect(res[0].distance).toBeLessThan(res[1].distance);
  });
});

describe("proximityScore", () => {
  it("is 1 for very close, 0 beyond max, and between for mid-range", () => {
    expect(proximityScore(33.5731, -7.5898, 33.5731, -7.5898)).toBe(1);
    expect(proximityScore(33.5731, -7.5898, 34.02, -6.84, 50)).toBe(0);
    const mid = proximityScore(33.5731, -7.5898, 33.7, -7.5, 50);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });
});
