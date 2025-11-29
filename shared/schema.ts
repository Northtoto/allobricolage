import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Service categories for Morocco handyman market
export const SERVICE_CATEGORIES = [
  "plomberie",              // Plomberie
  "electricite",            // Électricité
  "peinture",               // Peinture
  "menuiserie",             // Menuiserie
  "climatisation",          // Climatisation
  "reparation_appareils",   // Réparation d'appareils
  "petites_renovations",    // Petites rénovations
  "portes_serrures",        // Portes/Serrures
  "metallerie",             // Métallerie
  "carrelage",              // Carrelage
  "etancheite",             // Étanchéité
  "installation_luminaires",// Installation Luminaires
  "travaux_construction",   // Travaux Construction
  "services_generaux",      // Services Généraux
] as const;

export const MOROCCAN_CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Fès",
  "Tanger",
  "Agadir",
  "Meknès",
  "Oujda",
  "Kenitra",
  "Tétouan",
  "Salé",
  "Nador",
  "Beni Mellal",
  "El Jadida",
  "Khouribga",
  "Safi",
  "Mohammedia",
] as const;

export const URGENCY_LEVELS = ["low", "normal", "high", "emergency"] as const;
export const COMPLEXITY_LEVELS = ["simple", "moderate", "complex"] as const;
export const BOOKING_STATUS = ["pending", "accepted", "in_progress", "completed", "cancelled"] as const;
export const PAYMENT_METHODS = ["stripe", "cmi", "cashplus", "bank_transfer", "cash"] as const;
export const PAYMENT_STATUS = ["pending", "processing", "completed", "failed", "cancelled", "refunded"] as const;
export const CARD_THEMES = ["default", "gold", "platinum"] as const;

// Users table for clients and technicians
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Nullable for OAuth users
  role: text("role").notNull().default("client"),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  city: text("city"),
  googleId: text("google_id"), // For Google OAuth
  profilePicture: text("profile_picture"), // From Google or uploaded
  createdAt: timestamp("created_at").defaultNow(),
});

// Technicians table - professional metadata linked to users
export const technicians = pgTable("technicians", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  services: text("services").array().notNull(),
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
  isAvailable: boolean("is_available").notNull().default(true),
  isPro: boolean("is_pro").notNull().default(false),
  isPromo: boolean("is_promo").notNull().default(false),
  availability: text("availability").notNull().default("Sur RDV"),
  certifications: text("certifications").array().notNull().default([]),
  latitude: real("latitude"),
  longitude: real("longitude"),
  languages: text("languages").array().notNull().default(["français", "arabe"]),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey(),
  clientId: varchar("client_id").references(() => users.id),
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
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey(),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  technicianId: varchar("technician_id").notNull().references(() => technicians.id),
  clientId: varchar("client_id").references(() => users.id), // User ID of the client who made the booking
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  status: text("status").notNull().default("pending"),
  estimatedCost: integer("estimated_cost"),
  finalCost: integer("final_cost"),
  matchScore: real("match_score"),
  matchExplanation: text("match_explanation"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey(),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("MAD"),
  paymentMethod: text("payment_method").notNull(), // stripe, cmi, cashplus, bank_transfer
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed, cancelled
  paymentIntentId: text("payment_intent_id"), // For Stripe
  transactionId: text("transaction_id"), // For CMI, Cash Plus
  bankReference: text("bank_reference"), // For bank transfers (RIB/IBAN)
  paymentDetails: jsonb("payment_details"), // Store additional payment info
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // booking, payment, job_update, system
  title: text("title").notNull(),
  message: text("message").notNull(),
  bookingId: varchar("booking_id"),
  paymentId: varchar("payment_id"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey(),
  technicianId: varchar("technician_id").notNull().references(() => technicians.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  bookingId: varchar("booking_id").references(() => bookings.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment").notNull(),
  serviceQuality: integer("service_quality"), // 1-5
  punctuality: integer("punctuality"), // 1-5
  professionalism: integer("professionalism"), // 1-5
  valueForMoney: integer("value_for_money"), // 1-5
  isVerified: boolean("is_verified").notNull().default(false),
  technicianResponse: text("technician_response"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Technician Location Tracking table - Real-time GPS tracking
export const technicianLocations = pgTable("technician_locations", {
  id: varchar("id").primaryKey(),
  technicianId: varchar("technician_id").notNull().references(() => technicians.id),
  bookingId: varchar("booking_id").references(() => bookings.id), // Optional: track location per booking
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  accuracy: real("accuracy"), // GPS accuracy in meters
  heading: real("heading"), // Direction of travel (0-360 degrees)
  speed: real("speed"), // Speed in km/h
  altitude: real("altitude"), // Altitude in meters
  isActive: boolean("is_active").notNull().default(true), // Is technician currently sharing location?
  batteryLevel: integer("battery_level"), // Technician's device battery %
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job Addresses table - Store client service locations with coordinates
export const jobAddresses = pgTable("job_addresses", {
  id: varchar("id").primaryKey(),
  bookingId: varchar("booking_id").notNull().unique().references(() => bookings.id),
  address: text("address").notNull(), // Full street address
  city: text("city").notNull(),
  postalCode: text("postal_code"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  placeId: text("place_id"), // Google Places ID for verification
  formattedAddress: text("formatted_address"), // Google-formatted address
  additionalInstructions: text("additional_instructions"), // Building, floor, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Virtual ID Cards table - Professional ID cards for technicians
export const virtualIdCards = pgTable("virtual_id_cards", {
  id: varchar("id").primaryKey(),
  cardNumber: text("card_number").notNull().unique(), // Format: AB-123456
  technicianId: varchar("technician_id").notNull().unique().references(() => technicians.id),
  theme: text("theme").notNull().default("default"), // default, gold, platinum
  qrCodeData: text("qr_code_data").notNull(), // Base64 encoded QR code image
  issuedDate: timestamp("issued_date").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  viewsCount: integer("views_count").notNull().default(0),
  sharesCount: integer("shares_count").notNull().default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

// Review type for recent reviews
export interface TechnicianReview {
  author: string;
  text: string;
  rating?: number;
}

// Combined technician with user info for display
export interface TechnicianWithUser {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
  email?: string | null;
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
  recentReview?: TechnicianReview | null;
  latitude: number | null;
  longitude: number | null;
  languages: string[];
}

// AI Analysis types
export interface JobAnalysis {
  service: string;
  subServices: string[];
  urgency: string;
  complexity: string;
  estimatedDuration: string;
  extractedKeywords: string[];
  confidence: number;
  language: "fr" | "ar" | "en";
  visualDescription?: string;  // Gemini Vision description
  recommendations?: string[];   // Safety/action recommendations
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

// Real-time tracking interfaces
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
  destination: {
    address: string;
    latitude: number;
    longitude: number;
  };
  estimatedArrival: Date | null;
  distanceRemaining: number; // in meters
  durationRemaining: number; // in seconds
  isActive: boolean;
  route?: {
    polyline: string; // Encoded polyline from Google Maps
    distance: number; // in meters
    duration: number; // in seconds
  };
}

export interface RouteInfo {
  distance: number; // meters
  duration: number; // seconds
  polyline: string; // Encoded polyline
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
}

// Virtual ID Card theme configuration
export interface CardTheme {
  name: string;
  displayName: string;
  bgGradient: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  price: number; // MAD per year (0 for free)
  icon: string;
}
