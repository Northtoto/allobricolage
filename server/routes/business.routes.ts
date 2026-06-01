import { Router, type Request, type Response } from "express";
import { authenticate } from "@/middleware/auth.ts";
import { validateBody } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { NotFoundError, ValidationError } from "@/utils/errors.ts";
import { businessRepository } from "@/repositories/business.repository.ts";
import type { AuthenticatedRequest } from "@/types/express.ts";
import { z } from "zod";

const router = Router();

/**
 * B2B maintenance retainer catalog — the demand-side moat.
 * Recurring contracts give technicians guaranteed monthly income, which keeps the best
 * supply loyal & densely available — the unfair advantage no pure-B2C rival can match.
 * Prices in MAD/month. See docs/GO_TO_MARKET.md.
 */
const RETAINER_PLANS = {
  essentiel: {
    name: "Essentiel",
    priceMonthly: 800,
    slaHours: 24,
    sitesIncluded: 1,
    preventiveVisitsPerMonth: 1,
    features: [
      "1 établissement",
      "Intervention prioritaire sous 24h",
      "1 visite préventive / mois",
      "Techniciens vérifiés",
      "Facture TVA",
      "Protection litiges",
    ],
  },
  pro: {
    name: "Pro",
    priceMonthly: 2500,
    slaHours: 4,
    sitesIncluded: 5,
    preventiveVisitsPerMonth: 2,
    features: [
      "Jusqu'à 5 établissements",
      "Intervention garantie sous 4h",
      "2 visites préventives / mois",
      "Gestionnaire de compte dédié",
      "Tableau de bord multi-sites",
      "Facture TVA + reporting",
      "Protection litiges prioritaire",
    ],
  },
  enterprise: {
    name: "Enterprise",
    priceMonthly: 0, // sur devis
    slaHours: 2,
    sitesIncluded: 999,
    preventiveVisitsPerMonth: 4,
    features: [
      "Établissements illimités",
      "Intervention garantie sous 2h",
      "Visites préventives hebdomadaires",
      "Gestionnaire dédié + astreinte 24/7",
      "Reporting personnalisé & SLA contractuel",
      "Tarif sur devis",
    ],
  },
} as const;

type RetainerTier = keyof typeof RETAINER_PLANS;

const profileSchema = z.object({
  companyName: z.string().min(2),
  businessType: z.enum(["cafe", "restaurant", "hotel", "retail", "office", "syndic", "other"]).default("other"),
  ice: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  siteCount: z.number().int().min(1).default(1),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
});

const retainerSchema = z.object({
  tier: z.enum(["essentiel", "pro", "enterprise"] as const),
});

// Public: the retainer plan catalog (for pricing pages, no auth)
router.get(
  "/plans",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(successResponse({ plans: RETAINER_PLANS }));
  })
);

// Get my business profile + active retainer
router.get(
  "/my",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.id;
    const profile = await businessRepository.findProfileByUserId(userId);
    if (!profile) {
      res.json(successResponse({ profile: null, retainer: null }));
      return;
    }
    const retainer = await businessRepository.findActiveRetainer(profile.id);
    res.json(successResponse({ profile, retainer }));
  })
);

// Create or update the business profile
router.post(
  "/profile",
  authenticate,
  validateBody(profileSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.id;
    const existing = await businessRepository.findProfileByUserId(userId);
    const profile = existing
      ? await businessRepository.updateProfile(existing.id, req.body)
      : await businessRepository.createProfile({ ...req.body, userId });
    res.json(successResponse({ profile }));
  })
);

// Subscribe to a maintenance retainer
router.post(
  "/retainer",
  authenticate,
  validateBody(retainerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.id;
    const { tier } = req.body as { tier: RetainerTier };
    const plan = RETAINER_PLANS[tier];

    const profile = await businessRepository.findProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError("Profil entreprise introuvable. Créez-le d'abord via /business/profile.");
    }
    if (tier === "enterprise") {
      throw new ValidationError("Le plan Enterprise est sur devis — contactez l'équipe commerciale.", { tier: "enterprise" });
    }

    const now = new Date();
    const expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const retainer = await businessRepository.createRetainer({
      businessId: profile.id,
      tier,
      priceMonthly: plan.priceMonthly,
      slaHours: plan.slaHours,
      sitesIncluded: plan.sitesIncluded,
      preventiveVisitsPerMonth: plan.preventiveVisitsPerMonth,
      startedAt: now,
      expiresAt,
      isAutoRenew: true,
      status: "active",
    });

    await businessRepository.updateProfile(profile.id, {
      retainerTier: tier,
      retainerExpiresAt: expiresAt,
    });

    res.json(successResponse({ retainer, plan: { ...plan, tier }, expiresAt }));
  })
);

export default router;
