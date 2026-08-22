import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

let currentUser: { id: string; role: string; name: string } = {
  id: "client-1",
  role: "client",
  name: "C",
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

// Chainable Drizzle query builder mock. Every chain method defaults to
// returning `this` so calls like db.select().from().where().limit() chain
// freely; tests override the terminal method for that call with
// mockResolvedValueOnce(...) to control the resolved rows.
const mockDb = vi.hoisted(() => {
  const db: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    innerJoin: vi.fn(),
    orderBy: vi.fn(),
    insert: vi.fn(),
    values: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    returning: vi.fn(),
  };
  Object.values(db).forEach((fn) => fn.mockReturnThis());
  return db;
});

vi.mock("@/db/index.ts", () => ({ db: mockDb }));
vi.mock("uuid", () => ({ v4: () => "generated-uuid" }));

import { app } from "@/index.ts";

const BOOKING = "22222222-2222-2222-2222-222222222222";
const TECH_ID = "33333333-3333-3333-3333-333333333333";
const DISPUTE_ID = "44444444-4444-4444-4444-444444444444";

// GET /my chains 3 innerJoin() calls with no other terminal method — only the
// final call in the chain should resolve to rows, the earlier two must keep
// chaining (return `db`), so it can't be handled by a plain mockResolvedValueOnce.
function mockMyDisputesJoinRows(rows: unknown[]) {
  let calls = 0;
  mockDb.innerJoin.mockImplementation(() => {
    calls += 1;
    return calls === 3 ? Promise.resolve(rows) : mockDb;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(mockDb).forEach((fn) => fn.mockReturnThis());
  currentUser = { id: "client-1", role: "client", name: "C" };
});

describe("POST /api/disputes", () => {
  const validBody = { bookingId: BOOKING, reason: "Travail non terminé", description: "Le technicien est parti sans finir le travail." };

  it("rejects a description shorter than 20 characters (400)", async () => {
    const res = await request(app).post("/api/disputes").send({ ...validBody, description: "trop court" });

    expect(res.status).toBe(400);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("rejects an invalid bookingId (400)", async () => {
    const res = await request(app).post("/api/disputes").send({ ...validBody, bookingId: "not-a-uuid" });

    expect(res.status).toBe(400);
  });

  it("404s for an unknown booking", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const res = await request(app).post("/api/disputes").send(validBody);

    expect(res.status).toBe(404);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("rejects opening a dispute on someone else's booking (403)", async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: BOOKING, clientId: "someone-else", technicianId: TECH_ID }]);

    const res = await request(app).post("/api/disputes").send(validBody);

    expect(res.status).toBe(403);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("rejects a duplicate dispute on the same booking (409)", async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: BOOKING, clientId: "client-1", technicianId: TECH_ID }]);
    mockDb.limit.mockResolvedValueOnce([{ id: "existing-dispute" }]);

    const res = await request(app).post("/api/disputes").send(validBody);

    expect(res.status).toBe(409);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("creates the dispute for the booking's own client", async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: BOOKING, clientId: "client-1", technicianId: TECH_ID }]);
    mockDb.limit.mockResolvedValueOnce([]);
    const created = { id: DISPUTE_ID, bookingId: BOOKING, clientId: "client-1", technicianId: TECH_ID, status: "open" };
    mockDb.returning.mockResolvedValueOnce([created]);

    const res = await request(app).post("/api/disputes").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(created);
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "generated-uuid",
        bookingId: BOOKING,
        clientId: "client-1",
        technicianId: TECH_ID,
        reason: validBody.reason,
        description: validBody.description,
      })
    );
  });
});

describe("POST /api/disputes/warranty-claim", () => {
  const validBody = { bookingId: BOOKING, description: "La fuite est revenue après la réparation." };

  it("rejects a description shorter than 20 characters (400)", async () => {
    const res = await request(app).post("/api/disputes/warranty-claim").send({ ...validBody, description: "trop court" });

    expect(res.status).toBe(400);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("404s for an unknown booking", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const res = await request(app).post("/api/disputes/warranty-claim").send(validBody);

    expect(res.status).toBe(404);
  });

  it("rejects a warranty claim on someone else's booking (403)", async () => {
    mockDb.limit.mockResolvedValueOnce([{
      id: BOOKING, clientId: "someone-else", technicianId: TECH_ID,
      status: "completed", actualEndTime: new Date(), guaranteePeriodDays: 7,
    }]);

    const res = await request(app).post("/api/disputes/warranty-claim").send(validBody);

    expect(res.status).toBe(403);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("rejects a claim once the guarantee window has lapsed (422)", async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 86_400_000);
    mockDb.limit.mockResolvedValueOnce([{
      id: BOOKING, clientId: "client-1", technicianId: TECH_ID,
      status: "completed", actualEndTime: eightDaysAgo, guaranteePeriodDays: 7,
    }]);

    const res = await request(app).post("/api/disputes/warranty-claim").send(validBody);

    expect(res.status).toBe(422);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("rejects a claim on a booking that never completed (422)", async () => {
    mockDb.limit.mockResolvedValueOnce([{
      id: BOOKING, clientId: "client-1", technicianId: TECH_ID,
      status: "in_progress", actualEndTime: null, guaranteePeriodDays: 7,
    }]);

    const res = await request(app).post("/api/disputes/warranty-claim").send(validBody);

    expect(res.status).toBe(422);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("opens a warranty claim within the guarantee window", async () => {
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    mockDb.limit.mockResolvedValueOnce([{
      id: BOOKING, clientId: "client-1", technicianId: TECH_ID,
      status: "completed", actualEndTime: oneHourAgo, guaranteePeriodDays: 7,
    }]);
    mockDb.limit.mockResolvedValueOnce([]);
    const created = { id: DISPUTE_ID, bookingId: BOOKING, isWarrantyClaim: true };
    mockDb.returning.mockResolvedValueOnce([created]);

    const res = await request(app).post("/api/disputes/warranty-claim").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(created);
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: BOOKING,
        clientId: "client-1",
        technicianId: TECH_ID,
        reason: "garantie",
        isWarrantyClaim: true,
        description: validBody.description,
      })
    );
  });

  it("rejects a duplicate claim on the same booking (409)", async () => {
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    mockDb.limit.mockResolvedValueOnce([{
      id: BOOKING, clientId: "client-1", technicianId: TECH_ID,
      status: "completed", actualEndTime: oneHourAgo, guaranteePeriodDays: 7,
    }]);
    mockDb.limit.mockResolvedValueOnce([{ id: "existing-dispute" }]);

    const res = await request(app).post("/api/disputes/warranty-claim").send(validBody);

    expect(res.status).toBe(409);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});

describe("GET /api/disputes/my", () => {
  it("returns the caller's disputes with booking and technician info", async () => {
    const row = {
      dispute: { id: DISPUTE_ID, bookingId: BOOKING, status: "open" },
      booking: { clientName: "Youssef", status: "completed" },
      technician: { name: "Karim" },
    };
    mockMyDisputesJoinRows([row]);

    const res = await request(app).get("/api/disputes/my");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      { id: DISPUTE_ID, bookingId: BOOKING, status: "open", booking: row.booking, technician: row.technician },
    ]);
  });

  it("returns an empty list when the caller has no disputes", async () => {
    mockMyDisputesJoinRows([]);

    const res = await request(app).get("/api/disputes/my");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe("GET /api/disputes (admin)", () => {
  it("rejects a non-admin caller (403)", async () => {
    currentUser = { id: "client-1", role: "client", name: "C" };

    const res = await request(app).get("/api/disputes");

    expect(res.status).toBe(403);
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("returns the full dispute list with technician names attached", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    mockDb.orderBy.mockResolvedValueOnce([
      {
        dispute: { id: DISPUTE_ID, technicianId: TECH_ID, status: "open" },
        client: { name: "Youssef", email: "y@x.com", phone: "0600000000" },
        booking: { clientName: "Youssef", scheduledDate: "2026-09-01" },
      },
    ]);
    mockDb.limit.mockResolvedValueOnce([{ name: "Karim" }]);

    const res = await request(app).get("/api/disputes");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].technician).toEqual({ name: "Karim" });
    expect(res.body.data[0].dispute).toMatchObject({ id: DISPUTE_ID });
  });
});

describe("POST /api/disputes/:id/resolve (admin)", () => {
  it("rejects a non-admin caller (403)", async () => {
    currentUser = { id: "client-1", role: "client", name: "C" };

    const res = await request(app).post(`/api/disputes/${DISPUTE_ID}/resolve`).send({ resolution: "Remboursement effectué" });

    expect(res.status).toBe(403);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("rejects an invalid dispute id (400)", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };

    const res = await request(app).post("/api/disputes/not-a-uuid/resolve").send({ resolution: "Remboursement effectué" });

    expect(res.status).toBe(400);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("rejects a resolution shorter than 5 characters (400)", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };

    const res = await request(app).post(`/api/disputes/${DISPUTE_ID}/resolve`).send({ resolution: "ok" });

    expect(res.status).toBe(400);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("404s when resolving a dispute id that does not exist", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    mockDb.returning.mockResolvedValueOnce([]);

    const res = await request(app)
      .post(`/api/disputes/${DISPUTE_ID}/resolve`)
      .send({ resolution: "Remboursement effectué intégralement." });

    expect(res.status).toBe(404);
    // The route mistakenly returned 200 with an empty body here before the
    // `if (!updated)` guard was added — see server/routes/disputes.routes.ts.
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it("resolves a dispute without a refund and does not touch escrow", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    mockDb.returning.mockResolvedValueOnce([{ id: DISPUTE_ID, bookingId: BOOKING, status: "resolved" }]);

    const res = await request(app)
      .post(`/api/disputes/${DISPUTE_ID}/resolve`)
      .send({ resolution: "Le technicien est revenu terminer le travail." });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ id: DISPUTE_ID, bookingId: BOOKING, status: "resolved" });
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "resolved",
        resolution: "Le technicien est revenu terminer le travail.",
        refundAmount: null,
        resolvedBy: "admin-1",
        resolvedAt: expect.any(Date),
      })
    );
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it("does not touch escrow when refundAmount is explicitly 0", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    mockDb.returning.mockResolvedValueOnce([{ id: DISPUTE_ID, bookingId: BOOKING, status: "resolved" }]);

    const res = await request(app)
      .post(`/api/disputes/${DISPUTE_ID}/resolve`)
      .send({ resolution: "Litige clos sans remboursement.", refundAmount: 0 });

    expect(res.status).toBe(200);
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it("releases the escrow refund when a positive refundAmount is given", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    mockDb.returning.mockResolvedValueOnce([{ id: DISPUTE_ID, bookingId: BOOKING, status: "resolved" }]);

    const res = await request(app)
      .post(`/api/disputes/${DISPUTE_ID}/resolve`)
      .send({ resolution: "Remboursement partiel accordé.", refundAmount: 250 });

    expect(res.status).toBe(200);
    expect(mockDb.update).toHaveBeenCalledTimes(2);
    expect(mockDb.set).toHaveBeenNthCalledWith(2, { escrowStatus: "refunded" });
  });
});

describe("GET /api/disputes/stats (admin)", () => {
  it("rejects a non-admin caller (403)", async () => {
    currentUser = { id: "client-1", role: "client", name: "C" };

    const res = await request(app).get("/api/disputes/stats");

    expect(res.status).toBe(403);
  });

  it("reports counts and the average refund across resolved disputes", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    mockDb.from.mockResolvedValueOnce([{ count: 5 }]);
    mockDb.where.mockResolvedValueOnce([{ count: 2 }]);
    mockDb.where.mockResolvedValueOnce([{ count: 3 }]);
    mockDb.where.mockResolvedValueOnce([{ avg: 150.5 }]);

    const res = await request(app).get("/api/disputes/stats");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ total: 5, open: 2, resolved: 3, averageRefund: 151 });
  });

  it("defaults every figure to 0 when there is no dispute data at all", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    mockDb.from.mockResolvedValueOnce([]);
    mockDb.where.mockResolvedValueOnce([]);
    mockDb.where.mockResolvedValueOnce([]);
    mockDb.where.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/disputes/stats");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ total: 0, open: 0, resolved: 0, averageRefund: 0 });
  });
});
