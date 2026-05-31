import { Router, type Request, type Response } from "express";
import { authenticate } from "@/middleware/auth.ts";
import { validateBody, validateParams } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { db } from "@/db/index.ts";
import { favorites, technicians, users } from "@/db/schema.ts";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const router = Router();

const favoriteBodySchema = z.object({
  technicianId: z.string().uuid(),
});

const idParamSchema = z.object({
  id: z.string().uuid(),
});

// List client's favorites with technician details
router.get(
  "/",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const clientId = (req as any).user.id;

    const results = await db
      .select({
        id: favorites.id,
        createdAt: favorites.createdAt,
        technician: {
          id: technicians.id,
          name: users.name,
          photo: technicians.photo,
          rating: technicians.rating,
          reviewCount: technicians.reviewCount,
          hourlyRate: technicians.hourlyRate,
          services: technicians.services,
          isVerified: technicians.isVerified,
          city: users.city,
        },
      })
      .from(favorites)
      .where(eq(favorites.clientId, clientId))
      .innerJoin(technicians, eq(favorites.technicianId, technicians.id))
      .innerJoin(users, eq(technicians.userId, users.id));

    res.json(successResponse(results));
  })
);

// Add favorite
router.post(
  "/",
  authenticate,
  validateBody(favoriteBodySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const clientId = (req as any).user.id;
    const { technicianId } = req.body;

    // Check if already favorited
    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.clientId, clientId), eq(favorites.technicianId, technicianId)))
      .limit(1);

    if (existing.length > 0) {
      res.json(successResponse({ id: existing[0].id, alreadyExists: true }));
      return;
    }

    const [favorite] = await db
      .insert(favorites)
      .values({
        id: uuidv4(),
        clientId,
        technicianId,
      })
      .returning();

    res.status(201).json(successResponse(favorite));
  })
);

// Remove favorite
router.delete(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const favorite = await db
      .select()
      .from(favorites)
      .where(eq(favorites.id, req.params.id))
      .limit(1);

    if (!favorite.length) {
      throw new NotFoundError("Favorite not found");
    }

    await db.delete(favorites).where(eq(favorites.id, req.params.id));
    res.json(successResponse({ removed: true }));
  })
);

// Remove favorite by technician ID
router.delete(
  "/technician/:id",
  authenticate,
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const clientId = (req as any).user.id;

    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.clientId, clientId), eq(favorites.technicianId, req.params.id)))
      .limit(1);

    if (!existing.length) {
      res.json(successResponse({ removed: false, exists: false }));
      return;
    }

    await db
      .delete(favorites)
      .where(and(eq(favorites.clientId, clientId), eq(favorites.technicianId, req.params.id)));

    res.json(successResponse({ removed: true }));
  })
);

// Check if technician is favorited
router.get(
  "/check/:id",
  authenticate,
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const clientId = (req as any).user.id;
    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.clientId, clientId), eq(favorites.technicianId, req.params.id)))
      .limit(1);

    res.json(successResponse({ isFavorite: existing.length > 0, favoriteId: existing[0]?.id ?? null }));
  })
);

export default router;
