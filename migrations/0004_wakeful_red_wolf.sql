ALTER TABLE "bookings" ADD COLUMN "guarantee_period_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "disputes" ADD COLUMN "is_warranty_claim" boolean DEFAULT false NOT NULL;