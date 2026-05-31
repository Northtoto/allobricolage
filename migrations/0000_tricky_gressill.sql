CREATE TABLE "availability_slots" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"technician_id" varchar(36) NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"job_id" varchar(36) NOT NULL,
	"technician_id" varchar(36) NOT NULL,
	"client_id" varchar(36),
	"client_name" text NOT NULL,
	"client_phone" text NOT NULL,
	"scheduled_date" text NOT NULL,
	"scheduled_time" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_emergency" boolean DEFAULT false NOT NULL,
	"estimated_cost" integer,
	"final_cost" integer,
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"match_score" real,
	"match_explanation" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"booking_id" varchar(36) NOT NULL,
	"client_id" varchar(36) NOT NULL,
	"technician_id" varchar(36) NOT NULL,
	"reason" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"refund_amount" integer,
	"resolved_by" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"client_id" varchar(36) NOT NULL,
	"technician_id" varchar(36) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_addresses" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"booking_id" varchar(36) NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"postal_code" text,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"place_id" text,
	"formatted_address" text,
	"additional_instructions" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "job_addresses_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"client_id" varchar(36),
	"description" text NOT NULL,
	"service" text NOT NULL,
	"sub_services" text[],
	"city" text NOT NULL,
	"urgency" text DEFAULT 'normal' NOT NULL,
	"complexity" text DEFAULT 'moderate' NOT NULL,
	"estimated_duration" text,
	"min_cost" integer,
	"max_cost" integer,
	"likely_cost" integer,
	"confidence" real,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"extracted_keywords" text[],
	"ai_analysis" jsonb
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"sender_id" varchar(36),
	"receiver_id" varchar(36),
	"booking_id" varchar(36),
	"technician_id" varchar(36),
	"content" text NOT NULL,
	"channel" text DEFAULT 'whatsapp' NOT NULL,
	"direction" text DEFAULT 'outbound' NOT NULL,
	"external_message_id" text,
	"status" text DEFAULT 'sent' NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"sms_enabled" boolean DEFAULT true NOT NULL,
	"whatsapp_enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"booking_updates" boolean DEFAULT true NOT NULL,
	"payment_updates" boolean DEFAULT true NOT NULL,
	"promotional_updates" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"booking_id" varchar(36),
	"payment_id" varchar(36),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"booking_id" varchar(36) NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'MAD' NOT NULL,
	"payment_method" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"escrow_status" text DEFAULT 'pending' NOT NULL,
	"payment_intent_id" text,
	"transaction_id" text,
	"bank_reference" text,
	"payment_details" jsonb,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolio_images" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"technician_id" varchar(36) NOT NULL,
	"image_url" text NOT NULL,
	"title" text,
	"description" text,
	"is_before_after" boolean DEFAULT false NOT NULL,
	"category" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"code" text NOT NULL,
	"discount_amount" integer DEFAULT 50 NOT NULL,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"referrer_id" varchar(36) NOT NULL,
	"referred_id" varchar(36) NOT NULL,
	"code_used" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reward_amount" integer DEFAULT 50 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"technician_id" varchar(36) NOT NULL,
	"client_id" varchar(36) NOT NULL,
	"booking_id" varchar(36),
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"service_quality" integer,
	"punctuality" integer,
	"professionalism" integer,
	"value_for_money" integer,
	"is_verified" boolean DEFAULT false NOT NULL,
	"technician_response" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"technician_id" varchar(36) NOT NULL,
	"tier" text DEFAULT 'free' NOT NULL,
	"leads_included" integer DEFAULT 3 NOT NULL,
	"price_monthly" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"is_auto_renew" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technician_locations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"technician_id" varchar(36) NOT NULL,
	"booking_id" varchar(36),
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"accuracy" real,
	"heading" real,
	"speed" real,
	"altitude" real,
	"is_active" boolean DEFAULT true NOT NULL,
	"battery_level" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technicians" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"services" text[] DEFAULT '{}' NOT NULL,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"bio" text,
	"photo" text,
	"rating" real DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"completed_jobs" integer DEFAULT 0 NOT NULL,
	"response_time_minutes" integer DEFAULT 30 NOT NULL,
	"completion_rate" real DEFAULT 0.95 NOT NULL,
	"years_experience" integer DEFAULT 1 NOT NULL,
	"hourly_rate" integer DEFAULT 150 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_status" text DEFAULT 'unverified' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"emergency_available" boolean DEFAULT false NOT NULL,
	"is_pro" boolean DEFAULT false NOT NULL,
	"is_promo" boolean DEFAULT false NOT NULL,
	"subscription_tier" text DEFAULT 'free' NOT NULL,
	"subscription_expires_at" timestamp,
	"leads_used_this_month" integer DEFAULT 0 NOT NULL,
	"leads_reset_at" timestamp,
	"availability" text DEFAULT 'Sur RDV' NOT NULL,
	"certifications" text[] DEFAULT '{}' NOT NULL,
	"latitude" real,
	"longitude" real,
	"languages" text[] DEFAULT '{"francais","arabe"}' NOT NULL,
	CONSTRAINT "technicians_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text,
	"role" text DEFAULT 'client' NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"city" text,
	"google_id" text,
	"profile_picture" text,
	"referral_code" text,
	"referred_by" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "verification_documents" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"technician_id" varchar(36) NOT NULL,
	"document_type" text NOT NULL,
	"document_url" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "virtual_id_cards" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"card_number" text NOT NULL,
	"technician_id" varchar(36) NOT NULL,
	"theme" text DEFAULT 'default' NOT NULL,
	"qr_code_data" text NOT NULL,
	"issued_date" timestamp NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"shares_count" integer DEFAULT 0 NOT NULL,
	"last_viewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "virtual_id_cards_card_number_unique" UNIQUE("card_number"),
	CONSTRAINT "virtual_id_cards_technician_id_unique" UNIQUE("technician_id")
);
--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_addresses" ADD CONSTRAINT "job_addresses_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_images" ADD CONSTRAINT "portfolio_images_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_id_users_id_fk" FOREIGN KEY ("referred_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technician_locations" ADD CONSTRAINT "technician_locations_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technician_locations" ADD CONSTRAINT "technician_locations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_id_cards" ADD CONSTRAINT "virtual_id_cards_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "as_technician_idx" ON "availability_slots" USING btree ("technician_id");--> statement-breakpoint
CREATE INDEX "as_day_idx" ON "availability_slots" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "bookings_job_id_idx" ON "bookings" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "bookings_technician_id_idx" ON "bookings" USING btree ("technician_id");--> statement-breakpoint
CREATE INDEX "bookings_client_id_idx" ON "bookings" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "disputes_booking_idx" ON "disputes" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "disputes_status_idx" ON "disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fav_client_idx" ON "favorites" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "fav_technician_idx" ON "favorites" USING btree ("technician_id");--> statement-breakpoint
CREATE INDEX "jobs_client_id_idx" ON "jobs" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "jobs_service_idx" ON "jobs" USING btree ("service");--> statement-breakpoint
CREATE INDEX "jobs_city_idx" ON "jobs" USING btree ("city");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "msg_booking_idx" ON "messages" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "msg_sender_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "msg_receiver_idx" ON "messages" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "np_user_idx" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "payments_booking_id_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "pi_technician_idx" ON "portfolio_images" USING btree ("technician_id");--> statement-breakpoint
CREATE INDEX "reviews_technician_id_idx" ON "reviews" USING btree ("technician_id");--> statement-breakpoint
CREATE INDEX "reviews_client_id_idx" ON "reviews" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "loc_technician_idx" ON "technician_locations" USING btree ("technician_id");--> statement-breakpoint
CREATE INDEX "loc_booking_idx" ON "technician_locations" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "technicians_user_id_idx" ON "technicians" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "technicians_services_idx" ON "technicians" USING btree ("services");--> statement-breakpoint
CREATE INDEX "technicians_rating_idx" ON "technicians" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "technicians_available_idx" ON "technicians" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_google_id_idx" ON "users" USING btree ("google_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_referral_code_idx" ON "users" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "vd_technician_idx" ON "verification_documents" USING btree ("technician_id");--> statement-breakpoint
CREATE INDEX "vd_status_idx" ON "verification_documents" USING btree ("status");