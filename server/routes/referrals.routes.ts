import { Router, type Request, type Response } from "express";
import { authenticate, requireRole } from "@/middleware/auth.ts";
import { validateBody } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { db } from "@/db/index.ts";
import { referralCodes, referrals, users } from "@/db/schema.ts";
import { eq, and, count, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const router = Router();

const REDEEM_SCHEMA = z.object({
  code: z.string().min(3).max(20),
});

function generateReferralCode(name: string): string {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "").substring(0, 4) || "REF";
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ALLO${clean}${random}`;
}

// Get or create my referral code
router.get(
  "/my-code",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    const existing = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      res.json(successResponse(existing[0]));
      return;
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const code = generateReferralCode(user[0]?.name ?? "USER");

    const [created] = await db
      .insert(referralCodes)
      .values({
        id: uuidv4(),
        userId,
        code,
        maxUses: 50,
      })
      .returning();

    // Save code on user record too
    await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));

    res.json(successResponse(created));
  })
);

// Get my referrals (people I referred)
router.get(
  "/my-referrals",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    const result = await db
      .select({
        id: referrals.id,
        referredId: referrals.referredId,
        status: referrals.status,
        rewardAmount: referrals.rewardAmount,
        completedAt: referrals.completedAt,
        createdAt: referrals.createdAt,
        referred: {
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        },
      })
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .innerJoin(users, eq(referrals.referredId, users.id));

    // Count stats
    const [stats] = await db
      .select({ count: count() })
      .from(referrals)
      .where(eq(referrals.referrerId, userId));

    const [completed] = await db
      .select({ count: count() })
      .from(referrals)
      .where(and(eq(referrals.referrerId, userId), eq(referrals.status, "completed")));

    res.json(successResponse({
      referrals: result,
      total: stats?.count ?? 0,
      completed: completed?.count ?? 0,
      totalRewards: result.filter(r => r.status === "completed").reduce((sum, r) => sum + (r.rewardAmount ?? 0), 0),
    }));
  })
);

// Redeem a referral code during signup
router.post(
  "/redeem",
  validateBody(REDEEM_SCHEMA),
  asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.body;

    const codeEntry = await db
      .select()
      .from(referralCodes)
      .where(and(eq(referralCodes.code, code), eq(referralCodes.isActive, true)))
      .limit(1);

    if (!codeEntry.length) {
      throw new NotFoundError("Code de parrainage invalide");
    }

    const entry = codeEntry[0];
    if (entry.maxUses !== null && entry.usedCount >= entry.maxUses) {
      throw new NotFoundError("Ce code a atteint sa limite d'utilisations");
    }

    res.json(successResponse({
      valid: true,
      referrerId: entry.userId,
      discountAmount: entry.discountAmount,
      code,
    }));
  })
);

// Mark referral as completed (called after first booking by referred user)
router.post(
  "/complete/:referredId",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    const { referredId } = req.params;

    const referral = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referredId, referredId))
      .limit(1);

    if (!referral.length) {
      throw new NotFoundError("Referral not found");
    }

    const [updated] = await db
      .update(referrals)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(referrals.id, referral[0].id))
      .returning();

    // Update code used count
    await db
      .update(referralCodes)
      .set({ usedCount: sql`${referralCodes.usedCount} + 1` })
      .where(eq(referralCodes.userId, referral[0].referrerId));

    res.json(successResponse(updated));
  })
);

export default router;
