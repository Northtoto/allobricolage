CREATE TABLE "quotes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"booking_id" varchar(36) NOT NULL,
	"technician_id" varchar(36) NOT NULL,
	"client_id" varchar(36),
	"description" text NOT NULL,
	"labor_cost" integer DEFAULT 0 NOT NULL,
	"materials_cost" integer DEFAULT 0 NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'MAD' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"price_flag" text DEFAULT 'normal' NOT NULL,
	"expected_min" integer,
	"expected_max" integer,
	"responded_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quotes_booking_idx" ON "quotes" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "quotes_status_idx" ON "quotes" USING btree ("status");