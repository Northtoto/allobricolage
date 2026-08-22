import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "@/types/express.ts";
import { config } from "@/config/index.ts";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors.ts";

vi.mock("@/utils/logger.ts", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const mockDb = vi.hoisted(() => {
  const db: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  };
  Object.values(db).forEach((fn) => fn.mockReturnThis());
  return db;
});
vi.mock("@/db/index.ts", () => ({ db: mockDb }));

import { generateToken, verifyToken, authenticate, requireRole, optionalAuth } from "./auth.ts";
import { logger } from "@/utils/logger.ts";

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(mockDb).forEach((fn) => fn.mockReturnThis());
});

const USER_ROW = {
  id: "user-1",
  username: "youssef",
  password: "hashed-secret",
  role: "client",
  name: "Youssef Alami",
  email: "youssef@example.com",
  phone: "0612345678",
  city: "Casablanca",
  googleId: "google-secret-id",
  profilePicture: null,
  referralCode: null,
  referredBy: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

function makeReq(overrides: Partial<AuthenticatedRequest> = {}): Request {
  return { headers: {}, params: {}, ...overrides } as unknown as Request;
}

describe("generateToken / verifyToken", () => {
  it("round-trips a valid token", () => {
    const token = generateToken("user-1", "client");
    const payload = verifyToken(token);
    expect(payload.userId).toBe("user-1");
    expect(payload.role).toBe("client");
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it("throws JsonWebTokenError on a garbage token", () => {
    expect(() => verifyToken("not-a-jwt")).toThrow(jwt.JsonWebTokenError);
  });

  it("throws TokenExpiredError for an already-expired token", () => {
    const expired = jwt.sign({ userId: "user-1", role: "client" }, config.JWT_SECRET, {
      expiresIn: -10,
    });
    expect(() => verifyToken(expired)).toThrow(jwt.TokenExpiredError);
  });
});

describe("authenticate", () => {
  it("rejects with UnauthorizedError when the Authorization header is missing", async () => {
    const req = makeReq();
    const next = vi.fn();
    await authenticate(req, {} as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.message).toBe("Authentication required");
  });

  it("rejects when the Authorization header doesn't use the Bearer scheme", async () => {
    const req = makeReq({ headers: { authorization: "Basic abc123" } } as never);
    const next = vi.fn();
    await authenticate(req, {} as Response, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });

  it("rejects an invalid token with UnauthorizedError('Invalid token')", async () => {
    const req = makeReq({ headers: { authorization: "Bearer garbage" } } as never);
    const next = vi.fn();
    await authenticate(req, {} as Response, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.message).toBe("Invalid token");
  });

  it("rejects an expired token with UnauthorizedError('Token expired')", async () => {
    const expired = jwt.sign({ userId: "user-1", role: "client" }, config.JWT_SECRET, {
      expiresIn: -10,
    });
    const req = makeReq({ headers: { authorization: `Bearer ${expired}` } } as never);
    const next = vi.fn();
    await authenticate(req, {} as Response, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.message).toBe("Token expired");
  });

  it("rejects with UnauthorizedError('User not found') when the token's user no longer exists", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const token = generateToken("user-1", "client");
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } } as never);
    const next = vi.fn();
    await authenticate(req, {} as Response, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.message).toBe("User not found");
  });

  it("attaches the sanitized user and token, then calls next() with no error", async () => {
    mockDb.limit.mockResolvedValueOnce([USER_ROW]);
    const token = generateToken("user-1", "client");
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } } as never);
    const next = vi.fn();

    await authenticate(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    const authedReq = req as AuthenticatedRequest;
    expect(authedReq.user).toEqual({
      id: "user-1",
      username: "youssef",
      role: "client",
      name: "Youssef Alami",
      email: "youssef@example.com",
      phone: "0612345678",
      city: "Casablanca",
      profilePicture: null,
      referralCode: null,
      referredBy: null,
      createdAt: USER_ROW.createdAt,
    });
    expect(authedReq.user).not.toHaveProperty("password");
    expect(authedReq.user).not.toHaveProperty("googleId");
    expect(authedReq.token).toBe(token);
  });
});

describe("requireRole", () => {
  it("rejects with UnauthorizedError when there is no authenticated user", () => {
    const req = makeReq();
    const next = vi.fn();
    requireRole("admin")(req, {} as Response, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });

  it("rejects with ForbiddenError when the user's role isn't in the allowed set", () => {
    const req = makeReq({ user: { id: "u1", role: "client" } } as never);
    const next = vi.fn();
    requireRole("admin", "technician")(req, {} as Response, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.message).toBe("Required role: admin or technician");
  });

  it("calls next() with no error when the user has an allowed role", () => {
    const req = makeReq({ user: { id: "u1", role: "admin" } } as never);
    const next = vi.fn();
    requireRole("admin", "technician")(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe("optionalAuth", () => {
  it("proceeds without a user when there is no Authorization header", () => {
    const req = makeReq();
    const next = vi.fn();
    optionalAuth(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
    expect((req as AuthenticatedRequest).user).toBeUndefined();
  });

  it("proceeds without a user when the token is invalid", () => {
    const req = makeReq({ headers: { authorization: "Bearer garbage" } } as never);
    const next = vi.fn();
    optionalAuth(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
    expect((req as AuthenticatedRequest).user).toBeUndefined();
  });

  it("sets req.user when the token is valid and the user is found", async () => {
    mockDb.limit.mockResolvedValueOnce([USER_ROW]);
    const token = generateToken("user-1", "client");
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } } as never);
    const next = vi.fn();

    optionalAuth(req, {} as Response, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalled());

    const authedReq = req as AuthenticatedRequest;
    expect(authedReq.user?.id).toBe("user-1");
    expect(authedReq.user).not.toHaveProperty("password");
    expect(authedReq.token).toBe(token);
  });

  it("proceeds without a user and logs a warning when the lookup fails", async () => {
    mockDb.limit.mockRejectedValueOnce(new Error("db down"));
    const token = generateToken("user-1", "client");
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } } as never);
    const next = vi.fn();

    optionalAuth(req, {} as Response, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalled());

    expect((req as AuthenticatedRequest).user).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith("Optional auth lookup failed", expect.any(Object));
  });
});
