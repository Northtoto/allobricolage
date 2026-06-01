import Redis from "ioredis";
import { config } from "@/config/index.ts";
import { logger } from "@/utils/logger.ts";

/**
 * Optional shared Redis client for rate-limiting & account-lockout.
 *
 * Without REDIS_URL the app falls back to in-memory stores — fine for a single
 * long-lived instance, but NOT for serverless/multi-instance where each request
 * may hit a fresh process. Set REDIS_URL (e.g. an Upstash redis:// URL) in
 * production so brute-force protections actually persist.
 */
let client: Redis | null = null;

if (config.REDIS_URL) {
  client = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 2,
    lazyConnect: false,
    enableOfflineQueue: true,
  });
  client.on("error", (err) => {
    logger.error("Redis error", { error: err.message });
  });
  client.on("connect", () => {
    logger.info("Redis connected for rate-limiting & lockout");
  });
}

export const redisClient = client;
export const hasRedis = Boolean(client);
