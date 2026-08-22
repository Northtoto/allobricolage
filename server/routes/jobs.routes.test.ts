import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

let currentUser: { id: string; role: string; name: string } = { id: "client-1", role: "client", name: "C" };
vi.mock("@/middleware/auth.ts", async (orig) => {
  const actual = await orig<typeof import("@/middleware/auth.ts")>();
  return {
    ...actual,
    authenticate: (req: any, _res: any, next: any) => {
      req.user = currentUser;
      next();
    },
  };
});

const jobCreate = vi.fn();
const jobFindById = vi.fn();
vi.mock("@/repositories/job.repository.ts", () => ({
  jobRepository: {
    create: (d: any) => jobCreate(d),
    findById: (id: string) => jobFindById(id),
  },
}));

const businessFindProfileByUserId = vi.fn();
const businessFindActiveRetainer = vi.fn();
vi.mock("@/repositories/business.repository.ts", () => ({
  businessRepository: {
    findProfileByUserId: (id: string) => businessFindProfileByUserId(id),
    findActiveRetainer: (id: string) => businessFindActiveRetainer(id),
  },
}));

const analyzeJob = vi.fn();
const estimateCost = vi.fn();
const analyzeImage = vi.fn();
const matchTechnicians = vi.fn();
const getUpsellSuggestions = vi.fn();
vi.mock("@/services/ai.service.ts", () => ({
  aiService: {
    analyzeJob: (d: string) => analyzeJob(d),
    estimateCost: (d: any) => estimateCost(d),
    analyzeImage: (d: any) => analyzeImage(d),
    matchTechnicians: (...args: any[]) => matchTechnicians(...args),
    getUpsellSuggestions: (s: string) => getUpsellSuggestions(s),
  },
}));

import { app } from "@/index.ts";

const JOB_ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = { id: "client-1", role: "client", name: "C" };
  analyzeJob.mockResolvedValue({ service: "plomberie", subServices: [], urgency: "normal", complexity: "simple", estimatedDuration: "1-2 heures", extractedKeywords: [], confidence: 0.8, language: "fr" });
  estimateCost.mockResolvedValue({ minCost: 100, likelyCost: 150, maxCost: 200, confidence: 0.75, breakdown: {}, explanation: "e" });
  analyzeImage.mockResolvedValue({ service: "plomberie", subServices: [], urgency: "normal", complexity: "simple", estimatedDuration: "1-2 heures", extractedKeywords: [], confidence: 0.8, language: "fr" });
  matchTechnicians.mockResolvedValue([]);
  getUpsellSuggestions.mockReturnValue([]);
  jobCreate.mockResolvedValue({ id: JOB_ID, clientId: "client-1", service: "plomberie", city: "Casablanca", urgency: "normal", complexity: "simple", status: "pending" });
  businessFindProfileByUserId.mockResolvedValue(undefined);
  businessFindActiveRetainer.mockResolvedValue(undefined);
});

describe("POST /api/jobs/analyze", () => {
  it("rejects an empty description (400)", async () => {
    const res = await request(app).post("/api/jobs/analyze").send({ description: "" });
    expect(res.status).toBe(400);
    expect(analyzeJob).not.toHaveBeenCalled();
  });

  it("rejects a technician (403) — client/admin only", async () => {
    currentUser = { id: "tech-1", role: "technician", name: "T" };
    const res = await request(app).post("/api/jobs/analyze").send({ description: "Fuite d'eau" });
    expect(res.status).toBe(403);
    expect(analyzeJob).not.toHaveBeenCalled();
  });

  it("analyzes the description and returns a cost estimate (200)", async () => {
    const res = await request(app).post("/api/jobs/analyze").send({ description: "Fuite d'eau", urgency: "high" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.analysis.service).toBe("plomberie");
    expect(res.body.data.costEstimate.likelyCost).toBe(150);
    expect(analyzeJob).toHaveBeenCalledWith("Fuite d'eau");
    expect(estimateCost).toHaveBeenCalledWith(
      expect.objectContaining({ service: "plomberie", urgency: "high", complexity: "simple" })
    );
  });

  it("falls back to the analysis's own urgency when none is supplied", async () => {
    const res = await request(app).post("/api/jobs/analyze").send({ description: "Fuite d'eau" });
    expect(res.status).toBe(200);
    expect(estimateCost).toHaveBeenCalledWith(expect.objectContaining({ urgency: "normal" }));
  });

  it("allows an admin to analyze too", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    const res = await request(app).post("/api/jobs/analyze").send({ description: "Fuite d'eau" });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/jobs/analyze-image", () => {
  it("rejects a malformed data URL (400)", async () => {
    const res = await request(app).post("/api/jobs/analyze-image").send({ imageDataUrl: "not-a-data-url" });
    expect(res.status).toBe(400);
    expect(analyzeImage).not.toHaveBeenCalled();
  });

  it("rejects a non-image data URL scheme (400)", async () => {
    const res = await request(app)
      .post("/api/jobs/analyze-image")
      .send({ imageDataUrl: "data:text/plain;base64,aGVsbG8=" });
    expect(res.status).toBe(400);
  });

  it("analyzes a valid image data URL (200)", async () => {
    const imageDataUrl = "data:image/png;base64,iVBORw0KGgo=";
    const res = await request(app)
      .post("/api/jobs/analyze-image")
      .send({ imageDataUrl, description: "photo du tuyau" });

    expect(res.status).toBe(200);
    expect(analyzeImage).toHaveBeenCalledWith({ imageDataUrl, description: "photo du tuyau" });
    expect(res.body.data.costEstimate.likelyCost).toBe(150);
  });

  it("rejects a technician (403)", async () => {
    currentUser = { id: "tech-1", role: "technician", name: "T" };
    const res = await request(app)
      .post("/api/jobs/analyze-image")
      .send({ imageDataUrl: "data:image/png;base64,iVBORw0KGgo=" });
    expect(res.status).toBe(403);
  });
});

describe("POST /api/jobs", () => {
  it("rejects an invalid city (400)", async () => {
    const res = await request(app).post("/api/jobs").send({ description: "Fuite d'eau", city: "Paris" });
    expect(res.status).toBe(400);
    expect(jobCreate).not.toHaveBeenCalled();
  });

  it("rejects a missing description (400)", async () => {
    const res = await request(app).post("/api/jobs").send({ city: "Casablanca" });
    expect(res.status).toBe(400);
  });

  it("rejects a technician (403)", async () => {
    currentUser = { id: "tech-1", role: "technician", name: "T" };
    const res = await request(app).post("/api/jobs").send({ description: "Fuite d'eau", city: "Casablanca" });
    expect(res.status).toBe(403);
    expect(jobCreate).not.toHaveBeenCalled();
  });

  it("creates a job for the authenticated client with defaults when analysis is omitted", async () => {
    const res = await request(app).post("/api/jobs").send({ description: "Fuite d'eau", city: "Casablanca" });

    expect(res.status).toBe(201);
    expect(jobCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-1",
        description: "Fuite d'eau",
        city: "Casablanca",
        urgency: "normal",
        service: "services_generaux",
        complexity: "moderate",
        status: "pending",
      })
    );
  });

  it("uses the provided analysis's service/complexity instead of the defaults", async () => {
    const res = await request(app).post("/api/jobs").send({
      description: "Fuite d'eau",
      city: "Casablanca",
      analysis: { service: "plomberie", complexity: "complex" },
    });

    expect(res.status).toBe(201);
    expect(jobCreate).toHaveBeenCalledWith(
      expect.objectContaining({ service: "plomberie", complexity: "complex" })
    );
  });

  it("dispatches without B2B priority when the client has no business profile", async () => {
    businessFindProfileByUserId.mockResolvedValue(undefined);

    const res = await request(app).post("/api/jobs").send({ description: "Fuite d'eau", city: "Casablanca" });

    expect(res.status).toBe(201);
    expect(res.body.data.priority).toBe(false);
    expect(res.body.data.slaHours).toBeUndefined();
    expect(matchTechnicians).toHaveBeenCalledWith(JOB_ID, "plomberie", "Casablanca", {
      priority: false,
      slaHours: undefined,
    });
  });

  it("dispatches with B2B priority + SLA when the client has an active retainer", async () => {
    businessFindProfileByUserId.mockResolvedValue({ id: "biz-1", userId: "client-1" });
    businessFindActiveRetainer.mockResolvedValue({ id: "ret-1", businessId: "biz-1", status: "active", slaHours: 4 });

    const res = await request(app).post("/api/jobs").send({ description: "Fuite d'eau", city: "Casablanca" });

    expect(res.status).toBe(201);
    expect(res.body.data.priority).toBe(true);
    expect(res.body.data.slaHours).toBe(4);
    expect(matchTechnicians).toHaveBeenCalledWith(JOB_ID, "plomberie", "Casablanca", {
      priority: true,
      slaHours: 4,
    });
  });

  it("does not grant priority when the retainer exists but is not active", async () => {
    businessFindProfileByUserId.mockResolvedValue({ id: "biz-1", userId: "client-1" });
    businessFindActiveRetainer.mockResolvedValue({ id: "ret-1", businessId: "biz-1", status: "expired", slaHours: 4 });

    const res = await request(app).post("/api/jobs").send({ description: "Fuite d'eau", city: "Casablanca" });

    expect(res.status).toBe(201);
    expect(res.body.data.priority).toBe(false);
  });
});

describe("GET /api/jobs/:id", () => {
  it("rejects an invalid id (400)", async () => {
    const res = await request(app).get("/api/jobs/not-a-uuid");
    expect(res.status).toBe(400);
    expect(jobFindById).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown job", async () => {
    jobFindById.mockResolvedValue(undefined);
    const res = await request(app).get(`/api/jobs/${JOB_ID}`);
    expect(res.status).toBe(404);
  });

  it("lets the owning client view their job (200)", async () => {
    jobFindById.mockResolvedValue({ id: JOB_ID, clientId: "client-1", description: "d" });
    const res = await request(app).get(`/api/jobs/${JOB_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(JOB_ID);
  });

  it("rejects a client who does not own the job (403)", async () => {
    jobFindById.mockResolvedValue({ id: JOB_ID, clientId: "OTHER-CLIENT", description: "d" });
    const res = await request(app).get(`/api/jobs/${JOB_ID}`);
    expect(res.status).toBe(403);
  });

  it("lets an admin view any job (200)", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    jobFindById.mockResolvedValue({ id: JOB_ID, clientId: "OTHER-CLIENT", description: "d" });
    const res = await request(app).get(`/api/jobs/${JOB_ID}`);
    expect(res.status).toBe(200);
  });
});
