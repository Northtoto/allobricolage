import { storagePromise } from "./storage";
import type { InsertUser, InsertTechnician } from "@shared/schema";
import { SERVICE_CATEGORIES, MOROCCAN_CITIES } from "@shared/schema";

// Moroccan first names
const FIRST_NAMES = [
  "Mohammed", "Ahmed", "Youssef", "Fatima", "Aisha", "Hassan", "Omar", "Karim",
  "Mehdi", "Rachid", "Said", "Nabil", "Hamza", "Amine", "Tarik", "Samir",
  "Laila", "Zineb", "Amina", "Salma", "Yasmine", "Nadia", "Khadija", "Sanaa",
  "Khalid", "Abdelaziz", "Mustapha", "Driss", "Brahim", "Jamal", "Aziz", "Hicham",
  "Souad", "Nabila", "Hayat", "Malika", "Houda", "Samira", "Latifa", "Karima"
];

const LAST_NAMES = [
  "Alaoui", "Benjelloun", "El Amrani", "Tahiri", "Cherkaoui", "Benali", "Idrissi",
  "Berrada", "Fassi", "Tazi", "Sefrioui", "Naciri", "Kettani", "Squalli", "Mansouri",
  "El Bouazzaoui", "Filali", "Lahlou", "Ziani", "Haddad", "Bakri", "Cherif", "Benkirane",
  "El Guerrouj", "Bouzoubaa", "Slaoui", "El Malki", "Tounsi", "Mekouar", "Benabdellah",
  "El Yazidi", "Bennis", "Chakir", "Hamdaoui", "Benjelloun", "Messaoudi", "El Kadiri",
  "Benmoussa", "Filali", "Ouazzani"
];

// Skills by service category
const SERVICE_SKILLS: Record<string, string[]> = {
  plomberie: [
    "Réparation fuites", "Installation sanitaires", "Débouchage", "Soudure cuivre",
    "Installation chauffe-eau", "Détection fuites", "Plomberie neuve", "Rénovation salle de bain"
  ],
  electricite: [
    "Installation électrique", "Dépannage urgence", "Tableaux électriques", "Éclairage LED",
    "Mise aux normes", "Interphones", "Caméras surveillance", "Automatismes portails"
  ],
  peinture: [
    "Peinture intérieure", "Peinture extérieure", "Enduit décoratif", "Papier peint",
    "Ravalement façade", "Peinture anti-humidité", "Béton ciré", "Tadelakt"
  ],
  menuiserie: [
    "Portes sur mesure", "Placards encastrés", "Cuisine équipée", "Escaliers bois",
    "Parquet", "Menuiserie alu", "Pergolas", "Aménagement intérieur"
  ],
  climatisation: [
    "Installation climatisation", "Entretien climatiseurs", "Réparation clim", "Froid industriel",
    "Pompes à chaleur", "Ventilation", "Dépannage urgence", "Contrats maintenance"
  ],
  reparation_appareils: [
    "Réparation électroménager", "Réparation TV", "Machines à laver", "Réfrigérateurs",
    "Fours", "Lave-vaisselle", "Micro-ondes", "Petit électroménager"
  ],
  petites_renovations: [
    "Rénovation appartement", "Rafraîchissement", "Petits travaux", "Aménagement combles",
    "Cuisine", "Salle de bain", "Sols", "Plafonds"
  ],
  portes_serrures: [
    "Portes blindées", "Serrurerie", "Dépannage urgence", "Changement serrures",
    "Ouverture portes", "Installation verrous", "Portes automatiques", "Contrôle accès"
  ],
  metallerie: [
    "Portails métalliques", "Garde-corps", "Escaliers métalliques", "Pergolas métal",
    "Vérandas", "Soudure", "Ferronnerie art", "Structures métalliques"
  ],
  carrelage: [
    "Pose carrelage", "Faïence", "Mosaïque", "Terrasses", "Sols intérieurs",
    "Salles de bain", "Cuisines", "Rénovation carrelage"
  ],
  etancheite: [
    "Étanchéité toiture", "Traitement humidité", "Isolation thermique", "Étanchéité terrasse",
    "Drainage", "Cuvelage", "Résine étanchéité", "Membrane EPDM"
  ],
  installation_luminaires: [
    "Lustres", "Spots encastrés", "Éclairage indirect", "LED décoratif",
    "Ruban LED", "Appliques", "Éclairage extérieur", "Domotique lumière"
  ],
  travaux_construction: [
    "Maçonnerie générale", "Extensions", "Fondations", "Murs porteurs",
    "Dalles béton", "Chapes", "Agglos", "Enduits"
  ],
  services_generaux: [
    "Multi-services", "Petits travaux", "Bricolage", "Maintenance",
    "Jardinage", "Nettoyage", "Déménagement", "Montage meubles"
  ],
};

// Generate realistic phone numbers (Moroccan format)
function generatePhone(): string {
  const prefixes = ["06", "07"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}${number}`;
}

// Generate email from name
function generateEmail(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
}

// Generate username
function generateUsername(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Math.floor(Math.random() * 1000)}`;
}

// Select random items from array
function selectRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Generate coordinates for Moroccan cities (approximate)
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Casablanca": { lat: 33.5731, lng: -7.5898 },
  "Rabat": { lat: 34.0209, lng: -6.8416 },
  "Marrakech": { lat: 31.6295, lng: -7.9811 },
  "Fès": { lat: 34.0181, lng: -5.0078 },
  "Tanger": { lat: 35.7595, lng: -5.8340 },
  "Agadir": { lat: 30.4278, lng: -9.5981 },
  "Meknès": { lat: 33.8935, lng: -5.5473 },
  "Oujda": { lat: 34.6814, lng: -1.9086 },
  "Kenitra": { lat: 34.2610, lng: -6.5802 },
  "Tétouan": { lat: 35.5889, lng: -5.3626 },
};

async function seedTechnicians() {
  const storage = await storagePromise;

  console.log("🌱 Starting to seed 80 technicians...");

  const technicians: Array<{ user: InsertUser; technician: InsertTechnician }> = [];

  for (let i = 0; i < 80; i++) {
    // Random name
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const fullName = `${firstName} ${lastName}`;

    // Random city
    const city = MOROCCAN_CITIES[Math.floor(Math.random() * MOROCCAN_CITIES.length)];
    const coords = CITY_COORDINATES[city];

    // Random 1-3 services per technician
    const numServices = Math.floor(Math.random() * 3) + 1;
    const services = selectRandom([...SERVICE_CATEGORIES], numServices);

    // Skills based on services
    const skills: string[] = [];
    services.forEach(service => {
      const serviceSkills = SERVICE_SKILLS[service] || [];
      skills.push(...selectRandom(serviceSkills, Math.floor(Math.random() * 3) + 2));
    });

    // Random stats (realistic ranges)
    const rating = 3.5 + Math.random() * 1.5; // 3.5-5.0
    const reviewCount = Math.floor(Math.random() * 150) + 5; // 5-155
    const completedJobs = Math.floor(Math.random() * 200) + 10; // 10-210
    const yearsExperience = Math.floor(Math.random() * 15) + 1; // 1-16
    const hourlyRate = Math.floor(80 + Math.random() * 170); // 80-250 MAD
    const responseTimeMinutes = Math.floor(10 + Math.random() * 110); // 10-120
    const completionRate = 0.75 + Math.random() * 0.24; // 0.75-0.99

    // Random flags
    const isVerified = Math.random() > 0.3; // 70% verified
    const isAvailable = Math.random() > 0.2; // 80% available
    const isPro = Math.random() > 0.6; // 40% pro
    const isPromo = Math.random() > 0.85; // 15% promo

    // Random certifications
    const certifications: string[] = [];
    if (isVerified) {
      const possibleCerts = [
        "Certification professionnelle",
        "Formation OFPPT",
        "10 ans d'expérience",
        "Assurance responsabilité civile",
        "Intervenant agréé",
      ];
      certifications.push(...selectRandom(possibleCerts, Math.floor(Math.random() * 3)));
    }

    // Bio
    const bios = [
      `Professionnel expérimenté en ${skills[0]}. Intervention rapide et soignée.`,
      `${yearsExperience} ans d'expérience. Devis gratuit. Travail garanti.`,
      `Spécialiste ${services.map(s => SERVICE_SKILLS[s]?.[0] || s).join(", ")}. Prix compétitifs.`,
      `Artisan qualifié. Disponible 7j/7. Satisfaction client garantie.`,
      `Expert en ${skills.slice(0, 2).join(" et ")}. Intervention sous 24h.`,
    ];
    const bio = bios[Math.floor(Math.random() * bios.length)];

    // Create user
    const user: InsertUser = {
      username: generateUsername(firstName, lastName),
      password: "hashed_password_demo", // In real app, this would be properly hashed
      role: "technician",
      name: fullName,
      email: generateEmail(firstName, lastName),
      phone: generatePhone(),
      city: city,
    };

    // Create technician profile
    const technician: InsertTechnician = {
      userId: "", // Will be set after user creation
      services: services,
      skills: skills,
      bio: bio,
      photo: `/assets/avatars/${selectRandom(["avatar_man_1.png", "avatar_woman_1.png", "avatar_man_2.png", "avatar_woman_2.png", "avatar_man_3.png"], 1)[0]}`,
      rating: Math.round(rating * 10) / 10,
      reviewCount: reviewCount,
      completedJobs: completedJobs,
      responseTimeMinutes: responseTimeMinutes,
      completionRate: Math.round(completionRate * 100) / 100,
      yearsExperience: yearsExperience,
      hourlyRate: hourlyRate,
      isVerified: isVerified,
      isAvailable: isAvailable,
      isPro: isPro,
      isPromo: isPromo,
      availability: isAvailable ? "Disponible" : "Sur RDV",
      certifications: certifications,
      latitude: coords.lat + (Math.random() - 0.5) * 0.1, // Slight variation
      longitude: coords.lng + (Math.random() - 0.5) * 0.1,
      languages: ["français", "arabe"],
    };

    technicians.push({ user, technician });
  }

  // Insert all technicians
  console.log("📝 Inserting technicians into database...");

  let successCount = 0;
  let errorCount = 0;

  for (const { user, technician } of technicians) {
    try {
      // Create user
      const createdUser = await storage.createUser(user);

      // Create technician profile
      technician.userId = createdUser.id;
      await storage.createTechnician(technician);

      successCount++;

      if (successCount % 10 === 0) {
        console.log(`   ✅ ${successCount}/80 technicians created...`);
      }
    } catch (error) {
      errorCount++;
      console.error(`   ❌ Error creating technician: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log("\n🎉 Seeding complete!");
  console.log(`   ✅ Successfully created: ${successCount} technicians`);
  console.log(`   ❌ Errors: ${errorCount}`);

  // Print statistics
  console.log("\n📊 Statistics:");
  const serviceCount: Record<string, number> = {};
  const cityCount: Record<string, number> = {};

  technicians.forEach(({ technician, user }) => {
    technician.services.forEach(service => {
      serviceCount[service] = (serviceCount[service] || 0) + 1;
    });
    if (user.city) {
      cityCount[user.city] = (cityCount[user.city] || 0) + 1;
    }
  });

  console.log("\n   Services distribution:");
  Object.entries(serviceCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([service, count]) => {
      const label = SERVICE_SKILLS[service]?.[0] || service;
      console.log(`     • ${label}: ${count} technicians`);
    });

  console.log("\n   Cities distribution:");
  Object.entries(cityCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => {
      console.log(`     • ${city}: ${count} technicians`);
    });

  process.exit(0);
}

// Run the seeder
seedTechnicians().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
