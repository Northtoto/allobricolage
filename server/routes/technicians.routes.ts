import { Router, type Request, type Response } from "express";
import { authenticate } from "@/middleware/auth.ts";
import { validateParams, validateQuery } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { NotFoundError, ForbiddenError } from "@/utils/errors.ts";
import { technicianRepository, type TechnicianFilters } from "@/repositories/technician.repository.ts";
import { reviewRepository } from "@/repositories/review.repository.ts";
import type { AuthenticatedRequest } from "@/types/express.ts";
import { findWithinRadius } from "@/utils/geo.ts";
import { z } from "zod";

const router = Router();

const filtersSchema = z.object({
  city: z.string().optional(),
  service: z.string().optional(),
  minRating: z.string().transform((v) => parseFloat(v)).optional(),
  available: z.string().transform((v) => v === "true").optional(),
  search: z.string().optional(),
  sortBy: z.enum(["rating", "price-low", "price-high", "reviews", "experience"]).optional(),
  page: z.string().transform((v) => parseInt(v, 10)).optional(),
  limit: z.string().transform((v) => parseInt(v, 10)).optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid(),
});

router.get(
  "/",
  validateQuery(filtersSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const filters: TechnicianFilters = {
      city: req.query.city as string | undefined,
      service: req.query.service as string | undefined,
      minRating: (req.query as Record<string, unknown>).minRating as number | undefined,
      available: (req.query as Record<string, unknown>).available as boolean | undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as TechnicianFilters["sortBy"],
      page: (req.query as Record<string, unknown>).page as number | undefined,
      limit: (req.query as Record<string, unknown>).limit as number | undefined,
    };

    const { items, total } = await technicianRepository.findAllWithUsers(filters);
    res.json(successResponse(items, { total, page: filters.page ?? 1, limit: filters.limit ?? 20 }));
  })
);

// Geospatial radius search
router.get(
  "/search/nearby",
  asyncHandler(async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = parseFloat(req.query.radius as string) || 20;
    const service = req.query.service as string | undefined;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ success: false, error: "lat and lng query params required" });
      return;
    }

    // Fetch all technicians with lat/lng
    const allTechs = await technicianRepository.findAllWithUsers({
      service,
      available: true,
      limit: 500,
    });

    const geoPoints = allTechs.items
      .filter((tech: any) => tech.latitude && tech.longitude)
      .map((tech: any) => ({
        latitude: tech.latitude!,
        longitude: tech.longitude!,
        id: tech.id,
        data: tech,
      }));

    const nearby = findWithinRadius(lat, lng, geoPoints, radiusKm);

    res.json(successResponse(
      nearby.map((n) => ({
        ...(n.data as Record<string, unknown>),
        distance: Math.round(n.distance * 100) / 100,
      }))
    ));
  })
);

// IMPORTANT: "/me" must be registered BEFORE "/:id", otherwise Express matches
// "/me" against the "/:id" param route (id="me") and fails UUID validation (400).
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const tech = await technicianRepository.findByUserId(user.id);
    if (!tech) throw new NotFoundError("Technician profile");
    const techWithUser = await technicianRepository.findWithUser(tech.id);
    res.json(successResponse(techWithUser));
  })
);

router.get(
  "/:id",
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const tech = await technicianRepository.findWithUser(req.params.id);
    if (!tech) throw new NotFoundError("Technician", req.params.id);
    res.json(successResponse(tech));
  })
);

router.get(
  "/:id/reviews",
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const reviews = await reviewRepository.findByTechnicianId(req.params.id);
    res.json(successResponse(reviews));
  })
);

router.post(
  "/:id/photo",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;

    // Only the technician who owns this profile (or an admin) may replace its
    // photo — without this check any authenticated user could deface any
    // technician's profile just by knowing/guessing their id.
    if (user.role !== "admin") {
      const owned = await technicianRepository.findByUserId(user.id);
      if (!owned || owned.id !== req.params.id) {
        throw new ForbiddenError("Vous ne pouvez pas modifier ce profil");
      }
    }

    const photoUrl = `https://ui-avatars.com/api/?name=Tech&background=random`;
    await technicianRepository.update(req.params.id, { photo: photoUrl });
    res.json(successResponse({ photo: photoUrl }));
  })
);

export default router;
