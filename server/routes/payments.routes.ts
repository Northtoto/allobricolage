import { Router, type Request, type Response } from "express";
import { authenticate } from "@/middleware/auth.ts";
import { validateBody, validateParams } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { NotFoundError, ForbiddenError, ValidationError } from "@/utils/errors.ts";
import type { AuthenticatedRequest } from "@/types/express.ts";
import { paymentService } from "@/services/payment.service.ts";
import { paymentRepository } from "@/repositories/payment.repository.ts";
import { bookingRepository } from "@/repositories/booking.repository.ts";
import { db } from "@/db/index.ts";
import { payments, bookings, users, technicians } from "@/db/schema.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const createPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  // amount is NOT trusted from the client — the server derives the authoritative
  // amount from the booking (locked by the accepted devis). Accepted for backward
  // compat but ignored.
  amount: z.number().positive().optional(),
  paymentMethod: z.enum(["cash", "cmi", "cashplus", "bank_transfer", "stripe"]),
  currency: z.string().default("MAD"),
});

const idParamSchema = z.object({
  id: z.string().uuid(),
});

router.get(
  "/methods",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(successResponse(paymentService.getPaymentMethods()));
  })
);

router.get(
  "/bank-transfer/details",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.query.bookingId as string;
    const reference = paymentService.generateBankTransferReference(bookingId ?? "default");
    res.json(successResponse({
      bankName: "Banque Centrale Populaire",
      accountNumber: "12345678901234567890",
      rib: "007810000123456789012349",
      swift: "BCPCMAMC",
      reference,
      recipient: "M3allem SARL",
    }));
  })
);

router.post(
  "/create",
  authenticate,
  validateBody(createPaymentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;

    // Source of truth for the amount is the booking (set/locked by the accepted
    // devis) — never the client body. This prevents a client from paying an
    // arbitrary amount (e.g. 1 MAD) for a job that costs more.
    const booking = await bookingRepository.findById(req.body.bookingId);
    if (!booking) {
      throw new NotFoundError("Booking", req.body.bookingId);
    }
    if (user.role !== "admin" && booking.clientId !== user.id) {
      throw new ForbiddenError("Vous ne pouvez payer que vos propres réservations.");
    }
    const amount = booking.estimatedCost;
    if (!amount || amount <= 0) {
      throw new ValidationError(
        "Le montant n'est pas encore défini. Le technicien doit d'abord envoyer un devis.",
        { amount: "not_set" }
      );
    }

    const result = await paymentService.processPayment({
      bookingId: req.body.bookingId,
      amount,
      paymentMethod: req.body.paymentMethod,
      currency: req.body.currency ?? "MAD",
    } as never);
    res.status(201).json(successResponse(result));
  })
);

router.get(
  "/booking/:id",
  authenticate,
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const payment = await paymentRepository.findByBookingId(req.params.id);
    res.json(successResponse(payment ?? null));
  })
);

router.post(
  "/:id/confirm",
  authenticate,
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await paymentService.confirmPayment(req.params.id);
    res.json(successResponse({ success: true }));
  })
);

// Escrow: release payment to technician (after job completion)
router.post(
  "/:id/release-escrow",
  authenticate,
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.id;

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, req.params.id))
      .limit(1);

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    // Either client releasing or admin
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, payment.bookingId))
      .limit(1);

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const isAdmin = user?.role === "admin";
    const isClient = booking.clientId === userId;

    if (!isAdmin && !isClient) {
      throw new ForbiddenError("Not authorized to release this payment");
    }

    const [updated] = await db
      .update(payments)
      .set({ escrowStatus: "released", status: "completed", updatedAt: new Date() })
      .where(eq(payments.id, req.params.id))
      .returning();

    res.json(successResponse(updated));
  })
);

// P1-6 cash-first: confirm cash (or CashPlus) was collected after the service.
// The assigned technician — or an admin — marks the out-of-band payment settled.
router.post(
  "/:id/confirm-cash",
  authenticate,
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.id;

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, req.params.id))
      .limit(1);

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    if (payment.paymentMethod !== "cash" && payment.paymentMethod !== "cashplus") {
      throw new ValidationError("Only cash or CashPlus payments can be confirmed as collected", {
        paymentMethod: payment.paymentMethod,
      });
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, payment.bookingId))
      .limit(1);

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const isAdmin = user?.role === "admin";

    // Resolve whether this user is the booking's technician.
    const [tech] = await db
      .select({ userId: technicians.userId })
      .from(technicians)
      .where(eq(technicians.id, booking.technicianId))
      .limit(1);
    const isAssignedTechnician = tech?.userId === userId;

    if (!isAdmin && !isAssignedTechnician) {
      throw new ForbiddenError("Only the assigned technician or an admin can confirm cash collection");
    }

    const [updated] = await db
      .update(payments)
      .set({ status: "completed", paidAt: new Date(), updatedAt: new Date() })
      .where(eq(payments.id, req.params.id))
      .returning();

    res.json(successResponse(updated));
  })
);

// Escrow: request refund
router.post(
  "/:id/request-refund",
  authenticate,
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const authUser = (req as AuthenticatedRequest).user!;
    const userId = authUser.id;

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, req.params.id))
      .limit(1);

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, payment.bookingId))
      .limit(1);

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.clientId !== userId && booking.clientName !== authUser.name) {
      throw new ForbiddenError("Not authorized to refund this payment");
    }

    const [updated] = await db
      .update(payments)
      .set({ escrowStatus: "refunded", status: "refunded", updatedAt: new Date() })
      .where(eq(payments.id, req.params.id))
      .returning();

    res.json(successResponse(updated));
  })
);

// Get escrow status for a booking
router.get(
  "/escrow/:bookingId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, req.params.bookingId))
      .limit(1);

    if (!payment) {
      res.json(successResponse(null));
      return;
    }

    res.json(successResponse({
      paymentId: payment.id,
      amount: payment.amount,
      escrowStatus: payment.escrowStatus,
      status: payment.status,
      createdAt: payment.createdAt,
    }));
  })
);

export default router;
