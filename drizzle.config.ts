import { defineConfig } from "drizzle-kit";

// Load environment variables
import { config } from "dotenv";
config();

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is required for database migrations.");
  console.error("   Get a free PostgreSQL database at: https://neon.tech");
  console.error("   Set it in your .env file or environment variables");
  process.exit(1);
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
