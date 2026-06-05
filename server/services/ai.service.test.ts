import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the technician repository that matchTechnicians dynamically imports.
const mockTechs = [
  { id: "t-plain", name: "Plain", rating: 3, completionRate: 0.8, isPro: false, isVerified: false, responseTimeMinutes: 90, hourlyRate: 200, isAvailable: true },
  { id: "t-pro", name: "Pro", rating: 5, completionRate: 0.98, isPro: true, isVerified: true, responseTimeMinutes: 10, hourlyRate: 250, isAvailable: true },
];
vi.mock("@/repositories/technician.repository.ts", () => ({
  technicianRepository: {
    findAllWithUsers: vi.fn(async () => ({ items: mockTechs, total: mockTechs.length })),
  },
}));

import { aiService } from "./ai.service.ts";

describe("estimateCost (formula path — no HF key in test env)", () => {
  it("returns ordered min <= likely <= max with positive values", async () => {
    const e = await aiService.estimateCost({ service: "plomberie", urgency: "high", complexity: "moderate" });
    expect(e.minCost).toBeGreaterThan(0);
    expect(e.minCost).toBeLessThanOrEqual(e.likelyCost);
    expect(e.likelyCost).toBeLessThanOrEqual(e.maxCost);
  });

  it("charges more for emergencies than normal urgency", async () => {
    const normal = await aiService.estimateCost({ service: "plomberie", urgency: "normal", complexity: "moderate" });
    const emergency = await aiService.estimateCost({ service: "plomberie", urgency: "emergency", complexity: "moderate" });
    expect(emergency.likelyCost).toBeGreaterThan(normal.likelyCost);
  });
});

describe("parseLLMEstimate (hallucination guard)", () => {
  const params = { service: "plomberie", urgency: "high", complexity: "moderate" };
  const fallback = { minCost: 384, likelyCost: 480, maxCost: 624, confidence: 0.75, breakdown: {} as never, explanation: "formula" };
  const parse = (content: string) =>
    (aiService as unknown as { parseLLMEstimate: (c: string, p: typeof params, f: typeof fallback) => unknown })
      .parseLLMEstimate(content, params, fallback);

  it("accepts valid, ordered, in-range JSON", () => {
    const r = parse('{"minCost":400,"likelyCost":520,"maxCost":700,"confidence":0.85,"explanation":"siphon + 2 robinets"}') as { likelyCost: number; explanation: string } | null;
    expect(r).not.toBeNull();
    expect(r!.likelyCost).toBe(520);
    expect(r!.explanation).toContain("robinets");
  });

  it("rejects unordered values (min > likely)", () => {
    expect(parse('{"minCost":900,"likelyCost":500,"maxCost":700,"confidence":0.8}')).toBeNull();
  });

  it("rejects hallucinated out-of-range values (>5x formula)", () => {
    expect(parse('{"minCost":1,"likelyCost":99999,"maxCost":100000,"confidence":0.9}')).toBeNull();
  });

  it("rejects non-JSON / malformed content", () => {
    expect(parse("désolé je ne peux pas estimer")).toBeNull();
    expect(parse('{"minCost": "abc"}')).toBeNull();
  });
});

describe("matchTechnicians SLA priority", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ranks verified/Pro/fast technicians first when priority is set", async () => {
    const matches = await aiService.matchTechnicians("job-1", "plomberie", "Casablanca", { priority: true, slaHours: 4 });
    expect(matches[0].technician.id).toBe("t-pro");
  });

  it("caps ETA within the SLA window for priority jobs", async () => {
    const matches = await aiService.matchTechnicians("job-1", "plomberie", "Casablanca", { priority: true, slaHours: 4 });
    for (const m of matches) {
      expect(m.etaMinutes).toBeLessThanOrEqual(4 * 60);
    }
  });

  it("boosts match score for priority jobs", async () => {
    const matches = await aiService.matchTechnicians("job-1", "plomberie", "Casablanca", { priority: true, slaHours: 4 });
    expect(matches[0].matchScore).toBeGreaterThanOrEqual(0.9);
  });
});

describe("analyzeImage (photo → estimate, keyword fallback — no HF key in test env)", () => {
  const tinyPng = "data:image/png;base64,iVBORw0KGgo=";

  it("falls back to keyword analysis of the description and returns a valid shape", async () => {
    const a = await aiService.analyzeImage({ imageDataUrl: tinyPng, description: "fuite d'eau sous le robinet" });
    expect(a.service).toBe("plomberie");
    expect(["low", "normal", "high", "emergency"]).toContain(a.urgency);
    expect(a.confidence).toBeGreaterThan(0);
    expect(a.language).toBe("fr");
  });

  it("still returns a usable analysis when no description is given", async () => {
    const a = await aiService.analyzeImage({ imageDataUrl: tinyPng });
    expect(a.service).toBeTruthy();
    expect(a.subServices.length).toBeGreaterThan(0);
  });
});

describe("parseVisionAnalysis (vision hallucination guard)", () => {
  const fallback = {
    service: "services_generaux", subServices: ["Réparation"], urgency: "normal",
    complexity: "moderate" as const, estimatedDuration: "2-4 heures", confidence: 0.5,
    extractedKeywords: ["x"], language: "fr" as const,
  };
  const parse = (content: string) =>
    (aiService as unknown as { parseVisionAnalysis: (c: string, f: typeof fallback) => typeof fallback | null })
      .parseVisionAnalysis(content, fallback);

  it("accepts a valid analysis with a known service and enums", () => {
    const r = parse('{"service":"electricite","subServices":["Tableau"],"urgency":"high","complexity":"complex","estimatedDuration":"3-5 heures","confidence":0.9,"observations":"tableau brûlé"}');
    expect(r).not.toBeNull();
    expect(r!.service).toBe("electricite");
    expect(r!.urgency).toBe("high");
    expect(r!.extractedKeywords[0]).toContain("brûlé");
  });

  it("snaps an unknown service back to the fallback", () => {
    const r = parse('{"service":"teleportation","urgency":"normal","complexity":"simple","confidence":0.9}');
    expect(r!.service).toBe("services_generaux");
  });

  it("snaps invalid enums back to the fallback", () => {
    const r = parse('{"service":"plomberie","urgency":"super-urgent","complexity":"impossible","confidence":0.9}');
    expect(r!.urgency).toBe("normal");
    expect(r!.complexity).toBe("moderate");
  });

  it("returns null on malformed (non-JSON) content", () => {
    expect(parse("désolé, je ne peux pas analyser cette image")).toBeNull();
  });
});
