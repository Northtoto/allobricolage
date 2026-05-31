import rateLimit from "express-rate-limit";
import { errorResponse } from "@/utils/response.ts";

const createHandler = (message: string) => (_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) => {
  res.status(429).json(errorResponse("TOO_MANY_REQUESTS", message));
};

/** General API rate limit: 200 requests per 15 minutes per IP */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createHandler("Too many requests, please try again later"),
});

/** Strict auth rate limit: 10 failed attempts per 15 min per IP */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: createHandler("Too many authentication attempts, please try again later"),
});

/** Per-IP API rate limit: 60 requests per minute */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createHandler("API rate limit exceeded"),
});

/** Stricter limit for sensitive endpoints: 10 requests per minute */
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createHandler("Rate limit exceeded for this operation"),
});

/** Very strict limit for password change: 5 per 15 min */
export const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createHandler("Too many password change attempts"),
});

/** Upload rate limit: 10 uploads per 10 minutes */
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createHandler("Too many uploads, please try again later"),
});
