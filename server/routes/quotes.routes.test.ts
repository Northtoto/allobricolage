import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

let currentUser: { id: string; role: string; name: string } = {
  id: "tech-user-1",
  role: "technician",
  name: "T",
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

const quoteFindById = vi.fn();
const quoteFindByBookingId = vi.fn();
const quoteCreate = vi.fn();
const quoteUpdate = vi.fn();
const bookingFindById = vi.fn();
const bookingUpdate = vi.fn();
const jobFindById = vi.fn();
const technicianFindByUserId = vi.fn();
const notificationCreate = vi.fn();
const priceBand = vi.fn();

vi.mock("@/repositories/quote.repository.ts", () => ({
  quoteRepository: {
    findById: (id: string) => quoteFindById(id),
    findByBookingId: (id: string) => quoteFindByBookingId(id),
    create: (d: any) => quoteCreate(d),
    update: (id: string, d: any) => quoteUpdate(id, d),
  },
}));
vi.mock("@/repositories/booking.repository.ts", () => ({
  bookingRepository: {
    findById: (id: string) => bookingFindById(id),
    update: (id: string, d: any) => bookingUpdate(id, d),
  },
}));
vi.mock("@/repositories/job.repository.ts", () => ({
  jobRepository: { findById: (id: string) => jobFindById(id) },
}));
vi.mock("@/repositories/technician.repository.ts", () => ({
  technicianRepository: { findByUserId: (id: string) => technicianFindByUserId(id) },
}));
vi.mock("@/repositories/notification.repository.ts", () => ({
  notificationRepository: { create: (d: any) => notificationCreate(d) },
}));
vi.mock("@/services/ai.service.ts", () => ({
  aiService: { priceBand: (p: any) => priceBand(p) },
}));

import { app } from "@/index.ts";

const BOOKING = "22222222-2222-2222-2222-222222222222";
const QUOTE = "44444444-4444-4444-4444-444444444444";
const TECH_ID = "33333333-3333-3333-3333-333333333333";

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = { id: "tech-user-1", role: "technician", name: "T" };
  priceBand.mockReturnValue({ minCost: 200, likelyCost: 300, maxCost: 400 });
  jobFindById.mockResolvedValue({ id: "job-1", service: "plomberie", urgency: "normal", complexity: "moderate" });
  // clearAllMocks() only resets call history, not a mockResolvedValue set by a
  // previous test, so leaving this unset would let one test's technician
  // record leak into the next (see quotes-authorization.test.ts).
  technicianFindByUserId.mockResolvedValue(undefined);
});

describe("POST /api/quotes", () => {
  const validBody = { bookingId: BOOKING, description: "Réparation fuite", laborCost: 150, materialsCost: 100 };

  it("creates a quote for the booking's own technician", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, technicianId: TECH_ID, clientId: "client-1", jobId: "job-1" });
    technicianFindByUserId.mockResolvedValue({ id: TECH_ID, userId: "tech-user-1" });
    quoteCreate.mockResolvedValue({ id: QUOTE, status: "pending", amount: 250 });

    const res = await request(app).post("/api/quotes").send(validBody);

    expect(res.status).toBe(201);
    expect(quoteCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: BOOKING,
        technicianId: TECH_ID,
        clientId: "client-1",
        amount: 250,
        currency: "MAD",
        status: "pending",
        priceFlag: "normal",
        expectedMin: 200,
        expectedMax: 400,
      })
    );
  });

  it("notifies the booking's client with the quoted amount", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, technicianId: TECH_ID, clientId: "client-1", jobId: "job-1" });
    technicianFindByUserId.mockResolvedValue({ id: TECH_ID, userId: "tech-user-1" });
    quoteCreate.mockResolvedValue({ id: QUOTE, status: "pending", amount: 250 });

    await request(app).post("/api/quotes").send(validBody);

    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "client-1", type: "quote", bookingId: BOOKING })
    );
  });

  it("flags a quote above 125% of the market max as above_market", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, technicianId: TECH_ID, clientId: "client-1", jobId: "job-1" });
    technicianFindByUserId.mockResolvedValue({ id: TECH_ID, userId: "tech-user-1" });
    quoteCreate.mockResolvedValue({ id: QUOTE, status: "pending" });
    // band max=400 -> threshold 500; 600 is above it.
    await request(app).post("/api/quotes").send({ ...validBody, laborCost: 400, materialsCost: 200 });

    expect(quoteCreate).toHaveBeenCalledWith(expect.objectContaining({ priceFlag: "above_market", amount: 600 }));
  });

  it("flags a quote below 50% of the market min as below_market", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, technicianId: TECH_ID, clientId: "client-1", jobId: "job-1" });
    technicianFindByUserId.mockResolvedValue({ id: TECH_ID, userId: "tech-user-1" });
    quoteCreate.mockResolvedValue({ id: QUOTE, status: "pending" });
    // band min=200 -> threshold 100; 90 is below it.
    await request(app).post("/api/quotes").send({ ...validBody, laborCost: 90, materialsCost: 0 });

    expect(quoteCreate).toHaveBeenCalledWith(expect.objectContaining({ priceFlag: "below_market", amount: 90 }));
  });

  it("does not flag a quote right at the market boundary as an outlier", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, technicianId: TECH_ID, clientId: "client-1", jobId: "job-1" });
    technicianFindByUserId.mockResolvedValue({ id: TECH_ID, userId: "tech-user-1" });
    quoteCreate.mockResolvedValue({ id: QUOTE, status: "pending" });
    // Exactly 125% of max (500) must stay "normal" — the rule is a strict >.
    await request(app).post("/api/quotes").send({ ...validBody, laborCost: 500, materialsCost: 0 });

    expect(quoteCreate).toHaveBeenCalledWith(expect.objectContaining({ priceFlag: "normal" }));
  });

  it("rejects a zero-amount quote (400)", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, technicianId: TECH_ID, clientId: "client-1", jobId: "job-1" });
    technicianFindByUserId.mockResolvedValue({ id: TECH_ID, userId: "tech-user-1" });

    const res = await request(app).post("/api/quotes").send({ ...validBody, laborCost: 0, materialsCost: 0 });

    expect(res.status).toBe(400);
    expect(quoteCreate).not.toHaveBeenCalled();
  });

  it("rejects a technician quoting someone else's booking (403)", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, technicianId: "other-tech", clientId: "client-1", jobId: "job-1" });
    technicianFindByUserId.mockResolvedValue({ id: TECH_ID, userId: "tech-user-1" });

    const res = await request(app).post("/api/quotes").send(validBody);

    expect(res.status).toBe(403);
    expect(quoteCreate).not.toHaveBeenCalled();
  });

  it("rejects a technician with no technician profile (403)", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, technicianId: TECH_ID, clientId: "client-1", jobId: "job-1" });
    technicianFindByUserId.mockResolvedValue(undefined);

    const res = await request(app).post("/api/quotes").send(validBody);

    expect(res.status).toBe(403);
    expect(quoteCreate).not.toHaveBeenCalled();
  });

  it("lets an admin quote any booking regardless of technician ownership", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    bookingFindById.mockResolvedValue({ id: BOOKING, technicianId: TECH_ID, clientId: "client-1", jobId: "job-1" });
    quoteCreate.mockResolvedValue({ id: QUOTE, status: "pending" });

    const res = await request(app).post("/api/quotes").send(validBody);

    expect(res.status).toBe(201);
    expect(quoteCreate).toHaveBeenCalledWith(expect.objectContaining({ technicianId: TECH_ID }));
  });

  it("404s for an unknown booking", async () => {
    bookingFindById.mockResolvedValue(undefined);
    const res = await request(app).post("/api/quotes").send(validBody);
    expect(res.status).toBe(404);
  });

  it("rejects a client trying to create a quote (403 role check)", async () => {
    currentUser = { id: "client-1", role: "client", name: "C" };
    const res = await request(app).post("/api/quotes").send(validBody);
    expect(res.status).toBe(403);
    expect(quoteCreate).not.toHaveBeenCalled();
  });

  it("rejects an invalid bookingId (400)", async () => {
    const res = await request(app).post("/api/quotes").send({ ...validBody, bookingId: "not-a-uuid" });
    expect(res.status).toBe(400);
  });

  it("rejects a missing description (400)", async () => {
    const res = await request(app).post("/api/quotes").send({ bookingId: BOOKING, laborCost: 100, materialsCost: 0 });
    expect(res.status).toBe(400);
  });

  it("falls back to services_generaux/normal/moderate when the job lookup misses", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, technicianId: TECH_ID, clientId: "client-1", jobId: "job-1" });
    technicianFindByUserId.mockResolvedValue({ id: TECH_ID, userId: "tech-user-1" });
    jobFindById.mockResolvedValue(undefined);
    quoteCreate.mockResolvedValue({ id: QUOTE, status: "pending" });

    await request(app).post("/api/quotes").send(validBody);

    expect(priceBand).toHaveBeenCalledWith({ service: "services_generaux", urgency: "normal", complexity: "moderate" });
  });
});

describe("GET /api/quotes/booking/:id", () => {
  it("returns the booking's quotes for the owning client", async () => {
    currentUser = { id: "client-1", role: "client", name: "C" };
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: TECH_ID });
    quoteFindByBookingId.mockResolvedValue([{ id: QUOTE }]);

    const res = await request(app).get(`/api/quotes/booking/${BOOKING}`);

    expect(res.status).toBe(200);
    expect(quoteFindByBookingId).toHaveBeenCalledWith(BOOKING);
  });

  it("rejects an unrelated client (403)", async () => {
    currentUser = { id: "someone-else", role: "client", name: "X" };
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: TECH_ID });

    const res = await request(app).get(`/api/quotes/booking/${BOOKING}`);

    expect(res.status).toBe(403);
    expect(quoteFindByBookingId).not.toHaveBeenCalled();
  });

  it("404s for an unknown booking", async () => {
    bookingFindById.mockResolvedValue(undefined);
    const res = await request(app).get(`/api/quotes/booking/${BOOKING}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /api/quotes/:id/accept", () => {
  it("locks the accepted price onto the booking", async () => {
    currentUser = { id: "client-1", role: "client", name: "C" };
    quoteFindById.mockResolvedValue({
      id: QUOTE,
      bookingId: BOOKING,
      clientId: "client-1",
      status: "pending",
      amount: 250,
      expiresAt: new Date(Date.now() + 86400000),
    });
    quoteUpdate.mockResolvedValue({ id: QUOTE, status: "accepted" });

    const res = await request(app).post(`/api/quotes/${QUOTE}/accept`);

    expect(res.status).toBe(200);
    expect(quoteUpdate).toHaveBeenCalledWith(QUOTE, expect.objectContaining({ status: "accepted" }));
    expect(bookingUpdate).toHaveBeenCalledWith(BOOKING, { estimatedCost: 250 });
  });

  it("rejects a non-owning client (403)", async () => {
    currentUser = { id: "someone-else", role: "client", name: "X" };
    quoteFindById.mockResolvedValue({
      id: QUOTE,
      bookingId: BOOKING,
      clientId: "client-1",
      status: "pending",
      amount: 250,
      expiresAt: new Date(Date.now() + 86400000),
    });

    const res = await request(app).post(`/api/quotes/${QUOTE}/accept`);

    expect(res.status).toBe(403);
    expect(quoteUpdate).not.toHaveBeenCalled();
    expect(bookingUpdate).not.toHaveBeenCalled();
  });

  it("rejects accepting an already-accepted quote (400)", async () => {
    currentUser = { id: "client-1", role: "client", name: "C" };
    quoteFindById.mockResolvedValue({
      id: QUOTE,
      bookingId: BOOKING,
      clientId: "client-1",
      status: "accepted",
      amount: 250,
      expiresAt: new Date(Date.now() + 86400000),
    });

    const res = await request(app).post(`/api/quotes/${QUOTE}/accept`);

    expect(res.status).toBe(400);
    expect(quoteUpdate).not.toHaveBeenCalled();
    expect(bookingUpdate).not.toHaveBeenCalled();
  });

  it("expires a stale pending quote instead of accepting it (400)", async () => {
    currentUser = { id: "client-1", role: "client", name: "C" };
    quoteFindById.mockResolvedValue({
      id: QUOTE,
      bookingId: BOOKING,
      clientId: "client-1",
      status: "pending",
      amount: 250,
      expiresAt: new Date(Date.now() - 1000),
    });

    const res = await request(app).post(`/api/quotes/${QUOTE}/accept`);

    expect(res.status).toBe(400);
    expect(quoteUpdate).toHaveBeenCalledWith(QUOTE, { status: "expired" });
    expect(bookingUpdate).not.toHaveBeenCalled();
  });

  it("404s for an unknown quote", async () => {
    quoteFindById.mockResolvedValue(undefined);
    const res = await request(app).post(`/api/quotes/${QUOTE}/accept`);
    expect(res.status).toBe(404);
  });

  it("lets an admin accept a quote on the client's behalf", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    quoteFindById.mockResolvedValue({
      id: QUOTE,
      bookingId: BOOKING,
      clientId: "client-1",
      status: "pending",
      amount: 250,
      expiresAt: new Date(Date.now() + 86400000),
    });
    quoteUpdate.mockResolvedValue({ id: QUOTE, status: "accepted" });

    const res = await request(app).post(`/api/quotes/${QUOTE}/accept`);

    expect(res.status).toBe(200);
    expect(bookingUpdate).toHaveBeenCalledWith(BOOKING, { estimatedCost: 250 });
  });

  it("rejects an invalid quote id (400)", async () => {
    const res = await request(app).post("/api/quotes/not-a-uuid/accept");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/quotes/:id/reject", () => {
  it("rejects a pending quote for the owning client", async () => {
    currentUser = { id: "client-1", role: "client", name: "C" };
    quoteFindById.mockResolvedValue({ id: QUOTE, bookingId: BOOKING, clientId: "client-1", status: "pending" });
    quoteUpdate.mockResolvedValue({ id: QUOTE, status: "rejected" });

    const res = await request(app).post(`/api/quotes/${QUOTE}/reject`);

    expect(res.status).toBe(200);
    expect(quoteUpdate).toHaveBeenCalledWith(QUOTE, expect.objectContaining({ status: "rejected" }));
    expect(bookingUpdate).not.toHaveBeenCalled();
  });

  it("rejects a non-owning client (403)", async () => {
    currentUser = { id: "someone-else", role: "client", name: "X" };
    quoteFindById.mockResolvedValue({ id: QUOTE, bookingId: BOOKING, clientId: "client-1", status: "pending" });

    const res = await request(app).post(`/api/quotes/${QUOTE}/reject`);

    expect(res.status).toBe(403);
    expect(quoteUpdate).not.toHaveBeenCalled();
  });

  it("rejects rejecting an already-rejected quote (400)", async () => {
    currentUser = { id: "client-1", role: "client", name: "C" };
    quoteFindById.mockResolvedValue({ id: QUOTE, bookingId: BOOKING, clientId: "client-1", status: "rejected" });

    const res = await request(app).post(`/api/quotes/${QUOTE}/reject`);

    expect(res.status).toBe(400);
    expect(quoteUpdate).not.toHaveBeenCalled();
  });

  it("404s for an unknown quote", async () => {
    quoteFindById.mockResolvedValue(undefined);
    const res = await request(app).post(`/api/quotes/${QUOTE}/reject`);
    expect(res.status).toBe(404);
  });
});
