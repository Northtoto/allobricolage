import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Authenticated as client-1.
vi.mock("@/middleware/auth.ts", async (orig) => {
  const actual = await orig<typeof import("@/middleware/auth.ts")>();
  return {
    ...actual,
    authenticate: (req: any, _res: any, next: any) => {
      req.user = { id: "client-1", role: "client", name: "C" };
      next();
    },
  };
});
const bookingFindById = vi.fn();
const processPayment = vi.fn(async () => ({ paymentId: "p1", transactionId: "TRX-1", status: "pending" }));
vi.mock("@/repositories/booking.repository.ts", () => ({ bookingRepository: { findById: (id: string) => bookingFindById(id) } }));
vi.mock("@/services/payment.service.ts", () => ({ paymentService: { processPayment: (d: any) => processPayment(d), getPaymentMethods: () => [] } }));
vi.mock("@/repositories/payment.repository.ts", () => ({ paymentRepository: {} }));

import { app } from "@/index.ts";

const BOOKING = "22222222-2222-2222-2222-222222222222";
beforeEach(() => vi.clearAllMocks());

describe("payment amount integrity", () => {
  it("ignores a client-supplied amount and charges the booking's locked amount", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", estimatedCost: 1000 });
    // Client tries to pay 1 MAD for a 1000 MAD job.
    const res = await request(app).post("/api/payments/create").send({ bookingId: BOOKING, amount: 1, paymentMethod: "cash" });
    expect(res.status).toBe(201);
    expect(processPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: 1000 }));
  });

  it("rejects paying someone else's booking (403)", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "OTHER", estimatedCost: 1000 });
    const res = await request(app).post("/api/payments/create").send({ bookingId: BOOKING, paymentMethod: "cash" });
    expect(res.status).toBe(403);
    expect(processPayment).not.toHaveBeenCalled();
  });

  it("rejects payment when the booking has no amount set yet (400)", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", estimatedCost: null });
    const res = await request(app).post("/api/payments/create").send({ bookingId: BOOKING, paymentMethod: "cash" });
    expect(res.status).toBe(400);
    expect(processPayment).not.toHaveBeenCalled();
  });

  it("rejects an unknown booking (404)", async () => {
    bookingFindById.mockResolvedValue(undefined);
    const res = await request(app).post("/api/payments/create").send({ bookingId: BOOKING, paymentMethod: "cash" });
    expect(res.status).toBe(404);
  });

  it("rejects an invalid payment method (400 validation)", async () => {
    const res = await request(app).post("/api/payments/create").send({ bookingId: BOOKING, paymentMethod: "bitcoin" });
    expect(res.status).toBe(400);
  });
});
