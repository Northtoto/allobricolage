/**
 * 🤖 AI ROUTES - API Endpoints for All AI Services
 * 
 * Exposes the following AI features:
 * 1. Photo Verification - Before/After work verification
 * 2. Voice Booking - Darija/French/Arabic voice commands
 * 3. Chat Assistant - 24/7 AI support
 * 4. Dynamic Pricing - Smart pricing engine
 * 5. Smart Matching - 9-factor technician matching
 * 6. Sentiment Analysis - Review sentiment detection
 * 7. Fraud Detection - Pattern-based fraud prevention
 * 8. Equipment Identification - Photo → parts finder
 */

import { Router, Express } from "express";
import multer from "multer";
import { requireAuth, requireRole, rateLimit } from "./middleware/auth-guard";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Import AI services
import {
  verifyWorkCompletion,
  identifyEquipment,
  checkWorkQuality,
  processVoiceBooking,
  understandSMSIntent,
  translateText,
  translateReview,
  processChatMessage,
  answerFAQ,
  calculateDynamicPrice,
  getPriceRange,
  estimateTotalJobCost,
  applyDiscountCode,
  intelligentTechnicianMatching,
  findMultiSkillTechnician,
  getPersonalizedRecommendations,
  analyzeSentiment,
  handleNegativeReview,
  analyzeReviewTrends,
  detectFraud,
  detectTechnicianFraud,
  logInteraction,
  analyzeEquipmentPhoto,
  getSeverityDescription,
  getUrgencyLabel
} from "./ai-services";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// ==================== PHOTO VERIFICATION ====================

/**
 * POST /api/ai/photo/verify-work
 * Verify work completion by comparing before/after photos
 */
router.post(
  "/photo/verify-work",
  requireAuth as any,
  rateLimit(10, 60000) as any, // 10 requests per minute
  upload.fields([
    { name: "beforePhoto", maxCount: 1 },
    { name: "afterPhoto", maxCount: 1 }
  ]) as any,
  async (req, res) => {
    try {
      const files = req.files as any;

      if (!files.beforePhoto || !files.afterPhoto) {
        return res.status(400).json({ error: "Both before and after photos are required" });
      }

      const beforePhotoBase64 = files.beforePhoto[0].buffer.toString("base64");
      const afterPhotoBase64 = files.afterPhoto[0].buffer.toString("base64");
      const { jobDescription, serviceType } = req.body;

      const result = await verifyWorkCompletion(
        beforePhotoBase64,
        afterPhotoBase64,
        jobDescription || "Travail de maintenance",
        serviceType || "Général"
      );

      res.json(result);
    } catch (error) {
      console.error("Photo verification error:", error);
      res.status(500).json({ error: "Failed to verify work" });
    }
  }
);

/**
 * POST /api/ai/photo/identify-equipment
 * Identify equipment from a photo
 */
router.post(
  "/photo/identify-equipment",
  rateLimit(20, 60000) as any,
  upload.single("photo") as any,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Photo is required" });
      }

      const photoBase64 = req.file.buffer.toString("base64");
      const result = await identifyEquipment(photoBase64);

      res.json(result);
    } catch (error) {
      console.error("Equipment identification error:", error);
      res.status(500).json({ error: "Failed to identify equipment" });
    }
  }
);

/**
 * POST /api/ai/photo/quality-check
 * Check quality of completed work
 */
router.post(
  "/photo/quality-check",
  requireAuth as any,
  rateLimit(10, 60000) as any,
  upload.single("photo") as any,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Photo is required" });
      }

      const photoBase64 = req.file.buffer.toString("base64");
      const { serviceType, expectedOutcome } = req.body;

      const result = await checkWorkQuality(
        photoBase64,
        serviceType || "Général",
        expectedOutcome || "Travail terminé correctement"
      );

      res.json(result);
    } catch (error) {
      console.error("Quality check error:", error);
      res.status(500).json({ error: "Failed to check quality" });
    }
  }
);

// ==================== SMART PHOTO DIAGNOSIS ====================

/**
 * POST /api/ai/photo/diagnose
 * Smart Photo Diagnosis - Upload & Get Instant Quote
 * 
 * Client takes photo of broken equipment → AI identifies problem
 * → Instant cost estimate → Matched technicians → Auto-create job
 */
router.post(
  "/photo/diagnose",
  requireAuth as any,
  rateLimit(10, 60000) as any, // 10 requests per minute
  upload.single("photo") as any,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Photo is required" });
      }

      const currentUser = req.user as User;
      const imageBase64 = req.file.buffer.toString("base64");
      const { city, address, autoCreateJob } = req.body;
      const userCity = city || "Casablanca";
      const userAddress = address || "À définir";

      console.log(`📸 Processing photo diagnosis for user ${currentUser.id}...`);

      // Step 1: Analyze the photo with AI
      const analysis = await analyzeEquipmentPhoto(imageBase64);

      // Step 2: Find matching technicians
      const matchedTechnicians = await storage.searchTechnicians({
        service: analysis.serviceType,
        city: userCity,
        available: true,
        sortBy: "rating"
      });

      let job = null;

      // Step 3: Auto-create job if requested
      if (autoCreateJob === "true" || autoCreateJob === true) {
        job = await storage.createJob({
          clientId: currentUser.id,
          service: analysis.serviceType,
          description: `${analysis.equipmentType}: ${analysis.problem}\n\n${analysis.problemDetails}\n\nAdresse: ${userAddress}`,
          city: userCity,
          urgency: analysis.urgency,
          status: "pending",
          aiAnalysis: JSON.stringify({
            photoAnalysis: analysis,
            userAddress: userAddress,
            analyzedAt: new Date().toISOString()
          })
        });

        console.log(`✅ Job created: ${job.id}`);
      }

      // Step 4: Return comprehensive response
      res.json({
        success: true,
        analysis: {
          equipmentType: analysis.equipmentType,
          brand: analysis.brand,
          model: analysis.model,
          problem: analysis.problem,
          problemDetails: analysis.problemDetails,
          severity: analysis.severity,
          severityDescription: getSeverityDescription(analysis.severity),
          serviceType: analysis.serviceType,
          estimatedTime: analysis.estimatedTime,
          estimatedCost: analysis.estimatedCost,
          requiredParts: analysis.requiredParts,
          safetyConcerns: analysis.safetyConcerns,
          urgency: analysis.urgency,
          urgencyLabel: getUrgencyLabel(analysis.urgency),
          recommendations: analysis.recommendations,
          confidence: analysis.confidence
        },
        job: job ? {
          id: job.id,
          status: job.status,
          createdAt: job.createdAt
        } : null,
        matchedTechnicians: matchedTechnicians.slice(0, 5).map(tech => ({
          id: tech.id,
          name: tech.name,
          rating: tech.rating,
          reviewCount: tech.reviewCount,
          hourlyRate: tech.hourlyRate,
          services: tech.services,
          city: tech.city,
          isAvailable: tech.isAvailable,
          isPro: tech.isPro,
          photoUrl: (tech as any).photoUrl
        })),
        autoBookingAvailable: matchedTechnicians.length > 0,
        recommendedTechnician: matchedTechnicians[0] ? {
          id: matchedTechnicians[0].id,
          name: matchedTechnicians[0].name,
          rating: matchedTechnicians[0].rating,
          hourlyRate: matchedTechnicians[0].hourlyRate
        } : null
      });

    } catch (error) {
      console.error("Photo diagnosis error:", error);
      res.status(500).json({ 
        error: "Failed to analyze photo",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

/**
 * POST /api/ai/photo/diagnose-and-book
 * One-click: Photo diagnosis + Auto-book best technician
 */
router.post(
  "/photo/diagnose-and-book",
  requireAuth as any,
  rateLimit(5, 60000) as any, // 5 requests per minute
  upload.single("photo") as any,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Photo is required" });
      }

      const currentUser = req.user as User;
      const imageBase64 = req.file.buffer.toString("base64");
      const { city, address, scheduledDate, scheduledTime, technicianId } = req.body;
      const userCity = city || "Casablanca";
      const userAddress = address || "À définir";

      console.log(`📸🔧 Processing photo diagnosis + auto-booking for user ${currentUser.id}...`);

      // Step 1: Analyze the photo
      const analysis = await analyzeEquipmentPhoto(imageBase64);

      // Step 2: Find matching technicians
      const matchedTechnicians = await storage.searchTechnicians({
        service: analysis.serviceType,
        city: userCity,
        available: true,
        sortBy: "rating"
      });

      if (matchedTechnicians.length === 0) {
        return res.status(404).json({
          error: "No technicians available",
          message: `Aucun technicien disponible pour ${analysis.serviceType} à ${userCity}`,
          analysis
        });
      }

      // Step 3: Select technician (specified or best match)
      const selectedTechnician = technicianId 
        ? matchedTechnicians.find(t => t.id === technicianId) || matchedTechnicians[0]
        : matchedTechnicians[0];

      // Step 4: Create job
      const job = await storage.createJob({
        clientId: currentUser.id,
        service: analysis.serviceType,
        description: `${analysis.equipmentType}: ${analysis.problem}\n\n${analysis.problemDetails}\n\nAdresse: ${userAddress}`,
        city: userCity,
        urgency: analysis.urgency,
        status: "pending",
        aiAnalysis: JSON.stringify({
          photoAnalysis: analysis,
          userAddress: userAddress,
          autoBooked: true,
          analyzedAt: new Date().toISOString()
        })
      });

      // Step 5: Create booking
      const user = await storage.getUser(currentUser.id);
      const booking = await storage.createBooking({
        jobId: job.id,
        technicianId: selectedTechnician.id,
        clientId: currentUser.id,
        clientName: user?.name || "Client",
        clientPhone: user?.phone || "",
        scheduledDate: scheduledDate || new Date().toISOString().split("T")[0],
        scheduledTime: scheduledTime || "10:00",
        status: "pending",
        estimatedCost: analysis.estimatedCost.total
      });

      // Step 6: Create notification for technician
      const techUser = await storage.getTechnician(selectedTechnician.id);
      if (techUser?.userId) {
        await storage.createNotification({
          userId: techUser.userId,
          type: "booking",
          title: "🆕 Nouvelle demande de réservation",
          message: `${analysis.serviceType}: ${analysis.problem} - ${analysis.estimatedCost.total} MAD`,
          bookingId: booking.id
        });
      }

      res.json({
        success: true,
        message: "Diagnostic complété et réservation créée!",
        analysis: {
          equipmentType: analysis.equipmentType,
          problem: analysis.problem,
          severity: analysis.severity,
          serviceType: analysis.serviceType,
          estimatedCost: analysis.estimatedCost,
          urgency: analysis.urgency,
          confidence: analysis.confidence
        },
        job: {
          id: job.id,
          status: job.status
        },
        booking: {
          id: booking.id,
          status: booking.status,
          scheduledDate: booking.scheduledDate,
          scheduledTime: booking.scheduledTime,
          estimatedCost: booking.estimatedCost
        },
        technician: {
          id: selectedTechnician.id,
          name: selectedTechnician.name,
          rating: selectedTechnician.rating,
          hourlyRate: selectedTechnician.hourlyRate
        },
        nextSteps: [
          "Le technicien recevra votre demande",
          "Il acceptera ou proposera un autre créneau",
          "Vous serez notifié de sa réponse"
        ]
      });

    } catch (error) {
      console.error("Photo diagnosis + booking error:", error);
      res.status(500).json({ 
        error: "Failed to process request",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

// ==================== VOICE BOOKING ====================

/**
 * POST /api/ai/voice/booking
 * Process voice booking from audio
 */
router.post(
  "/voice/booking",
  requireAuth as any,
  rateLimit(5, 60000) as any, // 5 requests per minute (voice processing is expensive)
  upload.single("audio") as any,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Audio file is required" });
      }

      const currentUser = req.user as User;
      const user = await storage.getUser(currentUser.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const result = await processVoiceBooking(
        req.file.buffer,
        user.id,
        user.city || "Casablanca",
        req.body.address
      );

      res.json(result);
    } catch (error) {
      console.error("Voice booking error:", error);
      res.status(500).json({ error: "Failed to process voice booking" });
    }
  }
);

/**
 * POST /api/ai/voice/sms-intent
 * Understand SMS intent
 */
router.post(
  "/voice/sms-intent",
  rateLimit(30, 60000),
  async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const result = await understandSMSIntent(message);
      res.json(result);
    } catch (error) {
      console.error("SMS intent error:", error);
      res.status(500).json({ error: "Failed to understand SMS" });
    }
  }
);

/**
 * POST /api/ai/translate
 * Translate text between languages
 */
router.post(
  "/translate",
  rateLimit(30, 60000),
  async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      if (!text || !targetLanguage) {
        return res.status(400).json({ error: "Text and target language are required" });
      }

      const result = await translateText(text, targetLanguage);
      res.json({ translation: result });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Failed to translate" });
    }
  }
);

/**
 * POST /api/ai/translate/review
 * Translate review to multiple languages
 */
router.post(
  "/translate/review",
  rateLimit(20, 60000),
  async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const result = await translateReview(text);
      res.json(result);
    } catch (error) {
      console.error("Review translation error:", error);
      res.status(500).json({ error: "Failed to translate review" });
    }
  }
);

// ==================== CHAT ASSISTANT ====================

/**
 * POST /api/ai/chat
 * Process chat message
 */
router.post(
  "/chat",
  requireAuth as any,
  rateLimit(30, 60000) as any,
  async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const currentUser = req.user as User;
      const result = await processChatMessage(
        message,
        currentUser.id,
        history || []
      );

      res.json(result);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat" });
    }
  }
);

/**
 * POST /api/ai/faq
 * Answer FAQ question
 */
router.post(
  "/faq",
  rateLimit(60, 60000),
  async (req, res) => {
    try {
      const { question } = req.body;
      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const answer = await answerFAQ(question);
      res.json({ answer });
    } catch (error) {
      console.error("FAQ error:", error);
      res.status(500).json({ error: "Failed to answer FAQ" });
    }
  }
);

// ==================== DYNAMIC PRICING ====================

/**
 * POST /api/ai/pricing/calculate
 * Calculate dynamic price
 */
router.post(
  "/pricing/calculate",
  rateLimit(60, 60000),
  async (req, res) => {
    try {
      const params = req.body;
      if (!params.serviceType) {
        return res.status(400).json({ error: "Service type is required" });
      }

      const result = await calculateDynamicPrice({
        serviceType: params.serviceType,
        city: params.city || "Casablanca",
        urgency: params.urgency || "scheduled",
        scheduledDate: params.scheduledDate || new Date().toISOString().split("T")[0],
        scheduledTime: params.scheduledTime || "10:00",
        technicianId: params.technicianId,
        distanceKm: params.distanceKm,
        complexity: params.complexity
      });

      res.json(result);
    } catch (error) {
      console.error("Pricing error:", error);
      res.status(500).json({ error: "Failed to calculate price" });
    }
  }
);

/**
 * GET /api/ai/pricing/range/:serviceType
 * Get price range for a service
 */
router.get(
  "/pricing/range/:serviceType",
  async (req, res) => {
    try {
      const result = getPriceRange(req.params.serviceType);
      res.json(result);
    } catch (error) {
      console.error("Price range error:", error);
      res.status(500).json({ error: "Failed to get price range" });
    }
  }
);

/**
 * POST /api/ai/pricing/estimate
 * Estimate total job cost
 */
router.post(
  "/pricing/estimate",
  rateLimit(30, 60000),
  async (req, res) => {
    try {
      const params = req.body;
      if (!params.serviceType) {
        return res.status(400).json({ error: "Service type is required" });
      }

      const result = await estimateTotalJobCost({
        serviceType: params.serviceType,
        city: params.city || "Casablanca",
        urgency: params.urgency || "scheduled",
        estimatedHours: params.estimatedHours || 2,
        complexity: params.complexity || "medium"
      });

      res.json(result);
    } catch (error) {
      console.error("Estimate error:", error);
      res.status(500).json({ error: "Failed to estimate cost" });
    }
  }
);

/**
 * POST /api/ai/pricing/discount
 * Apply discount code
 */
router.post(
  "/pricing/discount",
  async (req, res) => {
    try {
      const { price, code } = req.body;
      if (!price || !code) {
        return res.status(400).json({ error: "Price and code are required" });
      }

      const result = applyDiscountCode(price, code);
      res.json(result);
    } catch (error) {
      console.error("Discount error:", error);
      res.status(500).json({ error: "Failed to apply discount" });
    }
  }
);

// ==================== SMART MATCHING ====================

/**
 * POST /api/ai/match/smart
 * Get intelligent technician matches for a job
 */
router.post(
  "/match/smart",
  requireAuth as any,
  rateLimit(20, 60000) as any,
  async (req, res) => {
    try {
      const { jobId } = req.body;
      if (!jobId) {
        return res.status(400).json({ error: "Job ID is required" });
      }

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const currentUser = req.user as User;
      const matches = await intelligentTechnicianMatching(job, currentUser.id);
      res.json({
        recommendedTechnicians: matches.slice(0, 5),
        topMatch: matches[0] || null,
        totalMatches: matches.length,
        matchingAlgorithm: "AI-powered with 9 factors"
      });
    } catch (error) {
      console.error("Smart matching error:", error);
      res.status(500).json({ error: "Failed to match technicians" });
    }
  }
);

/**
 * POST /api/ai/match/multi-skill
 * Find technician with multiple skills
 */
router.post(
  "/match/multi-skill",
  rateLimit(20, 60000),
  async (req, res) => {
    try {
      const { skills, city } = req.body;
      if (!skills || !Array.isArray(skills)) {
        return res.status(400).json({ error: "Skills array is required" });
      }

      const matches = await findMultiSkillTechnician(skills, city || "Casablanca");
      res.json(matches);
    } catch (error) {
      console.error("Multi-skill matching error:", error);
      res.status(500).json({ error: "Failed to find technicians" });
    }
  }
);

/**
 * GET /api/ai/match/recommendations
 * Get personalized technician recommendations
 */
router.get(
  "/match/recommendations",
  requireAuth as any,
  rateLimit(30, 60000) as any,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const currentUser = req.user as User;
      const recommendations = await getPersonalizedRecommendations(currentUser.id, limit);
      res.json(recommendations);
    } catch (error) {
      console.error("Recommendations error:", error);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  }
);

// ==================== SENTIMENT ANALYSIS ====================

/**
 * POST /api/ai/sentiment/analyze
 * Analyze sentiment of text
 */
router.post(
  "/sentiment/analyze",
  rateLimit(30, 60000),
  async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const result = await analyzeSentiment(text);
      res.json(result);
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      res.status(500).json({ error: "Failed to analyze sentiment" });
    }
  }
);

/**
 * GET /api/ai/sentiment/trends/:technicianId
 * Get review trends for a technician
 */
router.get(
  "/sentiment/trends/:technicianId",
  rateLimit(20, 60000),
  async (req, res) => {
    try {
      const result = await analyzeReviewTrends(req.params.technicianId);
      res.json(result);
    } catch (error) {
      console.error("Trends analysis error:", error);
      res.status(500).json({ error: "Failed to analyze trends" });
    }
  }
);

// ==================== FRAUD DETECTION ====================

/**
 * GET /api/ai/fraud/check/:userId
 * Check user for fraud
 */
router.get(
  "/fraud/check/:userId",
  requireAuth as any,
  requireRole("admin") as any,
  rateLimit(30, 60000) as any,
  async (req, res) => {
    try {
      const result = await detectFraud(req.params.userId, "manual_check");
      res.json(result);
    } catch (error) {
      console.error("Fraud check error:", error);
      res.status(500).json({ error: "Failed to check fraud" });
    }
  }
);

/**
 * GET /api/ai/fraud/technician/:technicianId
 * Check technician for fraud
 */
router.get(
  "/fraud/technician/:technicianId",
  requireAuth as any,
  requireRole("admin") as any,
  rateLimit(30, 60000) as any,
  async (req, res) => {
    try {
      const result = await detectTechnicianFraud(req.params.technicianId);
      res.json(result);
    } catch (error) {
      console.error("Technician fraud check error:", error);
      res.status(500).json({ error: "Failed to check technician fraud" });
    }
  }
);

// ==================== BOOKING COMPLETION WITH AI VERIFICATION ====================

/**
 * POST /api/ai/bookings/:id/complete-with-verification
 * Complete booking with AI photo verification
 */
router.post(
  "/bookings/:id/complete-with-verification",
  requireAuth as any,
  requireRole("technician") as any,
  rateLimit(10, 60000) as any,
  upload.fields([
    { name: "beforePhoto", maxCount: 1 },
    { name: "afterPhoto", maxCount: 1 }
  ]) as any,
  async (req, res) => {
    try {
      const bookingId = req.params.id;
      const booking = await storage.getBooking(bookingId);

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Verify technician owns this booking
      const currentUser = req.user as User;
      const technician = await storage.getTechnicianByUserId(currentUser.id);
      if (!technician || booking.technicianId !== technician.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files.beforePhoto || !files.afterPhoto) {
        return res.status(400).json({ error: "Both before and after photos are required" });
      }

      const beforePhotoBase64 = files.beforePhoto[0].buffer.toString("base64");
      const afterPhotoBase64 = files.afterPhoto[0].buffer.toString("base64");

      // Get job details for description
      const job = await storage.getJob(booking.jobId);
      const jobDescription = job?.description || "Travail de maintenance";
      const serviceType = job?.service || "Général";

      // AI verification
      const verification = await verifyWorkCompletion(
        beforePhotoBase64,
        afterPhotoBase64,
        jobDescription,
        serviceType
      );

      if (verification.recommendation === "approve") {
        // Auto-complete booking
        await storage.updateBooking(booking.id, { status: "completed" });

        // Update job status
        if (job) {
          await storage.updateJob(job.id, { status: "completed" });
        }

        // Auto-release payment if exists
        const payment = await storage.getPaymentByBooking(booking.id);
        if (payment && payment.status === "pending") {
          await storage.updatePayment(payment.id, {
            status: "completed",
            paidAt: new Date()
          });
        }

        // Notify client
        if (booking.clientId) {
          await storage.createNotification({
            userId: booking.clientId,
            type: "booking",
            title: "Travail terminé ✅",
            message: `Travail vérifié par AI: ${verification.qualityRating}/5 étoiles. ${verification.explanation}`,
            bookingId: booking.id
          });
        }

        // Log interaction for ML
        await logInteraction({
          userId: currentUser.id,
          type: "booking_completion",
          context: { bookingId, verification },
          outcome: "success",
          metadata: { autoApproved: true }
        });

        res.json({
          success: true,
          verification,
          autoApproved: true,
          message: "Travail vérifié et approuvé automatiquement!"
        });

      } else {
        // Manual review required
        await storage.createNotification({
          userId: booking.clientId!,
          type: "system",
          title: "Vérification en cours",
          message: "Le travail est en cours de vérification. Un responsable vous contactera si nécessaire.",
          bookingId: booking.id
        });

        res.json({
          success: true,
          verification,
          autoApproved: false,
          requiresReview: true,
          message: "Travail soumis pour vérification manuelle."
        });
      }

    } catch (error) {
      console.error("Completion with verification error:", error);
      res.status(500).json({ error: "Failed to complete booking" });
    }
  }
);

/**
 * Register AI routes with the Express app
 */
export function registerAIRoutes(app: Express) {
  app.use("/api/ai", router);
  console.log("✅ AI routes registered");
}

export default router;
