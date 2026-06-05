import { Router, type Request, type Response } from "express";
import { authenticate, requireRole } from "@/middleware/auth.ts";
import { validateBody } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { db } from "@/db/index.ts";
import { verificationDocuments, technicians, users } from "@/db/schema.ts";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import type { AuthenticatedRequest } from "@/types/express.ts";
import { computeVerificationLadder } from "@/utils/verification-ladder.ts";

const router = Router();

const uploadSchema = z.object({
  // P0-4 ladder: "selfie" (liveness) pairs with "cin" for the identity rung;
  // "ofppt_diploma" is the recognized Moroccan trade credential.
  documentType: z.enum([
    "cin", "selfie", "diploma", "ofppt_diploma", "insurance", "trade_license", "photo_id",
  ]),
  documentUrl: z.string().url(),
});

const reviewSchema = z.object({
  status: z.enum(["verified", "rejected"]),
  adminNotes: z.string().optional(),
});

// Upload verification document
router.post(
  "/upload",
  authenticate,
  validateBody(uploadSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.id;
    const { documentType, documentUrl } = req.body;

    // Get technician ID from user
    const tech = await db
      .select()
      .from(technicians)
      .where(eq(technicians.userId, userId))
      .limit(1);

    if (!tech.length) {
      throw new NotFoundError("Technician profile not found");
    }

    const [doc] = await db
      .insert(verificationDocuments)
      .values({
        id: uuidv4(),
        technicianId: tech[0].id,
        documentType,
        documentUrl,
      })
      .returning();

    // Update verification status to pending
    await db
      .update(technicians)
      .set({ verificationStatus: "pending" })
      .where(eq(technicians.id, tech[0].id));

    res.status(201).json(successResponse(doc));
  })
);

// Get my verification status and documents
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
      res.json(successResponse(null));
      return;
    }

    const docs = await db
      .select()
      .from(verificationDocuments)
      .where(eq(verificationDocuments.technicianId, tech[0].id))
      .orderBy(verificationDocuments.createdAt);

    res.json(successResponse({
      status: tech[0].verificationStatus,
      isVerified: tech[0].isVerified,
      documents: docs,
      verification: computeVerificationLadder(docs, { completedJobs: tech[0].completedJobs }),
    }));
  })
);

// Get all pending verifications (admin)
router.get(
  "/pending",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (_req: Request, res: Response) => {
    const pending = await db
      .select({
        id: verificationDocuments.id,
        documentType: verificationDocuments.documentType,
        documentUrl: verificationDocuments.documentUrl,
        status: verificationDocuments.status,
        createdAt: verificationDocuments.createdAt,
        technician: {
          id: technicians.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
        },
      })
      .from(verificationDocuments)
      .where(eq(verificationDocuments.status, "pending"))
      .innerJoin(technicians, eq(verificationDocuments.technicianId, technicians.id))
      .innerJoin(users, eq(technicians.userId, users.id));

    res.json(successResponse(pending));
  })
);

// Review a document (admin)
router.post(
  "/review/:id",
  authenticate,
  requireRole("admin"),
  validateBody(reviewSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = (req as AuthenticatedRequest).user!.id;

    const [updated] = await db
      .update(verificationDocuments)
      .set({
        status,
        adminNotes: adminNotes ?? null,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      })
      .where(eq(verificationDocuments.id, id))
      .returning();

    // If verified, update technician
    if (status === "verified") {
      const allDocs = await db
        .select()
        .from(verificationDocuments)
        .where(eq(verificationDocuments.technicianId, updated.technicianId));

      const hasCIN = allDocs.some((d) => d.documentType === "cin" && d.status === "verified");
      const hasFace = allDocs.some(
        (d) => (d.documentType === "selfie" || d.documentType === "photo_id") && d.status === "verified"
      );

      // Mark as verified once identity is established (CIN + a liveness selfie or
      // legacy photo ID). The granular tier comes from the verification ladder.
      if (hasCIN && hasFace) {
        await db
          .update(technicians)
          .set({ isVerified: true, verificationStatus: "verified" })
          .where(eq(technicians.id, updated.technicianId));
      }
    }

    res.json(successResponse(updated));
  })
);

// Get technician verification status (public)
router.get(
  "/technician/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tech = await db
      .select({
        isVerified: technicians.isVerified,
        verificationStatus: technicians.verificationStatus,
        completedJobs: technicians.completedJobs,
      })
      .from(technicians)
      .where(eq(technicians.id, id))
      .limit(1);

    if (!tech.length) {
      throw new NotFoundError("Technician not found");
    }

    // Count verified documents
    const docs = await db
      .select()
      .from(verificationDocuments)
      .where(and(
        eq(verificationDocuments.technicianId, id),
        eq(verificationDocuments.status, "verified")
      ));

    res.json(successResponse({
      isVerified: tech[0].isVerified,
      verificationStatus: tech[0].verificationStatus,
      verifiedDocuments: docs.map((d) => d.documentType),
      documentCount: docs.length,
      // P0-4: the tier + "what's verified" checklist the card renders.
      verification: computeVerificationLadder(docs, { completedJobs: tech[0].completedJobs }),
    }));
  })
);

export default router;
