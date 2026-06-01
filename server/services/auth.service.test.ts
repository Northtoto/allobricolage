import { describe, it, expect, vi, beforeEach } from "vitest";

// bcrypt mocked so we control compare/hash deterministically (and fast).
vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn(), hash: vi.fn(async () => "$hashed-new") },
}));
vi.mock("@/repositories/user.repository.ts", () => ({
  userRepository: {
    findByUsername: vi.fn(),
    existsByUsername: vi.fn(),
    existsByEmail: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    findByGoogleId: vi.fn(async () => undefined),
    findByEmail: vi.fn(async () => undefined),
  },
}));
vi.mock("@/repositories/technician.repository.ts", () => ({
  technicianRepository: { create: vi.fn() },
}));

import bcrypt from "bcryptjs";
import { authService } from "./auth.service.ts";
import { userRepository } from "@/repositories/user.repository.ts";
import { technicianRepository } from "@/repositories/technician.repository.ts";

const mockUser = {
  id: "u1",
  username: "alice",
  password: "$hashed",
  role: "client",
  name: "Alice",
  email: "alice@example.com",
  phone: null,
  city: null,
  googleId: "google-secret-id",
  profilePicture: null,
  referralCode: null,
  referredBy: null,
  createdAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("login", () => {
  it("logs in with valid credentials and strips password + googleId", async () => {
    (userRepository.findByUsername as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await authService.login("alice", "correct-pw");

    expect(res.token).toBeTruthy();
    expect(res.user.id).toBe("u1");
    expect(res.user).not.toHaveProperty("password");
    expect(res.user).not.toHaveProperty("googleId");
  });

  it("rejects an incorrect password", async () => {
    (userRepository.findByUsername as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    await expect(authService.login("alice", "wrong")).rejects.toThrow(/incorrect/i);
  });

  it("rejects an unknown user (no user enumeration difference)", async () => {
    (userRepository.findByUsername as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await expect(authService.login("ghost", "x")).rejects.toThrow(/incorrect/i);
  });
});

describe("signup", () => {
  const strong = "Str0ng!Pass";

  it("rejects a weak password", async () => {
    await expect(
      authService.signup({ username: "bob", password: "weak", name: "Bob", role: "client" } as never)
    ).rejects.toThrow(/faible/i);
  });

  it("rejects a duplicate username", async () => {
    (userRepository.existsByUsername as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    await expect(
      authService.signup({ username: "alice", password: strong, name: "A", role: "client" } as never)
    ).rejects.toThrow(/existe déjà/i);
  });

  it("hashes the password and returns a token on success", async () => {
    (userRepository.existsByUsername as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (userRepository.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (userRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockUser, id: "u2" });

    const res = await authService.signup({ username: "newbie", password: strong, name: "New", role: "client" } as never);

    expect(bcrypt.hash).toHaveBeenCalledWith(strong, 12);
    expect(res.token).toBeTruthy();
    expect(res.user).not.toHaveProperty("password");
  });

  it("creates a technician profile when role=technician", async () => {
    (userRepository.existsByUsername as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (userRepository.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (userRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockUser, id: "u3", role: "technician" });

    await authService.signup({ username: "tech1", password: strong, name: "T", role: "technician", services: ["plomberie"] } as never);

    expect(technicianRepository.create).toHaveBeenCalledTimes(1);
  });
});

describe("changePassword", () => {
  it("rejects when the current password is wrong", async () => {
    (userRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    await expect(authService.changePassword("u1", "wrong", "Str0ng!Pass")).rejects.toThrow(/incorrect/i);
  });

  it("rejects changing password on an OAuth-only account", async () => {
    (userRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockUser, password: null });
    await expect(authService.changePassword("u1", "x", "Str0ng!Pass")).rejects.toThrow(/OAuth/i);
  });
});

describe("googleLogin (unconfigured in this suite — must never trust input)", () => {
  it("rejects when Google is not configured", async () => {
    await expect(authService.googleLogin("any-token")).rejects.toThrow(/non configurée/i);
  });

  it("never logs in from a forged credential (always rejects)", async () => {
    await expect(authService.googleLogin("forged.jwt.value")).rejects.toThrow();
  });
});
