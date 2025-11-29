/**
 * N8N Automation Webhook Endpoints
 *
 * These endpoints are designed to integrate with N8N workflows for:
 * - Sending SMS to technicians when new jobs are posted
 * - Sending SMS notifications for booking updates
 * - Automated follow-up messages
 * - Payment reminders
 */

import type { Express } from "express";
import { storage } from "./storage";
import type { Booking, Job, TechnicianWithUser } from "@shared/schema";

export function registerN8NRoutes(app: Express) {

  /**
   * POST /api/webhooks/n8n/job-created
   * Webhook triggered when a new job is created
   * N8N will send SMS to matching technicians
   */
  app.post("/api/webhooks/n8n/job-created", async (req, res) => {
    try {
      const { jobId, matchedTechnicians } = req.body;

      if (!jobId) {
        return res.status(400).json({ error: "Missing jobId" });
      }

      // Get job details
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Get technician details for all matches
      const techniciansData = [];
      if (matchedTechnicians && Array.isArray(matchedTechnicians)) {
        for (const match of matchedTechnicians) {
          const tech = await storage.getTechnicianWithUser(match.technicianId);
          if (tech && tech.phone) {
            techniciansData.push({
              technicianId: tech.id,
              name: tech.name,
              phone: tech.phone,
              matchScore: match.matchScore,
              estimatedCost: match.estimatedCost.likelyCost,
              service: job.service,
              city: job.city,
              urgency: job.urgency,
              description: job.description
            });
          }
        }
      }

      // Return data for N8N to process
      res.json({
        success: true,
        job: {
          id: job.id,
          service: job.service,
          city: job.city,
          urgency: job.urgency,
          description: job.description,
          estimatedCost: job.likelyCost
        },
        technicians: techniciansData,
        smsCount: techniciansData.length,
        message: `${techniciansData.length} technician(s) ready for SMS notification`
      });

    } catch (error) {
      console.error("N8N job-created webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  /**
   * POST /api/webhooks/n8n/booking-confirmed
   * Webhook triggered when a booking is confirmed
   * N8N will send SMS to technician with booking details
   */
  app.post("/api/webhooks/n8n/booking-confirmed", async (req, res) => {
    try {
      const { bookingId } = req.body;

      if (!bookingId) {
        return res.status(400).json({ error: "Missing bookingId" });
      }

      // Get booking details
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Get technician details
      const technician = await storage.getTechnicianWithUser(booking.technicianId);
      if (!technician) {
        return res.status(404).json({ error: "Technician not found" });
      }

      // Get job details
      const job = await storage.getJob(booking.jobId);

      // Prepare SMS data
      const smsData = {
        to: technician.phone,
        technicianName: technician.name,
        clientName: booking.clientName,
        clientPhone: booking.clientPhone,
        service: job?.service || "Service",
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        estimatedCost: booking.estimatedCost,
        city: job?.city || "",
        trackingLink: `${process.env.BASE_URL || 'http://localhost:5000'}/track/${bookingId}`
      };

      res.json({
        success: true,
        smsData,
        message: "Booking confirmation ready for SMS"
      });

    } catch (error) {
      console.error("N8N booking-confirmed webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  /**
   * POST /api/webhooks/n8n/payment-reminder
   * Webhook for sending payment reminders
   */
  app.post("/api/webhooks/n8n/payment-reminder", async (req, res) => {
    try {
      const { bookingId } = req.body;

      if (!bookingId) {
        return res.status(400).json({ error: "Missing bookingId" });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Check payment status
      const payment = await storage.getPaymentByBooking(bookingId);

      if (payment && payment.status === "completed") {
        return res.json({
          success: false,
          message: "Payment already completed, no reminder needed"
        });
      }

      const smsData = {
        to: booking.clientPhone,
        clientName: booking.clientName,
        bookingId: booking.id,
        amount: booking.estimatedCost,
        paymentLink: `${process.env.BASE_URL || 'http://localhost:5000'}/payment/${bookingId}`
      };

      res.json({
        success: true,
        smsData,
        message: "Payment reminder ready for SMS"
      });

    } catch (error) {
      console.error("N8N payment-reminder webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  /**
   * POST /api/webhooks/n8n/tracking-started
   * Webhook when technician starts location sharing
   * Notify client with tracking link
   */
  app.post("/api/webhooks/n8n/tracking-started", async (req, res) => {
    try {
      const { bookingId } = req.body;

      if (!bookingId) {
        return res.status(400).json({ error: "Missing bookingId" });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const technician = await storage.getTechnicianWithUser(booking.technicianId);
      if (!technician) {
        return res.status(404).json({ error: "Technician not found" });
      }

      const smsData = {
        to: booking.clientPhone,
        clientName: booking.clientName,
        technicianName: technician.name,
        trackingLink: `${process.env.BASE_URL || 'http://localhost:5000'}/track/${bookingId}`,
        message: `${technician.name} est en route ! Suivez sa position en temps réel`
      };

      res.json({
        success: true,
        smsData,
        message: "Tracking notification ready for SMS"
      });

    } catch (error) {
      console.error("N8N tracking-started webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  /**
   * GET /api/webhooks/n8n/available-technicians
   * Get all available technicians for bulk SMS campaigns
   */
  app.get("/api/webhooks/n8n/available-technicians", async (req, res) => {
    try {
      const { city, service } = req.query;

      let technicians: TechnicianWithUser[];

      if (city) {
        technicians = await storage.getTechniciansByCity(city as string);
      } else if (service) {
        technicians = await storage.getTechniciansByService(service as string);
      } else {
        technicians = await storage.getAllTechniciansWithUsers();
      }

      // Filter only available ones
      const availableTechs = technicians.filter(t => t.isAvailable);

      const smsData = availableTechs.map(tech => ({
        technicianId: tech.id,
        name: tech.name,
        phone: tech.phone,
        service: tech.services.join(", "),
        city: tech.city,
        rating: tech.rating
      }));

      res.json({
        success: true,
        count: smsData.length,
        technicians: smsData
      });

    } catch (error) {
      console.error("N8N available-technicians webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  /**
   * POST /api/webhooks/n8n/job-completed
   * Webhook when job is marked as completed
   * Send review request SMS to client
   */
  app.post("/api/webhooks/n8n/job-completed", async (req, res) => {
    try {
      const { bookingId } = req.body;

      if (!bookingId) {
        return res.status(400).json({ error: "Missing bookingId" });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const technician = await storage.getTechnicianWithUser(booking.technicianId);

      const smsData = {
        to: booking.clientPhone,
        clientName: booking.clientName,
        technicianName: technician?.name || "Technicien",
        reviewLink: `${process.env.BASE_URL || 'http://localhost:5000'}/review/${bookingId}`,
        message: "Merci d'avoir utilisé AlloBricolage ! Laissez un avis"
      };

      res.json({
        success: true,
        smsData,
        message: "Review request ready for SMS"
      });

    } catch (error) {
      console.error("N8N job-completed webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  /**
   * POST /api/webhooks/n8n/test-sms
   * Test endpoint for N8N workflow development
   */
  app.post("/api/webhooks/n8n/test-sms", async (req, res) => {
    try {
      const { phone, message, templateType } = req.body;

      // Sample SMS templates for testing
      const templates = {
        'job-notification': `Nouvelle opportunité AlloBricolage !
Service: Plomberie
Ville: Casablanca
Urgence: Haute
Répondez rapidement pour obtenir ce travail.`,

        'booking-confirmation': `Réservation confirmée !
Client: Mohamed Ali
Date: 27/11/2025 14:00
Coût estimé: 250 MAD
Lien de suivi: https://allobricolage.com/track/123`,

        'payment-reminder': `Rappel de paiement AlloBricolage
Montant: 250 MAD
Payez maintenant: https://allobricolage.com/payment/123`,

        'tracking-notification': `Votre technicien est en route !
Suivez sa position en temps réel:
https://allobricolage.com/track/123`,

        'review-request': `Merci d'avoir utilisé AlloBricolage !
Partagez votre expérience:
https://allobricolage.com/review/123`
      };

      const smsTemplate = templates[templateType as keyof typeof templates] || message || "Test message from AlloBricolage";

      res.json({
        success: true,
        smsData: {
          to: phone || "+212600000000",
          message: smsTemplate
        },
        timestamp: new Date().toISOString(),
        message: "Test SMS data generated successfully"
      });

    } catch (error) {
      console.error("N8N test-sms webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}
