import { Router, type Request, type Response } from "express";
import { authenticate, requireRole } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { bookingRepository } from "@/repositories/booking.repository.ts";
import { technicianRepository } from "@/repositories/technician.repository.ts";
import { reviewRepository } from "@/repositories/review.repository.ts";
import type { AuthenticatedRequest } from "@/types/express.ts";

const router = Router();

router.get(
  "/stats",
  authenticate,
  requireRole("technician"),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const tech = await technicianRepository.findByUserId(user.id);
    if (!tech) throw new NotFoundError("Technician profile");

    const stats = await bookingRepository.getStats(tech.id);
    const reviews = await reviewRepository.findByTechnicianId(tech.id);

    res.json(successResponse({
      ...stats,
      averageRating: tech.rating,
      totalReviews: reviews.length,
    }));
  })
);

router.get(
  "/pending-jobs",
  authenticate,
  requireRole("technician"),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const tech = await technicianRepository.findByUserId(user.id);
    if (!tech) throw new NotFoundError("Technician profile");

    const pending = await bookingRepository.findPendingByTechnician(tech.id);
    res.json(successResponse(pending));
  })
);

router.post(
  "/jobs/:id/accept",
  authenticate,
  requireRole("technician"),
  asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingRepository.update(req.params.id, { status: "accepted" });
    res.json(successResponse(booking));
  })
);

router.post(
  "/jobs/:id/decline",
  authenticate,
  requireRole("technician"),
  asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingRepository.update(req.params.id, { status: "cancelled" });
    res.json(successResponse(booking));
  })
);

export default router;
