import { Router, type Request, type Response } from "express";
import { authLimiter, passwordChangeLimiter } from "@/middleware/rate-limiter.ts";
import { authenticate } from "@/middleware/auth.ts";
import { validateBody } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { authService } from "@/services/auth.service.ts";
import { moroccanPhoneSchema, passwordSchema } from "@/utils/password-policy.ts";
import { z } from "zod";
import type { AuthenticatedRequest } from "@/types/express.ts";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, "Nom d'utilisateur requis").max(50, "Trop long"),
  password: z.string().min(1, "Mot de passe requis").max(128, "Trop long"),
});

const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Minimum 3 caractères")
    .max(30, "Maximum 30 caractères")
    .regex(/^[a-zA-Z0-9_]+$/, "Lettres, chiffres et underscores uniquement"),
  password: passwordSchema,
  name: z.string().min(1, "Nom requis").max(100, "Trop long"),
  email: z.string().email("Email invalide").optional().nullable(),
  phone: moroccanPhoneSchema.optional().nullable(),
  city: z.string().optional().nullable(),
  role: z.enum(["client", "technician", "admin"]).default("client"),
  services: z.array(z.string().min(1)).max(10, "Maximum 10 services").optional(),
  yearsExperience: z.union([z.string(), z.number()]).optional(),
  hourlyRate: z.union([z.string(), z.number()]).optional(),
  bio: z.string().max(1000, "Bio trop longue").optional(),
}).refine(
  (data) => data.role !== "admin",
  { message: "Inscription admin interdite via l'API publique", path: ["role"] }
);

const googleLoginSchema = z.object({
  // Google ID token (JWT) from Google Identity Services — verified server-side.
  credential: z.string().min(1, "Jeton Google requis"),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

router.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body.username, req.body.password, req);
    res.json(successResponse(result));
  })
);

router.post(
  "/signup",
  authLimiter,
  validateBody(signupSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.signup(req.body);
    res.status(201).json(successResponse(result));
  })
);

router.post(
  "/google",
  authLimiter,
  validateBody(googleLoginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.googleLogin(req.body.credential);
    res.json(successResponse(result));
  })
);

router.post(
  "/logout",
  authenticate,
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(successResponse({ success: true }));
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    res.json(successResponse(user));
  })
);

router.post(
  "/password",
  authenticate,
  passwordChangeLimiter,
  validateBody(passwordChangeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    await authService.changePassword(user.id, req.body.currentPassword, req.body.newPassword);
    res.json(successResponse({ success: true }));
  })
);

export default router;
