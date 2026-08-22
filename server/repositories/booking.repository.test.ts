import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Booking } from "@shared/schema.ts";

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

import { bookingRepository } from "./booking.repository.ts";
import { NotFoundError } from "@/utils/errors.ts";

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(mockDb).forEach((fn) => fn.mockReturnThis());
});

const makeBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: "booking-1",
  jobId: "job-1",
  technicianId: "tech-1",
  clientId: "client-1",
  clientName: "Youssef Alami",
  clientPhone: "0612345678",
  scheduledDate: "2026-09-01",
  scheduledTime: "10:00",
  status: "pending",
  isEmergency: false,
  estimatedCost: 300,
  finalCost: null,
  actualStartTime: null,
  actualEndTime: null,
  guaranteePeriodDays: 0,
  matchScore: null,
  matchExplanation: null,
  createdAt: new Date("2026-08-01T00:00:00Z"),
  ...overrides,
});

describe("bookingRepository.findAll", () => {
  it("returns all bookings ordered by createdAt desc", async () => {
    const rows = [makeBooking({ id: "b1" }), makeBooking({ id: "b2" })];
    mockDb.orderBy.mockResolvedValueOnce(rows);

    const result = await bookingRepository.findAll();

    expect(result).toEqual(rows);
    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.orderBy).toHaveBeenCalled();
  });
});

describe("bookingRepository.findById", () => {
  it("returns the booking when found", async () => {
    const row = makeBooking({ id: "b1" });
    mockDb.limit.mockResolvedValueOnce([row]);

    const result = await bookingRepository.findById("b1");

    expect(result).toEqual(row);
    expect(mockDb.limit).toHaveBeenCalledWith(1);
  });

  it("returns undefined when no booking matches", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const result = await bookingRepository.findById("missing");

    expect(result).toBeUndefined();
  });
});

describe("bookingRepository.findByTechnicianId", () => {
  it("returns bookings for the technician", async () => {
    const rows = [makeBooking({ technicianId: "tech-1" })];
    mockDb.orderBy.mockResolvedValueOnce(rows);

    const result = await bookingRepository.findByTechnicianId("tech-1");

    expect(result).toEqual(rows);
  });

  it("returns an empty array when the technician has no bookings", async () => {
    mockDb.orderBy.mockResolvedValueOnce([]);

    const result = await bookingRepository.findByTechnicianId("tech-none");

    expect(result).toEqual([]);
  });
});

describe("bookingRepository.findByClientId", () => {
  it("returns bookings for the client", async () => {
    const rows = [makeBooking({ clientId: "client-1" })];
    mockDb.orderBy.mockResolvedValueOnce(rows);

    const result = await bookingRepository.findByClientId("client-1");

    expect(result).toEqual(rows);
  });
});

describe("bookingRepository.create", () => {
  it("generates an id and inserts the booking", async () => {
    const insertData = {
      jobId: "job-1",
      technicianId: "tech-1",
      clientId: "client-1",
      clientName: "Youssef Alami",
      clientPhone: "0612345678",
      scheduledDate: "2026-09-01",
      scheduledTime: "10:00",
    };
    const created = makeBooking({ id: "generated-uuid", ...insertData });
    mockDb.returning.mockResolvedValueOnce([created]);

    const result = await bookingRepository.create(insertData as never);

    expect(result).toEqual(created);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith({ ...insertData, id: "generated-uuid" });
  });
});

describe("bookingRepository.update", () => {
  it("updates and returns the booking when it exists", async () => {
    const updated = makeBooking({ id: "b1", status: "accepted" });
    mockDb.returning.mockResolvedValueOnce([updated]);

    const result = await bookingRepository.update("b1", { status: "accepted" } as never);

    expect(result).toEqual(updated);
    expect(mockDb.set).toHaveBeenCalledWith({ status: "accepted" });
  });

  it("throws NotFoundError when the booking does not exist", async () => {
    mockDb.returning.mockResolvedValueOnce([]);

    await expect(bookingRepository.update("missing", { status: "accepted" } as never)).rejects.toThrow(
      NotFoundError
    );
  });
});

describe("bookingRepository.findPendingByTechnician", () => {
  it("returns only pending bookings for the technician", async () => {
    const rows = [makeBooking({ technicianId: "tech-1", status: "pending" })];
    mockDb.orderBy.mockResolvedValueOnce(rows);

    const result = await bookingRepository.findPendingByTechnician("tech-1");

    expect(result).toEqual(rows);
  });
});

describe("bookingRepository.getStats", () => {
  it("aggregates counts and earnings from finalCost, falling back to estimatedCost", async () => {
    const rows = [
      makeBooking({ id: "b1", status: "completed", finalCost: 500, estimatedCost: 400 }),
      makeBooking({ id: "b2", status: "completed", finalCost: null, estimatedCost: 200 }),
      makeBooking({ id: "b3", status: "pending" }),
      makeBooking({ id: "b4", status: "cancelled" }),
    ];
    mockDb.where.mockResolvedValueOnce(rows);

    const stats = await bookingRepository.getStats("tech-1");

    expect(stats).toEqual({
      totalBookings: 4,
      pendingBookings: 1,
      completedBookings: 2,
      totalEarnings: 700,
    });
  });

  it("returns zeroed stats when the technician has no bookings", async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const stats = await bookingRepository.getStats("tech-none");

    expect(stats).toEqual({
      totalBookings: 0,
      pendingBookings: 0,
      completedBookings: 0,
      totalEarnings: 0,
    });
  });
});

describe("bookingRepository.getClientStats", () => {
  it("aggregates total/active/completed booking counts for the client", async () => {
    const rows = [
      makeBooking({ id: "b1", status: "pending" }),
      makeBooking({ id: "b2", status: "accepted" }),
      makeBooking({ id: "b3", status: "completed" }),
      makeBooking({ id: "b4", status: "cancelled" }),
    ];
    mockDb.where.mockResolvedValueOnce(rows);

    const stats = await bookingRepository.getClientStats("client-1");

    expect(stats).toEqual({
      totalBookings: 4,
      activeBookings: 2,
      completedBookings: 1,
    });
  });
});
