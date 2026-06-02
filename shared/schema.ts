import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const SERVICE_CATEGORIES = [
  "plomberie", "electricite", "peinture", "menuiserie",
  "climatisation", "reparation_appareils", "petites_renovations",
  "portes_serrures", "metallerie", "carrelage", "etancheite",
  "installation_luminaires", "travaux_construction", "services_generaux",
] as const;

export const MOROCCAN_CITIES = [
  "Casablanca", "Rabat", "Marrakech", "Fes", "Tanger",
  "Agadir", "Meknes", "Oujda", "Kenitra", "Tetouan",
  "Sale", "Nador", "Beni Mellal", "El Jadida", "Khouribga",
  "Safi", "Mohammedia",
] as const;

export const URGENCY_LEVELS = ["low", "normal", "high", "emergency"] as const;
export const COMPLEXITY_LEVELS = ["simple", "moderate", "complex"] as const;
export const BOOKING_STATUS = ["pending", "accepted", "in_progress", "completed", "cancelled"] as const;
export const PAYMENT_METHODS = ["stripe", "cmi", "cashplus", "bank_transfer", "cash"] as const;
export const PAYMENT_STATUS = ["pending", "processing", "completed", "failed", "cancelled", "refunded"] as const;
export const USER_ROLES = ["client", "technician", "admin"] as const;
export const VERIFICATION_STATUS = ["unverified", "pending", "verified", "rejected"] as const;
export const SUBSCRIPTION_TIERS = ["free", "bronze", "silver", "gold"] as const;
export const ESCROW_STATUS = ["held", "released", "refunded", "pending"] as const;
export const MESSAGE_DIRECTION = ["inbound", "outbound"] as const;
export const DOCUMENT_TYPES = ["cin", "diploma", "insurance", "trade_license", "photo_id"] as const;

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  role: text("role").notNull().default("client"),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  city: text("city"),
  googleId: text("google_id"),
  profilePicture: text("profile_picture"),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("users_email_idx").on(table.email),
  index("users_google_id_idx").on(table.googleId),
  index("users_role_idx").on(table.role),
  index("users_referral_code_idx").on(table.referralCode),
]);

export const technicians = pgTable("technicians", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  services: text("services").array().notNull().default([]),
  skills: text("skills").array().notNull().default([]),
  bio: text("bio"),
  photo: text("photo"),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  completedJobs: integer("completed_jobs").notNull().default(0),
  responseTimeMinutes: integer("response_time_minutes").notNull().default(30),
  completionRate: real("completion_rate").notNull().default(0.95),
  yearsExperience: integer("years_experience").notNull().default(1),
  hourlyRate: integer("hourly_rate").notNull().default(150),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationStatus: text("verification_status").notNull().default("unverified"),
  isAvailable: boolean("is_available").notNull().default(true),
  emergencyAvailable: boolean("emergency_available").notNull().default(false),
  isPro: boolean("is_pro").notNull().default(false),
  isPromo: boolean("is_promo").notNull().default(false),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  leadsUsedThisMonth: integer("leads_used_this_month").notNull().default(0),
  leadsResetAt: timestamp("leads_reset_at"),
  availability: text("availability").notNull().default("Sur RDV"),
  certifications: text("certifications").array().notNull().default([]),
  latitude: real("latitude"),
  longitude: real("longitude"),
  languages: text("languages").array().notNull().default(["francais", "arabe"]),
}, (table) => [
  index("technicians_user_id_idx").on(table.userId),
  index("technicians_services_idx").on(table.services),
  index("technicians_rating_idx").on(table.rating),
  index("technicians_available_idx").on(table.isAvailable),
]);

export const jobs = pgTable("jobs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: varchar("client_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  service: text("service").notNull(),
  subServices: text("sub_services").array(),
  city: text("city").notNull(),
  urgency: text("urgency").notNull().default("normal"),
  complexity: text("complexity").notNull().default("moderate"),
  estimatedDuration: text("estimated_duration"),
  minCost: integer("min_cost"),
  maxCost: integer("max_cost"),
  likelyCost: integer("likely_cost"),
  confidence: real("confidence"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  extractedKeywords: text("extracted_keywords").array(),
  aiAnalysis: jsonb("ai_analysis"),
}, (table) => [
  index("jobs_client_id_idx").on(table.clientId),
  index("jobs_service_idx").on(table.service),
  index("jobs_city_idx").on(table.city),
  index("jobs_status_idx").on(table.status),
]);

export const bookings = pgTable("bookings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  jobId: varchar("job_id", { length: 36 }).notNull().references(() => jobs.id, { onDelete: "cascade" }),
  technicianId: varchar("technician_id", { length: 36 }).notNull().references(() => technicians.id, { onDelete: "cascade" }),
  clientId: varchar("client_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  status: text("status").notNull().default("pending"),
  isEmergency: boolean("is_emergency").notNull().default(false),
  estimatedCost: integer("estimated_cost"),
  finalCost: integer("final_cost"),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  matchScore: real("match_score"),
  matchExplanation: text("match_explanation"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("bookings_job_id_idx").on(table.jobId),
  index("bookings_technician_id_idx").on(table.technicianId),
  index("bookings_client_id_idx").on(table.clientId),
  index("bookings_status_idx").on(table.status),
]);

export const payments = pgTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  bookingId: varchar("booking_id", { length: 36 }).notNull().references(() => bookings.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("MAD"),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default("pending"),
  escrowStatus: text("escrow_status").notNull().default("pending"),
  paymentIntentId: text("payment_intent_id"),
  transactionId: text("transaction_id"),
  bankReference: text("bank_reference"),
  paymentDetails: jsonb("payment_details"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("payments_booking_id_idx").on(table.bookingId),
]);

export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  bookingId: varchar("booking_id", { length: 36 }),
  paymentId: varchar("payment_id", { length: 36 }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("notifications_user_id_idx").on(table.userId),
  index("notifications_read_idx").on(table.isRead),
]);

export const reviews = pgTable("reviews", {
  id: varchar("id", { length: 36 }).primaryKey(),
  technicianId: varchar("technician_id", { length: 36 }).notNull().references(() => technicians.id, { onDelete: "cascade" }),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  bookingId: varchar("booking_id", { length: 36 }).references(() => bookings.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  serviceQuality: integer("service_quality"),
  punctuality: integer("punctuality"),
  professionalism: integer("professionalism"),
  valueForMoney: integer("value_for_money"),
  isVerified: boolean("is_verified").notNull().default(false),
  technicianResponse: text("technician_response"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("reviews_technician_id_idx").on(table.technicianId),
  index("reviews_client_id_idx").on(table.clientId),
]);

export const technicianLocations = pgTable("technician_locations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  technicianId: varchar("technician_id", { length: 36 }).notNull().references(() => technicians.id, { onDelete: "cascade" }),
  bookingId: varchar("booking_id", { length: 36 }).references(() => bookings.id, { onDelete: "set null" }),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  accuracy: real("accuracy"),
  heading: real("heading"),
  speed: real("speed"),
  altitude: real("altitude"),
  isActive: boolean("is_active").notNull().default(true),
  batteryLevel: integer("battery_level"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("loc_technician_idx").on(table.technicianId),
  index("loc_booking_idx").on(table.bookingId),
]);

export const jobAddresses = pgTable("job_addresses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  bookingId: varchar("booking_id", { length: 36 }).notNull().unique().references(() => bookings.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  placeId: text("place_id"),
  formattedAddress: text("formatted_address"),
  additionalInstructions: text("additional_instructions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const virtualIdCards = pgTable("virtual_id_cards", {
  id: varchar("id", { length: 36 }).primaryKey(),
  cardNumber: text("card_number").notNull().unique(),
  technicianId: varchar("technician_id", { length: 36 }).notNull().unique().references(() => technicians.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("default"),
  qrCodeData: text("qr_code_data").notNull(),
  issuedDate: timestamp("issued_date").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  viewsCount: integer("views_count").notNull().default(0),
  sharesCount: integer("shares_count").notNull().default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- NEW TABLES ---

export const verificationDocuments = pgTable("verification_documents", {
  id: varchar("id", { length: 36 }).primaryKey(),
  technicianId: varchar("technician_id", { length: 36 }).notNull().references(() => technicians.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(),
  documentUrl: text("document_url").notNull(),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("vd_technician_idx").on(table.technicianId),
  index("vd_status_idx").on(table.status),
]);

export const portfolioImages = pgTable("portfolio_images", {
  id: varchar("id", { length: 36 }).primaryKey(),
  technicianId: varchar("technician_id", { length: 36 }).notNull().references(() => technicians.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  description: text("description"),
  isBeforeAfter: boolean("is_before_after").notNull().default(false),
  category: text("category"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("pi_technician_idx").on(table.technicianId),
]);

export const availabilitySlots = pgTable("availability_slots", {
  id: varchar("id", { length: 36 }).primaryKey(),
  technicianId: varchar("technician_id", { length: 36 }).notNull().references(() => technicians.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("as_technician_idx").on(table.technicianId),
  index("as_day_idx").on(table.dayOfWeek),
]);

export const favorites = pgTable("favorites", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  technicianId: varchar("technician_id", { length: 36 }).notNull().references(() => technicians.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("fav_client_idx").on(table.clientId),
  index("fav_technician_idx").on(table.technicianId),
]);

export const referralCodes = pgTable("referral_codes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  discountAmount: integer("discount_amount").notNull().default(50),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: varchar("id", { length: 36 }).primaryKey(),
  referrerId: varchar("referrer_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  referredId: varchar("referred_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  codeUsed: text("code_used").notNull(),
  status: text("status").notNull().default("pending"),
  rewardAmount: integer("reward_amount").notNull().default(50),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  technicianId: varchar("technician_id", { length: 36 }).notNull().references(() => technicians.id, { onDelete: "cascade" }),
  tier: text("tier").notNull().default("free"),
  leadsIncluded: integer("leads_included").notNull().default(3),
  priceMonthly: integer("price_monthly").notNull().default(0),
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  isAutoRenew: boolean("is_auto_renew").notNull().default(false),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  senderId: varchar("sender_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  receiverId: varchar("receiver_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  bookingId: varchar("booking_id", { length: 36 }).references(() => bookings.id, { onDelete: "set null" }),
  technicianId: varchar("technician_id", { length: 36 }).references(() => technicians.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  channel: text("channel").notNull().default("whatsapp"),
  direction: text("direction").notNull().default("outbound"),
  externalMessageId: text("external_message_id"),
  status: text("status").notNull().default("sent"),
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("msg_booking_idx").on(table.bookingId),
  index("msg_sender_idx").on(table.senderId),
  index("msg_receiver_idx").on(table.receiverId),
]);

export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  smsEnabled: boolean("sms_enabled").notNull().default(true),
  whatsappEnabled: boolean("whatsapp_enabled").notNull().default(true),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  pushEnabled: boolean("push_enabled").notNull().default(true),
  bookingUpdates: boolean("booking_updates").notNull().default(true),
  paymentUpdates: boolean("payment_updates").notNull().default(true),
  promotionalUpdates: boolean("promotional_updates").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("np_user_idx").on(table.userId),
]);

export const disputes = pgTable("disputes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  bookingId: varchar("booking_id", { length: 36 }).notNull().references(() => bookings.id, { onDelete: "cascade" }),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  technicianId: varchar("technician_id", { length: 36 }).notNull().references(() => technicians.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  resolution: text("resolution"),
  refundAmount: integer("refund_amount"),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("disputes_booking_idx").on(table.bookingId),
  index("disputes_status_idx").on(table.status),
]);

// B2B: business client accounts (cafés, restaurants, hotels, syndics, companies).
// The demand-side moat — recurring maintenance retainers create guaranteed technician income.
export const businessProfiles = pgTable("business_profiles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  businessType: text("business_type").notNull().default("other"), // cafe | restaurant | hotel | retail | office | syndic | other
  ice: text("ice"), // Identifiant Commun de l'Entreprise (Moroccan business tax ID, for TVA invoicing)
  city: text("city"),
  address: text("address"),
  siteCount: integer("site_count").notNull().default(1),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  retainerTier: text("retainer_tier").notNull().default("none"), // none | essentiel | pro | enterprise
  retainerExpiresAt: timestamp("retainer_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("business_user_idx").on(table.userId),
  index("business_type_idx").on(table.businessType),
  index("business_tier_idx").on(table.retainerTier),
]);

// B2B: recurring maintenance contracts with SLA. The baseload that locks in supply.
export const businessRetainers = pgTable("business_retainers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  businessId: varchar("business_id", { length: 36 }).notNull().references(() => businessProfiles.id, { onDelete: "cascade" }),
  tier: text("tier").notNull(), // essentiel | pro | enterprise
  priceMonthly: integer("price_monthly").notNull().default(0), // MAD
  slaHours: integer("sla_hours").notNull().default(48), // guaranteed response time
  sitesIncluded: integer("sites_included").notNull().default(1),
  preventiveVisitsPerMonth: integer("preventive_visits_per_month").notNull().default(0),
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  isAutoRenew: boolean("is_auto_renew").notNull().default(true),
  status: text("status").notNull().default("active"), // active | paused | cancelled
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("retainer_business_idx").on(table.businessId),
  index("retainer_status_idx").on(table.status),
]);

// P0-1: written devis (quote). A technician proposes a quote for a booking; the
// client must accept it IN-APP before work starts. The priceFlag is the
// anti-arnaque guardrail — it marks quotes that fall outside the service's normal
// price band (computed from the deterministic estimator) so clients see a warning.
export const quotes = pgTable("quotes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  bookingId: varchar("booking_id", { length: 36 }).notNull().references(() => bookings.id, { onDelete: "cascade" }),
  technicianId: varchar("technician_id", { length: 36 }).notNull().references(() => technicians.id, { onDelete: "cascade" }),
  clientId: varchar("client_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  description: text("description").notNull(), // what work the price covers
  laborCost: integer("labor_cost").notNull().default(0),
  materialsCost: integer("materials_cost").notNull().default(0),
  amount: integer("amount").notNull(), // total in MAD
  currency: text("currency").notNull().default("MAD"),
  status: text("status").notNull().default("pending"), // pending | accepted | rejected | expired
  priceFlag: text("price_flag").notNull().default("normal"), // normal | above_market | below_market
  expectedMin: integer("expected_min"), // the band the quote was checked against
  expectedMax: integer("expected_max"),
  respondedAt: timestamp("responded_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("quotes_booking_idx").on(table.bookingId),
  index("quotes_status_idx").on(table.status),
]);

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTechnicianSchema = createInsertSchema(technicians).omit({ id: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertTechnicianLocationSchema = createInsertSchema(technicianLocations).omit({ id: true, timestamp: true, updatedAt: true });
export const insertJobAddressSchema = createInsertSchema(jobAddresses).omit({ id: true, createdAt: true });
export const insertVirtualIdCardSchema = createInsertSchema(virtualIdCards).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVerificationDocumentSchema = createInsertSchema(verificationDocuments).omit({ id: true, createdAt: true });
export const insertPortfolioImageSchema = createInsertSchema(portfolioImages).omit({ id: true, createdAt: true });
export const insertAvailabilitySlotSchema = createInsertSchema(availabilitySlots).omit({ id: true, createdAt: true });
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true, createdAt: true });
export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({ id: true, createdAt: true });
export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({ id: true, updatedAt: true });
export const insertDisputeSchema = createInsertSchema(disputes).omit({ id: true, createdAt: true });
export const insertBusinessProfileSchema = createInsertSchema(businessProfiles).omit({ id: true, createdAt: true });
export const insertBusinessRetainerSchema = createInsertSchema(businessRetainers).omit({ id: true, createdAt: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Technician = typeof technicians.$inferSelect;
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type TechnicianLocation = typeof technicianLocations.$inferSelect;
export type InsertTechnicianLocation = z.infer<typeof insertTechnicianLocationSchema>;
export type JobAddress = typeof jobAddresses.$inferSelect;
export type InsertJobAddress = z.infer<typeof insertJobAddressSchema>;
export type VirtualIdCard = typeof virtualIdCards.$inferSelect;
export type InsertVirtualIdCard = z.infer<typeof insertVirtualIdCardSchema>;
export type VerificationDocument = typeof verificationDocuments.$inferSelect;
export type InsertVerificationDocument = z.infer<typeof insertVerificationDocumentSchema>;
export type PortfolioImage = typeof portfolioImages.$inferSelect;
export type InsertPortfolioImage = z.infer<typeof insertPortfolioImageSchema>;
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type InsertAvailabilitySlot = z.infer<typeof insertAvailabilitySlotSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;
export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;
export type BusinessRetainer = typeof businessRetainers.$inferSelect;
export type InsertBusinessRetainer = z.infer<typeof insertBusinessRetainerSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export interface TechnicianWithUser {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  services: string[];
  skills: string[];
  bio: string | null;
  photo: string | null;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  responseTimeMinutes: number;
  completionRate: number;
  yearsExperience: number;
  hourlyRate: number;
  isVerified: boolean;
  isAvailable: boolean;
  isPro: boolean;
  isPromo: boolean;
  availability: string;
  certifications: string[];
  recentReview?: { author: string; text: string; rating?: number } | null;
  latitude: number | null;
  longitude: number | null;
  languages: string[];
}

export interface JobAnalysis {
  service: string;
  subServices: string[];
  urgency: string;
  complexity: string;
  estimatedDuration: string;
  extractedKeywords: string[];
  confidence: number;
  language: "fr" | "ar" | "en";
  visualDescription?: string;
  recommendations?: string[];
}

export interface CostEstimate {
  minCost: number;
  likelyCost: number;
  maxCost: number;
  confidence: number;
  breakdown: {
    baseRate: number;
    urgencyPremium: number;
    timePremium: number;
    complexityPremium: number;
    demandPremium: number;
  };
  explanation: string;
}

export interface TechnicianMatch {
  technician: TechnicianWithUser;
  matchScore: number;
  explanation: string;
  etaMinutes: number;
  estimatedCost: CostEstimate;
  factors: {
    specializationMatch: number;
    locationScore: number;
    availabilityScore: number;
    responseTimeScore: number;
    completionRateScore: number;
    ratingScore: number;
    priceScore: number;
  };
}

export interface UpsellSuggestion {
  service: string;
  description: string;
  probability: number;
  discount: number;
  reason: string;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  altitude?: number;
  batteryLevel?: number;
  timestamp: Date;
}

export interface TrackingSession {
  bookingId: string;
  technicianId: string;
  technicianName: string;
  technicianPhone: string;
  currentLocation: LocationUpdate | null;
  destination: { address: string; latitude: number; longitude: number };
  estimatedArrival: Date | null;
  distanceRemaining: number;
  durationRemaining: number;
  isActive: boolean;
  route?: { polyline: string; distance: number; duration: number };
}

export interface RouteInfo {
  distance: number;
  duration: number;
  polyline: string;
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
}

export interface CardTheme {
  name: string;
  displayName: string;
  bgGradient: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  price: number;
  icon: string;
}
