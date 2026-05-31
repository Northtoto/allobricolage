import { Router, type Request, type Response } from "express";
import { authenticate, requireRole } from "@/middleware/auth.ts";
import { validateBody, validateParams, validateQuery } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { reviewRepository } from "@/repositories/review.repository.ts";
import { notificationRepository } from "@/repositories/notification.repository.ts";
import { trackingRepository } from "@/repositories/tracking.repository.ts";
import { technicianRepository } from "@/repositories/technician.repository.ts";
import { aiService } from "@/services/ai.service.ts";
import { securityAudit } from "@/middleware/audit-logger.ts";
import type { AuthenticatedRequest } from "@/types/express.ts";
import { strictLimiter, uploadLimiter } from "@/middleware/rate-limiter.ts";
import { z } from "zod";

const router = Router();

const reviewSchema = z.object({
  technicianId: z.string().uuid("ID technicien invalide"),
  bookingId: z.string().uuid("ID réservation invalide").optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, "Commentaire requis").max(2000, "Commentaire trop long"),
  serviceQuality: z.number().min(1).max(5).optional(),
  punctuality: z.number().min(1).max(5).optional(),
  professionalism: z.number().min(1).max(5).optional(),
  valueForMoney: z.number().min(1).max(5).optional(),
});

const reviewResponseSchema = z.object({
  response: z.string().min(1, "Réponse requise").max(2000, "Trop long"),
});

const chatSchema = z.object({
  message: z.string().min(1, "Message requis").max(2000, "Message trop long"),
  history: z.array(z.object({ role: z.string(), content: z.string() })).max(50, "Historique trop long").default([]),
});

const idParamSchema = z.object({
  id: z.string().uuid("ID invalide"),
});

const notificationQuerySchema = z.object({
  unreadOnly: z.string().optional(),
  limit: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().min(1).max(100)).optional(),
});

router.post(
  "/reviews",
  authenticate,
  strictLimiter,
  validateBody(reviewSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const review = await reviewRepository.create({
      ...req.body,
      clientId: user.id,
    });
    await technicianRepository.updateRating(req.body.technicianId);
    securityAudit("review.posted", req, { technicianId: req.body.technicianId, rating: req.body.rating });
    res.status(201).json(successResponse(review));
  })
);

router.get(
  "/reviews/:id",
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const reviews = await reviewRepository.findByTechnicianId(req.params.id);
    res.json(successResponse(reviews));
  })
);

router.patch(
  "/reviews/:id/response",
  authenticate,
  requireRole("technician", "admin"),
  validateParams(idParamSchema),
  validateBody(reviewResponseSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const review = await reviewRepository.update(req.params.id, {
      technicianResponse: req.body.response,
    });
    res.json(successResponse(review));
  })
);

router.get(
  "/notifications",
  authenticate,
  validateQuery(notificationQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const query = notificationQuerySchema.parse(req.query);
    const limit = query.limit ?? 50;
    const unreadOnly = query.unreadOnly === "true";

    let notifications = await notificationRepository.findByUserId(user.id);
    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.isRead);
    }
    res.json(successResponse(notifications.slice(0, limit)));
  })
);

router.patch(
  "/notifications/:id",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationRepository.markAsRead(req.params.id);
    res.json(successResponse(notification));
  })
);

router.post(
  "/chat/darija",
  strictLimiter,
  validateBody(chatSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const response = await aiService.chatDarija(req.body.message, req.body.history);
    res.json(successResponse(response));
  })
);

const locationSchema = z.object({
  technicianId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  heading: z.number().optional(),
  speed: z.number().optional(),
  altitude: z.number().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
});

const addressSchema = z.object({
  bookingId: z.string().uuid(),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  placeId: z.string().optional(),
  formattedAddress: z.string().max(500).optional(),
  additionalInstructions: z.string().max(1000).optional(),
});

const routeSchema = z.object({
  origin: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  destination: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
});

router.post(
  "/tracking/location/update",
  authenticate,
  requireRole("technician", "admin"),
  validateBody(locationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const location = await trackingRepository.createLocation(req.body);
    res.json(successResponse(location));
  })
);

router.get(
  "/tracking/location/latest/:id",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const location = await trackingRepository.findLatestByBookingId(req.params.id);
    res.json(successResponse(location ?? null));
  })
);

router.post(
  "/tracking/address/save",
  authenticate,
  validateBody(addressSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const address = await trackingRepository.createAddress(req.body);
    res.json(successResponse(address));
  })
);

router.get(
  "/tracking/address/:id",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const address = await trackingRepository.findAddressByBookingId(req.params.id);
    res.json(successResponse(address ?? null));
  })
);

router.post(
  "/tracking/route/calculate",
  authenticate,
  validateBody(routeSchema),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(successResponse({
      distance: 5000,
      duration: 900,
      polyline: "mock_polyline",
      steps: [],
    }));
  })
);

router.get(
  "/invoices/:id",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    res.json(successResponse({
      id: req.params.id,
      invoiceNumber: `FACT-${Date.now()}`,
      date: new Date(),
      total: 500,
    }));
  })
);

export default router;
