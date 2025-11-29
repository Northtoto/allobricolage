/**
 * Real-time Tracking API Routes
 *
 * Endpoints for technician location tracking and client monitoring
 */

import type { Express } from "express";
import { storage } from "./storage";
import { requireAuth, requireRole } from "./middleware/auth-guard";
import {
  calculateRoute,
  startTrackingSession,
  updateTechnicianLocation,
  getTrackingSession,
  stopTrackingSession,
  getTechnicianActiveSessions,
  geocodeAddress
} from "./tracking-service";
import type { LocationUpdate } from "@shared/schema";

export function registerTrackingRoutes(app: Express) {

  // ==================== TECHNICIAN LOCATION ROUTES ====================

  /**
   * POST /api/tracking/location/update
   * Technician updates their current location
   * Requires: technician authentication
   */
  app.post("/api/tracking/location/update", requireRole("technician"), async (req, res) => {
    try {
      const { bookingId, latitude, longitude, accuracy, heading, speed, altitude, batteryLevel } = req.body;
      const technicianId = req.userId!;

      if (!bookingId || !latitude || !longitude) {
        return res.status(400).json({ error: "Missing required fields: bookingId, latitude, longitude" });
      }

      // Verify booking belongs to technician
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (booking.technicianId !== technicianId) {
        return res.status(403).json({ error: "Unauthorized: This booking doesn't belong to you" });
      }

      // Create location update
      const locationUpdate: LocationUpdate = {
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        altitude,
        batteryLevel,
        timestamp: new Date()
      };

      // Save to database
      const location = await storage.createTechnicianLocation({
        technicianId,
        bookingId,
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        altitude,
        isActive: true,
        batteryLevel
      });

      // Update tracking session with new ETA
      const session = await updateTechnicianLocation(bookingId, locationUpdate);

      res.json({
        success: true,
        location,
        session
      });
    } catch (error) {
      console.error("Location update error:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  /**
   * POST /api/tracking/session/start
   * Start a tracking session for a booking
   * Requires: technician authentication
   */
  app.post("/api/tracking/session/start", requireRole("technician"), async (req, res) => {
    try {
      const { bookingId } = req.body;
      const technicianId = req.userId!;

      if (!bookingId) {
        return res.status(400).json({ error: "Missing bookingId" });
      }

      // Get booking details
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (booking.technicianId !== technicianId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Get job address
      const address = await storage.getJobAddress(bookingId);
      if (!address) {
        return res.status(404).json({ error: "Job address not found. Please add destination first." });
      }

      // Get technician details
      const technician = await storage.getTechnicianWithUser(technicianId);
      if (!technician) {
        return res.status(404).json({ error: "Technician not found" });
      }

      // Start session
      const session = startTrackingSession(
        bookingId,
        technicianId,
        technician.name,
        technician.phone || "",
        address
      );

      res.json({ success: true, session });
    } catch (error) {
      console.error("Start tracking error:", error);
      res.status(500).json({ error: "Failed to start tracking session" });
    }
  });

  /**
   * POST /api/tracking/session/stop
   * Stop tracking session
   * Requires: technician authentication
   */
  app.post("/api/tracking/session/stop", requireRole("technician"), async (req, res) => {
    try {
      const { bookingId } = req.body;
      const technicianId = req.userId!;

      if (!bookingId) {
        return res.status(400).json({ error: "Missing bookingId" });
      }

      // Verify ownership
      const booking = await storage.getBooking(bookingId);
      if (!booking || booking.technicianId !== technicianId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Deactivate all location records for this booking
      await storage.deactivateTechnicianLocation(bookingId);

      stopTrackingSession(bookingId);

      res.json({ success: true });
    } catch (error) {
      console.error("Stop tracking error:", error);
      res.status(500).json({ error: "Failed to stop tracking" });
    }
  });

  /**
   * GET /api/tracking/technician/sessions
   * Get all active tracking sessions for logged-in technician
   * Requires: technician authentication
   */
  app.get("/api/tracking/technician/sessions", requireRole("technician"), async (req, res) => {
    try {
      const technicianId = req.userId!;
      const sessions = getTechnicianActiveSessions(technicianId);

      res.json({ sessions });
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ error: "Failed to get tracking sessions" });
    }
  });

  // ==================== CLIENT TRACKING ROUTES ====================

  /**
   * GET /api/tracking/booking/:bookingId
   * Get real-time tracking data for a booking
   * Requires: authentication (client or technician)
   */
  app.get("/api/tracking/booking/:bookingId", requireAuth, async (req, res) => {
    try {
      const { bookingId } = req.params;

      // Get booking to verify access
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Get tracking session
      const session = getTrackingSession(bookingId);

      if (!session) {
        return res.status(404).json({
          error: "No active tracking session",
          message: "The technician hasn't started location sharing yet"
        });
      }

      res.json({ session });
    } catch (error) {
      console.error("Get tracking error:", error);
      res.status(500).json({ error: "Failed to get tracking data" });
    }
  });

  /**
   * GET /api/tracking/location/latest/:bookingId
   * Get latest technician location for a booking
   * Requires: authentication
   */
  app.get("/api/tracking/location/latest/:bookingId", requireAuth, async (req, res) => {
    try {
      const { bookingId } = req.params;

      const location = await storage.getLatestTechnicianLocation(bookingId);

      if (!location) {
        return res.status(404).json({
          error: "No location data available",
          message: "Waiting for technician to start location sharing"
        });
      }

      res.json({ location });
    } catch (error) {
      console.error("Get location error:", error);
      res.status(500).json({ error: "Failed to get location" });
    }
  });

  // ==================== ADDRESS & GEOCODING ROUTES ====================

  /**
   * POST /api/tracking/address/geocode
   * Geocode an address to coordinates
   * Requires: authentication
   */
  app.post("/api/tracking/address/geocode", requireAuth, async (req, res) => {
    try {
      const { address, city } = req.body;

      if (!address || !city) {
        return res.status(400).json({ error: "Missing address or city" });
      }

      const result = await geocodeAddress(address, city);

      if (!result) {
        return res.status(404).json({ error: "Address not found" });
      }

      res.json(result);
    } catch (error) {
      console.error("Geocode error:", error);
      res.status(500).json({ error: "Failed to geocode address" });
    }
  });

  /**
   * POST /api/tracking/address/save
   * Save job address for a booking
   * Requires: authentication
   */
  app.post("/api/tracking/address/save", requireAuth, async (req, res) => {
    try {
      const {
        bookingId,
        address,
        city,
        postalCode,
        latitude,
        longitude,
        placeId,
        formattedAddress,
        additionalInstructions
      } = req.body;

      if (!bookingId || !address || !city || !latitude || !longitude) {
        return res.status(400).json({
          error: "Missing required fields: bookingId, address, city, latitude, longitude"
        });
      }

      // Verify booking exists
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Save address
      const jobAddress = await storage.createJobAddress({
        bookingId,
        address,
        city,
        postalCode,
        latitude,
        longitude,
        placeId,
        formattedAddress,
        additionalInstructions
      });

      res.json({ success: true, address: jobAddress });
    } catch (error) {
      console.error("Save address error:", error);
      res.status(500).json({ error: "Failed to save address" });
    }
  });

  /**
   * GET /api/tracking/address/:bookingId
   * Get job address for a booking
   * Requires: authentication
   */
  app.get("/api/tracking/address/:bookingId", requireAuth, async (req, res) => {
    try {
      const { bookingId } = req.params;

      const address = await storage.getJobAddress(bookingId);

      if (!address) {
        return res.status(404).json({ error: "Address not found" });
      }

      res.json({ address });
    } catch (error) {
      console.error("Get address error:", error);
      res.status(500).json({ error: "Failed to get address" });
    }
  });

  /**
   * POST /api/tracking/route/calculate
   * Calculate route between two points
   * Requires: authentication
   */
  app.post("/api/tracking/route/calculate", requireAuth, async (req, res) => {
    try {
      const { origin, destination } = req.body;

      if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
        return res.status(400).json({ error: "Invalid origin or destination coordinates" });
      }

      const route = await calculateRoute(origin, destination);

      if (!route) {
        return res.status(500).json({ error: "Failed to calculate route" });
      }

      res.json({ route });
    } catch (error) {
      console.error("Calculate route error:", error);
      res.status(500).json({ error: "Failed to calculate route" });
    }
  });
}
