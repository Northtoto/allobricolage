import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Authenticated as tech-user-1 by default; overridden per-test via currentUser.
let currentUser: { id: string; role: string; name: string } = { id: "tech-user-1", role: "technician", name: "T" };
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

const reviewFindById = vi.fn();
const reviewUpdate = vi.fn(async (id: string, patch: any) => ({ id, ...patch }));
const technicianFindByUserId = vi.fn();
vi.mock("@/repositories/review.repository.ts", () => ({
  reviewRepository: { findById: (id: string) => reviewFindById(id), update: (id: string, patch: any) => reviewUpdate(id, patch) },
}));
vi.mock("@/repositories/technician.repository.ts", () => ({
  technicianRepository: { findByUserId: (id: string) => technicianFindByUserId(id) },
}));

import { app } from "@/index.ts";

const REVIEW = "33333333-3333-3333-3333-333333333333";

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = { id: "tech-user-1", role: "technician", name: "T" };
  technicianFindByUserId.mockResolvedValue(undefined);
});

describe("PATCH /api/reviews/:id/response authorization", () => {
  it("lets the reviewed technician respond to their own review", async () => {
    reviewFindById.mockResolvedValue({ id: REVIEW, technicianId: "tech-1" });
    technicianFindByUserId.mockResolvedValue({ id: "tech-1", userId: "tech-user-1" });
    const res = await request(app).patch(`/api/reviews/${REVIEW}/response`).send({ response: "Merci !" });
    expect(res.status).toBe(200);
    expect(reviewUpdate).toHaveBeenCalledWith(REVIEW, { technicianResponse: "Merci !" });
  });

  it("rejects a technician responding to another technician's review (403)", async () => {
    reviewFindById.mockResolvedValue({ id: REVIEW, technicianId: "tech-1" });
    technicianFindByUserId.mockResolvedValue({ id: "tech-2", userId: "tech-user-1" });
    const res = await request(app).patch(`/api/reviews/${REVIEW}/response`).send({ response: "Merci !" });
    expect(res.status).toBe(403);
    expect(reviewUpdate).not.toHaveBeenCalled();
  });

  it("allows an admin to respond regardless of ownership", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    reviewFindById.mockResolvedValue({ id: REVIEW, technicianId: "tech-1" });
    const res = await request(app).patch(`/api/reviews/${REVIEW}/response`).send({ response: "Merci !" });
    expect(res.status).toBe(200);
    expect(reviewUpdate).toHaveBeenCalledWith(REVIEW, { technicianResponse: "Merci !" });
  });

  it("404s for an unknown review", async () => {
    reviewFindById.mockResolvedValue(undefined);
    const res = await request(app).patch(`/api/reviews/${REVIEW}/response`).send({ response: "Merci !" });
    expect(res.status).toBe(404);
    expect(reviewUpdate).not.toHaveBeenCalled();
  });
});
