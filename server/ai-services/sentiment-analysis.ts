/**
 * 😊 SENTIMENT ANALYSIS - Detect Unhappy Clients
 * 
 * What It Does:
 * - Analyzes review text
 * - Detects negative sentiment
 * - Alerts management
 * - Auto-offers compensation
 * 
 * Business Impact:
 * - Identify unhappy clients before they churn
 * - Proactive customer service
 * - Reduce negative reviews
 */

import OpenAI from "openai";
import { storage } from "../storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface SentimentResult {
  sentiment: "positive" | "neutral" | "negative" | "very_negative";
  score: number; // -1 to 1
  issues: string[];
  urgency: "low" | "medium" | "high" | "critical";
  recommendedAction: string;
  emotionalTone: string[];
  keyPhrases: string[];
  requiresFollowUp: boolean;
}

/**
 * Analyze sentiment of review text
 */
export async function analyzeSentiment(reviewText: string): Promise<SentimentResult> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return getBasicSentimentAnalysis(reviewText);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyse le sentiment de cet avis client (en français, arabe ou darija).

Retourne un JSON avec:
{
  "sentiment": "positive" | "neutral" | "negative" | "very_negative",
  "score": -1 à 1 (négatif à positif),
  "issues": ["liste des plaintes spécifiques"],
  "urgency": "low" | "medium" | "high" | "critical",
  "recommendedAction": "action recommandée",
  "emotionalTone": ["émotions détectées"],
  "keyPhrases": ["phrases clés"],
  "requiresFollowUp": true/false
}

Critères:
- very_negative: Client très mécontent, risque de plainte publique
- negative: Client insatisfait mais récupérable
- neutral: Avis mitigé
- positive: Client satisfait

Urgence:
- critical: Menace de plainte, demande de remboursement
- high: Très mécontent, problème non résolu
- medium: Insatisfait mais pas urgent
- low: Feedback constructif`
        },
        {
          role: "user",
          content: reviewText
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    return JSON.parse(jsonMatch[0]) as SentimentResult;

  } catch (error) {
    console.error("❌ Sentiment analysis error:", error);
    return getBasicSentimentAnalysis(reviewText);
  }
}

/**
 * Basic sentiment analysis without AI
 */
function getBasicSentimentAnalysis(text: string): SentimentResult {
  const lowerText = text.toLowerCase();
  
  // Negative keywords
  const negativeWords = [
    "mauvais", "nul", "horrible", "déçu", "arnaque", "voleur", "incompétent",
    "retard", "sale", "cher", "jamais", "pire", "problème", "catastrophe",
    "رديء", "سيء", "غالي", "متأخر" // Arabic negative words
  ];
  
  // Positive keywords
  const positiveWords = [
    "excellent", "parfait", "super", "génial", "professionnel", "rapide",
    "propre", "recommande", "satisfait", "merci", "bravo", "top",
    "ممتاز", "رائع", "شكرا" // Arabic positive words
  ];

  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;
  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;

  let sentiment: SentimentResult["sentiment"];
  let score: number;
  let urgency: SentimentResult["urgency"];

  if (negativeCount > 2) {
    sentiment = "very_negative";
    score = -0.8;
    urgency = "high";
  } else if (negativeCount > positiveCount) {
    sentiment = "negative";
    score = -0.4;
    urgency = "medium";
  } else if (positiveCount > negativeCount) {
    sentiment = "positive";
    score = 0.6;
    urgency = "low";
  } else {
    sentiment = "neutral";
    score = 0;
    urgency = "low";
  }

  return {
    sentiment,
    score,
    issues: negativeCount > 0 ? ["Analyse automatique - vérification manuelle recommandée"] : [],
    urgency,
    recommendedAction: negativeCount > 1 ? "Contacter le client" : "Aucune action requise",
    emotionalTone: [],
    keyPhrases: [],
    requiresFollowUp: negativeCount > 1
  };
}

/**
 * Auto-respond to negative reviews
 */
export async function handleNegativeReview(
  reviewId: string,
  userId: string,
  sentiment: SentimentResult
): Promise<{
  notificationSent: boolean;
  compensationOffered: boolean;
  compensationCode?: string;
  alertSent: boolean;
}> {
  const result = {
    notificationSent: false,
    compensationOffered: false,
    compensationCode: undefined as string | undefined,
    alertSent: false
  };

  try {
    // Alert management for critical issues
    if (sentiment.urgency === "critical" || sentiment.urgency === "high") {
      console.log(`🚨 ALERT: Negative review detected!
Review ID: ${reviewId}
Sentiment: ${sentiment.sentiment}
Score: ${sentiment.score}
Issues: ${sentiment.issues.join(", ")}
Urgency: ${sentiment.urgency}
Action: ${sentiment.recommendedAction}`);
      result.alertSent = true;
    }

    // Offer compensation for critical cases
    if (sentiment.urgency === "critical") {
      const compensationCode = `SORRY${Date.now().toString().slice(-6)}`;
      
      await storage.createNotification({
        userId,
        type: "system",
        title: "Nous sommes désolés",
        message: `Nous avons remarqué votre insatisfaction et nous en sommes vraiment désolés. Un responsable vous contactera dans l'heure. En attendant, voici un code promo de 50 MAD: ${compensationCode}`
      });

      result.notificationSent = true;
      result.compensationOffered = true;
      result.compensationCode = compensationCode;
    } else if (sentiment.sentiment === "negative" || sentiment.sentiment === "very_negative") {
      // Send apology notification
      await storage.createNotification({
        userId,
        type: "system",
        title: "Merci pour votre retour",
        message: "Nous avons bien reçu votre avis et nous prenons vos commentaires très au sérieux. Notre équipe travaille à améliorer nos services."
      });

      result.notificationSent = true;
    }

    return result;

  } catch (error) {
    console.error("❌ Error handling negative review:", error);
    return result;
  }
}

/**
 * Analyze trends in reviews
 */
export async function analyzeReviewTrends(
  technicianId: string
): Promise<{
  overallSentiment: string;
  averageScore: number;
  commonIssues: string[];
  strengths: string[];
  trend: "improving" | "stable" | "declining";
  recommendations: string[];
}> {
  try {
    const reviews = await storage.getReviewsByTechnician(technicianId);
    
    if (reviews.length === 0) {
      return {
        overallSentiment: "neutral",
        averageScore: 0,
        commonIssues: [],
        strengths: [],
        trend: "stable",
        recommendations: ["Encourager les clients à laisser des avis"]
      };
    }

    // Analyze each review
    const sentiments: SentimentResult[] = [];
    for (const review of reviews.slice(0, 20)) { // Limit to last 20 reviews
      const sentiment = await analyzeSentiment(review.comment || "");
      sentiments.push(sentiment);
    }

    // Calculate average score
    const averageScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;

    // Determine overall sentiment
    let overallSentiment: string;
    if (averageScore > 0.5) overallSentiment = "très positif";
    else if (averageScore > 0) overallSentiment = "positif";
    else if (averageScore > -0.5) overallSentiment = "mitigé";
    else overallSentiment = "négatif";

    // Collect common issues
    const allIssues = sentiments.flatMap(s => s.issues);
    const issueCounts: Record<string, number> = {};
    for (const issue of allIssues) {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    }
    const commonIssues = Object.entries(issueCounts)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue);

    // Determine trend (compare recent vs older)
    const recentSentiments = sentiments.slice(0, 5);
    const olderSentiments = sentiments.slice(5, 10);
    
    let trend: "improving" | "stable" | "declining" = "stable";
    if (recentSentiments.length > 0 && olderSentiments.length > 0) {
      const recentAvg = recentSentiments.reduce((sum, s) => sum + s.score, 0) / recentSentiments.length;
      const olderAvg = olderSentiments.reduce((sum, s) => sum + s.score, 0) / olderSentiments.length;
      
      if (recentAvg > olderAvg + 0.2) trend = "improving";
      else if (recentAvg < olderAvg - 0.2) trend = "declining";
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (averageScore < 0) {
      recommendations.push("Formation sur le service client recommandée");
    }
    if (commonIssues.length > 0) {
      recommendations.push(`Améliorer: ${commonIssues[0]}`);
    }
    if (trend === "declining") {
      recommendations.push("Attention: tendance à la baisse - action urgente");
    }

    return {
      overallSentiment,
      averageScore: Math.round(averageScore * 100) / 100,
      commonIssues,
      strengths: [], // Would extract from positive reviews
      trend,
      recommendations
    };

  } catch (error) {
    console.error("❌ Review trend analysis error:", error);
    return {
      overallSentiment: "unknown",
      averageScore: 0,
      commonIssues: [],
      strengths: [],
      trend: "stable",
      recommendations: ["Analyse non disponible"]
    };
  }
}

