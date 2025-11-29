import bcrypt from "bcrypt";
import { storage } from "./storage";
import { randomUUID } from "crypto";

async function seedDemoFlow() {
  console.log("🌱 Seeding Demo Flow Data...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Demo Technician
  let techUser = await storage.getUserByUsername("demo_tech");
  if (!techUser) {
    console.log("Creating demo technician...");
    techUser = await storage.createUser({
      username: "demo_tech",
      password: passwordHash,
      role: "technician",
      name: "Ahmed Le Bricoleur",
      phone: "+212600000001",
      city: "Casablanca"
    });

    await storage.createTechnician({
      userId: techUser.id,
      services: ["plomberie", "climatisation"],
      skills: ["Réparation", "Installation"],
      yearsExperience: 5,
      hourlyRate: 200,
      bio: "Technicien expert pour la démo.",
      isVerified: true,
      isAvailable: true,
      rating: 4.9,
      reviewCount: 42,
      completedJobs: 150
    });
  } else {
    console.log("Demo technician already exists.");
  }

  // Get the technician record
  const technician = await storage.getTechnicianByUserId(techUser.id);
  if (!technician) throw new Error("Technician record not found");

  // 2. Create Demo Client
  let clientUser = await storage.getUserByUsername("demo_client");
  if (!clientUser) {
    console.log("Creating demo client...");
    clientUser = await storage.createUser({
      username: "demo_client",
      password: passwordHash,
      role: "client",
      name: "Sarah Client",
      phone: "+212600000002",
      city: "Casablanca"
    });
  } else {
    console.log("Demo client already exists.");
  }

  // 3. Create Completed Job & Invoice Demo
  // Check if we already have a completed job for this pair
  const jobs = await storage.getJobsByClientId(clientUser.id);
  const completedJobExists = jobs.some(j => j.service === "plomberie" && j.status === "completed");

  if (!completedJobExists) {
    console.log("Creating completed job for invoice demo...");
    const job = await storage.createJob({
      clientId: clientUser.id,
      description: "Fuite d'eau dans la cuisine",
      service: "plomberie",
      city: "Casablanca",
      urgency: "high",
      status: "completed",
      likelyCost: 350
    });

    const booking = await storage.createBooking({
      jobId: job.id,
      technicianId: technician.id,
      clientName: clientUser.name,
      clientPhone: clientUser.phone || "",
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: "10:00",
      status: "completed",
      estimatedCost: 350,
      matchExplanation: "Intervention rapide"
    });

    await storage.createPayment({
      bookingId: booking.id,
      amount: 350,
      paymentMethod: "cmi",
      status: "completed",
      transactionId: "TXN_" + randomUUID(),
      paidAt: new Date()
    });
  } else {
    console.log("Completed job already exists.");
  }

  // 4. Create Accepted Job for Tracking Demo
  const acceptedJobExists = jobs.some(j => j.service === "climatisation" && j.status === "accepted");

  if (!acceptedJobExists) {
    console.log("Creating accepted job for tracking demo...");
    const job = await storage.createJob({
      clientId: clientUser.id,
      description: "Maintenance climatiseur annuel",
      service: "climatisation",
      city: "Casablanca",
      urgency: "normal",
      status: "accepted",
      likelyCost: 500
    });

    // Coordinates slightly away from technician default to show movement
    const booking = await storage.createBooking({
      jobId: job.id,
      technicianId: technician.id,
      clientName: clientUser.name,
      clientPhone: clientUser.phone || "",
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: "14:00",
      status: "accepted",
      estimatedCost: 500,
      matchExplanation: "Maintenance prévue"
    });
    
    // Create job address for tracking
    await storage.createJobAddress({
        bookingId: booking.id,
        address: "123 Rue de la Liberté, Casablanca",
        city: "Casablanca",
        postalCode: "20000",
        latitude: 33.5731 + 0.02, // Client location slightly offset
        longitude: -7.5898 + 0.02,
        placeId: "demo_place_id",
        formattedAddress: "123 Rue de la Liberté, Casablanca, Maroc"
    });
  } else {
    console.log("Accepted job already exists.");
  }

  console.log("✅ Demo data seeded successfully!");
}

seedDemoFlow().catch(console.error);

