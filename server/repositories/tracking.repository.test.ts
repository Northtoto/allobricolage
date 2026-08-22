import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TechnicianLocation, JobAddress } from "@shared/schema.ts";

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

import { trackingRepository } from "./tracking.repository.ts";

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(mockDb).forEach((fn) => fn.mockReturnThis());
});

const makeLocation = (overrides: Partial<TechnicianLocation> = {}): TechnicianLocation => ({
  id: "loc-1",
  technicianId: "tech-1",
  bookingId: "booking-1",
  latitude: 33.5731,
  longitude: -7.5898,
  accuracy: 10,
  heading: 90,
  speed: 5,
  altitude: null,
  isActive: true,
  batteryLevel: 80,
  timestamp: new Date("2026-08-22T10:00:00Z"),
  updatedAt: new Date("2026-08-22T10:00:00Z"),
  ...overrides,
});

const makeAddress = (overrides: Partial<JobAddress> = {}): JobAddress => ({
  id: "addr-1",
  bookingId: "booking-1",
  address: "12 Rue des Fleurs",
  city: "Casablanca",
  postalCode: "20000",
  latitude: 33.5731,
  longitude: -7.5898,
  placeId: "place-123",
  formattedAddress: "12 Rue des Fleurs, Casablanca, Morocco",
  additionalInstructions: "Ring twice",
  createdAt: new Date("2026-08-01T00:00:00Z"),
  ...overrides,
});

describe("trackingRepository.findLatestByBookingId", () => {
  it("returns the most recent location for the booking", async () => {
    const row = makeLocation({ bookingId: "booking-1" });
    mockDb.limit.mockResolvedValueOnce([row]);

    const result = await trackingRepository.findLatestByBookingId("booking-1");

    expect(result).toEqual(row);
    expect(mockDb.orderBy).toHaveBeenCalled();
    expect(mockDb.limit).toHaveBeenCalledWith(1);
  });

  it("returns undefined when the booking has no location history", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const result = await trackingRepository.findLatestByBookingId("booking-none");

    expect(result).toBeUndefined();
  });
});

describe("trackingRepository.createLocation", () => {
  it("generates an id and inserts the location", async () => {
    const insertData = {
      technicianId: "tech-1",
      bookingId: "booking-1",
      latitude: 33.5731,
      longitude: -7.5898,
    };
    const created = makeLocation({ id: "generated-uuid", ...insertData });
    mockDb.returning.mockResolvedValueOnce([created]);

    const result = await trackingRepository.createLocation(insertData as never);

    expect(result).toEqual(created);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith({ ...insertData, id: "generated-uuid" });
  });
});

describe("trackingRepository.deactivateByBookingId", () => {
  it("marks locations for the booking inactive", async () => {
    mockDb.where.mockResolvedValueOnce(undefined);

    await trackingRepository.deactivateByBookingId("booking-1");

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith({ isActive: false });
    expect(mockDb.where).toHaveBeenCalled();
  });
});

describe("trackingRepository.findAddressByBookingId", () => {
  it("returns the job address for the booking", async () => {
    const row = makeAddress({ bookingId: "booking-1" });
    mockDb.limit.mockResolvedValueOnce([row]);

    const result = await trackingRepository.findAddressByBookingId("booking-1");

    expect(result).toEqual(row);
    expect(mockDb.limit).toHaveBeenCalledWith(1);
  });

  it("returns undefined when the booking has no address", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const result = await trackingRepository.findAddressByBookingId("booking-none");

    expect(result).toBeUndefined();
  });
});

describe("trackingRepository.createAddress", () => {
  it("generates an id and inserts the address", async () => {
    const insertData = {
      bookingId: "booking-1",
      address: "12 Rue des Fleurs",
      city: "Casablanca",
      latitude: 33.5731,
      longitude: -7.5898,
    };
    const created = makeAddress({ id: "generated-uuid", ...insertData });
    mockDb.returning.mockResolvedValueOnce([created]);

    const result = await trackingRepository.createAddress(insertData as never);

    expect(result).toEqual(created);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith({ ...insertData, id: "generated-uuid" });
  });
});
