import { Router, type Request, type Response } from "express";
import { authenticate } from "@/middleware/auth.ts";
import { validateBody } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { db } from "@/db/index.ts";
import { subscriptions, technicians } from "@/db/schema.ts";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import type { AuthenticatedRequest } from "@/types/express.ts";

const router = Router();

const TIER_CONFIG = {
  free: { priceMonthly: 0, leadsIncluded: 3, name: "Gratuit" },
  bronze: { priceMonthly: 99, leadsIncluded: 10, name: "Bronze" },
  silver: { priceMonthly: 249, leadsIncluded: 30, name: "Silver" },
  gold: { priceMonthly: 499, leadsIncluded: 999, name: "Gold" },
};

const upgradeSchema = z.object({
  tier: z.enum(["bronze", "silver", "gold"] as const),
});

// Get subscription details for a technician
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

    const technician = tech[0];
    const tier = TIER_CONFIG[technician.subscriptionTier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.free;
    const leadsRemaining = Math.max(0, (tier.leadsIncluded) - (technician.leadsUsedThisMonth ?? 0));

    res.json(successResponse({
      tier: technician.subscriptionTier,
      tierName: tier.name,
      leadsIncluded: tier.leadsIncluded,
      leadsUsed: technician.leadsUsedThisMonth ?? 0,
      leadsRemaining,
      priceMonthly: tier.priceMonthly,
      expiresAt: technician.subscriptionExpiresAt,
      features: getTierFeatures(technician.subscriptionTier),
    }));
  })
);

// Upgrade subscription
router.post(
  "/upgrade",
  authenticate,
  validateBody(upgradeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.id;
    const { tier } = req.body;
    const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];

    const tech = await db
      .select()
      .from(technicians)
      .where(eq(technicians.userId, userId))
      .limit(1);

    if (!tech.length) {
      throw new NotFoundError("Technician not found");
    }

    const now = new Date();
    const expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    // Update technician
    await db
      .update(technicians)
      .set({
        subscriptionTier: tier,
        subscriptionExpiresAt: expiresAt,
        leadsUsedThisMonth: 0,
        leadsResetAt: expiresAt,
      })
      .where(eq(technicians.userId, userId));

    // Record subscription
    const [sub] = await db
      .insert(subscriptions)
      .values({
        id: uuidv4(),
        technicianId: tech[0].id,
        tier,
        leadsIncluded: config.leadsIncluded,
        priceMonthly: config.priceMonthly,
        startedAt: now,
        expiresAt,
        isAutoRenew: false,
        status: "active",
      })
      .returning();

    res.json(successResponse({
      subscription: sub,
      tier,
      tierName: config.name,
      priceMonthly: config.priceMonthly,
      leadsIncluded: config.leadsIncluded,
      expiresAt,
    }));
  })
);

// Use a lead (called by booking system)
router.post(
  "/use-lead",
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

    const t = tech[0];
    const config = TIER_CONFIG[t.subscriptionTier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.free;

    // Reset leads if month has passed
    let leadsUsed = t.leadsUsedThisMonth ?? 0;
    if (t.leadsResetAt && new Date() > new Date(t.leadsResetAt)) {
      leadsUsed = 0;
    }

    if (leadsUsed >= config.leadsIncluded) {
      res.status(403).json({
        success: false,
        error: "Limite de leads mensuels atteinte. Passez à un abonnement supérieur.",
      });
      return;
    }

    await db
      .update(technicians)
      .set({ leadsUsedThisMonth: leadsUsed + 1 })
      .where(eq(technicians.userId, userId));

    res.json(successResponse({ leadsUsed: leadsUsed + 1, leadsRemaining: config.leadsIncluded - leadsUsed - 1 }));
  })
);

function getTierFeatures(tier: string): string[] {
  const base = ["Profil public", "Réception des demandes"];
  switch (tier) {
    case "gold":
      return [...base, "Leads illimités", "Mise en avant prioritaire", "Badge Gold", "Analytics avancés", "Support prioritaire"];
    case "silver":
      return [...base, "30 leads/mois", "Mise en avant dans les résultats", "Badge Silver", "Analytics basiques"];
    case "bronze":
      return [...base, "10 leads/mois", "Badge Bronze"];
    default:
      return [...base, "3 leads/mois"];
  }
}

export default router;
