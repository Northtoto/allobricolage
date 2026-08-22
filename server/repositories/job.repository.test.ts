import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Job } from "@shared/schema.ts";

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
    offset: vi.fn(),
    orderBy: vi.fn(),
    insert: vi.fn(),
    values: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    returning: vi.fn(),
  };
  Object.values(db).forEach((fn) => fn.mockReturnThis());
  return db;
});

vi.mock("@/db/index.ts", () => ({ db: mockDb }));
vi.mock("uuid", () => ({ v4: () => "generated-uuid" }));

import { jobRepository } from "./job.repository.ts";
import { NotFoundError } from "@/utils/errors.ts";

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(mockDb).forEach((fn) => fn.mockReturnThis());
});

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: "job-1",
  clientId: "client-1",
  description: "Fuite d'eau sous l'évier de la cuisine",
  service: "plomberie",
  subServices: ["fuite"],
  city: "Casablanca",
  urgency: "normal",
  complexity: "moderate",
  estimatedDuration: "1-2 heures",
  minCost: 150,
  maxCost: 300,
  likelyCost: 220,
  confidence: 0.8,
  status: "pending",
  createdAt: new Date("2026-08-01T00:00:00Z"),
  extractedKeywords: ["fuite", "évier"],
  aiAnalysis: null,
  ...overrides,
});

describe("jobRepository.findAll", () => {
  it("returns items and total, paginating with the given page/limit", async () => {
    const items = [makeJob({ id: "j1" }), makeJob({ id: "j2" })];
    const countResult = [{ count: 2 }];
    mockDb.orderBy.mockResolvedValueOnce(items);
    mockDb.from.mockReturnValueOnce(mockDb).mockResolvedValueOnce(countResult);

    const result = await jobRepository.findAll(2, 10);

    expect(result).toEqual({ items, total: 2 });
    expect(mockDb.limit).toHaveBeenCalledWith(10);
    expect(mockDb.offset).toHaveBeenCalledWith(10);
  });

  it("defaults to page 1 / limit 20 when called with no arguments", async () => {
    mockDb.orderBy.mockResolvedValueOnce([]);
    mockDb.from.mockReturnValueOnce(mockDb).mockResolvedValueOnce([{ count: 0 }]);

    await jobRepository.findAll();

    expect(mockDb.limit).toHaveBeenCalledWith(20);
    expect(mockDb.offset).toHaveBeenCalledWith(0);
  });

  it("falls back to total 0 when the count query returns no rows", async () => {
    mockDb.orderBy.mockResolvedValueOnce([]);
    mockDb.from.mockReturnValueOnce(mockDb).mockResolvedValueOnce([]);

    const result = await jobRepository.findAll();

    expect(result).toEqual({ items: [], total: 0 });
  });
});

describe("jobRepository.findById", () => {
  it("returns the job when found", async () => {
    const row = makeJob({ id: "j1" });
    mockDb.limit.mockResolvedValueOnce([row]);

    const result = await jobRepository.findById("j1");

    expect(result).toEqual(row);
    expect(mockDb.limit).toHaveBeenCalledWith(1);
  });

  it("returns undefined when no job matches", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const result = await jobRepository.findById("missing");

    expect(result).toBeUndefined();
  });
});

describe("jobRepository.findByClientId", () => {
  it("returns jobs for the client ordered by createdAt desc", async () => {
    const rows = [makeJob({ clientId: "client-1" })];
    mockDb.orderBy.mockResolvedValueOnce(rows);

    const result = await jobRepository.findByClientId("client-1");

    expect(result).toEqual(rows);
    expect(mockDb.where).toHaveBeenCalled();
  });

  it("returns an empty array when the client has no jobs", async () => {
    mockDb.orderBy.mockResolvedValueOnce([]);

    const result = await jobRepository.findByClientId("client-none");

    expect(result).toEqual([]);
  });
});

describe("jobRepository.findByStatus", () => {
  it("returns jobs matching the status", async () => {
    const rows = [makeJob({ status: "matched" }), makeJob({ id: "j2", status: "matched" })];
    mockDb.orderBy.mockResolvedValueOnce(rows);

    const result = await jobRepository.findByStatus("matched");

    expect(result).toEqual(rows);
  });
});

describe("jobRepository.create", () => {
  it("generates an id and inserts the job", async () => {
    const insertData = {
      clientId: "client-1",
      description: "Prise electrique qui grésille",
      service: "electricite",
      city: "Rabat",
      urgency: "urgent",
      complexity: "simple",
      status: "pending",
    };
    const created = makeJob({ id: "generated-uuid", ...insertData });
    mockDb.returning.mockResolvedValueOnce([created]);

    const result = await jobRepository.create(insertData as never);

    expect(result).toEqual(created);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith({ ...insertData, id: "generated-uuid" });
  });
});

describe("jobRepository.update", () => {
  it("updates and returns the job when it exists", async () => {
    const updated = makeJob({ id: "j1", status: "matched" });
    mockDb.returning.mockResolvedValueOnce([updated]);

    const result = await jobRepository.update("j1", { status: "matched" } as never);

    expect(result).toEqual(updated);
    expect(mockDb.set).toHaveBeenCalledWith({ status: "matched" });
  });

  it("throws NotFoundError when the job does not exist", async () => {
    mockDb.returning.mockResolvedValueOnce([]);

    await expect(jobRepository.update("missing", { status: "matched" } as never)).rejects.toThrow(
      NotFoundError
    );
  });
});

describe("jobRepository.delete", () => {
  it("deletes without throwing when the job exists", async () => {
    mockDb.returning.mockResolvedValueOnce([makeJob({ id: "j1" })]);

    await expect(jobRepository.delete("j1")).resolves.toBeUndefined();
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it("throws NotFoundError when the job does not exist", async () => {
    mockDb.returning.mockResolvedValueOnce([]);

    await expect(jobRepository.delete("missing")).rejects.toThrow(NotFoundError);
  });
});
