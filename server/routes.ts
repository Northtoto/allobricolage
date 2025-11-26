import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import { setupAuth } from "./auth";
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
      const allTechnicians = await storage.getAllTechnicians();
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
      const { city, service } = req.query;
      let technicians = await storage.getAllTechnicians();
      
      if (city) {
        technicians = technicians.filter(
          t => t.city.toLowerCase() === (city as string).toLowerCase()
        );
      }
      
      if (service) {
        technicians = technicians.filter(
          t => t.services.includes(service as string)
        );
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
      const technician = await storage.getTechnician(req.params.id);
      if (!technician) {
        return res.status(404).json({ error: "Technician not found" });
      }
      res.json(technician);
    } catch (error) {
      console.error("Get technician error:", error);
      res.status(500).json({ error: "Failed to get technician" });
    }
  });

  // ==================== BOOKING ROUTES ====================

  // Create booking
  app.post("/api/bookings", async (req, res) => {
    try {
      const { jobId, technicianId, clientName, clientPhone, scheduledDate, scheduledTime } = req.body;
      
      if (!jobId || !technicianId || !clientName || !clientPhone || !scheduledDate || !scheduledTime) {
        return res.status(400).json({ error: "All booking fields are required" });
      }

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const technician = await storage.getTechnician(technicianId);
      if (!technician) {
        return res.status(404).json({ error: "Technician not found" });
      }

      const booking = await storage.createBooking({
        jobId,
        technicianId,
        clientName,
        clientPhone,
        scheduledDate,
        scheduledTime,
        status: "pending",
        estimatedCost: job.likelyCost,
        matchScore: 0.85,
        matchExplanation: `Réservation pour ${technician.name}`,
      });

      // Update job status
      await storage.updateJob(jobId, { status: "accepted" });

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
