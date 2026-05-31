import { config } from "dotenv";
config();
import fs from "fs";
import { Client } from "pg";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();

  const sql = fs.readFileSync("./migrations/0000_tricky_gressill.sql", "utf8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  let ok = 0;
  let skipped = 0;
  for (const stmt of statements) {
    try {
      await client.query(stmt);
      ok++;
    } catch (e: any) {
      if (
        e.message?.includes("already exists") ||
        e.message?.includes("duplicate") ||
        e.message?.includes("Cannot add foreign key")
      ) {
        skipped++;
      } else {
        console.log("WARN:", stmt.substring(0, 60), "→", e.message?.substring(0, 100));
      }
    }
  }

  console.log(`\nMigration: ${ok} OK, ${skipped} skipped`);
  await client.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
