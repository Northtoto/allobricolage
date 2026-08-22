import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Authenticated as client-1 by default; overridden per-test via currentUser.
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

const bookingFindById = vi.fn();
const technicianFindByUserId = vi.fn();
const quoteFindByBookingId = vi.fn();
vi.mock("@/repositories/booking.repository.ts", () => ({
  bookingRepository: { findById: (id: string) => bookingFindById(id) },
}));
vi.mock("@/repositories/technician.repository.ts", () => ({
  technicianRepository: { findByUserId: (id: string) => technicianFindByUserId(id) },
}));
vi.mock("@/repositories/quote.repository.ts", () => ({
  quoteRepository: { findByBookingId: (id: string) => quoteFindByBookingId(id) },
}));

import { app } from "@/index.ts";

const BOOKING = "22222222-2222-2222-2222-222222222222";

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = { id: "client-1", role: "client", name: "C" };
  // Explicit baseline — clearAllMocks() only resets call history, not a
  // mockResolvedValue set by a previous test, so leaving this unset would
  // let one test's technician record leak into the next.
  technicianFindByUserId.mockResolvedValue(undefined);
});

describe("GET /api/quotes/booking/:id authorization", () => {
  it("allows the booking's own client", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: "tech-1" });
    quoteFindByBookingId.mockResolvedValue([]);
    const res = await request(app).get(`/api/quotes/booking/${BOOKING}`);
    expect(res.status).toBe(200);
    expect(quoteFindByBookingId).toHaveBeenCalledWith(BOOKING);
  });

  it("allows the booking's own technician", async () => {
    currentUser = { id: "tech-user-1", role: "technician", name: "T" };
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: "tech-1" });
    technicianFindByUserId.mockResolvedValue({ id: "tech-1", userId: "tech-user-1" });
    quoteFindByBookingId.mockResolvedValue([]);
    const res = await request(app).get(`/api/quotes/booking/${BOOKING}`);
    expect(res.status).toBe(200);
  });

  it("rejects an unrelated client — no ownership check must not leak quotes (403)", async () => {
    currentUser = { id: "someone-else", role: "client", name: "X" };
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: "tech-1" });
    const res = await request(app).get(`/api/quotes/booking/${BOOKING}`);
    expect(res.status).toBe(403);
    expect(quoteFindByBookingId).not.toHaveBeenCalled();
  });

  it("rejects an unrelated technician (403)", async () => {
    currentUser = { id: "other-tech-user", role: "technician", name: "T2" };
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: "tech-1" });
    technicianFindByUserId.mockResolvedValue({ id: "tech-2", userId: "other-tech-user" });
    const res = await request(app).get(`/api/quotes/booking/${BOOKING}`);
    expect(res.status).toBe(403);
    expect(quoteFindByBookingId).not.toHaveBeenCalled();
  });

  it("allows admin regardless of ownership", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: "tech-1" });
    quoteFindByBookingId.mockResolvedValue([]);
    const res = await request(app).get(`/api/quotes/booking/${BOOKING}`);
    expect(res.status).toBe(200);
  });

  it("404s for an unknown booking", async () => {
    bookingFindById.mockResolvedValue(undefined);
    const res = await request(app).get(`/api/quotes/booking/${BOOKING}`);
    expect(res.status).toBe(404);
  });
});
