CREATE TABLE "business_profiles" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"company_name" text NOT NULL,
	"business_type" text DEFAULT 'other' NOT NULL,
	"ice" text,
	"city" text,
	"address" text,
	"site_count" integer DEFAULT 1 NOT NULL,
	"contact_name" text,
	"contact_phone" text,
	"retainer_tier" text DEFAULT 'none' NOT NULL,
	"retainer_expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "business_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "business_retainers" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"business_id" varchar(36) NOT NULL,
	"tier" text NOT NULL,
	"price_monthly" integer DEFAULT 0 NOT NULL,
	"sla_hours" integer DEFAULT 48 NOT NULL,
	"sites_included" integer DEFAULT 1 NOT NULL,
	"preventive_visits_per_month" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"is_auto_renew" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_retainers" ADD CONSTRAINT "business_retainers_business_id_business_profiles_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_user_idx" ON "business_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "business_type_idx" ON "business_profiles" USING btree ("business_type");--> statement-breakpoint
CREATE INDEX "business_tier_idx" ON "business_profiles" USING btree ("retainer_tier");--> statement-breakpoint
CREATE INDEX "retainer_business_idx" ON "business_retainers" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "retainer_status_idx" ON "business_retainers" USING btree ("status");