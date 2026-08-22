import { describe, it, expect, beforeEach, vi } from "vitest";

const { CHAIN_METHODS } = vi.hoisted(() => ({
  CHAIN_METHODS: [
    "select", "from", "where", "limit", "orderBy",
    "insert", "values", "update", "set", "delete", "returning",
  ] as const,
}));

vi.mock("@/db/index.ts", () => {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of CHAIN_METHODS) {
    db[method] = vi.fn(() => db);
  }
  return { db };
});

import { db } from "@/db/index.ts";
import { technicianRepository } from "./technician.repository.ts";
import { NotFoundError } from "@/utils/errors.ts";
import type { Technician, User } from "@/db/schema.ts";

type DbMock = Record<(typeof CHAIN_METHODS)[number], ReturnType<typeof vi.fn>>;
const dbMock = db as unknown as DbMock;

function makeTechnician(overrides: Partial<Technician> = {}): Technician {
  return {
    id: "t1",
    userId: "u1",
    services: ["plomberie"],
    skills: ["fuite", "installation"],
    bio: "Plombier experimente a Casablanca",
    photo: null,
    rating: 4.5,
    reviewCount: 10,
    completedJobs: 20,
    responseTimeMinutes: 15,
    completionRate: 0.98,
    yearsExperience: 5,
    hourlyRate: 200,
    isVerified: true,
    verificationStatus: "verified",
    isAvailable: true,
    emergencyAvailable: false,
    isPro: true,
    isPromo: false,
    subscriptionTier: "gold",
    subscriptionExpiresAt: null,
    leadsUsedThisMonth: 3,
    leadsResetAt: null,
    availability: "Sur RDV",
    certifications: [],
    latitude: 33.5,
    longitude: -7.6,
    languages: ["francais", "arabe"],
    ...overrides,
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "u1",
    username: "amina.b",
    password: "hashed-password",
    role: "technician",
    name: "Amina Bennani",
    email: "amina@example.com",
    phone: "+212600000000",
    city: "Casablanca",
    googleId: null,
    profilePicture: null,
    referralCode: null,
    referredBy: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("findAll", () => {
  it("returns all technicians", async () => {
    const tech = makeTechnician();
    dbMock.from.mockResolvedValueOnce([tech]);

    const result = await technicianRepository.findAll();

    expect(result).toEqual([tech]);
    expect(dbMock.select).toHaveBeenCalledTimes(1);
  });
});

describe("findById", () => {
  it("returns the technician when found", async () => {
    const tech = makeTechnician();
    dbMock.limit.mockResolvedValueOnce([tech]);

    const result = await technicianRepository.findById("t1");

    expect(result).toEqual(tech);
    expect(dbMock.limit).toHaveBeenCalledWith(1);
  });

  it("returns undefined when no row matches", async () => {
    dbMock.limit.mockResolvedValueOnce([]);

    const result = await technicianRepository.findById("missing");

    expect(result).toBeUndefined();
  });
});

describe("findByUserId", () => {
  it("returns the technician when found", async () => {
    const tech = makeTechnician();
    dbMock.limit.mockResolvedValueOnce([tech]);

    const result = await technicianRepository.findByUserId("u1");

    expect(result).toEqual(tech);
  });

  it("returns undefined when no row matches", async () => {
    dbMock.limit.mockResolvedValueOnce([]);

    const result = await technicianRepository.findByUserId("missing");

    expect(result).toBeUndefined();
  });
});

describe("findWithUser", () => {
  it("merges the technician row with its owning user", async () => {
    const tech = makeTechnician();
    const user = makeUser();
    dbMock.limit
      .mockResolvedValueOnce([tech])
      .mockResolvedValueOnce([user]);

    const result = await technicianRepository.findWithUser("t1");

    expect(result).toEqual({
      id: tech.id,
      userId: tech.userId,
      name: user.name,
      phone: user.phone,
      email: user.email,
      city: user.city,
      services: tech.services,
      skills: tech.skills,
      bio: tech.bio,
      photo: tech.photo,
      rating: tech.rating,
      reviewCount: tech.reviewCount,
      completedJobs: tech.completedJobs,
      responseTimeMinutes: tech.responseTimeMinutes,
      completionRate: tech.completionRate,
      yearsExperience: tech.yearsExperience,
      hourlyRate: tech.hourlyRate,
      isVerified: tech.isVerified,
      isAvailable: tech.isAvailable,
      isPro: tech.isPro,
      isPromo: tech.isPromo,
      availability: tech.availability,
      certifications: tech.certifications,
      latitude: tech.latitude,
      longitude: tech.longitude,
      languages: tech.languages,
    });
  });

  it("falls back to empty user fields when the owning user row is missing", async () => {
    const tech = makeTechnician();
    dbMock.limit
      .mockResolvedValueOnce([tech])
      .mockResolvedValueOnce([]);

    const result = await technicianRepository.findWithUser("t1");

    expect(result?.name).toBe("");
    expect(result?.phone).toBeNull();
    expect(result?.email).toBeNull();
    expect(result?.city).toBeNull();
  });

  it("returns undefined when the technician itself does not exist", async () => {
    dbMock.limit.mockResolvedValueOnce([]);

    const result = await technicianRepository.findWithUser("missing");

    expect(result).toBeUndefined();
    expect(dbMock.limit).toHaveBeenCalledTimes(1);
  });
});

describe("findAllWithUsers", () => {
  it("merges every technician with its user and reports the total when no filters are given", async () => {
    const tech1 = makeTechnician({ id: "t1", userId: "u1" });
    const tech2 = makeTechnician({ id: "t2", userId: "u2" });
    dbMock.from.mockResolvedValueOnce([tech1, tech2]);
    dbMock.limit
      .mockResolvedValueOnce([makeUser({ id: "u1", name: "Amina Bennani" })])
      .mockResolvedValueOnce([makeUser({ id: "u2", name: "Youssef Alami" })]);

    const { items, total } = await technicianRepository.findAllWithUsers();

    expect(total).toBe(2);
    expect(items.map((t) => t.id)).toEqual(["t1", "t2"]);
    expect(items.map((t) => t.name)).toEqual(["Amina Bennani", "Youssef Alami"]);
  });

  it("applies a where clause when available/minRating filters are given", async () => {
    const tech = makeTechnician();
    dbMock.where.mockResolvedValueOnce([tech]);
    dbMock.limit.mockResolvedValueOnce([makeUser()]);

    const { items, total } = await technicianRepository.findAllWithUsers({ available: true, minRating: 4 });

    expect(total).toBe(1);
    expect(items[0].id).toBe(tech.id);
    expect(dbMock.where).toHaveBeenCalled();
  });

  it("filters the merged results by service, city and free-text search", async () => {
    const plumber = makeTechnician({
      id: "t1", userId: "u1", services: ["plomberie"], skills: ["fuite"], bio: "Expert fuites",
    });
    const painter = makeTechnician({
      id: "t2", userId: "u2", services: ["peinture"], skills: ["facade"], bio: "Peintre pro",
    });
    dbMock.from.mockResolvedValueOnce([plumber, painter]);
    dbMock.limit
      .mockResolvedValueOnce([makeUser({ id: "u1", name: "Amina", city: "Casablanca" })])
      .mockResolvedValueOnce([makeUser({ id: "u2", name: "Youssef", city: "Rabat" })]);

    const { items, total } = await technicianRepository.findAllWithUsers({ service: "plomberie" });

    expect(total).toBe(1);
    expect(items[0].id).toBe("t1");
  });

  it("sorts by rating descending when sortBy is 'rating'", async () => {
    const low = makeTechnician({ id: "t1", userId: "u1", rating: 3 });
    const high = makeTechnician({ id: "t2", userId: "u2", rating: 4.8 });
    dbMock.from.mockResolvedValueOnce([low, high]);
    dbMock.limit
      .mockResolvedValueOnce([makeUser({ id: "u1" })])
      .mockResolvedValueOnce([makeUser({ id: "u2" })]);

    const { items } = await technicianRepository.findAllWithUsers({ sortBy: "rating" });

    expect(items.map((t) => t.id)).toEqual(["t2", "t1"]);
  });

  it("sorts by price ascending when sortBy is 'price-low'", async () => {
    const expensive = makeTechnician({ id: "t1", userId: "u1", hourlyRate: 300 });
    const cheap = makeTechnician({ id: "t2", userId: "u2", hourlyRate: 100 });
    dbMock.from.mockResolvedValueOnce([expensive, cheap]);
    dbMock.limit
      .mockResolvedValueOnce([makeUser({ id: "u1" })])
      .mockResolvedValueOnce([makeUser({ id: "u2" })]);

    const { items } = await technicianRepository.findAllWithUsers({ sortBy: "price-low" });

    expect(items.map((t) => t.id)).toEqual(["t2", "t1"]);
  });

  it("paginates the filtered/sorted results with page and limit", async () => {
    const techs = [
      makeTechnician({ id: "t1", userId: "u1" }),
      makeTechnician({ id: "t2", userId: "u2" }),
      makeTechnician({ id: "t3", userId: "u3" }),
    ];
    dbMock.from.mockResolvedValueOnce(techs);
    dbMock.limit
      .mockResolvedValueOnce([makeUser({ id: "u1" })])
      .mockResolvedValueOnce([makeUser({ id: "u2" })])
      .mockResolvedValueOnce([makeUser({ id: "u3" })]);

    const { items, total } = await technicianRepository.findAllWithUsers({ page: 2, limit: 2 });

    expect(total).toBe(3);
    expect(items.map((t) => t.id)).toEqual(["t3"]);
  });
});

describe("create", () => {
  it("inserts a generated id alongside the provided data and returns the new row", async () => {
    const tech = makeTechnician();
    dbMock.returning.mockResolvedValueOnce([tech]);

    const input = {
      userId: "u1",
      services: ["plomberie"],
      skills: ["fuite"],
      bio: "Plombier experimente a Casablanca",
    };
    const result = await technicianRepository.create(input as never);

    expect(result).toEqual(tech);
    const valuesArg = dbMock.values.mock.calls[0][0];
    expect(valuesArg).toMatchObject(input);
    expect(typeof valuesArg.id).toBe("string");
    expect(valuesArg.id.length).toBeGreaterThan(0);
  });
});

describe("update", () => {
  it("updates and returns the row when it exists", async () => {
    const updated = makeTechnician({ hourlyRate: 250 });
    dbMock.returning.mockResolvedValueOnce([updated]);

    const result = await technicianRepository.update("t1", { hourlyRate: 250 });

    expect(result).toEqual(updated);
    expect(dbMock.set).toHaveBeenCalledWith({ hourlyRate: 250 });
  });

  it("throws NotFoundError when the row does not exist", async () => {
    dbMock.returning.mockResolvedValueOnce([]);

    await expect(technicianRepository.update("missing", { hourlyRate: 250 })).rejects.toThrow(NotFoundError);
  });
});

describe("delete", () => {
  it("resolves when the row was deleted", async () => {
    dbMock.returning.mockResolvedValueOnce([makeTechnician()]);

    await expect(technicianRepository.delete("t1")).resolves.toBeUndefined();
  });

  it("throws NotFoundError when the row does not exist", async () => {
    dbMock.returning.mockResolvedValueOnce([]);

    await expect(technicianRepository.delete("missing")).rejects.toThrow(NotFoundError);
  });
});

describe("updateRating", () => {
  it("averages the review ratings and stores the rounded value with the review count", async () => {
    dbMock.where
      .mockResolvedValueOnce([{ rating: 5 }, { rating: 4 }, { rating: 4 }])
      .mockResolvedValueOnce([]);

    await technicianRepository.updateRating("t1");

    expect(dbMock.update).toHaveBeenCalledTimes(1);
    expect(dbMock.set).toHaveBeenCalledWith({ rating: 4.3, reviewCount: 3 });
  });

  it("does nothing when the technician has no reviews", async () => {
    dbMock.where.mockResolvedValueOnce([]);

    await technicianRepository.updateRating("t1");

    expect(dbMock.update).not.toHaveBeenCalled();
    expect(dbMock.set).not.toHaveBeenCalled();
  });
});
