import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Review } from "@shared/schema.ts";

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

import { reviewRepository } from "./review.repository.ts";
import { NotFoundError } from "@/utils/errors.ts";

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(mockDb).forEach((fn) => fn.mockReturnThis());
});

const makeReview = (overrides: Partial<Review> = {}): Review => ({
  id: "review-1",
  technicianId: "tech-1",
  clientId: "client-1",
  bookingId: "booking-1",
  rating: 5,
  comment: "Great work, on time and tidy.",
  serviceQuality: 5,
  punctuality: 5,
  professionalism: 5,
  valueForMoney: 4,
  isVerified: true,
  technicianResponse: null,
  createdAt: new Date("2026-08-01T00:00:00Z"),
  ...overrides,
});

describe("reviewRepository.findAll", () => {
  it("returns all reviews ordered by createdAt desc", async () => {
    const rows = [makeReview({ id: "r1" }), makeReview({ id: "r2" })];
    mockDb.orderBy.mockResolvedValueOnce(rows);

    const result = await reviewRepository.findAll();

    expect(result).toEqual(rows);
    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.orderBy).toHaveBeenCalled();
  });
});

describe("reviewRepository.findById", () => {
  it("returns the review when found", async () => {
    const row = makeReview({ id: "r1" });
    mockDb.limit.mockResolvedValueOnce([row]);

    const result = await reviewRepository.findById("r1");

    expect(result).toEqual(row);
    expect(mockDb.limit).toHaveBeenCalledWith(1);
  });

  it("returns undefined when no review matches", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const result = await reviewRepository.findById("missing");

    expect(result).toBeUndefined();
  });
});

describe("reviewRepository.findByTechnicianId", () => {
  it("returns reviews for the technician", async () => {
    const rows = [makeReview({ technicianId: "tech-1" })];
    mockDb.orderBy.mockResolvedValueOnce(rows);

    const result = await reviewRepository.findByTechnicianId("tech-1");

    expect(result).toEqual(rows);
  });

  it("returns an empty array when the technician has no reviews", async () => {
    mockDb.orderBy.mockResolvedValueOnce([]);

    const result = await reviewRepository.findByTechnicianId("tech-none");

    expect(result).toEqual([]);
  });
});

describe("reviewRepository.findByClientId", () => {
  it("returns reviews for the client", async () => {
    const rows = [makeReview({ clientId: "client-1" })];
    mockDb.orderBy.mockResolvedValueOnce(rows);

    const result = await reviewRepository.findByClientId("client-1");

    expect(result).toEqual(rows);
  });
});

describe("reviewRepository.findByBookingId", () => {
  it("returns the review for the booking", async () => {
    const row = makeReview({ bookingId: "booking-1" });
    mockDb.limit.mockResolvedValueOnce([row]);

    const result = await reviewRepository.findByBookingId("booking-1");

    expect(result).toEqual(row);
    expect(mockDb.limit).toHaveBeenCalledWith(1);
  });

  it("returns undefined when the booking has no review", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const result = await reviewRepository.findByBookingId("booking-none");

    expect(result).toBeUndefined();
  });
});

describe("reviewRepository.create", () => {
  it("generates an id and inserts the review", async () => {
    const insertData = {
      technicianId: "tech-1",
      clientId: "client-1",
      bookingId: "booking-1",
      rating: 5,
      comment: "Great work, on time and tidy.",
    };
    const created = makeReview({ id: "generated-uuid", ...insertData });
    mockDb.returning.mockResolvedValueOnce([created]);

    const result = await reviewRepository.create(insertData as never);

    expect(result).toEqual(created);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith({ ...insertData, id: "generated-uuid" });
  });
});

describe("reviewRepository.update", () => {
  it("updates and returns the review when it exists", async () => {
    const updated = makeReview({ id: "r1", technicianResponse: "Thank you!" });
    mockDb.returning.mockResolvedValueOnce([updated]);

    const result = await reviewRepository.update("r1", { technicianResponse: "Thank you!" } as never);

    expect(result).toEqual(updated);
    expect(mockDb.set).toHaveBeenCalledWith({ technicianResponse: "Thank you!" });
  });

  it("throws NotFoundError when the review does not exist", async () => {
    mockDb.returning.mockResolvedValueOnce([]);

    await expect(reviewRepository.update("missing", { rating: 4 } as never)).rejects.toThrow(
      NotFoundError
    );
  });
});
