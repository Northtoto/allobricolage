ALTER TABLE "payments" ADD COLUMN "commission_rate" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "commission_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "technician_payout" integer DEFAULT 0 NOT NULL;