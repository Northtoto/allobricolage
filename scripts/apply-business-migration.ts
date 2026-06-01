/**
 * One-off: applies migration 0001 (business_profiles + business_retainers) only.
 * Used instead of `drizzle-kit push` to avoid touching unrelated schema drift.
 * Idempotent-safe: runs in a transaction and aborts cleanly on any error.
 *   npx tsx scripts/apply-business-migration.ts
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { Pool } from "pg";

const sql = readFileSync("migrations/0001_famous_rumiko_fujikawa.sql", "utf8");
const statements = sql
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter(Boolean);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const stmt of statements) {
      const label = stmt.split("\n")[0].slice(0, 70);
      await client.query(stmt);
      console.log(`✅ ${label}`);
    }
    await client.query("COMMIT");
    console.log(`\nApplied ${statements.length} statements. business_profiles + business_retainers are live.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`\n❌ Rolled back. ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
