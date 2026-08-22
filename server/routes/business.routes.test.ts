import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

let currentUser: { id: string; role: string; name: string } = {
  id: "biz-user-1",
  role: "business",
  name: "B",
};
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

const findProfileByUserId = vi.fn();
const createProfile = vi.fn();
const updateProfile = vi.fn();
const findActiveRetainer = vi.fn();
const createRetainer = vi.fn();

vi.mock("@/repositories/business.repository.ts", () => ({
  businessRepository: {
    findProfileByUserId: (userId: string) => findProfileByUserId(userId),
    createProfile: (d: any) => createProfile(d),
    updateProfile: (id: string, d: any) => updateProfile(id, d),
    findActiveRetainer: (businessId: string) => findActiveRetainer(businessId),
    createRetainer: (d: any) => createRetainer(d),
  },
}));

import { app } from "@/index.ts";

const PROFILE_ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = { id: "biz-user-1", role: "business", name: "B" };
});

describe("GET /api/business/plans", () => {
  it("is public and returns the retainer catalog without auth", async () => {
    const res = await request(app).get("/api/business/plans");

    expect(res.status).toBe(200);
    expect(res.body.data.plans.essentiel).toMatchObject({ name: "Essentiel", priceMonthly: 800, slaHours: 24, sitesIncluded: 1 });
    expect(res.body.data.plans.pro).toMatchObject({ name: "Pro", priceMonthly: 2500, slaHours: 4, sitesIncluded: 5 });
    expect(res.body.data.plans.enterprise).toMatchObject({ name: "Enterprise", priceMonthly: 0, slaHours: 2 });
  });
});

describe("GET /api/business/my", () => {
  it("returns null profile and retainer when the user has no business profile", async () => {
    findProfileByUserId.mockResolvedValue(undefined);

    const res = await request(app).get("/api/business/my");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ profile: null, retainer: null });
    expect(findActiveRetainer).not.toHaveBeenCalled();
  });

  it("returns the profile with its active retainer", async () => {
    findProfileByUserId.mockResolvedValue({ id: PROFILE_ID, userId: "biz-user-1", companyName: "Cafe X" });
    findActiveRetainer.mockResolvedValue({ id: "ret-1", businessId: PROFILE_ID, tier: "pro" });

    const res = await request(app).get("/api/business/my");

    expect(res.status).toBe(200);
    expect(res.body.data.profile).toMatchObject({ id: PROFILE_ID, companyName: "Cafe X" });
    expect(res.body.data.retainer).toMatchObject({ id: "ret-1", tier: "pro" });
    expect(findActiveRetainer).toHaveBeenCalledWith(PROFILE_ID);
  });
});

describe("POST /api/business/profile", () => {
  it("rejects a company name shorter than 2 characters (400)", async () => {
    const res = await request(app).post("/api/business/profile").send({ companyName: "A" });

    expect(res.status).toBe(400);
    expect(createProfile).not.toHaveBeenCalled();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("rejects an unknown businessType (400)", async () => {
    const res = await request(app)
      .post("/api/business/profile")
      .send({ companyName: "Cafe X", businessType: "bakery" });

    expect(res.status).toBe(400);
  });

  it("creates a new profile when none exists yet", async () => {
    findProfileByUserId.mockResolvedValue(undefined);
    createProfile.mockResolvedValue({ id: PROFILE_ID, companyName: "Cafe X", userId: "biz-user-1" });

    const res = await request(app)
      .post("/api/business/profile")
      .send({ companyName: "Cafe X", businessType: "cafe", city: "Casablanca" });

    expect(res.status).toBe(200);
    expect(createProfile).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: "Cafe X", businessType: "cafe", city: "Casablanca", userId: "biz-user-1" })
    );
    expect(updateProfile).not.toHaveBeenCalled();
    expect(res.body.data.profile).toMatchObject({ id: PROFILE_ID, companyName: "Cafe X" });
  });

  it("updates the existing profile instead of creating a duplicate", async () => {
    findProfileByUserId.mockResolvedValue({ id: PROFILE_ID, companyName: "Old Name" });
    updateProfile.mockResolvedValue({ id: PROFILE_ID, companyName: "New Name" });

    const res = await request(app).post("/api/business/profile").send({ companyName: "New Name" });

    expect(res.status).toBe(200);
    expect(updateProfile).toHaveBeenCalledWith(PROFILE_ID, expect.objectContaining({ companyName: "New Name" }));
    expect(createProfile).not.toHaveBeenCalled();
  });
});

describe("POST /api/business/retainer", () => {
  it("rejects an unknown tier (400 validation)", async () => {
    const res = await request(app).post("/api/business/retainer").send({ tier: "gold" });

    expect(res.status).toBe(400);
    expect(createRetainer).not.toHaveBeenCalled();
  });

  it("404s when the caller has no business profile yet", async () => {
    findProfileByUserId.mockResolvedValue(undefined);

    const res = await request(app).post("/api/business/retainer").send({ tier: "essentiel" });

    expect(res.status).toBe(404);
    expect(createRetainer).not.toHaveBeenCalled();
  });

  it("rejects subscribing to enterprise in-app — it is sur devis (400)", async () => {
    findProfileByUserId.mockResolvedValue({ id: PROFILE_ID });

    const res = await request(app).post("/api/business/retainer").send({ tier: "enterprise" });

    expect(res.status).toBe(400);
    expect(createRetainer).not.toHaveBeenCalled();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("subscribes to the essentiel tier, creates the retainer and updates the profile", async () => {
    findProfileByUserId.mockResolvedValue({ id: PROFILE_ID });
    createRetainer.mockResolvedValue({ id: "ret-1", businessId: PROFILE_ID, tier: "essentiel" });
    updateProfile.mockResolvedValue({ id: PROFILE_ID, retainerTier: "essentiel" });

    const res = await request(app).post("/api/business/retainer").send({ tier: "essentiel" });

    expect(res.status).toBe(200);
    expect(createRetainer).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: PROFILE_ID,
        tier: "essentiel",
        priceMonthly: 800,
        slaHours: 24,
        sitesIncluded: 1,
        preventiveVisitsPerMonth: 1,
        isAutoRenew: true,
        status: "active",
      })
    );
    expect(updateProfile).toHaveBeenCalledWith(
      PROFILE_ID,
      expect.objectContaining({ retainerTier: "essentiel", retainerExpiresAt: expect.any(Date) })
    );
    expect(res.body.data.plan).toMatchObject({ tier: "essentiel", priceMonthly: 800 });
  });

  it("subscribes to the pro tier using pro-tier pricing and SLA", async () => {
    findProfileByUserId.mockResolvedValue({ id: PROFILE_ID });
    createRetainer.mockResolvedValue({ id: "ret-2", businessId: PROFILE_ID, tier: "pro" });
    updateProfile.mockResolvedValue({ id: PROFILE_ID, retainerTier: "pro" });

    const res = await request(app).post("/api/business/retainer").send({ tier: "pro" });

    expect(res.status).toBe(200);
    expect(createRetainer).toHaveBeenCalledWith(
      expect.objectContaining({ tier: "pro", priceMonthly: 2500, slaHours: 4, sitesIncluded: 5, preventiveVisitsPerMonth: 2 })
    );
    expect(updateProfile).toHaveBeenCalledWith(PROFILE_ID, expect.objectContaining({ retainerTier: "pro" }));
  });
});
