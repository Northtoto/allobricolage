import type { User, Technician, Review, Job, Booking, Payment, Notification } from "@shared/schema";
import { STORAGE_KEYS } from "../lib/localStorage";

// Demo password (Base64 encoded "demo123")
const DEMO_PASSWORD = "ZGVtbzEyMw==";

// Seed data for technicians and users
export const SEED_USERS: User[] = [
  {
    id: "user-1",
    username: "youssef_elfassi",
    password: DEMO_PASSWORD,
    name: "Youssef El Fassi",
    phone: "+212 600 000 000",
    city: "Casablanca",
    role: "technician",
    email: null,
    googleId: null,
    profilePicture: null,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "user-2",
    username: "karim_bennani",
    password: DEMO_PASSWORD,
    name: "Karim Bennani",
    phone: "+212 611 222 333",
    city: "Marrakech",
    role: "technician",
    email: null,
    googleId: null,
    profilePicture: null,
    createdAt: new Date("2024-01-02"),
  },
  {
    id: "user-3",
    username: "fatima_alaoui",
    password: DEMO_PASSWORD,
    name: "Fatima Zahra Alaoui",
    phone: "+212 622 334 455",
    city: "Rabat",
    role: "technician",
    email: null,
    googleId: null,
    profilePicture: null,
    createdAt: new Date("2024-01-03"),
  },
  {
    id: "user-4",
    username: "ahmed_benali",
    password: DEMO_PASSWORD,
    name: "Ahmed Benali",
    phone: "+212 661 123 456",
    city: "Casablanca",
    role: "technician",
    email: null,
    googleId: null,
    profilePicture: null,
    createdAt: new Date("2024-01-04"),
  },
  {
    id: "user-5",
    username: "mohamed_alami",
    password: DEMO_PASSWORD,
    name: "Mohamed Alami",
    phone: "+212 662 234 567",
    city: "Casablanca",
    role: "technician",
    email: null,
    googleId: null,
    profilePicture: null,
    createdAt: new Date("2024-01-05"),
  },
  {
    id: "user-6",
    username: "hassan_chraibi",
    password: DEMO_PASSWORD,
    name: "Hassan Chraibi",
    phone: "+212 665 567 890",
    city: "Casablanca",
    role: "technician",
    email: null,
    googleId: null,
    profilePicture: null,
    createdAt: new Date("2024-01-06"),
  },
  {
    id: "user-7",
    username: "omar_berrada",
    password: DEMO_PASSWORD,
    name: "Omar Berrada",
    phone: "+212 666 678 901",
    city: "Marrakech",
    role: "technician",
    email: null,
    googleId: null,
    profilePicture: null,
    createdAt: new Date("2024-01-07"),
  },
  {
    id: "user-8",
    username: "rachid_elidrissi",
    password: DEMO_PASSWORD,
    name: "Rachid El Idrissi",
    phone: "+212 667 789 012",
    city: "Casablanca",
    role: "technician",
    email: null,
    googleId: null,
    profilePicture: null,
    createdAt: new Date("2024-01-08"),
  },
  {
    id: "user-9",
    username: "said_ouazzani",
    password: DEMO_PASSWORD,
    name: "Said Ouazzani",
    phone: "+212 668 890 123",
    city: "Rabat",
    role: "technician",
    email: null,
    googleId: null,
    profilePicture: null,
    createdAt: new Date("2024-01-09"),
  },
  {
    id: "user-10",
    username: "nadia_senhaji",
    password: DEMO_PASSWORD,
    name: "Nadia Senhaji",
    phone: "+212 669 901 234",
    city: "Casablanca",
    role: "technician",
    email: null,
    googleId: null,
    profilePicture: null,
    createdAt: new Date("2024-01-10"),
  },
  // Demo client accounts
  {
    id: "client-demo-1",
    username: "demo_client",
    password: DEMO_PASSWORD,
    name: "Client Demo",
    phone: "+212 600 111 222",
    city: "Casablanca",
    role: "client",
    email: "client@demo.com",
    googleId: null,
    profilePicture: null,
    createdAt: new Date("2024-01-01"),
  },
];

export const SEED_TECHNICIANS: Technician[] = [
  {
    id: "tech-1",
    userId: "user-1",
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
  },
  {
    id: "tech-2",
    userId: "user-2",
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
  },
  {
    id: "tech-3",
    userId: "user-3",
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
  },
  {
    id: "tech-4",
    userId: "user-4",
    services: ["plomberie"],
    skills: ["Réparation fuites", "Installation sanitaire", "Débouchage"],
    rating: 4.9,
    reviewCount: 234,
    completedJobs: 512,
    responseTimeMinutes: 12,
    completionRate: 0.98,
    yearsExperience: 15,
    hourlyRate: 150,
    isVerified: true,
    isAvailable: true,
    isPro: true,
    isPromo: false,
    availability: "Immédiat",
    certifications: [],
    latitude: 33.5731,
    longitude: -7.5898,
    bio: "Plombier expert avec 15 ans d'expérience.",
    languages: ["français", "arabe"],
    photo: null,
  },
  {
    id: "tech-5",
    userId: "user-5",
    services: ["plomberie", "climatisation"],
    skills: ["Chauffe-eau", "Climatisation", "Plomberie générale"],
    rating: 4.7,
    reviewCount: 156,
    completedJobs: 289,
    responseTimeMinutes: 18,
    completionRate: 0.95,
    yearsExperience: 8,
    hourlyRate: 120,
    isVerified: true,
    isAvailable: true,
    isPro: false,
    isPromo: true,
    availability: "Immédiat",
    certifications: [],
    latitude: 33.5892,
    longitude: -7.6033,
    bio: "Technicien polyvalent.",
    languages: ["français", "arabe", "anglais"],
    photo: null,
  },
  {
    id: "tech-6",
    userId: "user-6",
    services: ["menuiserie"],
    skills: ["Menuiserie bois", "Portes", "Fenêtres"],
    rating: 4.9,
    reviewCount: 145,
    completedJobs: 298,
    responseTimeMinutes: 20,
    completionRate: 0.96,
    yearsExperience: 20,
    hourlyRate: 130,
    isVerified: true,
    isAvailable: false,
    isPro: true,
    isPromo: false,
    availability: "Sur RDV",
    certifications: ["Maître Artisan"],
    latitude: 33.5800,
    longitude: -7.5900,
    bio: "Maître menuisier.",
    languages: ["français", "arabe"],
    photo: null,
  },
  {
    id: "tech-7",
    userId: "user-7",
    services: ["plomberie"],
    skills: ["Plomberie traditionnelle", "Hammam", "Fontaines"],
    rating: 4.5,
    reviewCount: 87,
    completedJobs: 156,
    responseTimeMinutes: 30,
    completionRate: 0.92,
    yearsExperience: 7,
    hourlyRate: 110,
    isVerified: true,
    isAvailable: true,
    isPro: false,
    isPromo: false,
    availability: "Sur RDV",
    certifications: [],
    latitude: 31.6295,
    longitude: -7.9811,
    bio: "Spécialiste plomberie traditionnelle.",
    languages: ["français", "arabe", "anglais"],
    photo: null,
  },
  {
    id: "tech-8",
    userId: "user-8",
    services: ["climatisation"],
    skills: ["Installation climatisation", "Maintenance", "Réparation"],
    rating: 4.8,
    reviewCount: 112,
    completedJobs: 234,
    responseTimeMinutes: 22,
    completionRate: 0.97,
    yearsExperience: 9,
    hourlyRate: 160,
    isVerified: true,
    isAvailable: true,
    isPro: true,
    isPromo: true,
    availability: "Immédiat",
    certifications: ["Frigoriste Certifié"],
    latitude: 33.5700,
    longitude: -7.6100,
    bio: "Technicien frigoriste certifié.",
    languages: ["français", "arabe"],
    photo: null,
  },
  {
    id: "tech-9",
    userId: "user-9",
    services: ["carrelage"],
    skills: ["Carrelage sol", "Carrelage mural", "Mosaïque"],
    rating: 4.6,
    reviewCount: 89,
    completedJobs: 178,
    responseTimeMinutes: 25,
    completionRate: 0.94,
    yearsExperience: 11,
    hourlyRate: 140,
    isVerified: true,
    isAvailable: true,
    isPro: false,
    isPromo: false,
    availability: "Sur RDV",
    certifications: [],
    latitude: 34.0209,
    longitude: -6.8416,
    bio: "Expert en carrelage et mosaïque.",
    languages: ["français", "arabe"],
    photo: null,
  },
  {
    id: "tech-10",
    userId: "user-10",
    services: ["services_generaux"],
    skills: ["Nettoyage profond", "Vitres", "Désinfection"],
    rating: 4.8,
    reviewCount: 201,
    completedJobs: 567,
    responseTimeMinutes: 10,
    completionRate: 0.99,
    yearsExperience: 6,
    hourlyRate: 80,
    isVerified: true,
    isAvailable: true,
    isPro: true,
    isPromo: true,
    availability: "Immédiat",
    certifications: ["Hygiène Pro"],
    latitude: 33.5731,
    longitude: -7.5898,
    bio: "Service de nettoyage professionnel.",
    languages: ["français", "arabe"],
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?fit=crop&w=400&h=400",
  },
];

export const SEED_REVIEWS: Review[] = [
  {
    id: "review-1",
    technicianId: "tech-1",
    clientId: "client-demo-1",
    bookingId: null,
    rating: 5,
    comment: "Excellent travail ! Très professionnel et rapide. Je recommande vivement.",
    serviceQuality: 5,
    punctuality: 5,
    professionalism: 5,
    valueForMoney: 4,
    isVerified: true,
    technicianResponse: "Merci beaucoup pour votre confiance !",
    createdAt: new Date("2024-11-15"),
  },
  {
    id: "review-2",
    technicianId: "tech-2",
    clientId: "client-demo-1",
    bookingId: null,
    rating: 5,
    comment: "Installation électrique impeccable. Très satisfait du résultat.",
    serviceQuality: 5,
    punctuality: 4,
    professionalism: 5,
    valueForMoney: 5,
    isVerified: true,
    technicianResponse: null,
    createdAt: new Date("2024-11-20"),
  },
  {
    id: "review-3",
    technicianId: "tech-3",
    clientId: "client-demo-1",
    bookingId: null,
    rating: 5,
    comment: "Travail de peinture magnifique ! Très soigneux et créatif.",
    serviceQuality: 5,
    punctuality: 5,
    professionalism: 5,
    valueForMoney: 5,
    isVerified: true,
    technicianResponse: "Ravie d'avoir pu embellir votre espace !",
    createdAt: new Date("2024-11-25"),
  },
];

// Seed Jobs - Some completed, some pending for demo_client
export const SEED_JOBS: Job[] = [
  {
    id: "job-1",
    clientId: "client-demo-1",
    description: "Réparation fuite d'eau sous l'évier de la cuisine. L'eau coule en permanence.",
    service: "plomberie",
    city: "Casablanca",
    urgency: "high",
    complexity: "moderate",
    status: "completed",
    estimatedCost: 250,
    aiAnalysis: {
      service: "plomberie",
      subServices: ["Réparation fuites", "Installation sanitaire"],
      urgency: "high",
      complexity: "moderate",
      estimatedDuration: "2-3 heures",
      extractedKeywords: ["fuite", "eau", "évier", "cuisine"],
      confidence: 0.92,
      language: "fr",
    },
    createdAt: new Date("2024-11-20"),
  },
  {
    id: "job-2",
    clientId: "client-demo-1",
    description: "Installation d'un nouveau climatiseur dans le salon",
    service: "climatisation",
    city: "Casablanca",
    urgency: "normal",
    complexity: "complex",
    status: "in_progress",
    estimatedCost: 450,
    aiAnalysis: {
      service: "climatisation",
      subServices: ["Installation climatisation"],
      urgency: "normal",
      complexity: "complex",
      estimatedDuration: "1 jour",
      extractedKeywords: ["climatiseur", "installation", "salon"],
      confidence: 0.95,
      language: "fr",
    },
    createdAt: new Date("2024-11-28"),
  },
  {
    id: "job-3",
    clientId: "client-demo-1",
    description: "Peinture de deux chambres - couleur beige clair",
    service: "peinture",
    city: "Casablanca",
    urgency: "low",
    complexity: "simple",
    status: "pending",
    estimatedCost: 180,
    aiAnalysis: {
      service: "peinture",
      subServices: ["Peinture intérieure"],
      urgency: "low",
      complexity: "simple",
      estimatedDuration: "1-2 jours",
      extractedKeywords: ["peinture", "chambres", "beige"],
      confidence: 0.88,
      language: "fr",
    },
    createdAt: new Date("2024-11-29"),
  },
];

// Seed Bookings - Match the jobs
export const SEED_BOOKINGS: Booking[] = [
  {
    id: "booking-1",
    jobId: "job-1",
    clientId: "client-demo-1",
    technicianId: "tech-1",
    status: "completed",
    scheduledDate: new Date("2024-11-21"),
    completedDate: new Date("2024-11-21"),
    totalCost: 250,
    notes: "Intervention rapide et efficace",
    createdAt: new Date("2024-11-20"),
  },
  {
    id: "booking-2",
    jobId: "job-2",
    clientId: "client-demo-1",
    technicianId: "tech-8",
    status: "in_progress",
    scheduledDate: new Date("2024-11-30"),
    completedDate: null,
    totalCost: 450,
    notes: "Installation prévue pour demain",
    createdAt: new Date("2024-11-28"),
  },
  {
    id: "booking-3",
    jobId: "job-3",
    clientId: "client-demo-1",
    technicianId: "tech-3",
    status: "confirmed",
    scheduledDate: new Date("2024-12-05"),
    completedDate: null,
    totalCost: 180,
    notes: "Peinture de deux chambres",
    createdAt: new Date("2024-11-29"),
  },
];

// Seed Payments
export const SEED_PAYMENTS: Payment[] = [
  {
    id: "payment-1",
    bookingId: "booking-1",
    amount: 250,
    status: "completed",
    paymentMethod: "cash",
    transactionId: null,
    stripePaymentIntentId: null,
    createdAt: new Date("2024-11-21"),
  },
  {
    id: "payment-2",
    bookingId: "booking-2",
    amount: 450,
    status: "pending",
    paymentMethod: "bank_transfer",
    transactionId: null,
    stripePaymentIntentId: null,
    createdAt: new Date("2024-11-28"),
  },
];

// Seed Notifications for demo_client
export const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    userId: "client-demo-1",
    type: "booking_confirmed",
    title: "Réservation confirmée",
    message: "Youssef El Fassi a confirmé votre réservation pour le 21 novembre",
    bookingId: "booking-1",
    paymentId: null,
    isRead: true,
    createdAt: new Date("2024-11-20"),
  },
  {
    id: "notif-2",
    userId: "client-demo-1",
    type: "booking_completed",
    title: "Intervention terminée",
    message: "Votre réparation de plomberie a été complétée avec succès",
    bookingId: "booking-1",
    paymentId: null,
    isRead: true,
    createdAt: new Date("2024-11-21"),
  },
  {
    id: "notif-3",
    userId: "client-demo-1",
    type: "payment_received",
    title: "Paiement reçu",
    message: "Votre paiement de 250 MAD a été reçu",
    bookingId: "booking-1",
    paymentId: "payment-1",
    isRead: true,
    createdAt: new Date("2024-11-21"),
  },
  {
    id: "notif-4",
    userId: "client-demo-1",
    type: "booking_confirmed",
    title: "Nouvelle réservation",
    message: "Omar Berrada a accepté votre demande d'installation de climatisation",
    bookingId: "booking-2",
    paymentId: null,
    isRead: false,
    createdAt: new Date("2024-11-28"),
  },
  {
    id: "notif-5",
    userId: "client-demo-1",
    type: "booking_confirmed",
    title: "Réservation confirmée",
    message: "Fatima Zahra Alaoui a confirmé votre réservation de peinture",
    bookingId: "booking-3",
    paymentId: null,
    isRead: false,
    createdAt: new Date("2024-11-29"),
  },
  // Notifications for technicians
  {
    id: "notif-6",
    userId: "user-1",
    type: "new_booking",
    title: "Nouvelle demande",
    message: "Vous avez une nouvelle demande de réservation",
    bookingId: "booking-1",
    paymentId: null,
    isRead: true,
    createdAt: new Date("2024-11-20"),
  },
  {
    id: "notif-7",
    userId: "user-8",
    type: "new_booking",
    title: "Nouvelle demande",
    message: "Vous avez une nouvelle demande d'installation de climatisation",
    bookingId: "booking-2",
    paymentId: null,
    isRead: false,
    createdAt: new Date("2024-11-28"),
  },
];

// Initialize seed data on first load
export function initializeSeedData(): void {
  const version = localStorage.getItem(STORAGE_KEYS.SEED_VERSION);
  
  // Force reseed if version is outdated
  if (!version || version !== "v2") {
    console.log("🌱 Initializing seed data...");
    console.log("   Current version:", version || "none");
    console.log("   Target version: v2");
    
    // Seed users
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    
    // Seed technicians
    localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(SEED_TECHNICIANS));
    
    // Seed reviews
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(SEED_REVIEWS));
    
    // Seed jobs
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(SEED_JOBS));
    
    // Seed bookings
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(SEED_BOOKINGS));
    
    // Seed payments
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(SEED_PAYMENTS));
    
    // Seed notifications
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
    
    // Initialize empty arrays for other entities
    localStorage.setItem(STORAGE_KEYS.TRACKING, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.JOB_ADDRESSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.VIRTUAL_CARDS, JSON.stringify([]));
    
    // Mark as seeded
    localStorage.setItem(STORAGE_KEYS.SEED_VERSION, "v2");
    
    console.log("✅ Seed data initialized successfully");
    console.log(`   - ${SEED_USERS.length} users`);
    console.log(`   - ${SEED_TECHNICIANS.length} technicians`);
    console.log(`   - ${SEED_REVIEWS.length} reviews`);
    console.log(`   - ${SEED_JOBS.length} jobs`);
    console.log(`   - ${SEED_BOOKINGS.length} bookings`);
    console.log(`   - ${SEED_PAYMENTS.length} payments`);
    console.log(`   - ${SEED_NOTIFICATIONS.length} notifications`);
  }
}

// Reset all data and reseed
export function resetSeedData(): void {
  console.log("🔄 Resetting seed data...");
  
  // Clear version flag
  localStorage.removeItem(STORAGE_KEYS.SEED_VERSION);
  
  // Reinitialize
  initializeSeedData();
  
  console.log("✅ Data reset complete");
}

// Debug function to check current data
export function checkSeedData(): void {
  console.log("📊 Current Seed Data Status:");
  console.log("   Version:", localStorage.getItem(STORAGE_KEYS.SEED_VERSION));
  
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
  const technicians = JSON.parse(localStorage.getItem(STORAGE_KEYS.TECHNICIANS) || "[]");
  const jobs = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || "[]");
  const bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || "[]");
  const reviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS) || "[]");
  const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || "[]");
  
  console.log(`   - ${users.length} users`);
  console.log(`   - ${technicians.length} technicians`);
  console.log(`   - ${jobs.length} jobs`);
  console.log(`   - ${bookings.length} bookings`);
  console.log(`   - ${reviews.length} reviews`);
  console.log(`   - ${notifications.length} notifications`);
  
  console.log("\n🔍 Sample technician names:");
  technicians.slice(0, 5).forEach((tech: any) => {
    console.log(`   - ${tech.name} (${tech.services.join(", ")})`);
  });
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).resetSeedData = resetSeedData;
  (window as any).checkSeedData = checkSeedData;
}

