import { db } from "@/db/index.ts";
import { users, technicians, jobs, bookings, reviews } from "@/db/schema.ts";
import { userRepository } from "@/repositories/user.repository.ts";
import { technicianRepository } from "@/repositories/technician.repository.ts";
import { logger } from "@/utils/logger.ts";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const MOROCCAN_CITIES = [
  "Casablanca", "Rabat", "Marrakech", "Fes", "Tanger",
  "Agadir", "Meknes", "Oujda", "Kenitra", "Tetouan",
];

const SERVICES = [
  "plomberie", "electricite", "peinture", "menuiserie",
  "climatisation", "carrelage", "metallerie", "etancheite",
];

const FIRST_NAMES = [
  "Ahmed", "Karim", "Youssef", "Ali", "Omar", "Hassan", "Mohamed",
  "Said", "Abdel", "Lahcen", "Fatima", "Aicha", "Samira", "Nadia", "Laila",
];
const LAST_NAMES = [
  "El Amrani", "Benali", "Alaoui", "Fassi", "Bennani", "Idrissi",
  "Tazi", "Moussaoui", "Berrada", "Chraibi",
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomName(): string {
  const fn = FIRST_NAMES[randInt(0, FIRST_NAMES.length - 1)];
  const ln = LAST_NAMES[randInt(0, LAST_NAMES.length - 1)];
  return `${fn} ${ln}`;
}

function randomPhone(): string {
  return `+2126${randInt(1000000, 9999999).toString().padStart(7, "0")}`;
}

async function seedDatabase(): Promise<void> {
  logger.info("Starting database seeding...");

  try {
    await seedUsers();
    await seedTechnicians();
    await seedJobs();
    await seedBookings();
    await seedReviews();
    logger.info("Database seeding completed successfully");
  } catch (error) {
    logger.error("Seeding failed:", { error });
    throw error;
  }
}

async function seedUsers(): Promise<void> {
  logger.info("Seeding users...");
  const demoPassword = await bcrypt.hash("demo123", 12);

  const demoUsers = [
    {
      id: uuidv4(),
      username: "client",
      password: demoPassword,
      name: "Ahmed Client",
      email: "client@allobricolage.ma",
      phone: "+212661234567",
      city: "Casablanca",
      role: "client" as const,
    },
    {
      id: uuidv4(),
      username: "tech1",
      password: demoPassword,
      name: "Karim Plombier",
      email: "tech1@allobricolage.ma",
      phone: "+212662345678",
      city: "Casablanca",
      role: "technician" as const,
    },
    {
      id: uuidv4(),
      username: "tech2",
      password: demoPassword,
      name: "Youssef Electricien",
      email: "tech2@allobricolage.ma",
      phone: "+212663456789",
      city: "Rabat",
      role: "technician" as const,
    },
  ];

  for (const user of demoUsers) {
    const exists = await userRepository.findByUsername(user.username);
    if (!exists) {
      await userRepository.create(user);
    }
  }

  for (let i = 0; i < 20; i++) {
    const city = MOROCCAN_CITIES[randInt(0, MOROCCAN_CITIES.length - 1)];
    const role = Math.random() > 0.3 ? "client" as const : "technician" as const;
    const name = randomName();
    const username = `user_${i}_${Date.now().toString(36)}`;

    const exists = await userRepository.findByUsername(username);
    if (!exists) {
      await userRepository.create({
        username,
        password: await bcrypt.hash("password123", 12),
        name,
        email: `${username}@example.com`,
        phone: randomPhone(),
        city,
        role,
      });
    }
  }
}

async function seedTechnicians(): Promise<void> {
  logger.info("Seeding technicians...");
  const techUsers = (await userRepository.findAll()).filter((u) => u.role === "technician");

  for (const user of techUsers) {
    const existing = await technicianRepository.findByUserId(user.id);
    if (existing) continue;

    const service = SERVICES[randInt(0, SERVICES.length - 1)];
    await technicianRepository.create({
      userId: user.id,
      services: [service, SERVICES[randInt(0, SERVICES.length - 1)]],
      skills: ["Reparation", "Installation", "Maintenance"],
      bio: `Technicien specialise en ${service} avec ${randInt(1, 10)} ans d experience`,
      rating: Math.round((3 + Math.random() * 2) * 10) / 10,
      reviewCount: randInt(0, 50),
      completedJobs: randInt(0, 200),
      responseTimeMinutes: randInt(15, 75),
      completionRate: 0.85 + Math.random() * 0.14,
      yearsExperience: randInt(1, 15),
      hourlyRate: randInt(100, 500),
      isVerified: Math.random() > 0.3,
      isAvailable: Math.random() > 0.2,
      isPro: Math.random() > 0.7,
      isPromo: Math.random() > 0.8,
      availability: "Sur RDV",
      certifications: ["Professionnel Certifie"],
      latitude: 33.5 + Math.random() * 1.5,
      longitude: -7.5 + Math.random() * 1.5,
      languages: ["francais", "arabe"],
    });
  }
}

async function seedJobs(): Promise<void> {
  logger.info("Seeding jobs...");
  const clientUsers = (await userRepository.findAll()).filter((u) => u.role === "client");
  if (clientUsers.length === 0) return;

  for (let i = 0; i < 30; i++) {
    const client = clientUsers[randInt(0, clientUsers.length - 1)];
    const service = SERVICES[randInt(0, SERVICES.length - 1)];

    await db.insert(jobs).values({
      id: uuidv4(),
      clientId: client.id,
      description: `Besoin de ${service} - Intervention ${Math.random() > 0.5 ? "urgente" : "standard"}`,
      service,
      city: client.city ?? "Casablanca",
      urgency: (["low", "normal", "high", "emergency"] as const)[randInt(0, 3)],
      complexity: (["simple", "moderate", "complex"] as const)[randInt(0, 2)],
      status: (["pending", "completed", "cancelled"] as const)[randInt(0, 2)],
    });
  }
}

async function seedBookings(): Promise<void> {
  logger.info("Seeding bookings...");
  const allJobs = await db.select().from(jobs);
  const allTechs = await technicianRepository.findAll();

  if (allJobs.length === 0 || allTechs.length === 0) return;

  for (let i = 0; i < 20; i++) {
    const job = allJobs[randInt(0, allJobs.length - 1)];
    const tech = allTechs[randInt(0, allTechs.length - 1)];

    await db.insert(bookings).values({
      id: uuidv4(),
      jobId: job.id,
      technicianId: tech.id,
      clientId: job.clientId,
      clientName: randomName(),
      clientPhone: randomPhone(),
      scheduledDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      scheduledTime: `${randInt(8, 17)}:00`,
      status: (["pending", "accepted", "completed", "cancelled"] as const)[randInt(0, 3)],
      estimatedCost: randInt(200, 1200),
      matchScore: Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
      matchExplanation: "Correspondance basee sur la specialisation",
    });
  }
}

async function seedReviews(): Promise<void> {
  logger.info("Seeding reviews...");
  const allTechs = await technicianRepository.findAll();
  const clientUsers = (await userRepository.findAll()).filter((u) => u.role === "client");

  if (allTechs.length === 0 || clientUsers.length === 0) return;

  const comments = ["Excellent service", "Tres professionnel", "Bon travail", "Recommande", "Satisfait"];

  for (let i = 0; i < 40; i++) {
    const tech = allTechs[randInt(0, allTechs.length - 1)];
    const client = clientUsers[randInt(0, clientUsers.length - 1)];

    await db.insert(reviews).values({
      id: uuidv4(),
      technicianId: tech.id,
      clientId: client.id,
      rating: randInt(3, 5),
      comment: comments[randInt(0, comments.length - 1)],
      serviceQuality: randInt(3, 5),
      punctuality: randInt(3, 5),
      professionalism: randInt(3, 5),
      valueForMoney: randInt(3, 5),
    });
  }
}

seedDatabase().catch((error) => {
  logger.error("Seed script failed:", { error });
  process.exit(1);
});
