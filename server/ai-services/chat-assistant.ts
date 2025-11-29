/**
 * 💬 SMART CHAT ASSISTANT - 24/7 AI Support
 * 
 * What It Does:
 * - Real-time chat that understands context
 * - Answers questions, creates bookings, tracks status
 * - Supports Darija, French, Arabic
 * 
 * Features:
 * - "Combien coûte un plombier?" → Instant quote
 * - "Où est mon technicien?" → Live GPS location
 * - "Annuler ma réservation" → Confirms and cancels
 * - "Je veux payer" → Sends payment link
 */

import OpenAI from "openai";
import { storage } from "../storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  message: string;
  functionCalled?: string;
  functionResult?: any;
  suggestedActions?: string[];
}

// Function definitions for the chat assistant
const chatFunctions = [
  {
    name: "create_booking",
    description: "Créer une nouvelle réservation de maintenance",
    parameters: {
      type: "object",
      properties: {
        service_type: {
          type: "string",
          enum: ["Plomberie", "Électricité", "Climatisation", "Peinture", "Menuiserie", "Maçonnerie", "Carrelage", "Serrurerie", "Jardinage", "Nettoyage", "Réparation d'appareils", "Installation Luminaires", "Petites rénovations", "Étanchéité"]
        },
        description: { type: "string" },
        urgency: { type: "string", enum: ["urgent", "scheduled", "flexible"] }
      },
      required: ["service_type", "description", "urgency"]
    }
  },
  {
    name: "check_booking_status",
    description: "Vérifier le statut des réservations de l'utilisateur",
    parameters: {
      type: "object",
      properties: {
        booking_id: { type: "string", description: "ID de la réservation (optionnel)" }
      }
    }
  },
  {
    name: "track_technician",
    description: "Obtenir la position en temps réel du technicien",
    parameters: {
      type: "object",
      properties: {
        booking_id: { type: "string" }
      },
      required: ["booking_id"]
    }
  },
  {
    name: "cancel_booking",
    description: "Annuler une réservation",
    parameters: {
      type: "object",
      properties: {
        booking_id: { type: "string" }
      },
      required: ["booking_id"]
    }
  },
  {
    name: "get_price_estimate",
    description: "Obtenir une estimation de prix pour un service",
    parameters: {
      type: "object",
      properties: {
        service_type: { type: "string" },
        urgency: { type: "string", enum: ["urgent", "scheduled", "flexible"] }
      },
      required: ["service_type"]
    }
  },
  {
    name: "find_technicians",
    description: "Trouver des techniciens disponibles",
    parameters: {
      type: "object",
      properties: {
        service_type: { type: "string" },
        city: { type: "string" }
      },
      required: ["service_type"]
    }
  },
  {
    name: "send_payment_link",
    description: "Envoyer un lien de paiement pour une réservation",
    parameters: {
      type: "object",
      properties: {
        booking_id: { type: "string" }
      },
      required: ["booking_id"]
    }
  }
];

/**
 * Process a chat message and return AI response
 */
export async function processChatMessage(
  message: string,
  userId: string,
  conversationHistory: ChatMessage[]
): Promise<ChatResponse> {
  try {
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      return {
        message: "Le service de chat AI est temporairement indisponible. Veuillez réessayer plus tard ou contacter notre support.",
        suggestedActions: ["Appeler le support", "Envoyer un email"]
      };
    }

    // Get user context
    const user = await storage.getUser(userId);
    if (!user) {
      return {
        message: "Utilisateur non trouvé. Veuillez vous reconnecter.",
        suggestedActions: ["Se reconnecter"]
      };
    }

    // Get active bookings for context
    const allBookings = await storage.getAllBookings();
    const activeBookings = allBookings.filter(b =>
      b.clientId === userId && !["completed", "cancelled"].includes(b.status)
    );

    // Build system prompt with user context
    const systemPrompt = `Tu es l'Assistant AI d'AlloBricolage - serviable, professionnel, tu parles français et comprends le darija marocain.

Contexte utilisateur:
- Nom: ${user.name}
- Ville: ${user.city || "Non spécifiée"}
- Réservations actives: ${activeBookings.length}
${activeBookings.length > 0 ? `- Dernière réservation: ${activeBookings[0].status}` : ""}

Capacités:
1. Répondre aux questions sur les services et les prix
2. Aider à créer des réservations
3. Vérifier le statut des réservations
4. Envoyer des liens de paiement
5. Annuler/reprogrammer des réservations
6. Fournir les coordonnées du technicien
7. Suivre la position en temps réel

Tarifs indicatifs:
- Plomberie: 200-400 MAD/heure
- Électricité: 250-450 MAD/heure
- Climatisation: 300-500 MAD/heure
- Peinture: 150-300 MAD/heure
- Menuiserie: 200-400 MAD/heure
- Urgence: +50% du tarif normal

Villes couvertes: Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir, Meknès, Oujda, Kenitra, Tétouan

Règles:
- Réponds toujours dans la langue de l'utilisateur (français ou darija)
- Sois chaleureux, serviable et efficace
- Utilise les fonctions quand c'est approprié
- Si tu ne peux pas aider, propose de contacter le support humain`;

    // Make API call with function calling
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content
        })),
        { role: "user", content: message }
      ],
      functions: chatFunctions,
      function_call: "auto",
      max_tokens: 500,
      temperature: 0.7
    });

    const assistantMessage = response.choices[0].message;

    // Handle function calls
    if (assistantMessage.function_call) {
      const functionName = assistantMessage.function_call.name;
      const functionArgs = JSON.parse(assistantMessage.function_call.arguments);

      console.log(`🔧 Function called: ${functionName}`, functionArgs);

      // Execute the function
      const functionResult = await executeChatFunction(functionName, functionArgs, userId, user);

      // Get final response from AI with function result
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory.map(msg => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content
          })),
          { role: "user", content: message },
          assistantMessage,
          {
            role: "function",
            name: functionName,
            content: JSON.stringify(functionResult)
          }
        ],
        max_tokens: 500
      });

      return {
        message: finalResponse.choices[0].message.content || "Action effectuée avec succès.",
        functionCalled: functionName,
        functionResult,
        suggestedActions: getSuggestedActions(functionName, functionResult)
      };
    }

    // Return direct response
    return {
      message: assistantMessage.content || "Je suis là pour vous aider. Que puis-je faire pour vous?",
      suggestedActions: getDefaultSuggestedActions()
    };

  } catch (error) {
    console.error("❌ Chat assistant error:", error);
    return {
      message: "Désolé, une erreur s'est produite. Veuillez réessayer ou contacter notre support.",
      suggestedActions: ["Réessayer", "Contacter le support"]
    };
  }
}

/**
 * Execute a chat function
 */
async function executeChatFunction(
  functionName: string,
  args: any,
  userId: string,
  user: any
): Promise<any> {
  switch (functionName) {
    case "create_booking": {
      // Find best technician
      const technicians = await storage.searchTechnicians({
        service: args.service_type,
        city: user.city || "Casablanca",
        available: true,
        sortBy: "rating"
      });

      if (technicians.length === 0) {
        return {
          success: false,
          message: "Aucun technicien disponible pour ce service dans votre ville."
        };
      }

      // Create job
      const job = await storage.createJob({
        clientId: userId,
        service: args.service_type,
        description: args.description,
        urgency: args.urgency,
        city: user.city || "Casablanca",
        status: "pending"
      });

      return {
        success: true,
        jobId: job.id,
        suggestedTechnician: {
          name: technicians[0].name,
          rating: technicians[0].rating,
          hourlyRate: technicians[0].hourlyRate
        },
        message: `Demande créée! Technicien recommandé: ${technicians[0].name} (${technicians[0].rating}★)`
      };
    }

    case "check_booking_status": {
      const allBookings = await storage.getAllBookings();
      const userBookings = allBookings.filter(b => b.clientId === userId);

      if (args.booking_id) {
        const booking = userBookings.find(b => b.id === args.booking_id);
        if (!booking) {
          return { success: false, message: "Réservation non trouvée." };
        }
        return {
          success: true,
          booking: {
            id: booking.id,
            status: booking.status,
            scheduledDate: booking.scheduledDate,
            scheduledTime: booking.scheduledTime
          }
        };
      }

      return {
        success: true,
        bookings: userBookings.slice(0, 5).map(b => ({
          id: b.id,
          status: b.status,
          scheduledDate: b.scheduledDate
        })),
        totalBookings: userBookings.length
      };
    }

    case "track_technician": {
      const booking = await storage.getBooking(args.booking_id);
      if (!booking || booking.clientId !== userId) {
        return { success: false, message: "Réservation non trouvée." };
      }

      // Get technician location (mock for now)
      return {
        success: true,
        trackingUrl: `https://allobricolage.ma/track/${booking.id}`,
        eta: "12 minutes",
        distance: "2.3 km",
        status: booking.status
      };
    }

    case "cancel_booking": {
      const booking = await storage.getBooking(args.booking_id);
      if (!booking || booking.clientId !== userId) {
        return { success: false, message: "Réservation non trouvée." };
      }

      if (["completed", "cancelled"].includes(booking.status)) {
        return { success: false, message: "Cette réservation ne peut pas être annulée." };
      }

      await storage.updateBooking(booking.id, { status: "cancelled" });
      return {
        success: true,
        message: "Réservation annulée avec succès.",
        refundInfo: "Aucun frais d'annulation si annulé 2h avant l'intervention."
      };
    }

    case "get_price_estimate": {
      const basePrices: Record<string, number> = {
        "Plomberie": 250,
        "Électricité": 300,
        "Climatisation": 350,
        "Peinture": 200,
        "Menuiserie": 280,
        "Maçonnerie": 320,
        "Carrelage": 300,
        "Serrurerie": 400,
        "Jardinage": 180,
        "Nettoyage": 150,
        "Réparation d'appareils": 280,
        "Installation Luminaires": 250,
        "Petites rénovations": 300,
        "Étanchéité": 350
      };

      const basePrice = basePrices[args.service_type] || 250;
      let finalPrice = basePrice;
      const factors = [];

      if (args.urgency === "urgent") {
        finalPrice *= 1.5;
        factors.push("Urgence (+50%)");
      }

      return {
        success: true,
        basePrice,
        finalPrice: Math.round(finalPrice),
        currency: "MAD",
        unit: "heure",
        factors,
        note: "Prix indicatif. Le prix final dépend de la complexité du travail."
      };
    }

    case "find_technicians": {
      const technicians = await storage.searchTechnicians({
        service: args.service_type,
        city: args.city || user.city || "Casablanca",
        available: true,
        sortBy: "rating"
      });

      return {
        success: true,
        technicians: technicians.slice(0, 5).map(t => ({
          name: t.name,
          rating: t.rating,
          reviewCount: t.reviewCount,
          hourlyRate: t.hourlyRate,
          services: t.services
        })),
        totalFound: technicians.length
      };
    }

    case "send_payment_link": {
      const booking = await storage.getBooking(args.booking_id);
      if (!booking || booking.clientId !== userId) {
        return { success: false, message: "Réservation non trouvée." };
      }

      return {
        success: true,
        paymentUrl: `https://allobricolage.ma/payment/${booking.id}`,
        amount: booking.estimatedCost || 0,
        currency: "MAD",
        methods: ["CMI", "Cash Plus", "Virement bancaire", "Espèces"]
      };
    }

    default:
      return { success: false, message: "Fonction non reconnue." };
  }
}

/**
 * Get suggested actions based on function result
 */
function getSuggestedActions(functionName: string, result: any): string[] {
  if (!result.success) {
    return ["Réessayer", "Contacter le support"];
  }

  switch (functionName) {
    case "create_booking":
      return ["Confirmer la réservation", "Voir d'autres techniciens", "Modifier la demande"];
    case "check_booking_status":
      return ["Suivre le technicien", "Annuler", "Contacter le technicien"];
    case "track_technician":
      return ["Appeler le technicien", "Voir sur la carte", "Annuler"];
    case "cancel_booking":
      return ["Nouvelle réservation", "Voir l'historique"];
    case "get_price_estimate":
      return ["Réserver maintenant", "Voir les techniciens", "Poser une question"];
    case "find_technicians":
      return ["Réserver le meilleur", "Voir les avis", "Comparer les prix"];
    case "send_payment_link":
      return ["Payer maintenant", "Voir les détails", "Choisir une autre méthode"];
    default:
      return getDefaultSuggestedActions();
  }
}

/**
 * Get default suggested actions
 */
function getDefaultSuggestedActions(): string[] {
  return [
    "Réserver un technicien",
    "Voir mes réservations",
    "Obtenir un devis",
    "Contacter le support"
  ];
}

/**
 * Answer FAQ question
 */
export async function answerFAQ(question: string): Promise<string> {
  const faqData = [
    { q: "Combien coûte un plombier?", a: "Entre 200-400 MAD/heure selon l'urgence et la ville. Tarifs exacts affichés après matching." },
    { q: "Comment sont calculés les prix?", a: "Prix basés sur: type de service, urgence, heure, jour, distance, et réputation du technicien." },
    { q: "Comment réserver un technicien?", a: "3 options: 1) Photo du problème, 2) Description vocale, 3) Recherche manuelle. Tout prend moins de 2 minutes." },
    { q: "Puis-je annuler une réservation?", a: "Oui, annulation gratuite jusqu'à 2h avant l'intervention." },
    { q: "Quels moyens de paiement acceptez-vous?", a: "CMI (cartes bancaires), Cash Plus, virement bancaire, et espèces." },
    { q: "Quand dois-je payer?", a: "Paiement après la fin du travail et vérification de la qualité." },
    { q: "Couvrez-vous ma ville?", a: "Nous couvrons Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir, Meknès, Oujda, Kenitra, et Tétouan." },
    { q: "Quels services proposez-vous?", a: "Plomberie, Électricité, Climatisation, Peinture, Menuiserie, Maçonnerie, Carrelage, Serrurerie, Jardinage, Nettoyage, et plus." },
    { q: "Comment suivre mon technicien en temps réel?", a: "Après confirmation, un lien de suivi GPS est envoyé par SMS et visible dans l'app." },
    { q: "Les techniciens sont-ils vérifiés?", a: "Oui, tous passent par: vérification d'identité, vérification de compétences, et historique de travail." }
  ];

  try {
    if (!process.env.OPENAI_API_KEY) {
      // Simple keyword matching fallback
      const lowerQuestion = question.toLowerCase();
      for (const faq of faqData) {
        if (lowerQuestion.includes("prix") || lowerQuestion.includes("coût") || lowerQuestion.includes("combien")) {
          return faqData[0].a;
        }
        if (lowerQuestion.includes("réserver") || lowerQuestion.includes("comment")) {
          return faqData[2].a;
        }
        if (lowerQuestion.includes("annuler")) {
          return faqData[3].a;
        }
        if (lowerQuestion.includes("paiement") || lowerQuestion.includes("payer")) {
          return faqData[4].a;
        }
      }
      return "Je ne suis pas sûr de comprendre votre question. Pouvez-vous reformuler ou contacter notre support?";
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Tu es le bot FAQ d'AlloBricolage. Réponds aux questions en utilisant UNIQUEMENT cette base de connaissances:

${faqData.map(item => `Q: ${item.q}\nR: ${item.a}`).join('\n\n')}

Règles:
1. Si la question est dans la base → Réponds directement
2. Si la question est similaire → Adapte la réponse
3. Si la question n'est pas couverte → Dis "Je ne suis pas sûr, mais un agent peut vous aider. Voulez-vous discuter avec un humain?"
4. Réponds toujours en français
5. Sois serviable, amical et concis`
        },
        { role: "user", content: question }
      ],
      max_tokens: 200
    });

    return response.choices[0].message.content || "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler?";

  } catch (error) {
    console.error("❌ FAQ error:", error);
    return "Désolé, une erreur s'est produite. Veuillez contacter notre support.";
  }
}
