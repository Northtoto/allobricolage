import { 
  type User, type InsertUser, 
  type Technician, type InsertTechnician,
  type TechnicianWithUser,
  type Job, type InsertJob,
  type Booking, type InsertBooking
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Technicians
  getTechnician(id: string): Promise<Technician | undefined>;
  getTechnicianByUserId(userId: string): Promise<Technician | undefined>;
  getTechnicianWithUser(id: string): Promise<TechnicianWithUser | undefined>;
  getAllTechnicians(): Promise<Technician[]>;
  getAllTechniciansWithUsers(): Promise<TechnicianWithUser[]>;
  getTechniciansByCity(city: string): Promise<TechnicianWithUser[]>;
  getTechniciansByService(service: string): Promise<TechnicianWithUser[]>;
  createTechnician(technician: InsertTechnician): Promise<Technician>;
  updateTechnician(id: string, updates: Partial<Technician>): Promise<Technician | undefined>;
  
  // Jobs
  getJob(id: string): Promise<Job | undefined>;
  getAllJobs(): Promise<Job[]>;
  getJobsByStatus(status: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;
  
  // Bookings
  getBooking(id: string): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
  getBookingsByTechnician(technicianId: string): Promise<Booking[]>;
  getBookingsByJob(jobId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private technicians: Map<string, Technician>;
  private jobs: Map<string, Job>;
  private bookings: Map<string, Booking>;

  constructor() {
    this.users = new Map();
    this.technicians = new Map();
    this.jobs = new Map();
    this.bookings = new Map();
    
    // Seed with sample technicians for Morocco
    this.seedTechnicians();
  }

  private seedTechnicians() {
    const sampleData = [
      {
        user: { username: "ahmed_benali", password: "", name: "Ahmed Benali", phone: "+212 661-123456", city: "Casablanca", role: "technician" },
        tech: { services: ["plomberie"], skills: ["Réparation fuites", "Installation sanitaire", "Débouchage"], rating: 4.9, reviewCount: 234, completedJobs: 512, responseTimeMinutes: 12, completionRate: 0.98, yearsExperience: 15, hourlyRate: 150, isVerified: true, isAvailable: true, latitude: 33.5731, longitude: -7.5898, bio: "Plombier expert avec 15 ans d'expérience.", languages: ["français", "arabe"] }
      },
      {
        user: { username: "mohamed_alami", password: "", name: "Mohamed Alami", phone: "+212 662-234567", city: "Casablanca", role: "technician" },
        tech: { services: ["plomberie", "climatisation"], skills: ["Chauffe-eau", "Climatisation", "Plomberie générale"], rating: 4.7, reviewCount: 156, completedJobs: 289, responseTimeMinutes: 18, completionRate: 0.95, yearsExperience: 8, hourlyRate: 120, isVerified: true, isAvailable: true, latitude: 33.5892, longitude: -7.6033, bio: "Technicien polyvalent.", languages: ["français", "arabe", "anglais"] }
      },
      {
        user: { username: "youssef_tazi", password: "", name: "Youssef Tazi", phone: "+212 663-345678", city: "Casablanca", role: "technician" },
        tech: { services: ["electricite"], skills: ["Installation électrique", "Dépannage", "Tableaux électriques"], rating: 4.8, reviewCount: 189, completedJobs: 423, responseTimeMinutes: 15, completionRate: 0.97, yearsExperience: 12, hourlyRate: 140, isVerified: true, isAvailable: true, latitude: 33.5650, longitude: -7.6200, bio: "Électricien certifié.", languages: ["français", "arabe"] }
      },
      {
        user: { username: "karim_fassi", password: "", name: "Karim Fassi", phone: "+212 664-456789", city: "Rabat", role: "technician" },
        tech: { services: ["peinture"], skills: ["Peinture intérieure", "Peinture extérieure", "Enduit"], rating: 4.6, reviewCount: 98, completedJobs: 167, responseTimeMinutes: 25, completionRate: 0.94, yearsExperience: 10, hourlyRate: 100, isVerified: true, isAvailable: true, latitude: 34.0209, longitude: -6.8416, bio: "Peintre professionnel.", languages: ["français", "arabe"] }
      },
      {
        user: { username: "hassan_chraibi", password: "", name: "Hassan Chraibi", phone: "+212 665-567890", city: "Casablanca", role: "technician" },
        tech: { services: ["menuiserie"], skills: ["Menuiserie bois", "Portes", "Fenêtres"], rating: 4.9, reviewCount: 145, completedJobs: 298, responseTimeMinutes: 20, completionRate: 0.96, yearsExperience: 20, hourlyRate: 130, isVerified: true, isAvailable: false, latitude: 33.5800, longitude: -7.5900, bio: "Maître menuisier.", languages: ["français", "arabe"] }
      },
      {
        user: { username: "omar_berrada", password: "", name: "Omar Berrada", phone: "+212 666-678901", city: "Marrakech", role: "technician" },
        tech: { services: ["plomberie"], skills: ["Plomberie traditionnelle", "Hammam", "Fontaines"], rating: 4.5, reviewCount: 87, completedJobs: 156, responseTimeMinutes: 30, completionRate: 0.92, yearsExperience: 7, hourlyRate: 110, isVerified: true, isAvailable: true, latitude: 31.6295, longitude: -7.9811, bio: "Spécialiste plomberie traditionnelle.", languages: ["français", "arabe", "anglais"] }
      },
      {
        user: { username: "rachid_elidrissi", password: "", name: "Rachid El Idrissi", phone: "+212 667-789012", city: "Casablanca", role: "technician" },
        tech: { services: ["climatisation"], skills: ["Installation climatisation", "Maintenance", "Réparation"], rating: 4.8, reviewCount: 112, completedJobs: 234, responseTimeMinutes: 22, completionRate: 0.97, yearsExperience: 9, hourlyRate: 160, isVerified: true, isAvailable: true, latitude: 33.5700, longitude: -7.6100, bio: "Technicien frigoriste certifié.", languages: ["français", "arabe"] }
      },
      {
        user: { username: "driss_mohammadi", password: "", name: "Driss Mohammadi", phone: "+212 668-890123", city: "Fès", role: "technician" },
        tech: { services: ["carrelage", "maconnerie"], skills: ["Zellige", "Carrelage moderne", "Mosaïque"], rating: 4.7, reviewCount: 76, completedJobs: 134, responseTimeMinutes: 35, completionRate: 0.93, yearsExperience: 18, hourlyRate: 120, isVerified: true, isAvailable: true, latitude: 34.0181, longitude: -5.0078, bio: "Maître artisan en zellige.", languages: ["français", "arabe"] }
      },
    ];

    sampleData.forEach(({ user, tech }) => {
      const userId = randomUUID();
      const techId = randomUUID();
      
      const userRecord: User = { ...user, id: userId };
      this.users.set(userId, userRecord);
      
      const techRecord: Technician = {
        id: techId,
        userId: userId,
        services: tech.services,
        skills: tech.skills,
        bio: tech.bio || null,
        photo: null,
        rating: tech.rating,
        reviewCount: tech.reviewCount,
        completedJobs: tech.completedJobs,
        responseTimeMinutes: tech.responseTimeMinutes,
        completionRate: tech.completionRate,
        yearsExperience: tech.yearsExperience,
        hourlyRate: tech.hourlyRate,
        isVerified: tech.isVerified,
        isAvailable: tech.isAvailable,
        latitude: tech.latitude || null,
        longitude: tech.longitude || null,
        languages: tech.languages,
      };
      this.technicians.set(techId, techRecord);
    });
  }

  private mergeTechnicianWithUser(tech: Technician, user: User): TechnicianWithUser {
    return {
      id: tech.id,
      userId: tech.userId,
      name: user.name,
      phone: user.phone,
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
      latitude: tech.latitude,
      longitude: tech.longitude,
      languages: tech.languages,
    };
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role ?? "client",
      name: insertUser.name,
      phone: insertUser.phone ?? null,
      city: insertUser.city ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  // Technicians
  async getTechnician(id: string): Promise<Technician | undefined> {
    return this.technicians.get(id);
  }

  async getTechnicianByUserId(userId: string): Promise<Technician | undefined> {
    return Array.from(this.technicians.values()).find(
      (tech) => tech.userId === userId
    );
  }

  async getTechnicianWithUser(id: string): Promise<TechnicianWithUser | undefined> {
    const tech = this.technicians.get(id);
    if (!tech) return undefined;
    const user = this.users.get(tech.userId);
    if (!user) return undefined;
    return this.mergeTechnicianWithUser(tech, user);
  }

  async getAllTechnicians(): Promise<Technician[]> {
    return Array.from(this.technicians.values());
  }

  async getAllTechniciansWithUsers(): Promise<TechnicianWithUser[]> {
    const result: TechnicianWithUser[] = [];
    const techs = Array.from(this.technicians.values());
    for (const tech of techs) {
      const user = this.users.get(tech.userId);
      if (user) {
        result.push(this.mergeTechnicianWithUser(tech, user));
      }
    }
    return result;
  }

  async getTechniciansByCity(city: string): Promise<TechnicianWithUser[]> {
    const result: TechnicianWithUser[] = [];
    const techs = Array.from(this.technicians.values());
    for (const tech of techs) {
      const user = this.users.get(tech.userId);
      if (user && user.city?.toLowerCase() === city.toLowerCase()) {
        result.push(this.mergeTechnicianWithUser(tech, user));
      }
    }
    return result;
  }

  async getTechniciansByService(service: string): Promise<TechnicianWithUser[]> {
    const result: TechnicianWithUser[] = [];
    const techs = Array.from(this.technicians.values());
    for (const tech of techs) {
      if (tech.services.includes(service.toLowerCase())) {
        const user = this.users.get(tech.userId);
        if (user) {
          result.push(this.mergeTechnicianWithUser(tech, user));
        }
      }
    }
    return result;
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
      latitude: insertTechnician.latitude ?? null,
      longitude: insertTechnician.longitude ?? null,
      languages: insertTechnician.languages ?? ["français", "arabe"],
    };
    this.technicians.set(id, technician);
    return technician;
  }

  async updateTechnician(id: string, updates: Partial<Technician>): Promise<Technician | undefined> {
    const existing = this.technicians.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.technicians.set(id, updated);
    return updated;
  }

  // Jobs
  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJobsByStatus(status: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === status
    );
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const job: Job = { 
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
      createdAt: new Date(),
      extractedKeywords: insertJob.extractedKeywords ?? null,
      aiAnalysis: insertJob.aiAnalysis ?? null,
    };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const existing = this.jobs.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.jobs.set(id, updated);
    return updated;
  }

  // Bookings
  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBookingsByTechnician(technicianId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.technicianId === technicianId
    );
  }

  async getBookingsByJob(jobId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.jobId === jobId
    );
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = { 
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
      createdAt: new Date(),
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const existing = this.bookings.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.bookings.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
