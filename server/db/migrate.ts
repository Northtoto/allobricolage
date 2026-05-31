import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import dotenv from "dotenv";
import { logger } from "@/utils/logger.ts";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

async function runMigrations(): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  const db = drizzle(pool);

  logger.info("Running database migrations...");

  try {
    await migrate(db, { migrationsFolder: "./server/db/migrations" });
    logger.info("Migrations completed successfully");
  } catch (error) {
    logger.error("Migration failed:", { error });
    throw error;
  } finally {
    await pool.end();
  }
}

runMigrations().catch((error) => {
  logger.error("Migration script failed:", { error });
  process.exit(1);
});
