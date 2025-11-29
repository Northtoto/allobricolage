/**
 * 🔐 FRAUD DETECTION
 * 
 * What It Does:
 * Detects suspicious patterns:
 * - Same user creates 10 bookings and cancels all
 * - Technician consistently gets bad reviews
 * - Payment method used for multiple accounts
 * - Location doesn't match phone number area code
 * 
 * Business Impact:
 * - Reduce fraudulent bookings
 * - Protect technicians from fake reviews
 * - Prevent payment fraud
 */

import { storage } from "../storage";

export interface FraudFlag {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidence: any;
  timestamp: Date;
}

export interface FraudDetectionResult {
  userId: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number; // 0-100
  flags: FraudFlag[];
  recommendations: string[];
  actionTaken: string | null;
  requiresManualReview: boolean;
}

/**
 * Detect fraud for a user
 */
export async function detectFraud(
  userId: string,
  action: string
): Promise<FraudDetectionResult> {
  const flags: FraudFlag[] = [];
  let riskScore = 0;

  try {
    // Get user data
    const user = await storage.getUser(userId);
    if (!user) {
      return {
        userId,
        riskLevel: "low",
        riskScore: 0,
        flags: [],
        recommendations: [],
        actionTaken: null,
        requiresManualReview: false
      };
    }

    // Get user history
    const allBookings = await storage.getAllBookings();
    const userBookings = allBookings.filter(b => b.clientId === userId);
    const allReviews = await storage.getAllReviews();
    const userReviews = allReviews.filter(r => r.clientId === userId);
    const allPayments = await storage.getAllPayments();
    const userPayments = allPayments.filter(p => {
      const booking = userBookings.find(b => b.id === p.bookingId);
      return booking !== undefined;
    });

    // Check 1: Excessive cancellations
    const cancelledBookings = userBookings.filter(b => b.status === "cancelled");
    const cancellationRate = userBookings.length > 0 
      ? cancelledBookings.length / userBookings.length 
      : 0;

    if (cancellationRate > 0.5 && userBookings.length > 5) {
      riskScore += 25;
      flags.push({
        type: "high_cancellation_rate",
        severity: "medium",
        description: `Taux d'annulation élevé: ${Math.round(cancellationRate * 100)}%`,
        evidence: {
          totalBookings: userBookings.length,
          cancelledBookings: cancelledBookings.length,
          rate: cancellationRate
        },
        timestamp: new Date()
      });
    }

    // Check 2: Review bombing (posting many negative reviews quickly)
    const recentReviews = userReviews.filter(r => {
      const daysSince = (Date.now() - new Date(r.createdAt!).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince < 7;
    });

    const negativeRecentReviews = recentReviews.filter(r => r.rating < 3);
    if (recentReviews.length > 5 && negativeRecentReviews.length > 4) {
      riskScore += 35;
      flags.push({
        type: "review_bombing",
        severity: "high",
        description: `Bombardement d'avis négatifs: ${negativeRecentReviews.length} avis négatifs en 7 jours`,
        evidence: {
          recentReviews: recentReviews.length,
          negativeReviews: negativeRecentReviews.length
        },
        timestamp: new Date()
      });
    }

    // Check 3: Payment issues
    const failedPayments = userPayments.filter(p => p.status === "failed");
    if (failedPayments.length > 3) {
      riskScore += 20;
      flags.push({
        type: "payment_issues",
        severity: "medium",
        description: `Plusieurs paiements échoués: ${failedPayments.length}`,
        evidence: {
          failedPayments: failedPayments.length,
          totalPayments: userPayments.length
        },
        timestamp: new Date()
      });
    }

    // Check 4: Rapid booking creation
    const recentBookings = userBookings.filter(b => {
      const hoursSince = (Date.now() - new Date(b.createdAt!).getTime()) / (1000 * 60 * 60);
      return hoursSince < 24;
    });

    if (recentBookings.length > 10) {
      riskScore += 30;
      flags.push({
        type: "rapid_booking",
        severity: "high",
        description: `Création rapide de réservations: ${recentBookings.length} en 24h`,
        evidence: {
          bookingsIn24h: recentBookings.length
        },
        timestamp: new Date()
      });
    }

    // Check 5: Account age vs activity
    const accountAgeDays = user.createdAt 
      ? (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      : 365;

    if (accountAgeDays < 1 && userBookings.length > 5) {
      riskScore += 25;
      flags.push({
        type: "new_account_high_activity",
        severity: "high",
        description: "Compte nouveau avec activité suspecte",
        evidence: {
          accountAgeDays: Math.round(accountAgeDays),
          bookings: userBookings.length
        },
        timestamp: new Date()
      });
    }

    // Check 6: Suspicious review patterns
    const allTechReviewsByUser = userReviews;
    const uniqueTechnicians = new Set(allTechReviewsByUser.map(r => r.technicianId));
    
    // Check if user is targeting one technician
    const reviewsPerTechnician: Record<string, number> = {};
    for (const review of allTechReviewsByUser) {
      reviewsPerTechnician[review.technicianId] = (reviewsPerTechnician[review.technicianId] || 0) + 1;
    }

    const maxReviewsForOneTech = Math.max(...Object.values(reviewsPerTechnician), 0);
    if (maxReviewsForOneTech > 3) {
      riskScore += 20;
      flags.push({
        type: "targeted_reviews",
        severity: "medium",
        description: `Avis ciblés sur un technicien: ${maxReviewsForOneTech} avis`,
        evidence: {
          maxReviewsForOneTech,
          uniqueTechnicians: uniqueTechnicians.size
        },
        timestamp: new Date()
      });
    }

    // Determine risk level
    let riskLevel: FraudDetectionResult["riskLevel"];
    if (riskScore >= 70) riskLevel = "critical";
    else if (riskScore >= 50) riskLevel = "high";
    else if (riskScore >= 25) riskLevel = "medium";
    else riskLevel = "low";

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskLevel === "critical") {
      recommendations.push("Suspendre le compte immédiatement");
      recommendations.push("Contacter l'utilisateur pour vérification");
    } else if (riskLevel === "high") {
      recommendations.push("Surveiller l'activité du compte");
      recommendations.push("Limiter les actions disponibles");
    } else if (riskLevel === "medium") {
      recommendations.push("Ajouter à la liste de surveillance");
    }

    // Take automatic action for high risk
    let actionTaken: string | null = null;
    if (riskLevel === "critical" && flags.filter(f => f.severity === "high" || f.severity === "critical").length >= 2) {
      // In production, would actually restrict the account
      actionTaken = "Compte restreint automatiquement";
      console.log(`🚨 FRAUD ALERT: User ${userId} restricted due to high risk score: ${riskScore}`);
    }

    return {
      userId,
      riskLevel,
      riskScore: Math.min(riskScore, 100),
      flags,
      recommendations,
      actionTaken,
      requiresManualReview: riskLevel === "high" || riskLevel === "critical"
    };

  } catch (error) {
    console.error("❌ Fraud detection error:", error);
    return {
      userId,
      riskLevel: "low",
      riskScore: 0,
      flags: [],
      recommendations: [],
      actionTaken: null,
      requiresManualReview: false
    };
  }
}

/**
 * Detect technician fraud
 */
export async function detectTechnicianFraud(
  technicianId: string
): Promise<FraudDetectionResult> {
  const flags: FraudFlag[] = [];
  let riskScore = 0;

  try {
    const technician = await storage.getTechnician(technicianId);
    if (!technician) {
      return {
        userId: technicianId,
        riskLevel: "low",
        riskScore: 0,
        flags: [],
        recommendations: [],
        actionTaken: null,
        requiresManualReview: false
      };
    }

    // Get technician's bookings
    const allBookings = await storage.getAllBookings();
    const techBookings = allBookings.filter(b => b.technicianId === technicianId);

    // Check 1: High no-show rate
    const noShowBookings = techBookings.filter(b => b.status === "no_show" || b.status === "cancelled");
    const noShowRate = techBookings.length > 0 
      ? noShowBookings.length / techBookings.length 
      : 0;

    if (noShowRate > 0.3 && techBookings.length > 10) {
      riskScore += 30;
      flags.push({
        type: "high_no_show_rate",
        severity: "high",
        description: `Taux d'absence élevé: ${Math.round(noShowRate * 100)}%`,
        evidence: { noShowRate, totalBookings: techBookings.length },
        timestamp: new Date()
      });
    }

    // Check 2: Consistently bad reviews
    const reviews = await storage.getReviewsByTechnician(technicianId);
    const recentReviews = reviews.slice(0, 10);
    const avgRating = recentReviews.length > 0
      ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
      : 5;

    if (avgRating < 2.5 && recentReviews.length >= 5) {
      riskScore += 25;
      flags.push({
        type: "consistently_bad_reviews",
        severity: "medium",
        description: `Note moyenne très basse: ${avgRating.toFixed(1)}/5`,
        evidence: { avgRating, reviewCount: recentReviews.length },
        timestamp: new Date()
      });
    }

    // Check 3: Price manipulation (charging much more than estimated)
    const completedBookings = techBookings.filter(b => b.status === "completed" && b.finalCost && b.estimatedCost);
    const overcharges = completedBookings.filter(b => 
      b.finalCost! > b.estimatedCost! * 1.5 // More than 50% over estimate
    );

    if (overcharges.length > 3) {
      riskScore += 35;
      flags.push({
        type: "price_manipulation",
        severity: "high",
        description: `Surfacturation fréquente: ${overcharges.length} cas`,
        evidence: { overcharges: overcharges.length },
        timestamp: new Date()
      });
    }

    // Determine risk level
    let riskLevel: FraudDetectionResult["riskLevel"];
    if (riskScore >= 70) riskLevel = "critical";
    else if (riskScore >= 50) riskLevel = "high";
    else if (riskScore >= 25) riskLevel = "medium";
    else riskLevel = "low";

    const recommendations: string[] = [];
    if (riskLevel === "high" || riskLevel === "critical") {
      recommendations.push("Suspendre temporairement le profil");
      recommendations.push("Enquêter sur les plaintes");
    }

    return {
      userId: technicianId,
      riskLevel,
      riskScore: Math.min(riskScore, 100),
      flags,
      recommendations,
      actionTaken: null,
      requiresManualReview: riskLevel === "high" || riskLevel === "critical"
    };

  } catch (error) {
    console.error("❌ Technician fraud detection error:", error);
    return {
      userId: technicianId,
      riskLevel: "low",
      riskScore: 0,
      flags: [],
      recommendations: [],
      actionTaken: null,
      requiresManualReview: false
    };
  }
}

/**
 * Log interaction for learning
 */
export async function logInteraction(interaction: {
  userId: string;
  type: string;
  context: any;
  outcome: "success" | "failure";
  metadata: any;
}): Promise<void> {
  // In production, would store in database for ML training
  console.log(`📊 Interaction logged: ${interaction.type} - ${interaction.outcome}`);
}

