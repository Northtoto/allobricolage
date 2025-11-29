import {
  type User, type InsertUser,
  type Technician, type InsertTechnician,
  type TechnicianWithUser,
  type Job, type InsertJob,
  type Booking, type InsertBooking,
  type Payment, type InsertPayment,
  type Notification, type InsertNotification,
  type Review, type InsertReview,
  type TechnicianLocation, type InsertTechnicianLocation,
  type JobAddress, type InsertJobAddress,
  type VirtualIdCard, type InsertVirtualIdCard,
  users, technicians, jobs, bookings, payments, notifications, reviews,
  technicianLocations, jobAddresses, virtualIdCards
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, ilike, desc, or, sql, gte } from "drizzle-orm";

export interface TechnicianFilters {
  city?: string;
  service?: string;
  minRating?: number;
  available?: boolean;
  search?: string;
  sortBy?: 'rating' | 'price-low' | 'price-high' | 'reviews' | 'experience';
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Technicians
  getTechnician(id: string): Promise<Technician | undefined>;
  getTechnicianByUserId(userId: string): Promise<Technician | undefined>;
  getTechnicianWithUser(id: string): Promise<TechnicianWithUser | undefined>;
  getAllTechnicians(): Promise<Technician[]>;
  getAllTechniciansWithUsers(): Promise<TechnicianWithUser[]>;
  getTechniciansByCity(city: string): Promise<TechnicianWithUser[]>;
  getTechniciansByService(service: string): Promise<TechnicianWithUser[]>;
  searchTechnicians(filters: TechnicianFilters): Promise<TechnicianWithUser[]>;
  createTechnician(technician: InsertTechnician): Promise<Technician>;
  updateTechnician(id: string, updates: Partial<Technician>): Promise<Technician | undefined>;

  // Jobs
  getJob(id: string): Promise<Job | undefined>;
  getAllJobs(): Promise<Job[]>;
  getJobsByStatus(status: string): Promise<Job[]>;
  getJobsByClientId(clientId: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;

  // Bookings
  getBooking(id: string): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
  getBookingsByTechnician(technicianId: string): Promise<Booking[]>;
  getBookingsByJob(jobId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined>;

  // Payments
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByBooking(bookingId: string): Promise<Payment | undefined>;
  getAllPayments(): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;

  // Notifications
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  getUnreadNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  // Reviews
  getReview(id: string): Promise<Review | undefined>;
  getReviewsByTechnician(technicianId: string): Promise<Review[]>;
  getReviewsByClient(clientId: string): Promise<Review[]>;
  getAllReviews(): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, updates: Partial<Review>): Promise<Review | undefined>;

  // Technician Locations (Tracking)
  getTechnicianLocation(id: string): Promise<TechnicianLocation | undefined>;
  getLatestTechnicianLocation(bookingId: string): Promise<TechnicianLocation | undefined>;
  getTechnicianLocationHistory(technicianId: string, bookingId?: string): Promise<TechnicianLocation[]>;
  createTechnicianLocation(location: InsertTechnicianLocation): Promise<TechnicianLocation>;
  deactivateTechnicianLocation(bookingId: string): Promise<void>;

  // Job Addresses
  getJobAddress(bookingId: string): Promise<JobAddress | undefined>;
  createJobAddress(address: InsertJobAddress): Promise<JobAddress>;
  updateJobAddress(bookingId: string, updates: Partial<JobAddress>): Promise<JobAddress | undefined>;

  // Virtual ID Cards
  getVirtualCard(id: string): Promise<VirtualIdCard | undefined>;
  getVirtualCardByNumber(cardNumber: string): Promise<VirtualIdCard | undefined>;
  getVirtualCardByTechnician(technicianId: string): Promise<VirtualIdCard | undefined>;
  createVirtualCard(card: InsertVirtualIdCard): Promise<VirtualIdCard>;
  updateVirtualCard(id: string, updates: Partial<VirtualIdCard>): Promise<VirtualIdCard | undefined>;
  incrementCardViews(cardNumber: string): Promise<void>;
  incrementCardShares(cardNumber: string): Promise<void>;

  // Seeding
  seedIfEmpty(): Promise<void>;
}

// Sample technician data for seeding
const SEED_DATA = [
  {
    user: { username: "youssef_elfassi", password: "$2b$10$dummyHashedPassword1234567890abc", name: "Youssef El Fassi", phone: "+212 600 000 000", city: "Casablanca", role: "technician" },
    tech: {
      services: ["plomberie"],
      skills: ["Fuites", "Débouchage", "Installation sanitaire"],
      rating: 4.8,
      reviewCount: 125,
      completedJobs: 312,
      responseTimeMinutes: 12,
      completionRate: 0.98,
      yearsExperience: 10,
      hourlyRate: 150,
      isVerified: true,
      isAvailable: true,
      isPro: true,
      isPromo: true,
      availability: "Immédiat",
      certifications: ["Plomberie Certifié"],
      latitude: 33.5731,
      longitude: -7.5898,
      bio: "Expert en plomberie sanitaire avec 10 ans d'expérience. Intervention rapide et travail soigné garanti.",
      languages: ["français", "arabe"],
      photo: "https://images.unsplash.com/photo-1581578731117-104f8a3d46a8?fit=crop&w=400&h=400",
    }
  },
  {
    user: { username: "karim_bennani", password: "$2b$10$dummyHashedPassword1234567890abc", name: "Karim Bennani", phone: "+212 611 222 333", city: "Marrakech", role: "technician" },
    tech: {
      services: ["electricite"],
      skills: ["Installations", "Mise aux normes", "Dépannage"],
      rating: 4.7,
      reviewCount: 210,
      completedJobs: 445,
      responseTimeMinutes: 15,
      completionRate: 0.96,
      yearsExperience: 12,
      hourlyRate: 180,
      isVerified: true,
      isAvailable: true,
      isPro: true,
      isPromo: true,
      availability: "Immédiat",
      certifications: ["Électricien Agréé", "Habilitation BR"],
      latitude: 31.6295,
      longitude: -7.9811,
      bio: "Électricien certifié spécialisé dans les installations résidentielles et commerciales.",
      languages: ["français", "arabe", "anglais"],
      photo: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?fit=crop&w=400&h=400",
    }
  },
  {
    user: { username: "fatima_alaoui", password: "$2b$10$dummyHashedPassword1234567890abc", name: "Fatima Zahra Alaoui", phone: "+212 622 334 455", city: "Rabat", role: "technician" },
    tech: {
      services: ["peinture"],
      skills: ["Peinture murale", "Décoration", "Enduit"],
      rating: 4.9,
      reviewCount: 98,
      completedJobs: 187,
      responseTimeMinutes: 20,
      completionRate: 0.99,
      yearsExperience: 8,
      hourlyRate: 120,
      isVerified: true,
      isAvailable: true,
      isPro: true,
      isPromo: false,
      availability: "Sur RDV",
      certifications: ["Compagnon du Devoir"],
      latitude: 34.0209,
      longitude: -6.8416,
      bio: "Artiste peintre passionnée, je transforme vos espaces avec soin et créativité. Spécialisée dans les finitions décoratives.",
      languages: ["français", "arabe"],
      photo: "https://images.unsplash.com/photo-1595814433015-e6f5ce69614e?fit=crop&w=400&h=400",
    }
  },
  {
    user: { username: "ahmed_benali", password: "$2b$10$dummyHashedPassword1234567890abc", name: "Ahmed Benali", phone: "+212 661-123456", city: "Casablanca", role: "technician" },
    tech: { services: ["plomberie"], skills: ["Réparation fuites", "Installation sanitaire", "Débouchage"], rating: 4.9, reviewCount: 234, completedJobs: 512, responseTimeMinutes: 12, completionRate: 0.98, yearsExperience: 15, hourlyRate: 150, isVerified: true, isAvailable: true, isPro: true, isPromo: false, availability: "Immédiat", certifications: [], latitude: 33.5731, longitude: -7.5898, bio: "Plombier expert avec 15 ans d'expérience.", languages: ["français", "arabe"], photo: null }
  },
  {
    user: { username: "mohamed_alami", password: "$2b$10$dummyHashedPassword1234567890abc", name: "Mohamed Alami", phone: "+212 662-234567", city: "Casablanca", role: "technician" },
    tech: { services: ["plomberie", "climatisation"], skills: ["Chauffe-eau", "Climatisation", "Plomberie générale"], rating: 4.7, reviewCount: 156, completedJobs: 289, responseTimeMinutes: 18, completionRate: 0.95, yearsExperience: 8, hourlyRate: 120, isVerified: true, isAvailable: true, isPro: false, isPromo: true, availability: "Immédiat", certifications: [], latitude: 33.5892, longitude: -7.6033, bio: "Technicien polyvalent.", languages: ["français", "arabe", "anglais"], photo: null }
  },
  {
    user: { username: "hassan_chraibi", password: "$2b$10$dummyHashedPassword1234567890abc", name: "Hassan Chraibi", phone: "+212 665-567890", city: "Casablanca", role: "technician" },
    tech: { services: ["menuiserie"], skills: ["Menuiserie bois", "Portes", "Fenêtres"], rating: 4.9, reviewCount: 145, completedJobs: 298, responseTimeMinutes: 20, completionRate: 0.96, yearsExperience: 20, hourlyRate: 130, isVerified: true, isAvailable: false, isPro: true, isPromo: false, availability: "Sur RDV", certifications: ["Maître Artisan"], latitude: 33.5800, longitude: -7.5900, bio: "Maître menuisier.", languages: ["français", "arabe"], photo: null }
  },
  {
    user: { username: "omar_berrada", password: "$2b$10$dummyHashedPassword1234567890abc", name: "Omar Berrada", phone: "+212 666-678901", city: "Marrakech", role: "technician" },
    tech: { services: ["plomberie"], skills: ["Plomberie traditionnelle", "Hammam", "Fontaines"], rating: 4.5, reviewCount: 87, completedJobs: 156, responseTimeMinutes: 30, completionRate: 0.92, yearsExperience: 7, hourlyRate: 110, isVerified: true, isAvailable: true, isPro: false, isPromo: false, availability: "Sur RDV", certifications: [], latitude: 31.6295, longitude: -7.9811, bio: "Spécialiste plomberie traditionnelle.", languages: ["français", "arabe", "anglais"], photo: null }
  },
  {
    user: { username: "rachid_elidrissi", password: "$2b$10$dummyHashedPassword1234567890abc", name: "Rachid El Idrissi", phone: "+212 667-789012", city: "Casablanca", role: "technician" },
    tech: { services: ["climatisation"], skills: ["Installation climatisation", "Maintenance", "Réparation"], rating: 4.8, reviewCount: 112, completedJobs: 234, responseTimeMinutes: 22, completionRate: 0.97, yearsExperience: 9, hourlyRate: 160, isVerified: true, isAvailable: true, isPro: true, isPromo: true, availability: "Immédiat", certifications: ["Frigoriste Certifié"], latitude: 33.5700, longitude: -7.6100, bio: "Technicien frigoriste certifié.", languages: ["français", "arabe"], photo: null }
  },
  {
    user: { username: "said_ouazzani", password: "$2b$10$dummyHashedPassword1234567890abc", name: "Said Ouazzani", phone: "+212 668-890123", city: "Rabat", role: "technician" },
    tech: { services: ["carrelage"], skills: ["Carrelage sol", "Carrelage mural", "Mosaïque"], rating: 4.6, reviewCount: 89, completedJobs: 178, responseTimeMinutes: 25, completionRate: 0.94, yearsExperience: 11, hourlyRate: 140, isVerified: true, isAvailable: true, isPro: false, isPromo: false, availability: "Sur RDV", certifications: [], latitude: 34.0209, longitude: -6.8416, bio: "Expert en carrelage et mosaïque.", languages: ["français", "arabe"], photo: null }
  },
  {
    user: { username: "nadia_senhaji", password: "$2b$10$dummyHashedPassword1234567890abc", name: "Nadia Senhaji", phone: "+212 669-901234", city: "Casablanca", role: "technician" },
    tech: { services: ["nettoyage"], skills: ["Nettoyage profond", "Vitres", "Désinfection"], rating: 4.8, reviewCount: 201, completedJobs: 567, responseTimeMinutes: 10, completionRate: 0.99, yearsExperience: 6, hourlyRate: 80, isVerified: true, isAvailable: true, isPro: true, isPromo: true, availability: "Immédiat", certifications: ["Hygiène Pro"], latitude: 33.5731, longitude: -7.5898, bio: "Service de nettoyage professionnel.", languages: ["français", "arabe"], photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?fit=crop&w=400&h=400" }
  },
];

export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  private mergeTechnicianWithUser(tech: Technician, user: User): TechnicianWithUser {
    return {
      id: tech.id,
      userId: tech.userId,
      name: user.name,
      phone: user.phone,
      email: null,
      city: user.city,
      services: tech.services,
      skills: tech.skills,
      bio: tech.bio,
      photo: tech.photo,
      rating: tech.rating,
      reviewCount: tech.reviewCount,
      completedJobs: tech.completedJobs,
      responseTimeMinutes: tech.responseTimeMinutes,
      completionRate: tech.completionRate,
      yearsExperience: tech.yearsExperience,
      hourlyRate: tech.hourlyRate,
      isVerified: tech.isVerified,
      isAvailable: tech.isAvailable,
      isPro: tech.isPro,
      isPromo: tech.isPromo,
      availability: tech.availability,
      certifications: tech.certifications,
      recentReview: null,
      latitude: tech.latitude ?? null,
      longitude: tech.longitude ?? null,
      languages: tech.languages,
    };
  }

  // ==================== TRACKING METHODS ====================

  async getTechnicianLocation(id: string): Promise<TechnicianLocation | undefined> {
    const [location] = await this.db
      .select()
      .from(technicianLocations)
      .where(eq(technicianLocations.id, id))
      .limit(1);
    return location;
  }

  async getLatestTechnicianLocation(bookingId: string): Promise<TechnicianLocation | undefined> {
    const [location] = await this.db
      .select()
      .from(technicianLocations)
      .where(and(
        eq(technicianLocations.bookingId, bookingId),
        eq(technicianLocations.isActive, true)
      ))
      .orderBy(desc(technicianLocations.timestamp))
      .limit(1);
    return location;
  }

  async getTechnicianLocationHistory(technicianId: string, bookingId?: string): Promise<TechnicianLocation[]> {
    const conditions = bookingId
      ? and(eq(technicianLocations.technicianId, technicianId), eq(technicianLocations.bookingId, bookingId))
      : eq(technicianLocations.technicianId, technicianId);

    return await this.db
      .select()
      .from(technicianLocations)
      .where(conditions)
      .orderBy(technicianLocations.timestamp);
  }

  async createTechnicianLocation(location: InsertTechnicianLocation): Promise<TechnicianLocation> {
    const id = randomUUID();
    const [created] = await this.db
      .insert(technicianLocations)
      .values({ id, ...location })
      .returning();
    return created;
  }

  async deactivateTechnicianLocation(bookingId: string): Promise<void> {
    await this.db
      .update(technicianLocations)
      .set({ isActive: false })
      .where(eq(technicianLocations.bookingId, bookingId));
  }

  async getJobAddress(bookingId: string): Promise<JobAddress | undefined> {
    const [address] = await this.db
      .select()
      .from(jobAddresses)
      .where(eq(jobAddresses.bookingId, bookingId))
      .limit(1);
    return address;
  }

  async createJobAddress(address: InsertJobAddress): Promise<JobAddress> {
    const id = randomUUID();
    const [created] = await this.db
      .insert(jobAddresses)
      .values({ id, ...address })
      .returning();
    return created;
  }

  async updateJobAddress(bookingId: string, updates: Partial<JobAddress>): Promise<JobAddress | undefined> {
    const [updated] = await this.db
      .update(jobAddresses)
      .set(updates)
      .where(eq(jobAddresses.bookingId, bookingId))
      .returning();
    return updated;
  }

  // ==================== MISSING INTERFACE METHODS ====================

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await this.db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await this.db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return payment;
  }

  async getPaymentByBooking(bookingId: string): Promise<Payment | undefined> {
    const [payment] = await this.db.select().from(payments).where(eq(payments.bookingId, bookingId)).limit(1);
    return payment;
  }

  async getAllPayments(): Promise<Payment[]> {
    return await this.db.select().from(payments);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const [created] = await this.db.insert(payments).values({ id, ...payment }).returning();
    return created;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [updated] = await this.db.update(payments).set(updates).where(eq(payments.id, id)).returning();
    return updated;
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await this.db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await this.db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationsByUser(userId: string): Promise<Notification[]> {
    return await this.db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const [created] = await this.db.insert(notifications).values({ id, ...notification }).returning();
    return created;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [updated] = await this.db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
    return updated;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await this.db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async getReview(id: string): Promise<Review | undefined> {
    const [review] = await this.db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    return review;
  }

  async getReviewsByTechnician(technicianId: string): Promise<Review[]> {
    return await this.db.select().from(reviews).where(eq(reviews.technicianId, technicianId));
  }

  async getReviewsByClient(clientId: string): Promise<Review[]> {
    return await this.db.select().from(reviews).where(eq(reviews.clientId, clientId));
  }

  async getAllReviews(): Promise<Review[]> {
    return await this.db.select().from(reviews);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const id = randomUUID();
    const [created] = await this.db.insert(reviews).values({ id, ...review }).returning();
    return created;
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | undefined> {
    const [updated] = await this.db.update(reviews).set(updates).where(eq(reviews.id, id)).returning();
    return updated;
  }

  // ==================== VIRTUAL ID CARD METHODS ====================

  async getVirtualCard(id: string): Promise<VirtualIdCard | undefined> {
    const [card] = await this.db
      .select()
      .from(virtualIdCards)
      .where(eq(virtualIdCards.id, id))
      .limit(1);
    return card;
  }

  async getVirtualCardByNumber(cardNumber: string): Promise<VirtualIdCard | undefined> {
    const [card] = await this.db
      .select()
      .from(virtualIdCards)
      .where(eq(virtualIdCards.cardNumber, cardNumber))
      .limit(1);
    return card;
  }

  async getVirtualCardByTechnician(technicianId: string): Promise<VirtualIdCard | undefined> {
    const [card] = await this.db
      .select()
      .from(virtualIdCards)
      .where(eq(virtualIdCards.technicianId, technicianId))
      .limit(1);
    return card;
  }

  async createVirtualCard(card: InsertVirtualIdCard): Promise<VirtualIdCard> {
    const id = randomUUID();
    const [created] = await this.db.insert(virtualIdCards).values({ id, ...card }).returning();
    return created;
  }

  async updateVirtualCard(id: string, updates: Partial<VirtualIdCard>): Promise<VirtualIdCard | undefined> {
    const [updated] = await this.db
      .update(virtualIdCards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(virtualIdCards.id, id))
      .returning();
    return updated;
  }

  async incrementCardViews(cardNumber: string): Promise<void> {
    await this.db
      .update(virtualIdCards)
      .set({
        viewsCount: sql`${virtualIdCards.viewsCount} + 1`,
        lastViewedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(virtualIdCards.cardNumber, cardNumber));
  }

  async incrementCardShares(cardNumber: string): Promise<void> {
    await this.db
      .update(virtualIdCards)
      .set({
        sharesCount: sql`${virtualIdCards.sharesCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(virtualIdCards.cardNumber, cardNumber));
  }

  // Seed function - only runs if tables are empty
  async seedIfEmpty(): Promise<void> {
    const existingTechs = await this.db.select().from(technicians).limit(1);
    if (existingTechs.length > 0) {
      console.log("Database already has technicians, skipping seed");
      return;
    }

    console.log("Seeding database with sample technicians...");

    for (const data of SEED_DATA) {
      const userId = randomUUID();
      const techId = randomUUID();

      await this.db.insert(users).values({
        id: userId,
        username: data.user.username,
        password: data.user.password,
        name: data.user.name,
        phone: data.user.phone,
        city: data.user.city,
        role: data.user.role,
      });

      await this.db.insert(technicians).values({
        id: techId,
        userId: userId,
        services: data.tech.services,
        skills: data.tech.skills,
        bio: data.tech.bio,
        photo: data.tech.photo || null,
        rating: data.tech.rating,
        reviewCount: data.tech.reviewCount,
        completedJobs: data.tech.completedJobs,
        responseTimeMinutes: data.tech.responseTimeMinutes,
        completionRate: data.tech.completionRate,
        yearsExperience: data.tech.yearsExperience,
        hourlyRate: data.tech.hourlyRate,
        isVerified: data.tech.isVerified,
        isAvailable: data.tech.isAvailable,
        isPro: data.tech.isPro,
        isPromo: data.tech.isPromo,
        availability: data.tech.availability,
        certifications: data.tech.certifications,
        latitude: data.tech.latitude,
        longitude: data.tech.longitude,
        languages: data.tech.languages,
      });
    }

    console.log(`Seeded ${SEED_DATA.length} technicians`);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password || null,
      role: insertUser.role ?? "client",
      name: insertUser.name,
      email: insertUser.email ?? null,
      phone: insertUser.phone ?? null,
      city: insertUser.city ?? null,
      googleId: insertUser.googleId ?? null,
      profilePicture: insertUser.profilePicture ?? null,
      createdAt: new Date(),
    };
    await this.db.insert(users).values(user);
    return user;
  }

  // Technicians
  async getTechnician(id: string): Promise<Technician | undefined> {
    const result = await this.db.select().from(technicians).where(eq(technicians.id, id)).limit(1);
    return result[0];
  }

  async getTechnicianByUserId(userId: string): Promise<Technician | undefined> {
    const result = await this.db.select().from(technicians).where(eq(technicians.userId, userId)).limit(1);
    return result[0];
  }

  async getTechnicianWithUser(id: string): Promise<TechnicianWithUser | undefined> {
    const tech = await this.getTechnician(id);
    if (!tech) return undefined;
    const user = await this.getUser(tech.userId);
    if (!user) return undefined;
    return this.mergeTechnicianWithUser(tech, user);
  }

  async getAllTechnicians(): Promise<Technician[]> {
    return await this.db.select().from(technicians);
  }

  async getAllTechniciansWithUsers(): Promise<TechnicianWithUser[]> {
    const allTechs = await this.db.select().from(technicians);
    const result: TechnicianWithUser[] = [];

    for (const tech of allTechs) {
      const user = await this.getUser(tech.userId);
      if (user) {
        result.push(this.mergeTechnicianWithUser(tech, user));
      }
    }

    return result;
  }

  async getTechniciansByCity(city: string): Promise<TechnicianWithUser[]> {
    const allTechsWithUsers = await this.getAllTechniciansWithUsers();
    return allTechsWithUsers.filter(
      t => t.city?.toLowerCase() === city.toLowerCase()
    );
  }

  async getTechniciansByService(service: string): Promise<TechnicianWithUser[]> {
    const allTechsWithUsers = await this.getAllTechniciansWithUsers();
    const normalizedService = service.toLowerCase();
    return allTechsWithUsers.filter(
      t => t.services.some(s => s.toLowerCase() === normalizedService)
    );
  }

  async searchTechnicians(filters: TechnicianFilters): Promise<TechnicianWithUser[]> {
    const conditions = [];

    if (filters.city && filters.city !== 'all') {
      conditions.push(ilike(users.city, filters.city));
    }

    if (filters.service && filters.service !== 'all') {
      // Check if service string is in the services array
      conditions.push(sql`${filters.service} = ANY(${technicians.services})`);
    }

    if (filters.minRating) {
      conditions.push(gte(technicians.rating, filters.minRating));
    }

    if (filters.available) {
      conditions.push(eq(technicians.isAvailable, true));
    }

    if (filters.search) {
      const searchLower = `%${filters.search.toLowerCase()}%`;
      conditions.push(or(
        ilike(users.name, searchLower),
        ilike(technicians.bio, searchLower),
        sql`EXISTS (SELECT 1 FROM unnest(${technicians.services}) s WHERE s ILIKE ${searchLower})`
      ));
    }

    let orderByClause = desc(technicians.rating); // Default
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'rating': orderByClause = desc(technicians.rating); break;
        case 'price-low': orderByClause = sql`${technicians.hourlyRate} ASC`; break;
        case 'price-high': orderByClause = desc(technicians.hourlyRate); break;
        case 'reviews': orderByClause = desc(technicians.reviewCount); break;
        case 'experience': orderByClause = desc(technicians.yearsExperience); break;
      }
    }

    const results = await this.db
      .select({
        user: users,
        tech: technicians,
      })
      .from(technicians)
      .innerJoin(users, eq(technicians.userId, users.id))
      .where(and(...conditions))
      .orderBy(orderByClause);

    return results.map(({ user, tech }) => this.mergeTechnicianWithUser(tech, user));
  }

  async createTechnician(insertTechnician: InsertTechnician): Promise<Technician> {
    const id = randomUUID();
    const technician: Technician = {
      id,
      userId: insertTechnician.userId,
      services: insertTechnician.services,
      skills: insertTechnician.skills ?? [],
      bio: insertTechnician.bio ?? null,
      photo: insertTechnician.photo ?? null,
      rating: insertTechnician.rating ?? 0,
      reviewCount: insertTechnician.reviewCount ?? 0,
      completedJobs: insertTechnician.completedJobs ?? 0,
      responseTimeMinutes: insertTechnician.responseTimeMinutes ?? 30,
      completionRate: insertTechnician.completionRate ?? 0.95,
      yearsExperience: insertTechnician.yearsExperience ?? 1,
      hourlyRate: insertTechnician.hourlyRate ?? 150,
      isVerified: insertTechnician.isVerified ?? false,
      isAvailable: insertTechnician.isAvailable ?? true,
      isPro: insertTechnician.isPro ?? false,
      isPromo: insertTechnician.isPromo ?? false,
      availability: insertTechnician.availability ?? "Sur RDV",
      certifications: insertTechnician.certifications ?? [],
      latitude: insertTechnician.latitude ?? null,
      longitude: insertTechnician.longitude ?? null,
      languages: insertTechnician.languages ?? ["français", "arabe"],
    };
    await this.db.insert(technicians).values(technician);
    return technician;
  }

  async updateTechnician(id: string, updates: Partial<Technician>): Promise<Technician | undefined> {
    const existing = await this.getTechnician(id);
    if (!existing) return undefined;

    await this.db.update(technicians)
      .set(updates)
      .where(eq(technicians.id, id));

    return { ...existing, ...updates };
  }

  // Jobs
  async getJob(id: string): Promise<Job | undefined> {
    const result = await this.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return result[0];
  }

  async getAllJobs(): Promise<Job[]> {
    return await this.db.select().from(jobs);
  }

  async getJobsByStatus(status: string): Promise<Job[]> {
    return await this.db.select().from(jobs).where(eq(jobs.status, status));
  }

  async getJobsByClientId(clientId: string): Promise<Job[]> {
    return await this.db.select().from(jobs).where(eq(jobs.clientId, clientId));
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const jobData = {
      id,
      clientId: insertJob.clientId ?? null,
      description: insertJob.description,
      service: insertJob.service,
      subServices: insertJob.subServices ?? null,
      city: insertJob.city,
      urgency: insertJob.urgency ?? "normal",
      complexity: insertJob.complexity ?? "moderate",
      estimatedDuration: insertJob.estimatedDuration ?? null,
      minCost: insertJob.minCost ?? null,
      maxCost: insertJob.maxCost ?? null,
      likelyCost: insertJob.likelyCost ?? null,
      confidence: insertJob.confidence ?? null,
      status: insertJob.status ?? "pending",
      extractedKeywords: insertJob.extractedKeywords ?? null,
      aiAnalysis: insertJob.aiAnalysis ?? null,
    };
    await this.db.insert(jobs).values(jobData);
    const result = await this.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return result[0];
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const existing = await this.getJob(id);
    if (!existing) return undefined;

    await this.db.update(jobs)
      .set(updates)
      .where(eq(jobs.id, id));

    return { ...existing, ...updates };
  }

  // Bookings
  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await this.db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0];
  }

  async getAllBookings(): Promise<Booking[]> {
    return await this.db.select().from(bookings);
  }

  async getBookingsByTechnician(technicianId: string): Promise<Booking[]> {
    return await this.db.select().from(bookings).where(eq(bookings.technicianId, technicianId));
  }

  async getBookingsByJob(jobId: string): Promise<Booking[]> {
    return await this.db.select().from(bookings).where(eq(bookings.jobId, jobId));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const bookingData = {
      id,
      jobId: insertBooking.jobId,
      technicianId: insertBooking.technicianId,
      clientId: insertBooking.clientId ?? null,
      clientName: insertBooking.clientName,
      clientPhone: insertBooking.clientPhone,
      scheduledDate: insertBooking.scheduledDate,
      scheduledTime: insertBooking.scheduledTime,
      status: insertBooking.status ?? "pending",
      estimatedCost: insertBooking.estimatedCost ?? null,
      finalCost: insertBooking.finalCost ?? null,
      matchScore: insertBooking.matchScore ?? null,
      matchExplanation: insertBooking.matchExplanation ?? null,
    };
    await this.db.insert(bookings).values(bookingData);
    const result = await this.db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0];
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const existing = await this.getBooking(id);
    if (!existing) return undefined;

    await this.db.update(bookings)
      .set(updates)
      .where(eq(bookings.id, id));

    return { ...existing, ...updates };
  }
}

// Storage initialization - Neon PostgreSQL only
async function initStorage(): Promise<IStorage> {
  // Load environment variables
  try {
    const dotenv = await import("dotenv");
    dotenv.config();
  } catch (e) {
    // dotenv not available, continue with process.env
  }

  // Require DATABASE_URL for Neon PostgreSQL
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "❌ DATABASE_URL is required. Please set it in your environment variables.\n" +
      "   Get a free PostgreSQL database at: https://neon.tech\n" +
      "   Example: DATABASE_URL=postgresql://user:password@host/database"
    );
  }

    try {
    console.log("🐘 Connecting to Neon PostgreSQL database...");
      const dbStorage = new DatabaseStorage();
      await dbStorage.seedIfEmpty();
    console.log("✅ Database connected and initialized successfully");
      return dbStorage;
    } catch (error) {
    console.error("❌ Failed to initialize PostgreSQL database:", error);
    throw new Error(
      "Database connection failed. Please check your DATABASE_URL and ensure:\n" +
      "  1. The database is accessible\n" +
      "  2. The connection string is correct\n" +
      "  3. Your IP is whitelisted (if required)"
    );
  }
}

// Export a promise that resolves to storage
export const storagePromise = initStorage();

// Export storage reference (will be initialized asynchronously)
export let storage: IStorage;

// Update the storage reference once initialized
storagePromise.then(s => {
  storage = s;
}).catch(error => {
  console.error("❌ Storage initialization failed:", error);
  process.exit(1); // Exit if database connection fails
});
