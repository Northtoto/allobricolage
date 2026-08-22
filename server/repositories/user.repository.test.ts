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
import { userRepository } from "./user.repository.ts";
import { NotFoundError } from "@/utils/errors.ts";
import type { User } from "@/db/schema.ts";

type DbMock = Record<(typeof CHAIN_METHODS)[number], ReturnType<typeof vi.fn>>;
const dbMock = db as unknown as DbMock;

const userRow: User = {
  id: "u1",
  username: "amina.b",
  password: "hashed-password",
  role: "client",
  name: "Amina Bennani",
  email: "amina@example.com",
  phone: "+212600000000",
  city: "Casablanca",
  googleId: null,
  profilePicture: null,
  referralCode: null,
  referredBy: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("findAll", () => {
  it("returns all users", async () => {
    dbMock.from.mockResolvedValueOnce([userRow]);

    const result = await userRepository.findAll();

    expect(result).toEqual([userRow]);
    expect(dbMock.select).toHaveBeenCalledTimes(1);
    expect(dbMock.from).toHaveBeenCalledTimes(1);
  });
});

describe("findById", () => {
  it("returns the user when found", async () => {
    dbMock.limit.mockResolvedValueOnce([userRow]);

    const result = await userRepository.findById("u1");

    expect(result).toEqual(userRow);
    expect(dbMock.limit).toHaveBeenCalledWith(1);
  });

  it("returns undefined when no row matches", async () => {
    dbMock.limit.mockResolvedValueOnce([]);

    const result = await userRepository.findById("missing");

    expect(result).toBeUndefined();
  });
});

describe("findByUsername", () => {
  it("returns the user when found", async () => {
    dbMock.limit.mockResolvedValueOnce([userRow]);

    const result = await userRepository.findByUsername("amina.b");

    expect(result).toEqual(userRow);
  });

  it("returns undefined when no row matches", async () => {
    dbMock.limit.mockResolvedValueOnce([]);

    const result = await userRepository.findByUsername("nobody");

    expect(result).toBeUndefined();
  });
});

describe("findByEmail", () => {
  it("returns the user when found", async () => {
    dbMock.limit.mockResolvedValueOnce([userRow]);

    const result = await userRepository.findByEmail("amina@example.com");

    expect(result).toEqual(userRow);
  });

  it("returns undefined when no row matches", async () => {
    dbMock.limit.mockResolvedValueOnce([]);

    const result = await userRepository.findByEmail("nobody@example.com");

    expect(result).toBeUndefined();
  });
});

describe("findByGoogleId", () => {
  it("returns the user when found", async () => {
    dbMock.limit.mockResolvedValueOnce([userRow]);

    const result = await userRepository.findByGoogleId("google-123");

    expect(result).toEqual(userRow);
  });

  it("returns undefined when no row matches", async () => {
    dbMock.limit.mockResolvedValueOnce([]);

    const result = await userRepository.findByGoogleId("google-missing");

    expect(result).toBeUndefined();
  });
});

describe("create", () => {
  it("inserts a generated id alongside the provided data and returns the new row", async () => {
    dbMock.returning.mockResolvedValueOnce([userRow]);

    const input = {
      username: "amina.b",
      role: "client" as const,
      name: "Amina Bennani",
      email: "amina@example.com",
      phone: "+212600000000",
      city: "Casablanca",
    };
    const result = await userRepository.create(input);

    expect(result).toEqual(userRow);
    expect(dbMock.insert).toHaveBeenCalledTimes(1);
    const valuesArg = dbMock.values.mock.calls[0][0];
    expect(valuesArg).toMatchObject(input);
    expect(typeof valuesArg.id).toBe("string");
    expect(valuesArg.id.length).toBeGreaterThan(0);
  });
});

describe("update", () => {
  it("updates and returns the row when it exists", async () => {
    const updated: User = { ...userRow, city: "Rabat" };
    dbMock.returning.mockResolvedValueOnce([updated]);

    const result = await userRepository.update("u1", { city: "Rabat" });

    expect(result).toEqual(updated);
    expect(dbMock.set).toHaveBeenCalledWith({ city: "Rabat" });
  });

  it("throws NotFoundError when the row does not exist", async () => {
    dbMock.returning.mockResolvedValueOnce([]);

    await expect(userRepository.update("missing", { city: "Rabat" })).rejects.toThrow(NotFoundError);
  });
});

describe("delete", () => {
  it("resolves when the row was deleted", async () => {
    dbMock.returning.mockResolvedValueOnce([userRow]);

    await expect(userRepository.delete("u1")).resolves.toBeUndefined();
  });

  it("throws NotFoundError when the row does not exist", async () => {
    dbMock.returning.mockResolvedValueOnce([]);

    await expect(userRepository.delete("missing")).rejects.toThrow(NotFoundError);
  });
});

describe("existsByUsername", () => {
  it("returns true when the count is above zero", async () => {
    dbMock.where.mockResolvedValueOnce([{ count: 1 }]);

    const result = await userRepository.existsByUsername("amina.b");

    expect(result).toBe(true);
  });

  it("returns false when the count is zero", async () => {
    dbMock.where.mockResolvedValueOnce([{ count: 0 }]);

    const result = await userRepository.existsByUsername("nobody");

    expect(result).toBe(false);
  });

  it("returns false when no row is returned", async () => {
    dbMock.where.mockResolvedValueOnce([]);

    const result = await userRepository.existsByUsername("nobody");

    expect(result).toBe(false);
  });
});

describe("existsByEmail", () => {
  it("returns true when the count is above zero", async () => {
    dbMock.where.mockResolvedValueOnce([{ count: 2 }]);

    const result = await userRepository.existsByEmail("amina@example.com");

    expect(result).toBe(true);
  });

  it("returns false when the count is zero", async () => {
    dbMock.where.mockResolvedValueOnce([{ count: 0 }]);

    const result = await userRepository.existsByEmail("nobody@example.com");

    expect(result).toBe(false);
  });
});
