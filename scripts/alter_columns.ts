import { config } from "dotenv";
config();
import { Client } from "pg";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();

  const alters = [
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" text`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by" text`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "users_referral_code_idx" ON "users"("referral_code") WHERE "referral_code" IS NOT NULL`,

    `ALTER TABLE "technicians" ADD COLUMN IF NOT EXISTS "verification_status" text DEFAULT 'unverified' NOT NULL`,
    `ALTER TABLE "technicians" ADD COLUMN IF NOT EXISTS "emergency_available" boolean DEFAULT false NOT NULL`,
    `ALTER TABLE "technicians" ADD COLUMN IF NOT EXISTS "subscription_tier" text DEFAULT 'free' NOT NULL`,
    `ALTER TABLE "technicians" ADD COLUMN IF NOT EXISTS "subscription_expires_at" timestamp`,
    `ALTER TABLE "technicians" ADD COLUMN IF NOT EXISTS "leads_used_this_month" integer DEFAULT 0 NOT NULL`,
    `ALTER TABLE "technicians" ADD COLUMN IF NOT EXISTS "leads_reset_at" timestamp`,

    `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "is_emergency" boolean DEFAULT false NOT NULL`,
    `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "actual_start_time" timestamp`,
    `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "actual_end_time" timestamp`,

    `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "escrow_status" text DEFAULT 'pending' NOT NULL`,
  ];

  for (const sql of alters) {
    try {
      await client.query(sql);
      console.log("OK:", sql.substring(0, 80));
    } catch (e: any) {
      console.log("FAIL:", sql.substring(0, 60), "->", e.message?.substring(0, 100));
    }
  }

  await client.end();
}

run().catch(console.error);
