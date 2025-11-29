import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { registerPaymentRoutes } from "./payment-routes";
import { requireAuth, requireRole } from "./middleware/auth-guard";
import { 
  analyzeJobDescription, 
  estimateCost, 
  matchTechnicians,
  generateUpsellSuggestions
} from "./ai-service";
import { insertJobSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";

const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "allobricolage-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Setup authentication routes
  setupAuth(app);
  
  // Setup payment routes
  registerPaymentRoutes(app);
  
  // ==================== JOB ROUTES ====================
  
  // Analyze job description with AI
  app.post("/api/jobs/analyze", async (req, res) => {
    try {
      const { description, city, urgency } = req.body;
      
      if (!description || !city) {
        return res.status(400).json({ error: "Description and city are required" });
      }

      const analysis = await analyzeJobDescription(description, city, urgency || "normal");
      const costEstimate = await estimateCost(
        description,
        analysis.service,
        city,
        analysis.urgency,
        analysis.complexity
      );

      res.json({ analysis, costEstimate });
    } catch (error) {
      console.error("Job analysis error:", error);
      res.status(500).json({ error: "Failed to analyze job" });
    }
  });

  // Create job and find matches
  app.post("/api/jobs", async (req, res) => {
    try {
      const { description, city, urgency, analysis } = req.body;
      
      if (!description || !city || !analysis) {
        return res.status(400).json({ error: "Description, city, and analysis are required" });
      }

      // Get cost estimate
      const costEstimate = await estimateCost(
        description,
        analysis.service,
        city,
        urgency || analysis.urgency,
        analysis.complexity
      );

      // Create job
      const job = await storage.createJob({
        description,
        service: analysis.service,
        subServices: analysis.subServices,
        city,
        urgency: urgency || analysis.urgency,
        complexity: analysis.complexity,
        estimatedDuration: analysis.estimatedDuration,
        minCost: costEstimate.minCost,
        maxCost: costEstimate.maxCost,
        likelyCost: costEstimate.likelyCost,
        confidence: costEstimate.confidence,
        status: "pending",
        extractedKeywords: analysis.extractedKeywords,
        aiAnalysis: analysis,
      });

      // Get all technicians and match
      const allTechnicians = await storage.getAllTechniciansWithUsers();
      const matches = await matchTechnicians(
        allTechnicians,
        description,
        analysis.service,
        city,
        urgency || analysis.urgency,
        costEstimate
      );

      // Get upsell suggestions
      const upsellSuggestions = generateUpsellSuggestions(analysis.service);

      res.json({ 
        job, 
        matches, 
        costEstimate,
        upsellSuggestions 
      });
    } catch (error) {
      console.error("Create job error:", error);
      res.status(500).json({ error: "Failed to create job" });
    }
  });

  // Get job by ID
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Get job error:", error);
      res.status(500).json({ error: "Failed to get job" });
    }
  });

  // ==================== TECHNICIAN ROUTES ====================

  // Get all technicians
  app.get("/api/technicians", async (req, res) => {
    try {
      const { 
        city, 
        service, 
        minRating, 
        available, 
        search,
        sortBy 
      } = req.query;
      
      let technicians = await storage.getAllTechniciansWithUsers();
      
      // Filter by city
      if (city && city !== 'all') {
        technicians = technicians.filter(
          t => t.city?.toLowerCase() === (city as string).toLowerCase()
        );
      }
      
      // Filter by service
      if (service && service !== 'all') {
        technicians = technicians.filter(
          t => t.services.includes(service as string)
        );
      }

      // Filter by minimum rating
      if (minRating) {
        const rating = parseFloat(minRating as string);
        technicians = technicians.filter(t => t.rating >= rating);
      }

      // Filter by availability
      if (available === 'true') {
        technicians = technicians.filter(t => t.isAvailable);
      }

      // Search by name or bio
      if (search) {
        const searchLower = (search as string).toLowerCase();
        technicians = technicians.filter(t => 
          t.name.toLowerCase().includes(searchLower) ||
          t.bio?.toLowerCase().includes(searchLower) ||
          t.services.some(s => s.toLowerCase().includes(searchLower))
        );
      }

      // Sort results
      if (sortBy) {
        switch (sortBy) {
          case 'rating':
            technicians.sort((a, b) => b.rating - a.rating);
            break;
          case 'price-low':
            technicians.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
            break;
          case 'price-high':
            technicians.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
            break;
          case 'reviews':
            technicians.sort((a, b) => b.reviewCount - a.reviewCount);
            break;
          case 'experience':
            technicians.sort((a, b) => b.yearsExperience - a.yearsExperience);
            break;
          default:
            // Default: sort by rating
            technicians.sort((a, b) => b.rating - a.rating);
        }
      } else {
        // Default sorting: featured first, then by rating
        technicians.sort((a, b) => {
          if (a.isPromo !== b.isPromo) return b.isPromo ? 1 : -1;
          if (a.isPro !== b.isPro) return b.isPro ? 1 : -1;
          return b.rating - a.rating;
        });
      }

      res.json(technicians);
    } catch (error) {
      console.error("Get technicians error:", error);
      res.status(500).json({ error: "Failed to get technicians" });
    }
  });

  // Get technician by ID
  app.get("/api/technicians/:id", async (req, res) => {
    try {
      const technician = await storage.getTechnicianWithUser(req.params.id);
      if (!technician) {
        return res.status(404).json({ error: "Technician not found" });
      }
      res.json(technician);
    } catch (error) {
      console.error("Get technician error:", error);
      res.status(500).json({ error: "Failed to get technician" });
    }
  });

  // ==================== REVIEW ROUTES ====================

  // Get reviews for a technician
  app.get("/api/technicians/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByTechnician(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });

  // Create a review (requires authentication)
  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const { technicianId, bookingId, rating, comment, serviceQuality, punctuality, professionalism, valueForMoney } = req.body;

      if (!technicianId || !rating || !comment) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      const review = await storage.createReview({
        technicianId,
        clientId: req.user.id,
        bookingId: bookingId || null,
        rating,
        comment,
        serviceQuality: serviceQuality || null,
        punctuality: punctuality || null,
        professionalism: professionalism || null,
        valueForMoney: valueForMoney || null,
        isVerified: !!bookingId, // Verified if linked to a booking
      });

      res.status(201).json(review);
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Update review (technician response)
  app.patch("/api/reviews/:id/response", requireRole("technician"), async (req, res) => {
    try {
      const { response } = req.body;
      
      if (!response) {
        return res.status(400).json({ error: "Response text is required" });
      }

      const review = await storage.getReview(req.params.id);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }

      // Verify the technician owns this review
      const technician = await storage.getTechnicianByUserId(req.user.id);
      if (!technician || technician.id !== review.technicianId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const updated = await storage.updateReview(req.params.id, {
        technicianResponse: response
      });

      res.json(updated);
    } catch (error) {
      console.error("Update review error:", error);
      res.status(500).json({ error: "Failed to update review" });
    }
  });

  // ==================== BOOKING ROUTES ====================

  // Create booking (requires authentication)
  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const { jobId, technicianId, clientName, clientPhone, scheduledDate, scheduledTime, description } = req.body;
      
      if (!technicianId || !clientName || !clientPhone || !scheduledDate || !scheduledTime) {
        return res.status(400).json({ error: "All booking fields are required" });
      }

      const technicianWithUser = await storage.getTechnicianWithUser(technicianId);
      if (!technicianWithUser) {
        return res.status(404).json({ error: "Technician not found" });
      }

      let actualJobId = jobId;
      let estimatedCost = technicianWithUser.hourlyRate || 200;

      // Handle direct bookings (no pre-existing job)
      if (!jobId || jobId === "direct") {
        const primaryService = technicianWithUser.services[0] || "general";
        const newJob = await storage.createJob({
          description: description || `Réservation directe avec ${technicianWithUser.name}`,
          city: technicianWithUser.city || "Casablanca",
          service: primaryService,
          urgency: "normal",
          complexity: "medium",
          status: "accepted",
          likelyCost: estimatedCost,
          minCost: Math.round(estimatedCost * 0.8),
          maxCost: Math.round(estimatedCost * 1.3),
          extractedKeywords: [primaryService],
        });
        actualJobId = newJob.id;
      } else {
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ error: "Job not found" });
        }
        estimatedCost = job.likelyCost || estimatedCost;
      }

      const booking = await storage.createBooking({
        jobId: actualJobId,
        technicianId,
        clientName,
        clientPhone,
        scheduledDate,
        scheduledTime,
        status: "pending",
        estimatedCost,
        matchScore: 0.90,
        matchExplanation: `Réservation confirmée avec ${technicianWithUser.name}`,
      });

      // Update job status
      await storage.updateJob(actualJobId, { status: "accepted" });

      // Debug logging
      console.log("✅ Booking created successfully:", {
        id: booking.id,
        status: booking.status,
        technicianId: booking.technicianId,
        estimatedCost: booking.estimatedCost
      });

      res.json(booking);
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  // Get all bookings
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Get bookings error:", error);
      res.status(500).json({ error: "Failed to get bookings" });
    }
  });

  // ==================== TECHNICIAN DASHBOARD ROUTES ====================

  // Get technician stats (mock for now)
  app.get("/api/technician/stats", async (_req, res) => {
    try {
      // In a real app, this would be based on authenticated technician
      const stats = {
        totalEarnings: 45600,
        pendingJobs: 3,
        completedJobs: 127,
        averageRating: 4.8,
        responseRate: 94,
        thisMonthEarnings: 8500,
        lastMonthEarnings: 7200,
      };
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Get pending jobs for technician
  app.get("/api/technician/pending-jobs", async (_req, res) => {
    try {
      const jobs = await storage.getJobsByStatus("pending");
      
      // Transform to pending job format
      const pendingJobs = jobs.map(job => ({
        id: job.id,
        description: job.description,
        service: job.service,
        city: job.city,
        urgency: job.urgency,
        clientName: "Client",
        estimatedCost: job.likelyCost || 250,
        distance: Math.floor(Math.random() * 10) + 1,
        matchScore: 0.85 + Math.random() * 0.1,
        createdAt: job.createdAt?.toISOString() || new Date().toISOString(),
      }));
      
      res.json(pendingJobs);
    } catch (error) {
      console.error("Get pending jobs error:", error);
      res.status(500).json({ error: "Failed to get pending jobs" });
    }
  });

  // Accept job
  app.post("/api/technician/jobs/:id/accept", async (req, res) => {
    try {
      const job = await storage.updateJob(req.params.id, { status: "accepted" });
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json({ success: true, job });
    } catch (error) {
      console.error("Accept job error:", error);
      res.status(500).json({ error: "Failed to accept job" });
    }
  });

  // Decline job
  app.post("/api/technician/jobs/:id/decline", async (req, res) => {
    try {
      const job = await storage.updateJob(req.params.id, { status: "cancelled" });
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Decline job error:", error);
      res.status(500).json({ error: "Failed to decline job" });
    }
  });

  // ==================== CLIENT DASHBOARD ROUTES ====================

  // Get client stats
  app.get("/api/client/stats", async (_req, res) => {
    try {
      const stats = {
        activeJobs: 2,
        completedJobs: 15,
        totalSpent: 12500,
        averageRating: 4.7,
      };
      res.json(stats);
    } catch (error) {
      console.error("Get client stats error:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Get client jobs
  app.get("/api/client/jobs", async (_req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      const clientJobs = jobs.map(job => ({
        id: job.id,
        description: job.description,
        service: job.service,
        city: job.city,
        urgency: job.urgency,
        status: job.status,
        estimatedCost: job.likelyCost || 250,
        createdAt: job.createdAt?.toISOString() || new Date().toISOString(),
      }));
      res.json(clientJobs);
    } catch (error) {
      console.error("Get client jobs error:", error);
      res.status(500).json({ error: "Failed to get jobs" });
    }
  });

  // ==================== DARIJA CHAT ROUTES ====================

  // DarijaChat endpoint
  app.post("/api/chat/darija", async (req, res) => {
    try {
      const { message, history } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // AI-powered Darija chat response
      const { darijaChat } = await import("./ai-service");
      const response = await darijaChat(message, history || []);
      
      res.json({ response });
    } catch (error) {
      console.error("DarijaChat error:", error);
      // Fallback response in Darija
      res.json({ 
        response: "Smhli, kayna mochkila teknika. 3awed l message dyalek mn ba3d." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
