import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import type {
  User, InsertUser,
  Technician, InsertTechnician,
  TechnicianWithUser,
  Job, InsertJob,
  Booking, InsertBooking,
  Payment, InsertPayment,
  Notification, InsertNotification,
  Review, InsertReview
} from "@shared/schema";
import type { IStorage } from "./storage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "allobricolage.db");

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
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=400&h=400",
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
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?fit=crop&w=400&h=400",
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
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=400&h=400",
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

export class SQLiteStorage implements IStorage {
  private db: Database.Database;

  constructor() {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(DB_PATH);
    this.db.pragma("journal_mode = WAL");
    this.initTables();
  }

  private initTables() {
    // Create users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT,
        role TEXT NOT NULL DEFAULT 'client',
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        city TEXT,
        google_id TEXT,
        profile_picture TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create technicians table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS technicians (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        services TEXT NOT NULL,
        skills TEXT NOT NULL DEFAULT '[]',
        bio TEXT,
        photo TEXT,
        rating REAL NOT NULL DEFAULT 0,
        review_count INTEGER NOT NULL DEFAULT 0,
        completed_jobs INTEGER NOT NULL DEFAULT 0,
        response_time_minutes INTEGER NOT NULL DEFAULT 30,
        completion_rate REAL NOT NULL DEFAULT 0.95,
        years_experience INTEGER NOT NULL DEFAULT 1,
        hourly_rate INTEGER NOT NULL DEFAULT 150,
        is_verified INTEGER NOT NULL DEFAULT 0,
        is_available INTEGER NOT NULL DEFAULT 1,
        is_pro INTEGER NOT NULL DEFAULT 0,
        is_promo INTEGER NOT NULL DEFAULT 0,
        availability TEXT NOT NULL DEFAULT 'Sur RDV',
        certifications TEXT NOT NULL DEFAULT '[]',
        latitude REAL,
        longitude REAL,
        languages TEXT NOT NULL DEFAULT '["français", "arabe"]',
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create jobs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        client_id TEXT,
        description TEXT NOT NULL,
        service TEXT NOT NULL,
        sub_services TEXT,
        city TEXT NOT NULL,
        urgency TEXT NOT NULL DEFAULT 'normal',
        complexity TEXT NOT NULL DEFAULT 'moderate',
        estimated_duration TEXT,
        min_cost INTEGER,
        max_cost INTEGER,
        likely_cost INTEGER,
        confidence REAL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        extracted_keywords TEXT,
        ai_analysis TEXT
      )
    `);

    // Create bookings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        technician_id TEXT NOT NULL,
        client_name TEXT NOT NULL,
        client_phone TEXT NOT NULL,
        scheduled_date TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        estimated_cost INTEGER,
        final_cost INTEGER,
        match_score REAL,
        match_explanation TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs(id),
        FOREIGN KEY (technician_id) REFERENCES technicians(id)
      )
    `);

    // Create payments table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        booking_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'MAD',
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        payment_intent_id TEXT,
        transaction_id TEXT,
        bank_reference TEXT,
        payment_details TEXT,
        paid_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
      )
    `);

    // Create notifications table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        booking_id TEXT,
        payment_id TEXT,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create reviews table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        technician_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        booking_id TEXT,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        service_quality INTEGER,
        punctuality INTEGER,
        professionalism INTEGER,
        value_for_money INTEGER,
        is_verified INTEGER NOT NULL DEFAULT 0,
        technician_response TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (technician_id) REFERENCES technicians(id),
        FOREIGN KEY (client_id) REFERENCES users(id),
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
      )
    `);

    console.log("SQLite tables initialized");
  }

  private parseJSON(str: string | null): any {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }

  private rowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      password: row.password || undefined,
      role: row.role,
      name: row.name,
      email: row.email || undefined,
      phone: row.phone || undefined,
      city: row.city || undefined,
      googleId: row.google_id || undefined,
      profilePicture: row.profile_picture || undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
    };
  }

  private rowToTechnician(row: any): Technician {
    return {
      id: row.id,
      userId: row.user_id,
      services: this.parseJSON(row.services) || [],
      skills: this.parseJSON(row.skills) || [],
      bio: row.bio,
      photo: row.photo,
      rating: row.rating,
      reviewCount: row.review_count,
      completedJobs: row.completed_jobs,
      responseTimeMinutes: row.response_time_minutes,
      completionRate: row.completion_rate,
      yearsExperience: row.years_experience,
      hourlyRate: row.hourly_rate,
      isVerified: Boolean(row.is_verified),
      isAvailable: Boolean(row.is_available),
      isPro: Boolean(row.is_pro),
      isPromo: Boolean(row.is_promo),
      availability: row.availability,
      certifications: this.parseJSON(row.certifications) || [],
      latitude: row.latitude,
      longitude: row.longitude,
      languages: this.parseJSON(row.languages) || ["français", "arabe"],
    };
  }

  private rowToJob(row: any): Job {
    return {
      id: row.id,
      clientId: row.client_id,
      description: row.description,
      service: row.service,
      subServices: this.parseJSON(row.sub_services),
      city: row.city,
      urgency: row.urgency,
      complexity: row.complexity,
      estimatedDuration: row.estimated_duration,
      minCost: row.min_cost,
      maxCost: row.max_cost,
      likelyCost: row.likely_cost,
      confidence: row.confidence,
      status: row.status,
      createdAt: row.created_at ? new Date(row.created_at) : null,
      extractedKeywords: this.parseJSON(row.extracted_keywords),
      aiAnalysis: this.parseJSON(row.ai_analysis),
    };
  }

  private rowToBooking(row: any): Booking {
    return {
      id: row.id,
      jobId: row.job_id,
      technicianId: row.technician_id,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      scheduledDate: row.scheduled_date,
      scheduledTime: row.scheduled_time,
      status: row.status,
      estimatedCost: row.estimated_cost,
      finalCost: row.final_cost,
      matchScore: row.match_score,
      matchExplanation: row.match_explanation,
      createdAt: row.created_at ? new Date(row.created_at) : null,
    };
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
      latitude: tech.latitude,
      longitude: tech.longitude,
      languages: tech.languages,
    };
  }

  async seedIfEmpty(): Promise<void> {
    const count = this.db.prepare("SELECT COUNT(*) as count FROM technicians").get() as { count: number };
    if (count.count > 0) {
      console.log("SQLite database already has technicians, skipping seed");
      return;
    }

    console.log("Seeding SQLite database with sample technicians...");

    const insertUser = this.db.prepare(`
      INSERT INTO users (id, username, password, role, name, phone, city)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertTechnician = this.db.prepare(`
      INSERT INTO technicians (
        id, user_id, services, skills, bio, photo, rating, review_count,
        completed_jobs, response_time_minutes, completion_rate, years_experience,
        hourly_rate, is_verified, is_available, is_pro, is_promo, availability,
        certifications, latitude, longitude, languages
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedTransaction = this.db.transaction(() => {
      for (const data of SEED_DATA) {
        const userId = randomUUID();
        const techId = randomUUID();

        insertUser.run(
          userId,
          data.user.username,
          data.user.password,
          data.user.role,
          data.user.name,
          data.user.phone,
          data.user.city
        );

        insertTechnician.run(
          techId,
          userId,
          JSON.stringify(data.tech.services),
          JSON.stringify(data.tech.skills),
          data.tech.bio || null,
          data.tech.photo || null,
          data.tech.rating,
          data.tech.reviewCount,
          data.tech.completedJobs,
          data.tech.responseTimeMinutes,
          data.tech.completionRate,
          data.tech.yearsExperience,
          data.tech.hourlyRate,
          data.tech.isVerified ? 1 : 0,
          data.tech.isAvailable ? 1 : 0,
          data.tech.isPro ? 1 : 0,
          data.tech.isPromo ? 1 : 0,
          data.tech.availability,
          JSON.stringify(data.tech.certifications),
          data.tech.latitude,
          data.tech.longitude,
          JSON.stringify(data.tech.languages)
        );
      }
    });

    seedTransaction();
    console.log(`Seeded ${SEED_DATA.length} technicians to SQLite`);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const row = this.db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    return row ? this.rowToUser(row) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const row = this.db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    return row ? this.rowToUser(row) : undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const row = this.db.prepare("SELECT * FROM users WHERE google_id = ?").get(googleId);
    return row ? this.rowToUser(row) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const row = this.db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    return row ? this.rowToUser(row) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO users (id, username, password, role, name, email, phone, city, google_id, profile_picture, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      insertUser.username,
      insertUser.password ?? null,
      insertUser.role ?? "client",
      insertUser.name,
      insertUser.email ?? null,
      insertUser.phone ?? null,
      insertUser.city ?? null,
      insertUser.googleId ?? null,
      insertUser.profilePicture ?? null,
      createdAt
    );

    const created = this.db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    if (!created) throw new Error("Failed to create user");
    
    return this.rowToUser(created);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const existing = await this.getUser(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.email !== undefined) {
      fields.push("email = ?");
      values.push(updates.email);
    }
    if (updates.googleId !== undefined) {
      fields.push("google_id = ?");
      values.push(updates.googleId);
    }
    if (updates.profilePicture !== undefined) {
      fields.push("profile_picture = ?");
      values.push(updates.profilePicture);
    }
    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.phone !== undefined) {
      fields.push("phone = ?");
      values.push(updates.phone);
    }
    if (updates.city !== undefined) {
      fields.push("city = ?");
      values.push(updates.city);
    }

    if (fields.length === 0) return existing;

    values.push(id);
    const stmt = this.db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`);
    stmt.run(...values);

    return this.getUser(id);
  }

  // Technicians
  async getTechnician(id: string): Promise<Technician | undefined> {
    const row = this.db.prepare("SELECT * FROM technicians WHERE id = ?").get(id);
    return row ? this.rowToTechnician(row) : undefined;
  }

  async getTechnicianByUserId(userId: string): Promise<Technician | undefined> {
    const row = this.db.prepare("SELECT * FROM technicians WHERE user_id = ?").get(userId);
    return row ? this.rowToTechnician(row) : undefined;
  }

  async getTechnicianWithUser(id: string): Promise<TechnicianWithUser | undefined> {
    const tech = await this.getTechnician(id);
    if (!tech) return undefined;
    const user = await this.getUser(tech.userId);
    if (!user) return undefined;
    return this.mergeTechnicianWithUser(tech, user);
  }

  async getAllTechnicians(): Promise<Technician[]> {
    const rows = this.db.prepare("SELECT * FROM technicians").all();
    return rows.map((row: any) => this.rowToTechnician(row));
  }

  async getAllTechniciansWithUsers(): Promise<TechnicianWithUser[]> {
    const techs = await this.getAllTechnicians();
    const result: TechnicianWithUser[] = [];
    for (const tech of techs) {
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
    return allTechsWithUsers.filter(
      t => t.services.some(s => s.toLowerCase() === service.toLowerCase())
    );
  }

  async createTechnician(insertTechnician: InsertTechnician): Promise<Technician> {
    const id = randomUUID();
    this.db.prepare(`
      INSERT INTO technicians (
        id, user_id, services, skills, bio, photo, rating, review_count,
        completed_jobs, response_time_minutes, completion_rate, years_experience,
        hourly_rate, is_verified, is_available, is_pro, is_promo, availability,
        certifications, latitude, longitude, languages
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      insertTechnician.userId,
      JSON.stringify(insertTechnician.services),
      JSON.stringify(insertTechnician.skills ?? []),
      insertTechnician.bio ?? null,
      insertTechnician.photo ?? null,
      insertTechnician.rating ?? 0,
      insertTechnician.reviewCount ?? 0,
      insertTechnician.completedJobs ?? 0,
      insertTechnician.responseTimeMinutes ?? 30,
      insertTechnician.completionRate ?? 0.95,
      insertTechnician.yearsExperience ?? 1,
      insertTechnician.hourlyRate ?? 150,
      insertTechnician.isVerified ? 1 : 0,
      insertTechnician.isAvailable !== false ? 1 : 0,
      insertTechnician.isPro ? 1 : 0,
      insertTechnician.isPromo ? 1 : 0,
      insertTechnician.availability ?? "Sur RDV",
      JSON.stringify(insertTechnician.certifications ?? []),
      insertTechnician.latitude ?? null,
      insertTechnician.longitude ?? null,
      JSON.stringify(insertTechnician.languages ?? ["français", "arabe"])
    );

    return {
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
  }

  async updateTechnician(id: string, updates: Partial<Technician>): Promise<Technician | undefined> {
    const existing = await this.getTechnician(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    
    this.db.prepare(`
      UPDATE technicians SET
        services = ?, skills = ?, bio = ?, photo = ?, rating = ?,
        review_count = ?, completed_jobs = ?, response_time_minutes = ?,
        completion_rate = ?, years_experience = ?, hourly_rate = ?,
        is_verified = ?, is_available = ?, is_pro = ?, is_promo = ?,
        availability = ?, certifications = ?, latitude = ?, longitude = ?, languages = ?
      WHERE id = ?
    `).run(
      JSON.stringify(updated.services),
      JSON.stringify(updated.skills),
      updated.bio,
      updated.photo,
      updated.rating,
      updated.reviewCount,
      updated.completedJobs,
      updated.responseTimeMinutes,
      updated.completionRate,
      updated.yearsExperience,
      updated.hourlyRate,
      updated.isVerified ? 1 : 0,
      updated.isAvailable ? 1 : 0,
      updated.isPro ? 1 : 0,
      updated.isPromo ? 1 : 0,
      updated.availability,
      JSON.stringify(updated.certifications),
      updated.latitude,
      updated.longitude,
      JSON.stringify(updated.languages),
      id
    );

    return updated;
  }

  // Jobs
  async getJob(id: string): Promise<Job | undefined> {
    const row = this.db.prepare("SELECT * FROM jobs WHERE id = ?").get(id);
    return row ? this.rowToJob(row) : undefined;
  }

  async getAllJobs(): Promise<Job[]> {
    const rows = this.db.prepare("SELECT * FROM jobs ORDER BY created_at DESC").all();
    return rows.map((row: any) => this.rowToJob(row));
  }

  async getJobsByStatus(status: string): Promise<Job[]> {
    const rows = this.db.prepare("SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC").all(status);
    return rows.map((row: any) => this.rowToJob(row));
  }

  async getJobsByClientId(clientId: string): Promise<Job[]> {
    const rows = this.db.prepare("SELECT * FROM jobs WHERE client_id = ? ORDER BY created_at DESC").all(clientId);
    return rows.map((row: any) => this.rowToJob(row));
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO jobs (
        id, client_id, description, service, sub_services, city, urgency, complexity,
        estimated_duration, min_cost, max_cost, likely_cost, confidence, status,
        created_at, extracted_keywords, ai_analysis
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      insertJob.clientId ?? null,
      insertJob.description,
      insertJob.service,
      insertJob.subServices ? JSON.stringify(insertJob.subServices) : null,
      insertJob.city,
      insertJob.urgency ?? "normal",
      insertJob.complexity ?? "moderate",
      insertJob.estimatedDuration ?? null,
      insertJob.minCost ?? null,
      insertJob.maxCost ?? null,
      insertJob.likelyCost ?? null,
      insertJob.confidence ?? null,
      insertJob.status ?? "pending",
      now,
      insertJob.extractedKeywords ? JSON.stringify(insertJob.extractedKeywords) : null,
      insertJob.aiAnalysis ? JSON.stringify(insertJob.aiAnalysis) : null
    );

    return {
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
      createdAt: new Date(now),
      extractedKeywords: insertJob.extractedKeywords ?? null,
      aiAnalysis: insertJob.aiAnalysis ?? null,
    };
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const existing = await this.getJob(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    
    this.db.prepare(`
      UPDATE jobs SET
        client_id = ?, description = ?, service = ?, sub_services = ?, city = ?,
        urgency = ?, complexity = ?, estimated_duration = ?, min_cost = ?,
        max_cost = ?, likely_cost = ?, confidence = ?, status = ?,
        extracted_keywords = ?, ai_analysis = ?
      WHERE id = ?
    `).run(
      updated.clientId,
      updated.description,
      updated.service,
      updated.subServices ? JSON.stringify(updated.subServices) : null,
      updated.city,
      updated.urgency,
      updated.complexity,
      updated.estimatedDuration,
      updated.minCost,
      updated.maxCost,
      updated.likelyCost,
      updated.confidence,
      updated.status,
      updated.extractedKeywords ? JSON.stringify(updated.extractedKeywords) : null,
      updated.aiAnalysis ? JSON.stringify(updated.aiAnalysis) : null,
      id
    );

    return updated;
  }

  // Bookings
  async getBooking(id: string): Promise<Booking | undefined> {
    const row = this.db.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
    return row ? this.rowToBooking(row) : undefined;
  }

  async getAllBookings(): Promise<Booking[]> {
    const rows = this.db.prepare("SELECT * FROM bookings ORDER BY created_at DESC").all();
    return rows.map((row: any) => this.rowToBooking(row));
  }

  async getBookingsByTechnician(technicianId: string): Promise<Booking[]> {
    const rows = this.db.prepare("SELECT * FROM bookings WHERE technician_id = ? ORDER BY created_at DESC").all(technicianId);
    return rows.map((row: any) => this.rowToBooking(row));
  }

  async getBookingsByJob(jobId: string): Promise<Booking[]> {
    const rows = this.db.prepare("SELECT * FROM bookings WHERE job_id = ? ORDER BY created_at DESC").all(jobId);
    return rows.map((row: any) => this.rowToBooking(row));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO bookings (
        id, job_id, technician_id, client_name, client_phone, scheduled_date,
        scheduled_time, status, estimated_cost, final_cost, match_score,
        match_explanation, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      insertBooking.jobId,
      insertBooking.technicianId,
      insertBooking.clientName,
      insertBooking.clientPhone,
      insertBooking.scheduledDate,
      insertBooking.scheduledTime,
      insertBooking.status ?? "pending",
      insertBooking.estimatedCost ?? null,
      insertBooking.finalCost ?? null,
      insertBooking.matchScore ?? null,
      insertBooking.matchExplanation ?? null,
      now
    );

    return {
      id,
      jobId: insertBooking.jobId,
      technicianId: insertBooking.technicianId,
      clientName: insertBooking.clientName,
      clientPhone: insertBooking.clientPhone,
      scheduledDate: insertBooking.scheduledDate,
      scheduledTime: insertBooking.scheduledTime,
      status: insertBooking.status ?? "pending",
      estimatedCost: insertBooking.estimatedCost ?? null,
      finalCost: insertBooking.finalCost ?? null,
      matchScore: insertBooking.matchScore ?? null,
      matchExplanation: insertBooking.matchExplanation ?? null,
      createdAt: new Date(now),
    };
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const existing = await this.getBooking(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    
    this.db.prepare(`
      UPDATE bookings SET
        job_id = ?, technician_id = ?, client_name = ?, client_phone = ?,
        scheduled_date = ?, scheduled_time = ?, status = ?, estimated_cost = ?,
        final_cost = ?, match_score = ?, match_explanation = ?
      WHERE id = ?
    `).run(
      updated.jobId,
      updated.technicianId,
      updated.clientName,
      updated.clientPhone,
      updated.scheduledDate,
      updated.scheduledTime,
      updated.status,
      updated.estimatedCost,
      updated.finalCost,
      updated.matchScore,
      updated.matchExplanation,
      id
    );

    return updated;
  }

  // Payments
  async getPayment(id: string): Promise<Payment | undefined> {
    const row = this.db.prepare("SELECT * FROM payments WHERE id = ?").get(id);
    if (!row) return undefined;
    return this.rowToPayment(row);
  }

  async getPaymentByBooking(bookingId: string): Promise<Payment | undefined> {
    const row = this.db.prepare("SELECT * FROM payments WHERE booking_id = ?").get(bookingId);
    if (!row) return undefined;
    return this.rowToPayment(row);
  }

  async getAllPayments(): Promise<Payment[]> {
    const rows = this.db.prepare("SELECT * FROM payments ORDER BY created_at DESC").all();
    return rows.map((row: any) => this.rowToPayment(row));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO payments (
        id, booking_id, amount, currency, payment_method, status,
        payment_intent_id, transaction_id, bank_reference, payment_details,
        paid_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      insertPayment.bookingId,
      insertPayment.amount,
      insertPayment.currency ?? "MAD",
      insertPayment.paymentMethod,
      insertPayment.status ?? "pending",
      insertPayment.paymentIntentId ?? null,
      insertPayment.transactionId ?? null,
      insertPayment.bankReference ?? null,
      insertPayment.paymentDetails ? JSON.stringify(insertPayment.paymentDetails) : null,
      null,
      now,
      now
    );

    return {
      id,
      bookingId: insertPayment.bookingId,
      amount: insertPayment.amount,
      currency: insertPayment.currency ?? "MAD",
      paymentMethod: insertPayment.paymentMethod,
      status: insertPayment.status ?? "pending",
      paymentIntentId: insertPayment.paymentIntentId ?? null,
      transactionId: insertPayment.transactionId ?? null,
      bankReference: insertPayment.bankReference ?? null,
      paymentDetails: insertPayment.paymentDetails ?? null,
      paidAt: null,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const existing = await this.getPayment(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    
    this.db.prepare(`
      UPDATE payments SET
        status = ?, payment_intent_id = ?, transaction_id = ?,
        bank_reference = ?, payment_details = ?, paid_at = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updated.status,
      updated.paymentIntentId,
      updated.transactionId,
      updated.bankReference,
      updated.paymentDetails ? JSON.stringify(updated.paymentDetails) : null,
      updated.paidAt ? updated.paidAt.toISOString() : null,
      updated.updatedAt.toISOString(),
      id
    );

    return updated;
  }

  private rowToPayment(row: any): Payment {
    return {
      id: row.id,
      bookingId: row.booking_id,
      amount: row.amount,
      currency: row.currency,
      paymentMethod: row.payment_method,
      status: row.status,
      paymentIntentId: row.payment_intent_id,
      transactionId: row.transaction_id,
      bankReference: row.bank_reference,
      paymentDetails: this.parseJSON(row.payment_details),
      paidAt: row.paid_at ? new Date(row.paid_at) : null,
      createdAt: row.created_at ? new Date(row.created_at) : null,
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
    };
  }

  // Notifications
  async getNotification(id: string): Promise<Notification | undefined> {
    const row = this.db.prepare("SELECT * FROM notifications WHERE id = ?").get(id);
    if (!row) return undefined;
    return this.rowToNotification(row);
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const rows = this.db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    return rows.map((row: any) => this.rowToNotification(row));
  }

  async getUnreadNotificationsByUser(userId: string): Promise<Notification[]> {
    const rows = this.db.prepare("SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC").all(userId);
    return rows.map((row: any) => this.rowToNotification(row));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, message, booking_id, payment_id, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      insertNotification.userId,
      insertNotification.type,
      insertNotification.title,
      insertNotification.message,
      insertNotification.bookingId ?? null,
      insertNotification.paymentId ?? null,
      insertNotification.isRead ? 1 : 0,
      now
    );

    return {
      id,
      userId: insertNotification.userId,
      type: insertNotification.type,
      title: insertNotification.title,
      message: insertNotification.message,
      bookingId: insertNotification.bookingId ?? null,
      paymentId: insertNotification.paymentId ?? null,
      isRead: insertNotification.isRead ?? false,
      createdAt: new Date(now),
    };
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const existing = await this.getNotification(id);
    if (!existing) return undefined;

    this.db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
    
    return { ...existing, isRead: true };
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    this.db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(userId);
  }

  private rowToNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      bookingId: row.booking_id,
      paymentId: row.payment_id,
      isRead: Boolean(row.is_read),
      createdAt: row.created_at ? new Date(row.created_at) : null,
    };
  }

  // ==================== REVIEW METHODS ====================

  async getReview(id: string): Promise<Review | undefined> {
    const row = this.db.prepare("SELECT * FROM reviews WHERE id = ?").get(id);
    return row ? this.rowToReview(row) : undefined;
  }

  async getReviewsByTechnician(technicianId: string): Promise<Review[]> {
    const rows = this.db.prepare("SELECT * FROM reviews WHERE technician_id = ? ORDER BY created_at DESC").all(technicianId);
    return rows.map(row => this.rowToReview(row));
  }

  async getReviewsByClient(clientId: string): Promise<Review[]> {
    const rows = this.db.prepare("SELECT * FROM reviews WHERE client_id = ? ORDER BY created_at DESC").all(clientId);
    return rows.map(row => this.rowToReview(row));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO reviews
      (id, technician_id, client_id, booking_id, rating, comment, service_quality, punctuality, professionalism, value_for_money, is_verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      review.technicianId,
      review.clientId,
      review.bookingId || null,
      review.rating,
      review.comment,
      review.serviceQuality || null,
      review.punctuality || null,
      review.professionalism || null,
      review.valueForMoney || null,
      review.isVerified ? 1 : 0,
      createdAt
    );

    const created = this.db.prepare("SELECT * FROM reviews WHERE id = ?").get(id);
    if (!created) throw new Error("Failed to create review");

    // Update technician rating and review count
    await this.updateTechnicianStats(review.technicianId);

    return this.rowToReview(created);
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | undefined> {
    const existing = await this.getReview(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.comment !== undefined) {
      fields.push("comment = ?");
      values.push(updates.comment);
    }
    if (updates.rating !== undefined) {
      fields.push("rating = ?");
      values.push(updates.rating);
    }
    if (updates.serviceQuality !== undefined) {
      fields.push("service_quality = ?");
      values.push(updates.serviceQuality);
    }
    if (updates.punctuality !== undefined) {
      fields.push("punctuality = ?");
      values.push(updates.punctuality);
    }
    if (updates.professionalism !== undefined) {
      fields.push("professionalism = ?");
      values.push(updates.professionalism);
    }
    if (updates.valueForMoney !== undefined) {
      fields.push("value_for_money = ?");
      values.push(updates.valueForMoney);
    }
    if (updates.technicianResponse !== undefined) {
      fields.push("technician_response = ?");
      values.push(updates.technicianResponse);
    }
    if (updates.isVerified !== undefined) {
      fields.push("is_verified = ?");
      values.push(updates.isVerified ? 1 : 0);
    }

    if (fields.length === 0) return existing;

    values.push(id);
    const stmt = this.db.prepare(`UPDATE reviews SET ${fields.join(", ")} WHERE id = ?`);
    stmt.run(...values);

    // Update technician stats if rating changed
    if (updates.rating !== undefined || updates.serviceQuality !== undefined) {
      await this.updateTechnicianStats(existing.technicianId);
    }

    return this.getReview(id);
  }

  private async updateTechnicianStats(technicianId: string): Promise<void> {
    const reviews = await this.getReviewsByTechnician(technicianId);
    
    if (reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const reviewCount = reviews.length;

    this.db.prepare(`
      UPDATE technicians 
      SET rating = ?, review_count = ?
      WHERE id = ?
    `).run(avgRating, reviewCount, technicianId);
  }

  private rowToReview(row: any): Review {
    return {
      id: row.id,
      technicianId: row.technician_id,
      clientId: row.client_id,
      bookingId: row.booking_id,
      rating: row.rating,
      comment: row.comment,
      serviceQuality: row.service_quality,
      punctuality: row.punctuality,
      professionalism: row.professionalism,
      valueForMoney: row.value_for_money,
      isVerified: Boolean(row.is_verified),
      technicianResponse: row.technician_response,
      createdAt: row.created_at ? new Date(row.created_at) : null,
    };
  }
}

