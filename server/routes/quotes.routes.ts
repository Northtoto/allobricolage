import { Router, type Request, type Response } from "express";
import { authenticate, requireRole } from "@/middleware/auth.ts";
import { validateBody, validateParams } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { NotFoundError, ForbiddenError, ValidationError } from "@/utils/errors.ts";
import { quoteRepository } from "@/repositories/quote.repository.ts";
import { bookingRepository } from "@/repositories/booking.repository.ts";
import { jobRepository } from "@/repositories/job.repository.ts";
import { technicianRepository } from "@/repositories/technician.repository.ts";
import { notificationRepository } from "@/repositories/notification.repository.ts";
import { aiService } from "@/services/ai.service.ts";
import { securityAudit } from "@/middleware/audit-logger.ts";
import type { AuthenticatedRequest } from "@/types/express.ts";
import { z } from "zod";

const router = Router();

const idParam = z.object({ id: z.string().uuid("Identifiant invalide") });

const createQuoteSchema = z.object({
  bookingId: z.string().uuid("ID réservation invalide"),
  description: z.string().min(1, "Description des travaux requise").max(2000),
  laborCost: z.number().int().min(0).default(0),
  materialsCost: z.number().int().min(0).default(0),
  // Validity window in days (default 7).
  validityDays: z.number().int().min(1).max(30).default(7),
});

// Anti-arnaque guardrail: compare the quoted total against the service's normal
// band and flag outliers so the client sees a clear warning before accepting.
function classifyPrice(amount: number, band: { minCost: number; maxCost: number }): {
  priceFlag: "normal" | "above_market" | "below_market";
} {
  if (amount > band.maxCost * 1.25) return { priceFlag: "above_market" };
  if (amount < band.minCost * 0.5) return { priceFlag: "below_market" };
  return { priceFlag: "normal" };
}

// Technician proposes a written devis for a booking.
router.post(
  "/",
  authenticate,
  requireRole("technician", "admin"),
  validateBody(createQuoteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const { bookingId, description, laborCost, materialsCost, validityDays } = req.body;

    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError("Booking", bookingId);

    // Only the booking's technician may quote it.
    const tech = await technicianRepository.findByUserId(user.id);
    if (user.role !== "admin" && (!tech || tech.id !== booking.technicianId)) {
      throw new ForbiddenError("Vous ne pouvez établir un devis que pour vos propres réservations.");
    }

    const amount = laborCost + materialsCost;
    if (amount <= 0) {
      throw new ValidationError("Le montant du devis doit être positif.", { amount: "must be > 0" });
    }

    // Compute the price band from the job's service/urgency/complexity.
    const job = await jobRepository.findById(booking.jobId);
    const band = aiService.priceBand({
      service: job?.service ?? "services_generaux",
      urgency: job?.urgency ?? "normal",
      complexity: job?.complexity ?? "moderate",
    });
    const { priceFlag } = classifyPrice(amount, band);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const quote = await quoteRepository.create({
      bookingId,
      technicianId: booking.technicianId,
      clientId: booking.clientId,
      description,
      laborCost,
      materialsCost,
      amount,
      currency: "MAD",
      status: "pending",
      priceFlag,
      expectedMin: band.minCost,
      expectedMax: band.maxCost,
      expiresAt,
    });

    if (booking.clientId) {
      await notificationRepository.create({
        userId: booking.clientId,
        type: "quote",
        title: "Nouveau devis reçu",
        message: `Devis de ${amount} MAD à valider pour votre intervention.`,
        bookingId,
      });
    }

    securityAudit("quote.created", req, { quoteId: quote.id, bookingId, amount, priceFlag });
    res.status(201).json(successResponse(quote));
  })
);

// Both parties can view a booking's quotes.
router.get(
  "/booking/:id",
  authenticate,
  validateParams(idParam),
  asyncHandler(async (req: Request, res: Response) => {
    const quotesList = await quoteRepository.findByBookingId(req.params.id);
    res.json(successResponse(quotesList));
  })
);

// Client accepts the devis — locks the price onto the booking before work starts.
router.post(
  "/:id/accept",
  authenticate,
  validateParams(idParam),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const quote = await quoteRepository.findById(req.params.id);
    if (!quote) throw new NotFoundError("Quote", req.params.id);

    if (user.role !== "admin" && quote.clientId !== user.id) {
      throw new ForbiddenError("Seul le client de la réservation peut accepter ce devis.");
    }
    if (quote.status !== "pending") {
      throw new ValidationError(`Ce devis est déjà ${quote.status}.`, { status: quote.status });
    }
    if (quote.expiresAt && new Date() > new Date(quote.expiresAt)) {
      await quoteRepository.update(quote.id, { status: "expired" });
      throw new ValidationError("Ce devis a expiré. Demandez-en un nouveau.", { status: "expired" });
    }

    const updated = await quoteRepository.update(quote.id, { status: "accepted", respondedAt: new Date() });
    // Lock the accepted price onto the booking.
    await bookingRepository.update(quote.bookingId, { estimatedCost: quote.amount });

    securityAudit("quote.accepted", req, { quoteId: quote.id, bookingId: quote.bookingId, amount: quote.amount });
    res.json(successResponse(updated));
  })
);

// Client rejects the devis.
router.post(
  "/:id/reject",
  authenticate,
  validateParams(idParam),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const quote = await quoteRepository.findById(req.params.id);
    if (!quote) throw new NotFoundError("Quote", req.params.id);

    if (user.role !== "admin" && quote.clientId !== user.id) {
      throw new ForbiddenError("Seul le client de la réservation peut refuser ce devis.");
    }
    if (quote.status !== "pending") {
      throw new ValidationError(`Ce devis est déjà ${quote.status}.`, { status: quote.status });
    }

    const updated = await quoteRepository.update(quote.id, { status: "rejected", respondedAt: new Date() });
    res.json(successResponse(updated));
  })
);

export default router;
