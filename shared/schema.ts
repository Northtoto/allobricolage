import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Service categories for Morocco handyman market
export const SERVICE_CATEGORIES = [
  "plomberie",      // Plumbing
  "electricite",    // Electrical
  "peinture",       // Painting
  "menuiserie",     // Carpentry
  "climatisation",  // AC/HVAC
  "maconnerie",     // Masonry
  "carrelage",      // Tiling
  "serrurerie",     // Locksmith
  "jardinage",      // Gardening
  "nettoyage",      // Cleaning
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
] as const;

export const URGENCY_LEVELS = ["low", "normal", "high", "emergency"] as const;
export const COMPLEXITY_LEVELS = ["simple", "moderate", "complex"] as const;
export const BOOKING_STATUS = ["pending", "accepted", "in_progress", "completed", "cancelled"] as const;

// Users table for clients and technicians
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("client"),
  name: text("name").notNull(),
  phone: text("phone"),
  city: text("city"),
});

// Technicians table - professional metadata linked to users
export const technicians = pgTable("technicians", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
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
  latitude: real("latitude"),
  longitude: real("longitude"),
  languages: text("languages").array().notNull().default(["français", "arabe"]),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey(),
  clientId: varchar("client_id"),
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
  jobId: varchar("job_id").notNull(),
  technicianId: varchar("technician_id").notNull(),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertTechnicianSchema = createInsertSchema(technicians).omit({ id: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Technician = typeof technicians.$inferSelect;
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

// Combined technician with user info for display
export interface TechnicianWithUser {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
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
