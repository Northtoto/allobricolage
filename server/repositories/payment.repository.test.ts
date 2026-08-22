import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Payment } from "@shared/schema.ts";

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

import { paymentRepository } from "./payment.repository.ts";
import { NotFoundError } from "@/utils/errors.ts";

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(mockDb).forEach((fn) => fn.mockReturnThis());
});

const makePayment = (overrides: Partial<Payment> = {}): Payment => ({
  id: "pay-1",
  bookingId: "booking-1",
  amount: 300,
  currency: "MAD",
  paymentMethod: "cash",
  status: "pending",
  escrowStatus: "pending",
  commissionRate: 0.18,
  commissionAmount: 54,
  technicianPayout: 246,
  paymentIntentId: null,
  transactionId: "TRX-1",
  bankReference: null,
  paymentDetails: null,
  paidAt: null,
  createdAt: new Date("2026-08-01T00:00:00Z"),
  updatedAt: new Date("2026-08-01T00:00:00Z"),
  ...overrides,
});

describe("paymentRepository.findById", () => {
  it("returns the payment when found", async () => {
    const row = makePayment({ id: "pay-1" });
    mockDb.limit.mockResolvedValueOnce([row]);

    const result = await paymentRepository.findById("pay-1");

    expect(result).toEqual(row);
    expect(mockDb.limit).toHaveBeenCalledWith(1);
  });

  it("returns undefined when no payment matches", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const result = await paymentRepository.findById("missing");

    expect(result).toBeUndefined();
  });
});

describe("paymentRepository.findByBookingId", () => {
  it("returns the payment for the booking", async () => {
    const row = makePayment({ bookingId: "booking-1" });
    mockDb.limit.mockResolvedValueOnce([row]);

    const result = await paymentRepository.findByBookingId("booking-1");

    expect(result).toEqual(row);
    expect(mockDb.limit).toHaveBeenCalledWith(1);
  });

  it("returns undefined when the booking has no payment", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const result = await paymentRepository.findByBookingId("booking-none");

    expect(result).toBeUndefined();
  });
});

describe("paymentRepository.create", () => {
  it("generates an id and inserts the payment", async () => {
    const insertData = {
      bookingId: "booking-1",
      amount: 300,
      paymentMethod: "cash",
      status: "pending",
    };
    const created = makePayment({ id: "generated-uuid", ...insertData });
    mockDb.returning.mockResolvedValueOnce([created]);

    const result = await paymentRepository.create(insertData as never);

    expect(result).toEqual(created);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith({ ...insertData, id: "generated-uuid" });
  });
});

describe("paymentRepository.update", () => {
  it("updates and returns the payment when it exists", async () => {
    const updated = makePayment({ id: "pay-1", status: "completed" });
    mockDb.returning.mockResolvedValueOnce([updated]);

    const result = await paymentRepository.update("pay-1", { status: "completed" } as never);

    expect(result).toEqual(updated);
    const setArg = mockDb.set.mock.calls[0][0];
    expect(setArg.status).toBe("completed");
    expect(setArg.updatedAt).toBeInstanceOf(Date);
  });

  it("throws NotFoundError when the payment does not exist", async () => {
    mockDb.returning.mockResolvedValueOnce([]);

    await expect(
      paymentRepository.update("missing", { status: "completed" } as never)
    ).rejects.toThrow(NotFoundError);
  });
});
