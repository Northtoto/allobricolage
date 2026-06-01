import { z } from "zod";
import dotenv from "dotenv";
import { fromZodError } from "zod-validation-error";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform((val) => parseInt(val, 10)).default("5002"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  BASE_URL: z.string().url().default("http://localhost:5002"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  HF_COST_MODEL: z.string().default("Qwen/Qwen2.5-7B-Instruct"),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  CMI_MERCHANT_ID: z.string().optional(),
  CMI_API_KEY: z.string().optional(),
  CMI_ENDPOINT: z.string().url().optional(),

  CASHPLUS_MERCHANT_ID: z.string().optional(),
  CASHPLUS_API_KEY: z.string().optional(),

  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // Shared store for rate-limiting & account-lockout (required for multi-instance
  // / serverless so protection persists across invocations). Optional: falls back
  // to in-memory when unset.
  REDIS_URL: z.string().optional(),

  // Security configuration
  BCRYPT_ROUNDS: z.string().transform((v) => parseInt(v, 10)).default("12"),
  ENABLE_CSRF: z.string().transform((v) => v === "true").default("false"),
  REQUIRE_HTTPS: z.string().transform((v) => v === "true").default("false"),
  ENABLE_AUDIT_LOG: z.string().transform((v) => v === "true").default("true"),
});

function validateEnv(): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorMessage = fromZodError(result.error, {
      prefix: "Environment configuration error",
      maxIssuesInMessage: 10,
    });
    throw new Error(errorMessage.message);
  }

  return result.data;
}

export const config = validateEnv();

export const isDev = config.NODE_ENV === "development";
export const isProd = config.NODE_ENV === "production";
export const isTest = config.NODE_ENV === "test";
