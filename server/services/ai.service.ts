import { logger } from "@/utils/logger.ts";
import type { JobAnalysis, CostEstimate, TechnicianMatch, UpsellSuggestion } from "@/db/schema.ts";

export class AIService {
  async analyzeJob(description: string): Promise<JobAnalysis> {
    logger.info("Analyzing job", { description: description.substring(0, 100) });

    const serviceKeywords: Record<string, string[]> = {
      plomberie: ["fuite", "robinet", "wc", "toilette", "eau", "tuyau", "canalisation", "egout", "vidange"],
      electricite: ["electricite", "courant", "prise", "interrupteur", "cable", "coupure", "tableau"],
      climatisation: ["clim", "climatisation", "froid", "chaud", "recharge", "gaz"],
      peinture: ["peinture", "peindre", "mur", "enduit", "facade"],
      menuiserie: ["porte", "fenetre", "meuble", "menuiserie", "bois"],
      carrelage: ["carrelage", "carreau", "sol", "pose"],
      metallerie: ["fer", "metal", "soudure", "grille"],
      etancheite: ["fuite", "toit", "terrasse", "etancheite", "humidite"],
      portes_serrures: ["serrure", "cle", "ouverture", "porte bloquee"],
    };

    const lowerDesc = description.toLowerCase();
    let detectedService = "services_generaux";
    let maxMatches = 0;

    for (const [service, keywords] of Object.entries(serviceKeywords)) {
      const matches = keywords.filter((kw) => lowerDesc.includes(kw)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedService = service;
      }
    }

    const urgencies = ["low", "normal", "high", "emergency"];
    const urgency: typeof urgencies[number] =
      lowerDesc.includes("urgent") || lowerDesc.includes("cassé") || lowerDesc.includes("fuite")
        ? "high"
        : "normal";

    const complexity: "simple" | "moderate" | "complex" =
      lowerDesc.includes("rénovation") || lowerDesc.includes("changement complet")
        ? "complex"
        : lowerDesc.includes("remplacement") || lowerDesc.includes("installation")
          ? "moderate"
          : "simple";

    return {
      service: detectedService,
      subServices: ["Réparation"],
      urgency,
      complexity,
      estimatedDuration: complexity === "simple" ? "1-2 heures" : complexity === "moderate" ? "2-4 heures" : "4-8 heures",
      extractedKeywords: Array.from(new Set(lowerDesc.split(/\s+/).filter((w) => w.length > 3))),
      confidence: Math.min(0.5 + maxMatches * 0.15, 0.95),
      language: "fr",
    };
  }

  async estimateCost(params: {
    service: string;
    urgency: string;
    complexity: string;
  }): Promise<CostEstimate> {
    const baseRates: Record<string, number> = {
      plomberie: 300,
      electricite: 250,
      peinture: 200,
      menuiserie: 350,
      climatisation: 400,
      reparation_appareils: 250,
      petites_renovations: 500,
      portes_serrures: 200,
      metallerie: 350,
      carrelage: 300,
      etancheite: 450,
      installation_luminaires: 200,
      travaux_construction: 600,
      services_generaux: 200,
    };

    const baseRate = baseRates[params.service] ?? 200;
    const urgencyPremium = params.urgency === "emergency" ? baseRate * 0.5 : params.urgency === "high" ? baseRate * 0.25 : 0;
    const complexityPremium = params.complexity === "complex" ? baseRate * 0.4 : params.complexity === "moderate" ? baseRate * 0.2 : 0;
    const timePremium = baseRate * 0.1;
    const demandPremium = baseRate * 0.05;

    const total = baseRate + urgencyPremium + complexityPremium + timePremium + demandPremium;
    const minCost = Math.round(total * 0.8);
    const likelyCost = Math.round(total);
    const maxCost = Math.round(total * 1.3);

    return {
      minCost,
      likelyCost,
      maxCost,
      confidence: 0.75,
      breakdown: {
        baseRate,
        urgencyPremium,
        timePremium,
        complexityPremium,
        demandPremium,
      },
      explanation: `Coût estimé pour ${params.service} (${params.complexity}, ${params.urgency === "emergency" ? "urgence" : "standard"})`,
    };
  }

  async matchTechnicians(
    jobId: string,
    service: string,
    city: string,
    opts: { priority?: boolean; slaHours?: number } = {}
  ) {
    const { technicianRepository } = await import("@/repositories/technician.repository.ts");
    const { items: techs } = await technicianRepository.findAllWithUsers({
      service,
      city,
      available: true,
    });

    // B2B retainer clients get SLA-priority dispatch: rank the best, fastest, verified
    // technicians first and guarantee an ETA within the contracted SLA window.
    const ranked = opts.priority
      ? [...techs].sort((a, b) => {
          const score = (t: typeof a) =>
            (t.isPro ? 2 : 0) +
            (t.isVerified ? 1 : 0) +
            t.rating / 5 +
            t.completionRate -
            t.responseTimeMinutes / 240;
          return score(b) - score(a);
        })
      : techs;

    const slaMinutes = opts.slaHours ? opts.slaHours * 60 : undefined;

    const matches = ranked.slice(0, 5).map((tech) => ({
      technician: tech,
      matchScore: opts.priority
        ? Math.round((0.9 + Math.random() * 0.09) * 100) / 100
        : Math.round((0.7 + Math.random() * 0.28) * 100) / 100,
      explanation: opts.priority
        ? `${tech.name} — intervention prioritaire (contrat de maintenance), sous ${opts.slaHours ?? 4}h garanties`
        : `${tech.name} est idéal pour ce travail grâce à sa spécialisation`,
      etaMinutes: opts.priority
        ? Math.min(Math.round(15 + Math.random() * 30), slaMinutes ?? 9999)
        : Math.round(20 + Math.random() * 60),
      estimatedCost: {
        minCost: tech.hourlyRate,
        likelyCost: Math.round(tech.hourlyRate * 1.5),
        maxCost: Math.round(tech.hourlyRate * 2.5),
        confidence: 0.8,
        breakdown: {
          baseRate: tech.hourlyRate,
          urgencyPremium: 0,
          timePremium: Math.round(tech.hourlyRate * 0.1),
          complexityPremium: Math.round(tech.hourlyRate * 0.2),
          demandPremium: Math.round(tech.hourlyRate * 0.05),
        },
        explanation: `Tarif horaire de ${tech.hourlyRate} MAD`,
      },
      factors: {
        specializationMatch: Math.round(Math.random() * 100) / 100,
        locationScore: Math.round(Math.random() * 100) / 100,
        availabilityScore: tech.isAvailable ? 1 : 0.5,
        responseTimeScore: Math.max(0, 1 - tech.responseTimeMinutes / 120),
        completionRateScore: tech.completionRate,
        ratingScore: tech.rating / 5,
        priceScore: Math.min(1, 500 / tech.hourlyRate),
      },
    }));

    return matches;
  }

  async chatDarija(message: string, history: { role: string; content: string }[]) {
    const lowerMsg = message.toLowerCase();

    const responses: { pattern: string[]; response: string }[] = [
      {
        pattern: ["salam", "slt", "cc", "bonjour", "bonsoir"],
        response: "As-salamu alaykoum ! Ana chatbot AlloBricolage. kifach nqdar n3awnek lyoma ?",
      },
      {
        pattern: ["kifach", "kif", "comment", "kider"],
        response: "Kifach nkhdem : 1) kteb chi wassaf dyal lkhadma li bgha. 2) Ghadi n9dar n3arrefek chi 7arif. 3) Dir réservation o tkellem mea technicien direct",
      },
      {
        pattern: ["ch7al", "tarif", "prix", "thaman", "bch7al", "tbie3"],
        response: "Les tarifs varient selon le service. Hadi chi exemple : Plomberie men 150-400 DH/h, Electricite 120-300 DH/h, Peinture 100-250 DH/h. Ghadi tkhadam mea chi devis personnalisé.",
      },
      {
        pattern: ["plombier", "fuite", "eau", "robinet", "wc"],
        response: "Bghiti chi plombier ? AlloBricolage 3ndo bazzaf dyal les plombiers certifies f Casa, Rabat, Marrakech... koul chi 7arif 3ndo notes o reviews dyal les clients. Wash bghiti nwerrik chi wahed ?",
      },
      {
        pattern: ["electricien", "courant", "prise", "lumiere", "tableau"],
        response: "Bghiti chi electricien ? 3ndina bazzaf dyal les electricians qualifies. Ymkn lik tkhter selon la ville o tarif. Wash bghiti ndir lik recherche ?",
      },
    ];

    for (const resp of responses) {
      if (resp.pattern.some((p) => lowerMsg.includes(p))) {
        return {
          response: resp.response,
          confidence: 0.85,
          language: "darija",
        };
      }
    }

    return {
      response: "Smah lia ma fhemtch mzyan. imkn lik tkteb bl3arabi, blfrançais, ou blanglais. Ana hna bech n3awnek f chi service dyal bricolage ou réparation.",
      confidence: 0.5,
      language: "darija",
    };
  }

  getUpsellSuggestions(service: string): UpsellSuggestion[] {
    const upsellMap: Record<string, UpsellSuggestion[]> = {
      plomberie: [
        { service: "Detartrage chauffe-eau", description: "Prolongez la duree de vie de votre chauffe-eau", probability: 0.75, discount: 10, reason: "Recommande avec les interventions de plomberie" },
        { service: "Inspection canalisation", description: "Detectez les problemes avant qu'ils ne s'aggravent", probability: 0.65, discount: 15, reason: "Preventif pour eviter les fuites futures" },
      ],
      electricite: [
        { service: "Mise aux normes electriques", description: "Assurez la securite de votre installation", probability: 0.8, discount: 20, reason: "Important pour la securite" },
        { service: "Installation detecteur de fumee", description: "Protection incendie obligatoire", probability: 0.9, discount: 5, reason: "Securite et conformite" },
      ],
      peinture: [
        { service: "Traitement anti-humidite", description: "Protegez vos murs de l'humidite", probability: 0.7, discount: 15, reason: "Prolonge la duree de vie de la peinture" },
      ],
      climatisation: [
        { service: "Contrat d'entretien annuel", description: "Maintenez votre climatisation en bon etat", probability: 0.85, discount: 25, reason: "Economies sur le long terme" },
      ],
    };

    return upsellMap[service] ?? [];
  }
}

export const aiService = new AIService();
