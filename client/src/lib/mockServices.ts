import type { Job, TechnicianWithUser, CostEstimate, TechnicianMatch } from "@shared/schema";
import { localStorageService } from "./localStorage";

// Utility function to simulate async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// AI SERVICES
// ============================================

/**
 * Mock job description analysis
 */
export async function mockAnalyzeJob(description: string): Promise<{
  service: string;
  subServices: string[];
  urgency: string;
  complexity: string;
  estimatedDuration: string;
  extractedKeywords: string[];
  confidence: number;
  language: string;
}> {
  await delay(500); // Simulate API call

  const descLower = description.toLowerCase();
  
  // Detect service from keywords
  let service = "services_generaux";
  let subServices: string[] = [];
  let complexity = "moderate";
  
  if (descLower.includes("plomb") || descLower.includes("fuite") || descLower.includes("eau")) {
    service = "plomberie";
    subServices = ["Réparation fuites", "Installation sanitaire"];
  } else if (descLower.includes("électr") || descLower.includes("lumière") || descLower.includes("prise")) {
    service = "electricite";
    subServices = ["Installation électrique", "Dépannage"];
  } else if (descLower.includes("peint") || descLower.includes("mur")) {
    service = "peinture";
    subServices = ["Peinture intérieure"];
  } else if (descLower.includes("menuiser") || descLower.includes("porte") || descLower.includes("fenêtre")) {
    service = "menuiserie";
    subServices = ["Portes", "Fenêtres"];
  } else if (descLower.includes("clim") || descLower.includes("climatisation")) {
    service = "climatisation";
    subServices = ["Installation climatisation"];
  } else if (descLower.includes("carrel")) {
    service = "carrelage";
    subServices = ["Pose carrelage"];
  }
  
  // Detect urgency
  let urgency = "normal";
  if (descLower.includes("urgent") || descLower.includes("immédiat") || descLower.includes("rapidement")) {
    urgency = "high";
  } else if (descLower.includes("pas urgent") || descLower.includes("quand possible")) {
    urgency = "low";
  }
  
  // Detect complexity
  if (descLower.includes("simple") || descLower.includes("petit")) {
    complexity = "simple";
  } else if (descLower.includes("complex") || descLower.includes("grand") || descLower.includes("important")) {
    complexity = "complex";
  }
  
  return {
    service,
    subServices,
    urgency,
    complexity,
    estimatedDuration: complexity === "simple" ? "1-2 heures" : complexity === "complex" ? "1-2 jours" : "2-4 heures",
    extractedKeywords: description.split(' ').filter(w => w.length > 3).slice(0, 5),
    confidence: 0.85,
    language: "fr",
  };
}

/**
 * Mock image analysis
 */
export async function mockAnalyzeImage(imageData: string): Promise<{
  description: string;
  detectedIssues: string[];
  recommendations: string[];
}> {
  await delay(1000); // Simulate API call
  
  return {
    description: "Image analysée : zone nécessitant une intervention",
    detectedIssues: ["Détérioration visible", "Nécessite une inspection"],
    recommendations: ["Faire appel à un professionnel", "Intervention recommandée sous 48h"],
  };
}

/**
 * Mock cost estimation
 */
export async function mockEstimateCost(job: Partial<Job>): Promise<CostEstimate> {
  await delay(300);
  
  // Base rates by service
  const baseRates: Record<string, number> = {
    plomberie: 150,
    electricite: 180,
    peinture: 120,
    menuiserie: 140,
    climatisation: 200,
    carrelage: 130,
    services_generaux: 100,
  };
  
  const baseRate = baseRates[job.service || "services_generaux"] || 120;
  
  // Urgency multiplier
  const urgencyMultiplier = job.urgency === "high" ? 1.3 : job.urgency === "emergency" ? 1.5 : 1.0;
  
  // Complexity multiplier
  const complexityMultiplier = job.complexity === "complex" ? 1.4 : job.complexity === "simple" ? 0.8 : 1.0;
  
  const likelyCost = Math.round(baseRate * urgencyMultiplier * complexityMultiplier);
  const minCost = Math.round(likelyCost * 0.8);
  const maxCost = Math.round(likelyCost * 1.3);
  
  return {
    minCost,
    likelyCost,
    maxCost,
    confidence: 0.85,
    breakdown: {
      baseRate,
      urgencyPremium: Math.round(baseRate * (urgencyMultiplier - 1)),
      timePremium: 0,
      complexityPremium: Math.round(baseRate * (complexityMultiplier - 1)),
      demandPremium: 0,
    },
    explanation: `Estimation basée sur le service ${job.service}, urgence ${job.urgency}, et complexité ${job.complexity}`,
  };
}

/**
 * Mock technician matching
 */
export async function mockMatchTechnicians(job: Partial<Job>): Promise<TechnicianMatch[]> {
  await delay(500);
  
  // Get technicians that match the service
  const technicians = await localStorageService.searchTechnicians({
    service: job.service,
    city: job.city,
    available: true,
  });
  
  console.log("🔍 Search filters:", { service: job.service, city: job.city, available: true });
  console.log("🔍 Technicians found:", technicians);
  console.log("🔍 Number of technicians:", technicians.length);
  
  // Calculate match scores
  const matches: TechnicianMatch[] = technicians.slice(0, 5).map(tech => {
    const specializationMatch = tech.services.includes(job.service || "") ? 1.0 : 0.5;
    const locationScore = tech.city?.toLowerCase() === job.city?.toLowerCase() ? 1.0 : 0.7;
    const availabilityScore = tech.isAvailable ? 1.0 : 0.5;
    const responseTimeScore = Math.max(0, 1 - (tech.responseTimeMinutes / 60));
    const completionRateScore = tech.completionRate;
    const ratingScore = tech.rating / 5;
    const priceScore = Math.max(0, 1 - ((tech.hourlyRate - 100) / 200));
    
    const matchScore = (
      specializationMatch * 0.3 +
      locationScore * 0.2 +
      availabilityScore * 0.15 +
      responseTimeScore * 0.1 +
      completionRateScore * 0.1 +
      ratingScore * 0.1 +
      priceScore * 0.05
    );
    
    const estimatedCost: CostEstimate = {
      minCost: Math.round(tech.hourlyRate * 2 * 0.8),
      likelyCost: Math.round(tech.hourlyRate * 2),
      maxCost: Math.round(tech.hourlyRate * 2 * 1.3),
      confidence: 0.8,
      breakdown: {
        baseRate: tech.hourlyRate,
        urgencyPremium: 0,
        timePremium: 0,
        complexityPremium: 0,
        demandPremium: 0,
      },
      explanation: `Basé sur le tarif horaire de ${tech.hourlyRate} MAD`,
    };
    
    return {
      technician: tech,
      matchScore: Math.round(matchScore * 100) / 100,
      explanation: `${Math.round(matchScore * 100)}% de correspondance`,
      etaMinutes: tech.responseTimeMinutes,
      estimatedCost,
      factors: {
        specializationMatch,
        locationScore,
        availabilityScore,
        responseTimeScore,
        completionRateScore,
        ratingScore,
        priceScore,
      },
    };
  });
  
  // Sort by match score
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

// ============================================
// PAYMENT SERVICES
// ============================================

/**
 * Mock payment processing
 */
export async function mockProcessPayment(data: {
  bookingId: string;
  amount: number;
  paymentMethod: string;
}): Promise<{
  id: string;
  status: string;
  transactionId: string;
}> {
  await delay(2000); // Simulate payment processing
  
  return {
    id: `payment-${Date.now()}`,
    status: "completed",
    transactionId: `DEMO-${Date.now()}`,
  };
}

/**
 * Get available payment methods
 */
export function mockGetPaymentMethods(): Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
}> {
  return [
    {
      id: "cash",
      name: "Espèces",
      description: "Paiement en espèces au technicien",
      icon: "💵",
      available: true,
    },
    {
      id: "bank_transfer",
      name: "Virement bancaire",
      description: "Virement vers le compte du technicien",
      icon: "🏦",
      available: true,
    },
    {
      id: "stripe",
      name: "Carte bancaire",
      description: "Paiement sécurisé par carte (Demo)",
      icon: "💳",
      available: true,
    },
  ];
}

/**
 * Generate bank transfer reference
 */
export function mockGenerateBankTransferReference(bookingId: string): string {
  return `REF-${bookingId.slice(0, 8).toUpperCase()}`;
}

// ============================================
// SMS/NOTIFICATION SERVICES
// ============================================

/**
 * Mock SMS sending
 */
export async function mockSendSMS(phone: string, message: string): Promise<void> {
  console.log(`📱 SMS to ${phone}:`, message);
  
  // Could show a toast notification here instead
  // This will be handled by the components
}

/**
 * Mock notification creation
 */
export async function mockCreateNotification(userId: string, notification: {
  type: string;
  title: string;
  message: string;
  bookingId?: string;
  paymentId?: string;
}): Promise<void> {
  await localStorageService.createNotification({
    userId,
    ...notification,
    isRead: false,
  });
}

// ============================================
// FILE UPLOAD SERVICES
// ============================================

/**
 * Mock image upload (convert to base64)
 */
export async function mockUploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check file size (limit to 1MB for localStorage)
    if (file.size > 1024 * 1024) {
      reject(new Error("File too large. Maximum size is 1MB for demo mode."));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Mock invoice generation
 */
export async function mockGenerateInvoice(bookingId: string): Promise<{
  url: string;
  filename: string;
}> {
  await delay(1000);
  
  return {
    url: `/invoices/demo-${bookingId}.pdf`,
    filename: `facture-${bookingId}.pdf`,
  };
}

// ============================================
// GPS TRACKING SERVICES
// ============================================

/**
 * Mock route calculation
 */
export async function mockCalculateRoute(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<{
  distance: number;
  duration: number;
  polyline: string;
}> {
  await delay(500);
  
  // Simple distance calculation (Haversine formula)
  const R = 6371; // Earth's radius in km
  const dLat = (destination.lat - origin.lat) * Math.PI / 180;
  const dLon = (destination.lng - origin.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 1000; // Convert to meters
  
  // Estimate duration (assuming 30 km/h average speed)
  const duration = (distance / 1000) * 2 * 60; // minutes
  
  return {
    distance: Math.round(distance),
    duration: Math.round(duration),
    polyline: "mock_polyline_data", // Would be actual encoded polyline in real app
  };
}

// ============================================
// CHAT SERVICES
// ============================================

/**
 * Mock Darija chat responses
 */
export async function mockDarijaChat(message: string, history: Array<{ role: string; content: string }>): Promise<{
  response: string;
}> {
  await delay(800);
  
  const messageLower = message.toLowerCase();
  
  // Simple keyword-based responses
  if (messageLower.includes("salam") || messageLower.includes("bonjour")) {
    return { response: "Salam! Kifach n9der n3awnek? 😊" };
  }
  
  if (messageLower.includes("prix") || messageLower.includes("tarif") || messageLower.includes("flos")) {
    return { response: "Les prix dépendent du service et de la ville. Généralement entre 100-200 MAD/heure. Bghiti t3ref kthar?" };
  }
  
  if (messageLower.includes("plomb") || messageLower.includes("eau")) {
    return { response: "3andna des plombiers professionnels. Chkoun f mdina dyalek? Casablanca, Rabat, Marrakech...?" };
  }
  
  if (messageLower.includes("électr") || messageLower.includes("kahraba")) {
    return { response: "Électriciens certifiés disponibles! Chnou l mochkil? Installation, dépannage, wla mise aux normes?" };
  }
  
  if (messageLower.includes("merci") || messageLower.includes("choukran")) {
    return { response: "Bla jmil! N9dro n3awnok f ay wa9t 😊" };
  }
  
  // Default response
  return { 
    response: "Fhemt! Bghiti technicien f service mo3ayan? Goul liya chnou bghiti o ana nsa3dek tl9a l professionnel mzyan!" 
  };
}

