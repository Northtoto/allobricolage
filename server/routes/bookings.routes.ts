import { Router, type Request, type Response } from "express";
import { authenticate, requireRole } from "@/middleware/auth.ts";
import { validateBody, validateParams } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { NotFoundError, ForbiddenError } from "@/utils/errors.ts";
import { securityAudit } from "@/middleware/audit-logger.ts";
import { bookingRepository } from "@/repositories/booking.repository.ts";
import { jobRepository } from "@/repositories/job.repository.ts";
import { technicianRepository } from "@/repositories/technician.repository.ts";
import { notificationRepository } from "@/repositories/notification.repository.ts";
import type { AuthenticatedRequest } from "@/types/express.ts";
import { DEFAULT_GUARANTEE_PERIOD_DAYS } from "@/services/warranty.service.ts";
import { z } from "zod";

const router = Router();

const createBookingSchema = z.object({
  jobId: z.string().min(1),
  technicianId: z.string().uuid("ID technicien invalide"),
  clientName: z.string().min(1, "Nom requis").max(100),
  clientPhone: z.string().min(1, "Téléphone requis").max(20),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM requis"),
  estimatedCost: z.number().min(0).optional(),
  isEmergency: z.boolean().optional().default(false),
  matchScore: z.number().min(0).max(1).optional(),
  matchExplanation: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  service: z.string().max(100).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["pending", "accepted", "in_progress", "completed", "cancelled"]),
});

const idParamSchema = z.object({
  id: z.string().uuid("ID invalide"),
});

router.post(
  "/",
  authenticate,
  requireRole("client", "admin"),
  validateBody(createBookingSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const data = req.body;

    let jobId = data.jobId;
    if (jobId === "direct") {
      const job = await jobRepository.create({
        clientId: user.id,
        description: data.description ?? "Réservation directe",
        service: data.service ?? "services_generaux",
        city: user.city ?? "Casablanca",
        urgency: "normal",
        complexity: "moderate",
        status: "pending",
      });
      jobId = job.id;
    }

    // Apply emergency pricing: +50% if emergency
    const estimatedCost = data.isEmergency && data.estimatedCost
      ? Math.round(data.estimatedCost * 1.5)
      : data.estimatedCost;

    const booking = await bookingRepository.create({
      jobId,
      technicianId: data.technicianId,
      clientId: user.id,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      status: "pending",
      isEmergency: data.isEmergency ?? false,
      estimatedCost,
      matchScore: data.matchScore ?? 0.9,
      matchExplanation: data.matchExplanation ?? "Reservation confirmee",
    });

    const tech = await technicianRepository.findById(data.technicianId);
    if (tech) {
      await notificationRepository.create({
        userId: tech.userId,
        type: "booking",
        title: "Nouvelle réservation",
        message: `${data.clientName} a réservé vos services`,
        bookingId: booking.id,
      });
    }

    securityAudit("booking.created", req, { bookingId: booking.id, technicianId: data.technicianId });
    res.status(201).json(successResponse(booking));
  })
);

router.get(
  "/",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    let result;

    if (user.role === "client") {
      result = await bookingRepository.findByClientId(user.id);
    } else if (user.role === "technician") {
      const tech = await technicianRepository.findByUserId(user.id);
      result = tech ? await bookingRepository.findByTechnicianId(tech.id) : [];
    } else {
      result = await bookingRepository.findAll();
    }

    res.json(successResponse(result));
  })
);

router.get(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const booking = await bookingRepository.findById(req.params.id);
    if (!booking) throw new NotFoundError("Booking", req.params.id);

    const isAuthorized =
      user.role === "admin" ||
      booking.clientId === user.id ||
      await isBookingTechnician(booking.technicianId, user.id);

    if (!isAuthorized) {
      throw new ForbiddenError("Vous ne pouvez pas accéder à cette réservation");
    }

    res.json(successResponse(booking));
  })
);

router.patch(
  "/:id/status",
  authenticate,
  validateParams(idParamSchema),
  validateBody(updateStatusSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const booking = await bookingRepository.findById(req.params.id);
    if (!booking) throw new NotFoundError("Booking", req.params.id);

    const isAuthorized =
      user.role === "admin" ||
      booking.clientId === user.id ||
      await isBookingTechnician(booking.technicianId, user.id);

    if (!isAuthorized) {
      throw new ForbiddenError("Action non autorisée");
    }

    // P0-3: on completion, stamp the finish time and open the guarantee window
    // so the client can claim a free re-visit if the work fails.
    const updates: Record<string, unknown> = { status: req.body.status };
    if (req.body.status === "completed" && booking.status !== "completed") {
      updates.actualEndTime = booking.actualEndTime ?? new Date();
      updates.guaranteePeriodDays = DEFAULT_GUARANTEE_PERIOD_DAYS;
    }

    const updated = await bookingRepository.update(req.params.id, updates);
    securityAudit("booking.status_changed", req, {
      bookingId: req.params.id,
      from: booking.status,
      to: req.body.status,
    });
    res.json(successResponse(updated));
  })
);

async function isBookingTechnician(technicianId: string, userId: string): Promise<boolean> {
  const tech = await technicianRepository.findById(technicianId);
  return tech?.userId === userId;
}

export default router;
