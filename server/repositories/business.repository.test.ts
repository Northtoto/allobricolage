import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BusinessProfile, BusinessRetainer } from "@shared/schema.ts";

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

import { businessRepository } from "./business.repository.ts";
import { NotFoundError } from "@/utils/errors.ts";

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(mockDb).forEach((fn) => fn.mockReturnThis());
});

const makeProfile = (overrides: Partial<BusinessProfile> = {}): BusinessProfile => ({
  id: "biz-1",
  userId: "user-1",
  companyName: "Café Atlas",
  businessType: "cafe",
  ice: null,
  city: "Casablanca",
  address: null,
  siteCount: 1,
  contactName: null,
  contactPhone: null,
  retainerTier: "none",
  retainerExpiresAt: null,
  createdAt: new Date("2026-08-01T00:00:00Z"),
  ...overrides,
});

const makeRetainer = (overrides: Partial<BusinessRetainer> = {}): BusinessRetainer => ({
  id: "retainer-1",
  businessId: "biz-1",
  tier: "pro",
  priceMonthly: 1500,
  slaHours: 24,
  sitesIncluded: 3,
  preventiveVisitsPerMonth: 2,
  startedAt: new Date("2026-08-01T00:00:00Z"),
  expiresAt: null,
  isAutoRenew: true,
  status: "active",
  createdAt: new Date("2026-08-01T00:00:00Z"),
  ...overrides,
});

describe("businessRepository.findProfileByUserId", () => {
  it("returns the profile when found", async () => {
    const row = makeProfile({ userId: "user-1" });
    mockDb.limit.mockResolvedValueOnce([row]);

    const result = await businessRepository.findProfileByUserId("user-1");

    expect(result).toEqual(row);
    expect(mockDb.limit).toHaveBeenCalledWith(1);
  });

  it("returns undefined when no profile matches", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const result = await businessRepository.findProfileByUserId("no-user");

    expect(result).toBeUndefined();
  });
});

describe("businessRepository.findProfileById", () => {
  it("returns the profile when found", async () => {
    const row = makeProfile({ id: "biz-1" });
    mockDb.limit.mockResolvedValueOnce([row]);

    const result = await businessRepository.findProfileById("biz-1");

    expect(result).toEqual(row);
  });

  it("returns undefined when no profile matches", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const result = await businessRepository.findProfileById("missing");

    expect(result).toBeUndefined();
  });
});

describe("businessRepository.createProfile", () => {
  it("generates an id and inserts the profile", async () => {
    const insertData = { userId: "user-1", companyName: "Café Atlas", businessType: "cafe" };
    const created = makeProfile({ id: "generated-uuid", ...insertData });
    mockDb.returning.mockResolvedValueOnce([created]);

    const result = await businessRepository.createProfile(insertData as never);

    expect(result).toEqual(created);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith({ ...insertData, id: "generated-uuid" });
  });
});

describe("businessRepository.updateProfile", () => {
  it("updates and returns the profile", async () => {
    const updated = makeProfile({ id: "biz-1", retainerTier: "pro" });
    mockDb.returning.mockResolvedValueOnce([updated]);

    const result = await businessRepository.updateProfile("biz-1", { retainerTier: "pro" } as never);

    expect(result).toEqual(updated);
    expect(mockDb.set).toHaveBeenCalledWith({ retainerTier: "pro" });
  });

  it("throws NotFoundError when the profile does not exist", async () => {
    mockDb.returning.mockResolvedValueOnce([]);

    await expect(
      businessRepository.updateProfile("missing", { retainerTier: "pro" } as never)
    ).rejects.toThrow(NotFoundError);
  });
});

describe("businessRepository.findActiveRetainer", () => {
  it("returns the most recently started retainer", async () => {
    const row = makeRetainer({ businessId: "biz-1" });
    mockDb.limit.mockResolvedValueOnce([row]);

    const result = await businessRepository.findActiveRetainer("biz-1");

    expect(result).toEqual(row);
    expect(mockDb.orderBy).toHaveBeenCalled();
    expect(mockDb.limit).toHaveBeenCalledWith(1);
  });

  it("returns undefined when the business has no retainer", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const result = await businessRepository.findActiveRetainer("biz-no-retainer");

    expect(result).toBeUndefined();
  });
});

describe("businessRepository.createRetainer", () => {
  it("generates an id and inserts the retainer", async () => {
    const insertData = { businessId: "biz-1", tier: "pro", priceMonthly: 1500 };
    const created = makeRetainer({ id: "generated-uuid", ...insertData });
    mockDb.returning.mockResolvedValueOnce([created]);

    const result = await businessRepository.createRetainer(insertData as never);

    expect(result).toEqual(created);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith({ ...insertData, id: "generated-uuid" });
  });
});
