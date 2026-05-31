import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { users, bookings, jobs, reviews, technicians } from "@/db/schema.ts";
import { ForbiddenError, UnauthorizedError, NotFoundError } from "@/utils/errors.ts";
import type { AuthenticatedRequest } from "@/types/express.ts";
import { logger } from "@/utils/logger.ts";

/** Ensure authenticated user can access a booking */
export async function requireBookingOwnership(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    next(new UnauthorizedError());
    return;
  }

  const bookingId = req.params.id;
  if (!bookingId) {
    next(new ForbiddenError("Booking ID required"));
    return;
  }

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) {
    next(new NotFoundError("Booking", bookingId));
    return;
  }

  const isClient = booking.clientId === user.id;
  const isTechnician = await isBookingTechnician(booking.technicianId, user.id);
  const isAdmin = user.role === "admin";

  if (!isClient && !isTechnician && !isAdmin) {
    logger.warn("Unauthorized booking access attempt", {
      userId: user.id,
      bookingId,
      resourceOwner: booking.clientId,
    });
    next(new ForbiddenError("You can only access your own bookings"));
    return;
  }

  ((req as unknown) as Record<string, unknown>).resource = booking;
  next();
}

/** Ensure authenticated user can access a job */
export async function requireJobOwnership(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    next(new UnauthorizedError());
    return;
  }

  if (user.role === "admin") {
    next();
    return;
  }

  const jobId = req.params.id;
  if (!jobId) {
    next(new ForbiddenError("Job ID required"));
    return;
  }

  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job) {
    next(new NotFoundError("Job", jobId));
    return;
  }

  if (job.clientId !== user.id) {
    logger.warn("Unauthorized job access attempt", {
      userId: user.id,
      jobId,
      resourceOwner: job.clientId,
    });
    next(new ForbiddenError("You can only access your own jobs"));
    return;
  }

  ((req as unknown) as Record<string, unknown>).resource = job;
  next();
}

/** Ensure authenticated user can access a review */
export async function requireReviewOwnership(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    next(new UnauthorizedError());
    return;
  }

  if (user.role === "admin") {
    next();
    return;
  }

  const reviewId = req.params.id;
  if (!reviewId) {
    next(new ForbiddenError("Review ID required"));
    return;
  }

  const [review] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  if (!review) {
    next(new NotFoundError("Review", reviewId));
    return;
  }

  if (review.clientId !== user.id) {
    logger.warn("Unauthorized review access attempt", {
      userId: user.id,
      reviewId,
      resourceOwner: review.clientId,
    });
    next(new ForbiddenError("You can only access your own reviews"));
    return;
  }

  next();
}

async function isBookingTechnician(technicianId: string, userId: string): Promise<boolean> {
  const [tech] = await db.select().from(technicians).where(eq(technicians.id, technicianId)).limit(1);
  return tech?.userId === userId;
}

/** Strip password and other sensitive fields from user object before sending to client */
export function sanitizeUser(user: Record<string, unknown>): Record<string, unknown> {
  const {
    password: _password,
    googleId: _googleId,
    ...safe
  } = user;
  return safe;
}
