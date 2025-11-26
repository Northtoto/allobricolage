import { 
  type User, type InsertUser, 
  type Technician, type InsertTechnician,
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
  getAllTechnicians(): Promise<Technician[]>;
  getTechniciansByCity(city: string): Promise<Technician[]>;
  getTechniciansByService(service: string): Promise<Technician[]>;
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
    const sampleTechnicians: InsertTechnician[] = [
      {
        name: "Ahmed Benali",
        phone: "+212 661-123456",
        city: "Casablanca",
        services: ["plomberie"],
        skills: ["Réparation fuites", "Installation sanitaire", "Débouchage", "Tuyauterie cuivre"],
        rating: 4.9,
        reviewCount: 234,
        completedJobs: 512,
        responseTimeMinutes: 12,
        completionRate: 0.98,
        yearsExperience: 15,
        hourlyRate: 150,
        isVerified: true,
        isAvailable: true,
        latitude: 33.5731,
        longitude: -7.5898,
        bio: "Plombier expert avec 15 ans d'expérience. Spécialisé dans les réparations d'urgence.",
        languages: ["français", "arabe"],
      },
      {
        name: "Mohamed Alami",
        phone: "+212 662-234567",
        city: "Casablanca",
        services: ["plomberie", "climatisation"],
        skills: ["Chauffe-eau", "Climatisation", "Plomberie générale", "Installation"],
        rating: 4.7,
        reviewCount: 156,
        completedJobs: 289,
        responseTimeMinutes: 18,
        completionRate: 0.95,
        yearsExperience: 8,
        hourlyRate: 120,
        isVerified: true,
        isAvailable: true,
        latitude: 33.5892,
        longitude: -7.6033,
        bio: "Technicien polyvalent, spécialisé en plomberie et climatisation.",
        languages: ["français", "arabe", "anglais"],
      },
      {
        name: "Youssef Tazi",
        phone: "+212 663-345678",
        city: "Casablanca",
        services: ["electricite"],
        skills: ["Installation électrique", "Dépannage", "Tableaux électriques", "Domotique"],
        rating: 4.8,
        reviewCount: 189,
        completedJobs: 423,
        responseTimeMinutes: 15,
        completionRate: 0.97,
        yearsExperience: 12,
        hourlyRate: 140,
        isVerified: true,
        isAvailable: true,
        latitude: 33.5650,
        longitude: -7.6200,
        bio: "Électricien certifié. Expert en installations résidentielles et commerciales.",
        languages: ["français", "arabe"],
      },
      {
        name: "Karim Fassi",
        phone: "+212 664-456789",
        city: "Rabat",
        services: ["peinture"],
        skills: ["Peinture intérieure", "Peinture extérieure", "Enduit", "Décoration"],
        rating: 4.6,
        reviewCount: 98,
        completedJobs: 167,
        responseTimeMinutes: 25,
        completionRate: 0.94,
        yearsExperience: 10,
        hourlyRate: 100,
        isVerified: true,
        isAvailable: true,
        latitude: 34.0209,
        longitude: -6.8416,
        bio: "Peintre professionnel avec une attention particulière aux finitions.",
        languages: ["français", "arabe"],
      },
      {
        name: "Hassan Chraibi",
        phone: "+212 665-567890",
        city: "Casablanca",
        services: ["menuiserie"],
        skills: ["Menuiserie bois", "Portes", "Fenêtres", "Meubles sur mesure"],
        rating: 4.9,
        reviewCount: 145,
        completedJobs: 298,
        responseTimeMinutes: 20,
        completionRate: 0.96,
        yearsExperience: 20,
        hourlyRate: 130,
        isVerified: true,
        isAvailable: false,
        latitude: 33.5800,
        longitude: -7.5900,
        bio: "Maître menuisier. Créations sur mesure et restauration de meubles anciens.",
        languages: ["français", "arabe"],
      },
      {
        name: "Omar Berrada",
        phone: "+212 666-678901",
        city: "Marrakech",
        services: ["plomberie"],
        skills: ["Plomberie traditionnelle", "Hammam", "Fontaines", "Installation moderne"],
        rating: 4.5,
        reviewCount: 87,
        completedJobs: 156,
        responseTimeMinutes: 30,
        completionRate: 0.92,
        yearsExperience: 7,
        hourlyRate: 110,
        isVerified: true,
        isAvailable: true,
        latitude: 31.6295,
        longitude: -7.9811,
        bio: "Spécialiste de la plomberie traditionnelle marocaine et moderne.",
        languages: ["français", "arabe", "anglais"],
      },
      {
        name: "Rachid El Idrissi",
        phone: "+212 667-789012",
        city: "Casablanca",
        services: ["climatisation"],
        skills: ["Installation climatisation", "Maintenance", "Réparation", "Pompe à chaleur"],
        rating: 4.8,
        reviewCount: 112,
        completedJobs: 234,
        responseTimeMinutes: 22,
        completionRate: 0.97,
        yearsExperience: 9,
        hourlyRate: 160,
        isVerified: true,
        isAvailable: true,
        latitude: 33.5700,
        longitude: -7.6100,
        bio: "Technicien frigoriste certifié. Expert en systèmes de climatisation.",
        languages: ["français", "arabe"],
      },
      {
        name: "Driss Mohammadi",
        phone: "+212 668-890123",
        city: "Fès",
        services: ["carrelage", "maconnerie"],
        skills: ["Zellige", "Carrelage moderne", "Mosaïque", "Maçonnerie"],
        rating: 4.7,
        reviewCount: 76,
        completedJobs: 134,
        responseTimeMinutes: 35,
        completionRate: 0.93,
        yearsExperience: 18,
        hourlyRate: 120,
        isVerified: true,
        isAvailable: true,
        latitude: 34.0181,
        longitude: -5.0078,
        bio: "Maître artisan en zellige traditionnel et carrelage moderne.",
        languages: ["français", "arabe"],
      },
    ];

    sampleTechnicians.forEach((tech) => {
      const id = randomUUID();
      this.technicians.set(id, { ...tech, id });
    });
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Technicians
  async getTechnician(id: string): Promise<Technician | undefined> {
    return this.technicians.get(id);
  }

  async getAllTechnicians(): Promise<Technician[]> {
    return Array.from(this.technicians.values());
  }

  async getTechniciansByCity(city: string): Promise<Technician[]> {
    return Array.from(this.technicians.values()).filter(
      (tech) => tech.city.toLowerCase() === city.toLowerCase()
    );
  }

  async getTechniciansByService(service: string): Promise<Technician[]> {
    return Array.from(this.technicians.values()).filter(
      (tech) => tech.services.includes(service.toLowerCase())
    );
  }

  async createTechnician(insertTechnician: InsertTechnician): Promise<Technician> {
    const id = randomUUID();
    const technician: Technician = { ...insertTechnician, id };
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
      ...insertJob, 
      id, 
      createdAt: new Date(),
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
      ...insertBooking, 
      id,
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
