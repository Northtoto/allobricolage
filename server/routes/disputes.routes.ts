import { Router, type Request, type Response } from "express";
import { authenticate, requireRole } from "@/middleware/auth.ts";
import { validateBody, validateParams } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { db } from "@/db/index.ts";
import { disputes, bookings, technicians, users, payments } from "@/db/schema.ts";
import { eq, count, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import type { AuthenticatedRequest } from "@/types/express.ts";
import { isUnderWarranty } from "@/services/warranty.service.ts";

const router = Router();

const createSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
});

// A warranty claim is a dispute the reason is implicit ("garantie") — the
// client only describes the problem; eligibility is enforced server-side.
const warrantyClaimSchema = z.object({
  bookingId: z.string().uuid(),
  description: z.string().min(20).max(2000),
});

const resolveSchema = z.object({
  resolution: z.string().min(5),
  refundAmount: z.number().min(0).optional(),
});

// Create a dispute
router.post(
  "/",
  authenticate,
  validateBody(createSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.id;
    const { bookingId, reason, description } = req.body;

    // Verify booking belongs to this client
    const bk = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!bk.length) {
      throw new NotFoundError("Booking not found");
    }

    if (bk[0].clientId !== userId) {
      res.status(403).json({ success: false, error: "Not authorized" });
      return;
    }

    // Check no existing dispute
    const existing = await db
      .select()
      .from(disputes)
      .where(eq(disputes.bookingId, bookingId))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ success: false, error: "A dispute already exists for this booking" });
      return;
    }

    const [dispute] = await db
      .insert(disputes)
      .values({
        id: uuidv4(),
        bookingId,
        clientId: userId,
        technicianId: bk[0].technicianId,
        reason,
        description,
      })
      .returning();

    res.status(201).json(successResponse(dispute));
  })
);

// Open a warranty claim ("signaler un problème sous garantie").
// Same storage as a dispute, but server-guarded by the guarantee window and
// flagged so admins/UI can fast-track a free re-visit before any refund.
router.post(
  "/warranty-claim",
  authenticate,
  validateBody(warrantyClaimSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.id;
    const { bookingId, description } = req.body;

    const bk = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!bk.length) {
      throw new NotFoundError("Booking not found");
    }

    if (bk[0].clientId !== userId) {
      res.status(403).json({ success: false, error: "Not authorized" });
      return;
    }

    // Server-authoritative eligibility: never trust a client claim of coverage.
    if (!isUnderWarranty(bk[0])) {
      res.status(422).json({
        success: false,
        error: "This booking is not under warranty",
      });
      return;
    }

    const existing = await db
      .select()
      .from(disputes)
      .where(eq(disputes.bookingId, bookingId))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ success: false, error: "A dispute already exists for this booking" });
      return;
    }

    const [dispute] = await db
      .insert(disputes)
      .values({
        id: uuidv4(),
        bookingId,
        clientId: userId,
        technicianId: bk[0].technicianId,
        reason: "garantie",
        description,
        isWarrantyClaim: true,
      })
      .returning();

    res.status(201).json(successResponse(dispute));
  })
);

// Get my disputes (client or technician)
router.get(
  "/my",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.id;

    const clientDisputes = await db
      .select({
        dispute: disputes,
        booking: {
          clientName: bookings.clientName,
          status: bookings.status,
        },
        technician: {
          name: users.name,
        },
      })
      .from(disputes)
      .where(eq(disputes.clientId, userId))
      .innerJoin(bookings, eq(disputes.bookingId, bookings.id))
      .innerJoin(technicians, eq(disputes.technicianId, technicians.id))
      .innerJoin(users, eq(technicians.userId, users.id));

    res.json(successResponse(clientDisputes.map((row: any) => ({
      ...row.dispute,
      booking: row.booking,
      technician: row.technician,
    }))));
  })
);

// Get all disputes (admin)
router.get(
  "/",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (_req: Request, res: Response) => {
    const disputeList = await db
      .select({
        dispute: disputes,
        client: { name: users.name, email: users.email, phone: users.phone },
        booking: { clientName: bookings.clientName, scheduledDate: bookings.scheduledDate },
      })
      .from(disputes)
      .innerJoin(users, eq(disputes.clientId, users.id))
      .innerJoin(bookings, eq(disputes.bookingId, bookings.id))
      .orderBy(disputes.createdAt);

    // Add technician name
    const withTech = await Promise.all(
      disputeList.map(async (row: any) => {
        const tech = await db
          .select({ name: users.name })
          .from(technicians)
          .innerJoin(users, eq(technicians.userId, users.id))
          .where(eq(technicians.id, (row.dispute as any).technicianId))
          .limit(1);
        return { ...row, technician: tech[0] ?? null };
      })
    );

    res.json(successResponse(withTech));
  })
);

// Resolve dispute (admin)
router.post(
  "/:id/resolve",
  authenticate,
  requireRole("admin"),
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(resolveSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { resolution, refundAmount } = req.body;
    const adminId = (req as AuthenticatedRequest).user!.id;

    const [updated] = await db
      .update(disputes)
      .set({
        status: "resolved",
        resolution,
        refundAmount: refundAmount ?? null,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      })
      .where(eq(disputes.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundError("Dispute", id);
    }

    // Release escrow refund if specified
    if (refundAmount && refundAmount > 0) {
      await db
        .update(payments)
        .set({ escrowStatus: "refunded" })
        .where(eq(payments.bookingId, updated.bookingId));
    }

    res.json(successResponse(updated));
  })
);

// Dispute stats (admin)
router.get(
  "/stats",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (_req: Request, res: Response) => {
    const [total] = await db.select({ count: count() }).from(disputes);
    const [open] = await db.select({ count: count() }).from(disputes).where(eq(disputes.status, "open"));
    const [resolved] = await db.select({ count: count() }).from(disputes).where(eq(disputes.status, "resolved"));

    const [avgRefund] = await db
      .select({ avg: sql<number>`COALESCE(AVG(refund_amount), 0)` })
      .from(disputes)
      .where(eq(disputes.status, "resolved"));

    res.json(successResponse({
      total: total?.count ?? 0,
      open: open?.count ?? 0,
      resolved: resolved?.count ?? 0,
      averageRefund: Math.round(avgRefund?.avg ?? 0),
    }));
  })
);

export default router;
