import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

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

const { CHAIN_METHODS } = vi.hoisted(() => ({
  CHAIN_METHODS: ["select", "from", "where", "limit", "insert", "values", "update", "set", "returning"] as const,
}));

vi.mock("@/db/index.ts", () => {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of CHAIN_METHODS) {
    db[method] = vi.fn(() => db);
  }
  return { db };
});

import { db } from "@/db/index.ts";
import { app } from "@/index.ts";

type DbMock = Record<(typeof CHAIN_METHODS)[number], ReturnType<typeof vi.fn>>;
const dbMock = db as unknown as DbMock;

const TECH_ID = "tech-1";

function technicianRow(overrides: Record<string, unknown> = {}) {
  return {
    id: TECH_ID,
    userId: "tech-user-1",
    subscriptionTier: "free",
    subscriptionExpiresAt: null,
    leadsUsedThisMonth: 0,
    leadsResetAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = { id: "tech-user-1", role: "technician", name: "T" };
});

describe("GET /api/subscriptions/my", () => {
  it("returns 404 when the authenticated user has no technician profile", async () => {
    dbMock.limit.mockResolvedValueOnce([]);
    const res = await request(app).get("/api/subscriptions/my");
    expect(res.status).toBe(404);
  });

  it("reports free-tier defaults and remaining leads", async () => {
    dbMock.limit.mockResolvedValueOnce([technicianRow({ subscriptionTier: "free", leadsUsedThisMonth: 1 })]);
    const res = await request(app).get("/api/subscriptions/my");
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      tier: "free",
      tierName: "Gratuit",
      leadsIncluded: 3,
      leadsUsed: 1,
      leadsRemaining: 2,
      priceMonthly: 0,
    });
    expect(res.body.data.features).toContain("3 leads/mois");
  });

  it("reports gold-tier features and unlimited-style lead count", async () => {
    dbMock.limit.mockResolvedValueOnce([technicianRow({ subscriptionTier: "gold", leadsUsedThisMonth: 50 })]);
    const res = await request(app).get("/api/subscriptions/my");
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ tier: "gold", tierName: "Gold", leadsIncluded: 999, priceMonthly: 499 });
    expect(res.body.data.features).toContain("Leads illimités");
  });
});

describe("POST /api/subscriptions/upgrade", () => {
  it("rejects an unknown tier (400)", async () => {
    const res = await request(app).post("/api/subscriptions/upgrade").send({ tier: "platinum" });
    expect(res.status).toBe(400);
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  it("rejects downgrading to free through this endpoint (400)", async () => {
    const res = await request(app).post("/api/subscriptions/upgrade").send({ tier: "free" });
    expect(res.status).toBe(400);
  });

  it("returns 404 when the authenticated user has no technician profile", async () => {
    dbMock.limit.mockResolvedValueOnce([]);
    const res = await request(app).post("/api/subscriptions/upgrade").send({ tier: "silver" });
    expect(res.status).toBe(404);
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  it("upgrades to silver: updates the technician row and records a subscription", async () => {
    dbMock.limit.mockResolvedValueOnce([technicianRow()]);
    dbMock.returning.mockResolvedValueOnce([{ id: "sub-1", technicianId: TECH_ID, tier: "silver" }]);

    const res = await request(app).post("/api/subscriptions/upgrade").send({ tier: "silver" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ tier: "silver", tierName: "Silver", priceMonthly: 249, leadsIncluded: 30 });

    expect(dbMock.update).toHaveBeenCalledTimes(1);
    expect(dbMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionTier: "silver", leadsUsedThisMonth: 0 })
    );

    expect(dbMock.insert).toHaveBeenCalledTimes(1);
    expect(dbMock.values).toHaveBeenCalledWith(
      expect.objectContaining({ technicianId: TECH_ID, tier: "silver", leadsIncluded: 30, priceMonthly: 249, status: "active" })
    );
  });
});

describe("POST /api/subscriptions/use-lead", () => {
  it("returns 404 when the authenticated user has no technician profile", async () => {
    dbMock.limit.mockResolvedValueOnce([]);
    const res = await request(app).post("/api/subscriptions/use-lead");
    expect(res.status).toBe(404);
  });

  it("consumes a lead and reports leads remaining", async () => {
    dbMock.limit.mockResolvedValueOnce([technicianRow({ subscriptionTier: "bronze", leadsUsedThisMonth: 2 })]);
    const res = await request(app).post("/api/subscriptions/use-lead");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ leadsUsed: 3, leadsRemaining: 7 });
    expect(dbMock.set).toHaveBeenCalledWith({ leadsUsedThisMonth: 3 });
  });

  it("rejects use-lead once the monthly quota is reached (403) without updating", async () => {
    dbMock.limit.mockResolvedValueOnce([technicianRow({ subscriptionTier: "bronze", leadsUsedThisMonth: 10 })]);
    const res = await request(app).post("/api/subscriptions/use-lead");
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  it("resets the monthly counter once leadsResetAt has passed, even if it was previously at quota", async () => {
    dbMock.limit.mockResolvedValueOnce([
      technicianRow({
        subscriptionTier: "bronze",
        leadsUsedThisMonth: 10,
        leadsResetAt: new Date("2000-01-01T00:00:00Z"),
      }),
    ]);
    const res = await request(app).post("/api/subscriptions/use-lead");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ leadsUsed: 1, leadsRemaining: 9 });
    expect(dbMock.set).toHaveBeenCalledWith({ leadsUsedThisMonth: 1 });
  });
});
