import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Quote } from "@shared/schema.ts";

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

import { quoteRepository } from "./quote.repository.ts";

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(mockDb).forEach((fn) => fn.mockReturnThis());
});

const makeQuote = (overrides: Partial<Quote> = {}): Quote => ({
  id: "quote-1",
  bookingId: "booking-1",
  technicianId: "tech-1",
  clientId: "client-1",
  description: "Fix leaking pipe under the sink",
  laborCost: 200,
  materialsCost: 100,
  amount: 300,
  currency: "MAD",
  status: "pending",
  priceFlag: "normal",
  expectedMin: 250,
  expectedMax: 350,
  respondedAt: null,
  expiresAt: null,
  createdAt: new Date("2026-08-01T00:00:00Z"),
  ...overrides,
});

describe("quoteRepository.findById", () => {
  it("returns the quote when found", async () => {
    const row = makeQuote({ id: "quote-1" });
    mockDb.limit.mockResolvedValueOnce([row]);

    const result = await quoteRepository.findById("quote-1");

    expect(result).toEqual(row);
    expect(mockDb.limit).toHaveBeenCalledWith(1);
  });

  it("returns undefined when no quote matches", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const result = await quoteRepository.findById("missing");

    expect(result).toBeUndefined();
  });
});

describe("quoteRepository.findByBookingId", () => {
  it("returns quotes for the booking ordered by createdAt desc", async () => {
    const rows = [makeQuote({ id: "q1" }), makeQuote({ id: "q2" })];
    mockDb.orderBy.mockResolvedValueOnce(rows);

    const result = await quoteRepository.findByBookingId("booking-1");

    expect(result).toEqual(rows);
    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.orderBy).toHaveBeenCalled();
  });

  it("returns an empty array when the booking has no quotes", async () => {
    mockDb.orderBy.mockResolvedValueOnce([]);

    const result = await quoteRepository.findByBookingId("booking-none");

    expect(result).toEqual([]);
  });
});

describe("quoteRepository.create", () => {
  it("generates an id and inserts the quote", async () => {
    const insertData = {
      bookingId: "booking-1",
      technicianId: "tech-1",
      clientId: "client-1",
      description: "Fix leaking pipe under the sink",
      amount: 300,
    };
    const created = makeQuote({ id: "generated-uuid", ...insertData });
    mockDb.returning.mockResolvedValueOnce([created]);

    const result = await quoteRepository.create(insertData as never);

    expect(result).toEqual(created);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith({ ...insertData, id: "generated-uuid" });
  });
});

describe("quoteRepository.update", () => {
  it("updates and returns the quote when it exists", async () => {
    const updated = makeQuote({ id: "quote-1", status: "accepted" });
    mockDb.returning.mockResolvedValueOnce([updated]);

    const result = await quoteRepository.update("quote-1", { status: "accepted" } as never);

    expect(result).toEqual(updated);
    expect(mockDb.set).toHaveBeenCalledWith({ status: "accepted" });
  });

  it("returns undefined when the quote does not exist", async () => {
    mockDb.returning.mockResolvedValueOnce([]);

    const result = await quoteRepository.update("missing", { status: "accepted" } as never);

    expect(result).toBeUndefined();
  });
});
