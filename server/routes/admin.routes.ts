import { Router, type Request, type Response } from "express";
import { authenticate, requireRole } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { db } from "@/db/index.ts";
import { users, technicians, bookings, payments, verificationDocuments } from "@/db/schema.ts";
import { eq, and, count, sql, desc, gte } from "drizzle-orm";

const router = Router();

// Platform overview metrics
router.get(
  "/metrics",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (_req: Request, res: Response) => {
    const [
      [totalUsers],
      [totalTechnicians],
      [totalClients],
      [totalBookings],
      [completedBookings],
      [totalRevenue],
      [pendingVerifications],
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(technicians),
      db.select({ count: count() }).from(users).where(eq(users.role, "client")),
      db.select({ count: count() }).from(bookings),
      db.select({ count: count() }).from(bookings).where(eq(bookings.status, "completed")),
      db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(payments).where(eq(payments.status, "completed")),
      db.select({ count: count() }).from(verificationDocuments).where(eq(verificationDocuments.status, "pending")),
    ]);

    res.json(successResponse({
      users: totalUsers.count,
      technicians: totalTechnicians.count,
      clients: totalClients.count,
      bookings: totalBookings.count,
      completedBookings: completedBookings.count,
      totalRevenue: totalRevenue.total / 100,
      pendingVerifications: pendingVerifications.count,
    }));
  })
);

// Recent activity
router.get(
  "/recent-bookings",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (_req: Request, res: Response) => {
    const recent = await db
      .select({
        booking: bookings,
        clientName: users.name,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.clientId, users.id))
      .orderBy(desc(bookings.createdAt))
      .limit(20);

    res.json(successResponse(recent));
  })
);

// Top technicians by revenue
router.get(
  "/top-technicians",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (_req: Request, res: Response) => {
    const topTechs = await db
      .select({
        technician: {
          id: technicians.id,
          rating: technicians.rating,
          completedJobs: technicians.completedJobs,
          hourlyRate: technicians.hourlyRate,
          isVerified: technicians.isVerified,
        },
        user: {
          name: users.name,
          city: users.city,
          phone: users.phone,
        },
      })
      .from(technicians)
      .innerJoin(users, eq(technicians.userId, users.id))
      .orderBy(desc(technicians.completedJobs))
      .limit(20);

    res.json(successResponse(topTechs));
  })
);

// Revenue over time (last 30 days)
router.get(
  "/revenue-timeline",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (_req: Request, res: Response) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenue = await db
      .select({
        date: sql<string>`DATE(${payments.createdAt})`,
        amount: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
        count: count(),
      })
      .from(payments)
      .where(and(
        eq(payments.status, "completed"),
        gte(payments.createdAt, thirtyDaysAgo)
      ))
      .groupBy(sql`DATE(${payments.createdAt})`)
      .orderBy(sql`DATE(${payments.createdAt})`);

    res.json(successResponse(revenue));
  })
);

// Verification queue
router.get(
  "/verification-queue",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (_req: Request, res: Response) => {
    const queue = await db
      .select({
        document: verificationDocuments,
        technician: {
          name: users.name,
          email: users.email,
          phone: users.phone,
        },
      })
      .from(verificationDocuments)
      .where(eq(verificationDocuments.status, "pending"))
      .innerJoin(technicians, eq(verificationDocuments.technicianId, technicians.id))
      .innerJoin(users, eq(technicians.userId, users.id))
      .orderBy(verificationDocuments.createdAt);

    res.json(successResponse(queue));
  })
);

export default router;
