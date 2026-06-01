import { Router, type Request, type Response } from "express";
import { authenticate } from "@/middleware/auth.ts";
import { validateBody, validateParams } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { db } from "@/db/index.ts";
import { portfolioImages, technicians } from "@/db/schema.ts";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import type { AuthenticatedRequest } from "@/types/express.ts";

const router = Router();

const createSchema = z.object({
  imageUrl: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  isBeforeAfter: z.boolean().optional().default(false),
});

const idSchema = z.object({ id: z.string().uuid() });

// Get portfolio for a technician (public)
router.get(
  "/technician/:id",
  validateParams(idSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const images = await db
      .select()
      .from(portfolioImages)
      .where(eq(portfolioImages.technicianId, id))
      .orderBy(portfolioImages.sortOrder, portfolioImages.createdAt);

    res.json(successResponse(images));
  })
);

// Get my portfolio (technician)
router.get(
  "/my",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.id;

    const tech = await db
      .select()
      .from(technicians)
      .where(eq(technicians.userId, userId))
      .limit(1);

    if (!tech.length) {
      throw new NotFoundError("Technician not found");
    }

    const images = await db
      .select()
      .from(portfolioImages)
      .where(eq(portfolioImages.technicianId, tech[0].id))
      .orderBy(portfolioImages.sortOrder, portfolioImages.createdAt);

    res.json(successResponse(images));
  })
);

// Add image to portfolio
router.post(
  "/",
  authenticate,
  validateBody(createSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.id;

    const tech = await db
      .select()
      .from(technicians)
      .where(eq(technicians.userId, userId))
      .limit(1);

    if (!tech.length) {
      throw new NotFoundError("Technician not found");
    }

    const count = await db
      .select()
      .from(portfolioImages)
      .where(eq(portfolioImages.technicianId, tech[0].id));

    const [image] = await db
      .insert(portfolioImages)
      .values({
        id: uuidv4(),
        technicianId: tech[0].id,
        imageUrl: req.body.imageUrl,
        title: req.body.title ?? null,
        description: req.body.description ?? null,
        category: req.body.category ?? null,
        isBeforeAfter: req.body.isBeforeAfter ?? false,
        sortOrder: count.length,
      })
      .returning();

    res.status(201).json(successResponse(image));
  })
);

// Delete portfolio image
router.delete(
  "/:id",
  authenticate,
  validateParams(idSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.id;

    const tech = await db
      .select()
      .from(technicians)
      .where(eq(technicians.userId, userId))
      .limit(1);

    if (!tech.length) {
      throw new NotFoundError("Technician not found");
    }

    const image = await db
      .select()
      .from(portfolioImages)
      .where(eq(portfolioImages.id, req.params.id))
      .limit(1);

    if (!image.length || image[0].technicianId !== tech[0].id) {
      throw new NotFoundError("Image not found");
    }

    await db.delete(portfolioImages).where(eq(portfolioImages.id, req.params.id));
    res.json(successResponse({ removed: true }));
  })
);

// Reorder images
router.post(
  "/reorder",
  authenticate,
  validateBody(z.object({ orderedIds: z.array(z.string().uuid()) })),
  asyncHandler(async (req: Request, res: Response) => {
    const { orderedIds } = req.body;
    const userId = (req as AuthenticatedRequest).user!.id;

    const tech = await db
      .select()
      .from(technicians)
      .where(eq(technicians.userId, userId))
      .limit(1);

    if (!tech.length) {
      throw new NotFoundError("Technician not found");
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(portfolioImages)
        .set({ sortOrder: i })
        .where(eq(portfolioImages.id, orderedIds[i]));
    }

    res.json(successResponse({ reordered: true }));
  })
);

export default router;
