import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import type { JobAnalysis, CostEstimate, TechnicianMatch, UpsellSuggestion, Technician } from "@shared/schema";

// Check for API keys - gracefully degrade to rule-based analysis if not available
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
const hasGeminiKey = !!process.env.GEMINI_API_KEY;

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = hasOpenAIKey ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// DON'T DELETE THIS COMMENT
// Note that the newest Gemini model series is "gemini-2.5-flash"
// do not change this unless explicitly requested by the user
const gemini = hasGeminiKey ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! }) : null;

// Log API key status on startup
if (!hasOpenAIKey) console.log("AlloBricolage: OpenAI API key not configured - using rule-based analysis");
if (!hasGeminiKey) console.log("AlloBricolage: Gemini API key not configured - using default match explanations");

// Service mapping for NLP extraction
const SERVICE_KEYWORDS: Record<string, string[]> = {
  plomberie: ["plombier", "plomberie", "fuite", "eau", "robinet", "tuyau", "évier", "wc", "toilette", "chauffe-eau", "canalisation", "سباكة", "ماء", "تسرب"],
  electricite: ["électricien", "électricité", "prise", "interrupteur", "tableau", "câble", "disjoncteur", "éclairage", "كهرباء", "كهربائي"],
  peinture: ["peintre", "peinture", "peindre", "mur", "plafond", "enduit", "دهان", "طلاء"],
  menuiserie: ["menuisier", "menuiserie", "bois", "porte", "fenêtre", "meuble", "placard", "نجارة", "خشب"],
  climatisation: ["climatisation", "clim", "climatiseur", "ventilation", "chauffage", "تكييف", "مكيف"],
  maconnerie: ["maçon", "maçonnerie", "mur", "béton", "brique", "construction", "بناء"],
  carrelage: ["carrelage", "carreleur", "zellige", "mosaïque", "sol", "بلاط"],
  serrurerie: ["serrurier", "serrure", "clé", "porte", "قفل", "أقفال"],
  jardinage: ["jardinier", "jardin", "plante", "pelouse", "taille", "حديقة"],
  nettoyage: ["nettoyage", "ménage", "nettoyer", "تنظيف"],
};

const URGENCY_KEYWORDS: Record<string, string[]> = {
  emergency: ["urgence", "urgent", "immédiat", "maintenant", "catastrophe", "inondation", "طوارئ", "عاجل"],
  high: ["rapidement", "vite", "bientôt", "pressé", "سريع"],
  normal: ["normal", "quand possible", "عادي"],
  low: ["pas pressé", "pas urgent", "planifier", "غير مستعجل"],
};

const COMPLEXITY_KEYWORDS: Record<string, string[]> = {
  complex: ["rénovation", "installation complète", "remplacement total", "câblage complet", "معقد"],
  moderate: ["réparation", "remplacement", "إصلاح"],
  simple: ["petit", "simple", "rapide", "facile", "بسيط"],
};

export async function analyzeJobDescription(description: string, city: string, urgency: string): Promise<JobAnalysis> {
  // If OpenAI is not configured, use rule-based analysis
  if (!openai) {
    return {
      service: detectService(description),
      subServices: extractSubServices(description),
      urgency: urgency,
      complexity: detectComplexity(description),
      estimatedDuration: estimateDuration(detectComplexity(description)),
      extractedKeywords: extractKeywords(description),
      confidence: 0.8,
      language: detectLanguage(description),
    };
  }

  try {
    // First, try with OpenAI for intent extraction
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for AlloBricolage, a Moroccan handyman marketplace. Analyze job descriptions in French or Arabic and extract structured information.

Available services: plomberie, electricite, peinture, menuiserie, climatisation, maconnerie, carrelage, serrurerie, jardinage, nettoyage

Return JSON with this exact structure:
{
  "service": "main service category",
  "subServices": ["specific issues or tasks"],
  "urgency": "low|normal|high|emergency",
  "complexity": "simple|moderate|complex",
  "estimatedDuration": "time estimate in French",
  "extractedKeywords": ["relevant keywords"],
  "confidence": 0.0 to 1.0,
  "language": "fr|ar|en"
}`
        },
        {
          role: "user",
          content: `Analyze this job request from ${city}:\n\n"${description}"\n\nUser-selected urgency: ${urgency}`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      service: result.service || detectService(description),
      subServices: result.subServices || [],
      urgency: result.urgency || urgency,
      complexity: result.complexity || detectComplexity(description),
      estimatedDuration: result.estimatedDuration || "1-2 heures",
      extractedKeywords: result.extractedKeywords || [],
      confidence: result.confidence || 0.85,
      language: result.language || "fr",
    };
  } catch (error) {
    console.error("OpenAI analysis failed, using fallback:", error);
    // Fallback to rule-based analysis
    return {
      service: detectService(description),
      subServices: [],
      urgency: urgency,
      complexity: detectComplexity(description),
      estimatedDuration: "1-2 heures",
      extractedKeywords: extractKeywords(description),
      confidence: 0.7,
      language: detectLanguage(description),
    };
  }
}

export async function estimateCost(
  description: string, 
  service: string, 
  city: string, 
  urgency: string, 
  complexity: string
): Promise<CostEstimate> {
  // Base rates by service (in MAD)
  const baseRates: Record<string, number> = {
    plomberie: 200,
    electricite: 180,
    peinture: 150,
    menuiserie: 220,
    climatisation: 250,
    maconnerie: 200,
    carrelage: 180,
    serrurerie: 150,
    jardinage: 120,
    nettoyage: 100,
  };

  // City multipliers
  const cityMultipliers: Record<string, number> = {
    Casablanca: 1.2,
    Rabat: 1.15,
    Marrakech: 1.1,
    Fès: 1.0,
    Tanger: 1.1,
    Agadir: 1.05,
    default: 1.0,
  };

  // Urgency premiums
  const urgencyPremiums: Record<string, number> = {
    emergency: 50,
    high: 30,
    normal: 0,
    low: -10,
  };

  // Complexity premiums
  const complexityPremiums: Record<string, number> = {
    complex: 100,
    moderate: 30,
    simple: 0,
  };

  // Time-based premium
  const hour = new Date().getHours();
  const timePremium = (hour < 8 || hour > 18) ? 40 : 0;

  const baseRate = baseRates[service] || 180;
  const cityMultiplier = cityMultipliers[city] || cityMultipliers.default;
  const urgencyPremium = urgencyPremiums[urgency] || 0;
  const complexityPremium = complexityPremiums[complexity] || 0;

  const adjustedBase = Math.round(baseRate * cityMultiplier);
  const likelyCost = adjustedBase + urgencyPremium + timePremium + complexityPremium;
  const minCost = Math.round(likelyCost * 0.8);
  const maxCost = Math.round(likelyCost * 1.3);

  // Calculate confidence based on how much info we have
  const confidence = 0.75 + (description.length > 50 ? 0.1 : 0) + (complexity !== "moderate" ? 0.05 : 0);

  return {
    minCost,
    likelyCost,
    maxCost,
    confidence: Math.min(confidence, 0.95),
    breakdown: {
      baseRate: adjustedBase,
      urgencyPremium,
      timePremium,
      complexityPremium,
      demandPremium: 0,
    },
    explanation: `Estimation basée sur le service ${service} à ${city}. ${urgency === "emergency" ? "Prime d'urgence appliquée." : ""} ${timePremium > 0 ? "Prime horaire (hors heures normales)." : ""}`,
  };
}

export async function matchTechnicians(
  technicians: Technician[],
  description: string,
  service: string,
  city: string,
  urgency: string,
  costEstimate: CostEstimate
): Promise<TechnicianMatch[]> {
  const matches: TechnicianMatch[] = [];
  const descriptionLower = description.toLowerCase();

  for (const tech of technicians) {
    // Filter by city and service
    if (tech.city.toLowerCase() !== city.toLowerCase()) continue;
    if (!tech.services.includes(service)) continue;

    // Calculate match factors
    const specializationMatch = calculateSpecializationScore(tech, service, descriptionLower);
    const locationScore = 0.9; // Simplified - same city
    const availabilityScore = tech.isAvailable ? 1.0 : 0.5;
    const responseTimeScore = Math.max(0, 1 - (tech.responseTimeMinutes / 60));
    const completionRateScore = tech.completionRate;
    const ratingScore = tech.rating / 5;
    const priceScore = calculatePriceScore(tech.hourlyRate, costEstimate.likelyCost);

    // Weighted combination (XGBoost-style)
    const matchScore = 
      specializationMatch * 0.25 +
      locationScore * 0.15 +
      availabilityScore * 0.15 +
      responseTimeScore * 0.1 +
      completionRateScore * 0.15 +
      ratingScore * 0.15 +
      priceScore * 0.05;

    // Only include good matches
    if (matchScore < 0.5) continue;

    // Calculate personalized cost estimate for this technician
    const techCostAdjustment = (tech.hourlyRate - 150) / 150;
    const techCostEstimate: CostEstimate = {
      ...costEstimate,
      minCost: Math.round(costEstimate.minCost * (1 + techCostAdjustment * 0.5)),
      likelyCost: Math.round(costEstimate.likelyCost * (1 + techCostAdjustment * 0.5)),
      maxCost: Math.round(costEstimate.maxCost * (1 + techCostAdjustment * 0.5)),
    };

    // Calculate ETA
    const etaMinutes = tech.responseTimeMinutes + Math.floor(Math.random() * 20) + 10;

    matches.push({
      technician: tech,
      matchScore,
      explanation: await generateMatchExplanation(tech, matchScore, service, descriptionLower),
      etaMinutes,
      estimatedCost: techCostEstimate,
      factors: {
        specializationMatch,
        locationScore,
        availabilityScore,
        responseTimeScore,
        completionRateScore,
        ratingScore,
        priceScore,
      },
    });
  }

  // Sort by match score descending
  matches.sort((a, b) => b.matchScore - a.matchScore);

  // Return top 5 matches
  return matches.slice(0, 5);
}

async function generateMatchExplanation(
  tech: Technician,
  score: number,
  service: string,
  description: string
): Promise<string> {
  // If Gemini is not configured, use default explanation
  if (!gemini) {
    return getDefaultExplanation(tech, score);
  }

  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a brief explanation in French (2-3 sentences) for why ${tech.name} is a ${Math.round(score * 100)}% match for a ${service} job. 
      
Tech info:
- Rating: ${tech.rating}/5 (${tech.reviewCount} reviews)
- ${tech.completedJobs} jobs completed
- ${tech.yearsExperience} years experience
- Skills: ${tech.skills.join(", ")}
- Available: ${tech.isAvailable ? "Yes" : "No"}

Be concise and focus on the most relevant qualifications.`,
    });

    return response.text || getDefaultExplanation(tech, score);
  } catch (error) {
    console.error("Gemini explanation failed:", error);
    return getDefaultExplanation(tech, score);
  }
}

function getDefaultExplanation(tech: Technician, score: number): string {
  return `${tech.name} est un match à ${Math.round(score * 100)}% grâce à ${tech.yearsExperience} ans d'expérience et une note de ${tech.rating}/5 (${tech.reviewCount} avis). ${tech.isAvailable ? "Disponible maintenant." : ""}`;
}

export function generateUpsellSuggestions(service: string): UpsellSuggestion[] {
  const upsellMap: Record<string, UpsellSuggestion[]> = {
    plomberie: [
      {
        service: "Inspection plomberie complète",
        description: "Vérification de toutes les installations",
        probability: 0.6,
        discount: 15,
        reason: "Souvent demandé après une réparation",
      },
      {
        service: "Remplacement joints",
        description: "Prévention des futures fuites",
        probability: 0.45,
        discount: 10,
        reason: "Maintenance préventive recommandée",
      },
    ],
    electricite: [
      {
        service: "Vérification tableau électrique",
        description: "Diagnostic complet de sécurité",
        probability: 0.55,
        discount: 20,
        reason: "Important pour la sécurité",
      },
      {
        service: "Installation prises USB",
        description: "Prises modernes avec ports USB",
        probability: 0.35,
        discount: 15,
        reason: "Amélioration pratique",
      },
    ],
    peinture: [
      {
        service: "Réparation murs",
        description: "Rebouchage fissures et trous",
        probability: 0.5,
        discount: 10,
        reason: "Préparation optimale",
      },
    ],
    climatisation: [
      {
        service: "Entretien annuel",
        description: "Nettoyage et maintenance préventive",
        probability: 0.7,
        discount: 25,
        reason: "Prolonge la durée de vie",
      },
    ],
  };

  return upsellMap[service] || [];
}

// Helper functions
function detectService(description: string): string {
  const lower = description.toLowerCase();
  for (const [service, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return service;
    }
  }
  return "plomberie"; // Default
}

function detectComplexity(description: string): string {
  const lower = description.toLowerCase();
  for (const [complexity, keywords] of Object.entries(COMPLEXITY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return complexity;
    }
  }
  return "moderate";
}

function extractKeywords(description: string): string[] {
  const words = description.toLowerCase().split(/\s+/);
  const allKeywords = Object.values(SERVICE_KEYWORDS).flat();
  return words.filter(w => allKeywords.includes(w)).slice(0, 5);
}

function detectLanguage(description: string): "fr" | "ar" | "en" {
  // Simple Arabic detection
  if (/[\u0600-\u06FF]/.test(description)) return "ar";
  // Simple English detection
  if (/\b(the|and|or|is|are|have|has)\b/i.test(description)) return "en";
  return "fr";
}

function calculateSpecializationScore(tech: Technician, service: string, description: string): number {
  let score = 0.7; // Base score for matching service
  
  // Bonus for relevant skills mentioned in description
  for (const skill of tech.skills) {
    if (description.includes(skill.toLowerCase())) {
      score += 0.1;
    }
  }
  
  // Experience bonus
  score += Math.min(tech.yearsExperience / 20, 0.15);
  
  return Math.min(score, 1.0);
}

function calculatePriceScore(hourlyRate: number, estimatedCost: number): number {
  // Higher score for more affordable technicians
  const avgRate = 150;
  const diff = (avgRate - hourlyRate) / avgRate;
  return Math.max(0.5, Math.min(1.0, 0.75 + diff * 0.5));
}

function extractSubServices(description: string): string[] {
  const subServices: string[] = [];
  const lower = description.toLowerCase();
  
  // Common sub-service keywords
  const subServiceMap: Record<string, string[]> = {
    "Fuite d'eau": ["fuite", "coule", "goutte"],
    "Débouchage": ["bouché", "bouchée", "déboucher"],
    "Installation": ["installer", "installation", "poser"],
    "Réparation": ["réparer", "réparation", "cassé", "cassée"],
    "Remplacement": ["remplacer", "changer", "remplacement"],
    "Entretien": ["entretien", "maintenance", "nettoyer"],
  };
  
  for (const [service, keywords] of Object.entries(subServiceMap)) {
    if (keywords.some(kw => lower.includes(kw))) {
      subServices.push(service);
    }
  }
  
  return subServices.slice(0, 3);
}

function estimateDuration(complexity: string): string {
  switch (complexity) {
    case "simple": return "30 min - 1 heure";
    case "complex": return "3-5 heures";
    default: return "1-2 heures";
  }
}

// DarijaChat - AI-powered customer support in Moroccan Darija
export async function darijaChat(
  message: string, 
  history: Array<{ role: string; content: string }>
): Promise<string> {
  // Common Darija responses for fallback
  const darijaResponses = [
    "Salam! Ana hna bach n3awnek. Chouf, ila 3ndek chi mochkil f dar dyalek, kayna techniciens zwinin 3ndna.",
    "Ahlan! Kifach nqdr n3awnek lyoum? 3ndna plombier, khrba2i, w bzaf d services khra.",
    "Mrhba bik! Gol lia chno kayn w ghadi n3awnek tlqa technicien mezyan.",
  ];

  // If no AI is available, use fallback responses
  if (!openai && !gemini) {
    const randomIndex = Math.floor(Math.random() * darijaResponses.length);
    return darijaResponses[randomIndex];
  }

  try {
    // Use OpenAI if available
    if (openai) {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a friendly customer support assistant for AlloBricolage, a Moroccan handyman marketplace.

IMPORTANT RULES:
1. Always respond in Moroccan Darija (using Latin script like "Salam, kifach nqdr n3awnek?")
2. Be warm, helpful, and professional
3. Guide users to find technicians for their home repair needs
4. Available services: plomberie (plumber), electricite (electrician), peinture (painter), menuiserie (carpenter), climatisation (AC), maconnerie (mason), carrelage (tiles), serrurerie (locksmith), jardinage (gardener), nettoyage (cleaning)
5. Moroccan cities we serve: Casablanca, Rabat, Marrakech, Fes, Tanger, Agadir, Meknes, Oujda, Kenitra, Tetouan
6. Keep responses concise and helpful
7. Use common Darija phrases like: Salam, Mrhba, Ana hna bach n3awnek, Wakha, La bsa, Chokran

Example phrases:
- "Salam! Kifach nqdr n3awnek lyoum?"
- "Ana ghadi n3awnek tlqa technicien mezyan."
- "Gol lia chno kayn f dar dyalek w ghadi nchouf lk chi had."
- "Wakha, daba ghadi nchouf lk acher techniciens 3ndna."`
          },
          ...history.map(h => ({
            role: h.role as "user" | "assistant",
            content: h.content
          })),
          {
            role: "user",
            content: message
          }
        ],
        max_completion_tokens: 256,
      });

      return response.choices[0].message.content || darijaResponses[0];
    }

    // Use Gemini as fallback
    if (gemini) {
      const historyContext = history.map(h => `${h.role}: ${h.content}`).join("\n");
      
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a customer support assistant for AlloBricolage, a Moroccan handyman marketplace.
        
Always respond in Moroccan Darija (Latin script). Be helpful and friendly.

Previous conversation:
${historyContext}

User: ${message}

Respond in Darija:`,
      });

      return response.text || darijaResponses[0];
    }

  } catch (error) {
    console.error("DarijaChat AI error:", error);
  }

  // Fallback response
  return darijaResponses[Math.floor(Math.random() * darijaResponses.length)];
}
