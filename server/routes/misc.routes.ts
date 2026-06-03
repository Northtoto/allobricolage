import { Router, type Request, type Response } from "express";
import { authenticate, requireRole } from "@/middleware/auth.ts";
import { validateBody, validateParams, validateQuery } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from "@/utils/errors.ts";
import { reviewRepository } from "@/repositories/review.repository.ts";
import { notificationRepository } from "@/repositories/notification.repository.ts";
import { trackingRepository } from "@/repositories/tracking.repository.ts";
import { technicianRepository } from "@/repositories/technician.repository.ts";
import { bookingRepository } from "@/repositories/booking.repository.ts";
import { aiService } from "@/services/ai.service.ts";
import { securityAudit } from "@/middleware/audit-logger.ts";
import { haversineDistance } from "@/utils/geo.ts";
import type { AuthenticatedRequest } from "@/types/express.ts";
import type { TrackingSession } from "@/db/schema.ts";
import { strictLimiter, uploadLimiter } from "@/middleware/rate-limiter.ts";
import { z } from "zod";

const router = Router();

const reviewSchema = z.object({
  technicianId: z.string().uuid("ID technicien invalide"),
  bookingId: z.string().uuid("ID réservation invalide"),
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

    // Anti-fraud: a review must be backed by the reviewer's OWN completed booking
    // with that technician. Without this, anyone could post fake/defamatory ratings
    // for any technician. One review per booking; the review is then marked verified.
    const booking = await bookingRepository.findById(req.body.bookingId);
    if (!booking) {
      throw new NotFoundError("Booking", req.body.bookingId);
    }
    if (booking.clientId !== user.id) {
      throw new ForbiddenError("Vous ne pouvez évaluer que vos propres réservations.");
    }
    if (booking.technicianId !== req.body.technicianId) {
      throw new ValidationError("Le technicien ne correspond pas à cette réservation.", { technicianId: "mismatch" });
    }
    if (booking.status !== "completed") {
      throw new ValidationError("Vous ne pouvez évaluer qu'après la fin de l'intervention.", { status: booking.status });
    }
    const existing = await reviewRepository.findByBookingId(req.body.bookingId);
    if (existing) {
      throw new ConflictError("Cette réservation a déjà été évaluée.");
    }

    const review = await reviewRepository.create({
      ...req.body,
      clientId: user.id,
      isVerified: true, // backed by a real completed booking
    });
    await technicianRepository.updateRating(req.body.technicianId);
    securityAudit("review.posted", req, { technicianId: req.body.technicianId, rating: req.body.rating, bookingId: req.body.bookingId });
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
  validateParams(z.object({ id: z.string().uuid("Identifiant invalide") })),
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

// Assemble a live tracking session for a booking from existing data (latest
// technician location + saved job address + technician profile). Returns
// isActive:false with safe defaults when no location has been shared yet, so the
// client renders its "tracking not active" state rather than erroring.
router.get(
  "/tracking/booking/:id",
  authenticate,
  validateParams(z.object({ id: z.string().uuid("Identifiant invalide") })),
  asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.id;
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError("Booking", bookingId);

    const tech = await technicianRepository.findWithUser(booking.technicianId);
    const loc = await trackingRepository.findLatestByBookingId(bookingId);
    const addr = await trackingRepository.findAddressByBookingId(bookingId);

    const currentLocation = loc
      ? {
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy ?? undefined,
          heading: loc.heading ?? undefined,
          speed: loc.speed ?? undefined,
          timestamp: loc.timestamp,
        }
      : null;

    const destination = {
      address: addr?.address ?? "",
      latitude: addr?.latitude ?? 0,
      longitude: addr?.longitude ?? 0,
    };

    let distanceRemaining = 0;
    let durationRemaining = 0;
    let estimatedArrival: Date | null = null;
    if (currentLocation && addr?.latitude != null && addr?.longitude != null) {
      const km = haversineDistance(currentLocation.latitude, currentLocation.longitude, addr.latitude, addr.longitude);
      distanceRemaining = Math.round(km * 1000);
      const speedKmh = loc?.speed && loc.speed > 1 ? loc.speed : 30; // assume 30 km/h urban when unknown
      durationRemaining = Math.round((km / speedKmh) * 3600);
      estimatedArrival = new Date(Date.now() + durationRemaining * 1000);
    }

    const session: TrackingSession = {
      bookingId,
      technicianId: booking.technicianId,
      technicianName: tech?.name ?? "Technicien",
      technicianPhone: tech?.phone ?? "",
      currentLocation,
      destination,
      estimatedArrival,
      distanceRemaining,
      durationRemaining,
      isActive: currentLocation !== null,
    };

    res.json(successResponse({ session }));
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
