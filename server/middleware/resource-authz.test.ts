import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "@/types/express.ts";
import { ForbiddenError, UnauthorizedError, NotFoundError } from "@/utils/errors.ts";

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

import {
  requireBookingOwnership,
  requireJobOwnership,
  requireReviewOwnership,
  sanitizeUser,
} from "./resource-authz.ts";
import { logger } from "@/utils/logger.ts";

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(mockDb).forEach((fn) => fn.mockReturnThis());
});

function makeReq(overrides: Partial<AuthenticatedRequest> & { params?: Record<string, string> } = {}): Request {
  return { params: {}, ...overrides } as unknown as Request;
}

const BOOKING = {
  id: "booking-1",
  clientId: "client-1",
  technicianId: "tech-1",
};

describe("requireBookingOwnership", () => {
  it("rejects with UnauthorizedError when there is no authenticated user", async () => {
    const req = makeReq({ params: { id: "booking-1" } });
    const next = vi.fn();
    await requireBookingOwnership(req, {} as Response, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });

  it("rejects with ForbiddenError when no booking id is present in params", async () => {
    const req = makeReq({ user: { id: "client-1", role: "client" } } as never, );
    const next = vi.fn();
    await requireBookingOwnership(req, {} as Response, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.message).toBe("Booking ID required");
  });

  it("rejects with NotFoundError when the booking doesn't exist", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const req = makeReq({
      params: { id: "missing-booking" },
      user: { id: "client-1", role: "client" },
    } as never);
    const next = vi.fn();
    await requireBookingOwnership(req, {} as Response, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
  });

  it("allows the owning client and attaches the booking as req.resource", async () => {
    mockDb.limit.mockResolvedValueOnce([BOOKING]).mockResolvedValueOnce([]);
    const req = makeReq({
      params: { id: "booking-1" },
      user: { id: "client-1", role: "client" },
    } as never);
    const next = vi.fn();

    await requireBookingOwnership(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect((req as unknown as Record<string, unknown>).resource).toEqual(BOOKING);
  });

  it("allows the assigned technician even though they aren't the client", async () => {
    mockDb.limit
      .mockResolvedValueOnce([BOOKING])
      .mockResolvedValueOnce([{ id: "tech-1", userId: "tech-user-1" }]);
    const req = makeReq({
      params: { id: "booking-1" },
      user: { id: "tech-user-1", role: "technician" },
    } as never);
    const next = vi.fn();

    await requireBookingOwnership(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect((req as unknown as Record<string, unknown>).resource).toEqual(BOOKING);
  });

  it("allows an admin even when neither the client nor the assigned technician", async () => {
    mockDb.limit.mockResolvedValueOnce([BOOKING]).mockResolvedValueOnce([]);
    const req = makeReq({
      params: { id: "booking-1" },
      user: { id: "admin-1", role: "admin" },
    } as never);
    const next = vi.fn();

    await requireBookingOwnership(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("rejects an unrelated user with ForbiddenError and logs the attempt", async () => {
    mockDb.limit.mockResolvedValueOnce([BOOKING]).mockResolvedValueOnce([]);
    const req = makeReq({
      params: { id: "booking-1" },
      user: { id: "stranger-1", role: "client" },
    } as never);
    const next = vi.fn();

    await requireBookingOwnership(req, {} as Response, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.message).toBe("You can only access your own bookings");
    expect(logger.warn).toHaveBeenCalledWith(
      "Unauthorized booking access attempt",
      expect.objectContaining({ userId: "stranger-1", bookingId: "booking-1", resourceOwner: "client-1" })
    );
  });
});

const JOB = { id: "job-1", clientId: "client-1" };

describe("requireJobOwnership", () => {
  it("rejects with UnauthorizedError when there is no authenticated user", async () => {
    const req = makeReq({ params: { id: "job-1" } });
    const next = vi.fn();
    await requireJobOwnership(req, {} as Response, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });

  it("lets an admin through without needing a job id or a db lookup", async () => {
    const req = makeReq({ user: { id: "admin-1", role: "admin" } } as never);
    const next = vi.fn();

    await requireJobOwnership(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("rejects with ForbiddenError when no job id is present in params", async () => {
    const req = makeReq({ user: { id: "client-1", role: "client" } } as never);
    const next = vi.fn();
    await requireJobOwnership(req, {} as Response, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.message).toBe("Job ID required");
  });

  it("rejects with NotFoundError when the job doesn't exist", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const req = makeReq({
      params: { id: "missing-job" },
      user: { id: "client-1", role: "client" },
    } as never);
    const next = vi.fn();
    await requireJobOwnership(req, {} as Response, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
  });

  it("allows the owning client and attaches the job as req.resource", async () => {
    mockDb.limit.mockResolvedValueOnce([JOB]);
    const req = makeReq({
      params: { id: "job-1" },
      user: { id: "client-1", role: "client" },
    } as never);
    const next = vi.fn();

    await requireJobOwnership(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect((req as unknown as Record<string, unknown>).resource).toEqual(JOB);
  });

  it("rejects a non-owning client with ForbiddenError and logs the attempt", async () => {
    mockDb.limit.mockResolvedValueOnce([JOB]);
    const req = makeReq({
      params: { id: "job-1" },
      user: { id: "stranger-1", role: "client" },
    } as never);
    const next = vi.fn();

    await requireJobOwnership(req, {} as Response, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.message).toBe("You can only access your own jobs");
    expect(logger.warn).toHaveBeenCalledWith(
      "Unauthorized job access attempt",
      expect.objectContaining({ userId: "stranger-1", jobId: "job-1", resourceOwner: "client-1" })
    );
  });
});

const REVIEW = { id: "review-1", clientId: "client-1" };

describe("requireReviewOwnership", () => {
  it("rejects with UnauthorizedError when there is no authenticated user", async () => {
    const req = makeReq({ params: { id: "review-1" } });
    const next = vi.fn();
    await requireReviewOwnership(req, {} as Response, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });

  it("lets an admin through without needing a review id or a db lookup", async () => {
    const req = makeReq({ user: { id: "admin-1", role: "admin" } } as never);
    const next = vi.fn();

    await requireReviewOwnership(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("rejects with ForbiddenError when no review id is present in params", async () => {
    const req = makeReq({ user: { id: "client-1", role: "client" } } as never);
    const next = vi.fn();
    await requireReviewOwnership(req, {} as Response, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.message).toBe("Review ID required");
  });

  it("rejects with NotFoundError when the review doesn't exist", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const req = makeReq({
      params: { id: "missing-review" },
      user: { id: "client-1", role: "client" },
    } as never);
    const next = vi.fn();
    await requireReviewOwnership(req, {} as Response, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
  });

  it("allows the owning client and calls next() with no error", async () => {
    mockDb.limit.mockResolvedValueOnce([REVIEW]);
    const req = makeReq({
      params: { id: "review-1" },
      user: { id: "client-1", role: "client" },
    } as never);
    const next = vi.fn();

    await requireReviewOwnership(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("rejects a non-owning client with ForbiddenError and logs the attempt", async () => {
    mockDb.limit.mockResolvedValueOnce([REVIEW]);
    const req = makeReq({
      params: { id: "review-1" },
      user: { id: "stranger-1", role: "client" },
    } as never);
    const next = vi.fn();

    await requireReviewOwnership(req, {} as Response, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.message).toBe("You can only access your own reviews");
    expect(logger.warn).toHaveBeenCalledWith(
      "Unauthorized review access attempt",
      expect.objectContaining({ userId: "stranger-1", reviewId: "review-1", resourceOwner: "client-1" })
    );
  });
});

describe("sanitizeUser", () => {
  it("strips password and googleId while keeping other fields", () => {
    const result = sanitizeUser({
      id: "u1",
      name: "Youssef",
      password: "hashed",
      googleId: "g-1",
      role: "client",
    });
    expect(result).toEqual({ id: "u1", name: "Youssef", role: "client" });
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("googleId");
  });

  it("is a no-op on fields other than password/googleId when they're absent", () => {
    const result = sanitizeUser({ id: "u2", name: "Sara" });
    expect(result).toEqual({ id: "u2", name: "Sara" });
  });
});
