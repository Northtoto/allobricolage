import { Router, type Request, type Response } from "express";
import { authenticate, requireRole } from "@/middleware/auth.ts";
import { validateBody, validateParams } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { NotFoundError, ForbiddenError } from "@/utils/errors.ts";
import { MOROCCAN_CITIES } from "@/db/schema.ts";
import { jobRepository } from "@/repositories/job.repository.ts";
import { businessRepository } from "@/repositories/business.repository.ts";
import { aiService } from "@/services/ai.service.ts";
import type { AuthenticatedRequest } from "@/types/express.ts";
import { z } from "zod";

const router = Router();

const CITY_VALUES = [...MOROCCAN_CITIES] as [string, ...string[]];

const analyzeSchema = z.object({
  description: z.string().min(1, "Description requise").max(5000, "Description trop longue"),
  urgency: z.enum(["low", "normal", "high", "emergency"]).default("normal"),
});

// Photo → estimate. The image is an inline data URL; cap its size (~8 MB of
// base64) so a client can't push a huge payload through the vision pipeline.
const analyzeImageSchema = z.object({
  imageDataUrl: z
    .string()
    .regex(/^data:image\/(jpeg|jpg|png|webp);base64,/, "Image invalide")
    .max(8_000_000, "Image trop volumineuse"),
  description: z.string().max(5000, "Description trop longue").optional(),
  urgency: z.enum(["low", "normal", "high", "emergency"]).optional(),
});

const createJobSchema = z.object({
  description: z.string().min(1, "Description requise").max(5000, "Trop longue"),
  analysis: z.object({
    service: z.string().min(1),
    complexity: z.string().min(1),
  }).optional(),
  city: z.enum(CITY_VALUES, { message: "Ville marocaine invalide" }),
  urgency: z.enum(["low", "normal", "high", "emergency"]).default("normal"),
});

const idParamSchema = z.object({
  id: z.string().uuid("ID invalide"),
});

router.post(
  "/analyze",
  authenticate,
  requireRole("client", "admin"),
  validateBody(analyzeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { description, urgency } = req.body;
    const analysis = await aiService.analyzeJob(description);
    const costEstimate = await aiService.estimateCost({
      service: analysis.service,
      urgency: urgency ?? analysis.urgency,
      complexity: analysis.complexity,
      description,
    });
    res.json(successResponse({ analysis, costEstimate }));
  })
);

router.post(
  "/analyze-image",
  authenticate,
  requireRole("client", "admin"),
  validateBody(analyzeImageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { imageDataUrl, description, urgency } = req.body;

    const analysis = await aiService.analyzeImage({ imageDataUrl, description });
    const costEstimate = await aiService.estimateCost({
      service: analysis.service,
      urgency: urgency ?? analysis.urgency,
      complexity: analysis.complexity,
      description,
    });

    res.json(successResponse({ analysis, costEstimate }));
  })
);

router.post(
  "/",
  authenticate,
  requireRole("client", "admin"),
  validateBody(createJobSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const { description, analysis, city, urgency } = req.body;

    const job = await jobRepository.create({
      clientId: user.id,
      description,
      service: analysis?.service ?? "services_generaux",
      city,
      urgency: urgency ?? "normal",
      complexity: analysis?.complexity ?? "moderate",
      status: "pending",
    });

    // B2B retainer clients get SLA-priority dispatch.
    const business = await businessRepository.findProfileByUserId(user.id);
    const retainer = business ? await businessRepository.findActiveRetainer(business.id) : undefined;
    const priority = retainer?.status === "active";

    const matches = await aiService.matchTechnicians(job.id, job.service, city, {
      priority,
      slaHours: retainer?.slaHours,
    });
    const upsellSuggestions = aiService.getUpsellSuggestions(job.service);

    res.status(201).json(successResponse({
      job,
      matches,
      upsellSuggestions,
      priority,
      slaHours: priority ? retainer?.slaHours : undefined,
    }));
  })
);

router.get(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const job = await jobRepository.findById(req.params.id);
    if (!job) throw new NotFoundError("Job", req.params.id);

    if (user.role !== "admin" && job.clientId !== user.id) {
      throw new ForbiddenError("Vous ne pouvez pas accéder à ce job");
    }

    res.json(successResponse(job));
  })
);

export default router;
