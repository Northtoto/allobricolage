import { Router, type Request, type Response } from "express";
import { authenticate, requireRole } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { bookingRepository } from "@/repositories/booking.repository.ts";
import { jobRepository } from "@/repositories/job.repository.ts";
import type { AuthenticatedRequest } from "@/types/express.ts";

const router = Router();

router.get(
  "/stats",
  authenticate,
  requireRole("client"),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const stats = await bookingRepository.getClientStats(user.id);
    const userJobs = await jobRepository.findByClientId(user.id);

    res.json(successResponse({
      ...stats,
      totalJobs: userJobs.length,
    }));
  })
);

router.get(
  "/jobs",
  authenticate,
  requireRole("client"),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const jobs = await jobRepository.findByClientId(user.id);
    res.json(successResponse(jobs));
  })
);

export default router;
