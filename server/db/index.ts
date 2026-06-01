import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "@/config/index.ts";
import { logger } from "@/utils/logger.ts";
import * as schema from "./schema.ts";

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: config.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

// A transient error on an idle pooled connection (e.g. Neon dropping an idle
// socket) must not crash the process — log it and let the pool recreate
// connections on the next query.
pool.on("error", (err) => {
  logger.error("Unexpected database pool error (recovering)", { error: err.message });
});

export const db = drizzle(pool, { schema, logger: config.NODE_ENV === "development" });

export async function closeDbConnection(): Promise<void> {
  await pool.end();
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    logger.info("Database connection established successfully");
    return true;
  } catch (error) {
    logger.error("Failed to connect to database", { error: getErrorMessage(error) });
    return false;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export type Database = typeof db;
