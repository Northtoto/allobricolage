import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock auth so we control the acting user, and the repos the review route touches.
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
const reviewFindByBooking = vi.fn();
const reviewCreate = vi.fn(async (d: any) => ({ id: "rev-1", ...d }));
vi.mock("@/repositories/booking.repository.ts", () => ({ bookingRepository: { findById: (id: string) => bookingFindById(id) } }));
vi.mock("@/repositories/review.repository.ts", () => ({
  reviewRepository: { findByBookingId: (id: string) => reviewFindByBooking(id), create: (d: any) => reviewCreate(d) },
}));
vi.mock("@/repositories/technician.repository.ts", () => ({ technicianRepository: { updateRating: vi.fn() } }));

import { app } from "@/index.ts";

const TECH = "11111111-1111-1111-1111-111111111111";
const BOOKING = "22222222-2222-2222-2222-222222222222";
const body = { technicianId: TECH, bookingId: BOOKING, rating: 5, comment: "great" };

beforeEach(() => vi.clearAllMocks());

describe("review anti-fraud gate", () => {
  it("rejects a review with no matching booking (404)", async () => {
    bookingFindById.mockResolvedValue(undefined);
    const res = await request(app).post("/api/reviews").send(body);
    expect(res.status).toBe(404);
    expect(reviewCreate).not.toHaveBeenCalled();
  });

  it("rejects reviewing someone else's booking (403)", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "OTHER-client", technicianId: TECH, status: "completed" });
    const res = await request(app).post("/api/reviews").send(body);
    expect(res.status).toBe(403);
    expect(reviewCreate).not.toHaveBeenCalled();
  });

  it("rejects reviewing a non-completed booking (400)", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: TECH, status: "pending" });
    const res = await request(app).post("/api/reviews").send(body);
    expect(res.status).toBe(400);
    expect(reviewCreate).not.toHaveBeenCalled();
  });

  it("rejects a duplicate review for the same booking (409)", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: TECH, status: "completed" });
    reviewFindByBooking.mockResolvedValue({ id: "existing" });
    const res = await request(app).post("/api/reviews").send(body);
    expect(res.status).toBe(409);
    expect(reviewCreate).not.toHaveBeenCalled();
  });

  it("accepts a legitimate review from the owner's completed booking and marks it verified", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: TECH, status: "completed" });
    reviewFindByBooking.mockResolvedValue(undefined);
    const res = await request(app).post("/api/reviews").send(body);
    expect(res.status).toBe(201);
    expect(reviewCreate).toHaveBeenCalledWith(expect.objectContaining({ clientId: "client-1", isVerified: true }));
  });
});
