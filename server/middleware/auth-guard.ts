import { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";
import { storage } from "../storage";

/**
 * Middleware to require authentication
 * Use this on routes that should only be accessible to authenticated users
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Veuillez vous connecter pour accéder à cette fonctionnalité"
    });
  }
  next();
}

/**
 * Middleware to require specific role
 * Use this to restrict routes to specific user types
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Veuillez vous connecter pour accéder à cette fonctionnalité"
      });
    }

    const user = req.user as User;
    if (!roles.includes(user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: "Vous n'avez pas les autorisations nécessaires"
      });
    }

    next();
  };
}

/**
 * Middleware to verify booking ownership
 * Checks if the authenticated user owns the booking (as client or assigned technician)
 */
export function requireBookingOwnership(paramName: string = "id") {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Veuillez vous connecter"
      });
    }

    const bookingId = req.params[paramName];
    if (!bookingId) {
      return res.status(400).json({
        error: "Missing booking ID"
      });
    }

    try {
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({
          error: "Booking not found"
        });
      }

      const user = req.user as User;
      
      // Check if user is the client (by matching user ID with booking's clientId)
      // or the assigned technician
      const isClient = booking.clientId === user.id;
      
      let isTechnician = false;
      if (user.role === "technician") {
        const technician = await storage.getTechnicianByUserId(user.id);
        isTechnician = technician?.id === booking.technicianId;
      }

      if (!isClient && !isTechnician) {
        return res.status(403).json({
          error: "Unauthorized",
          message: "Vous n'avez pas accès à cette réservation"
        });
      }

      next();
    } catch (error) {
      console.error("Booking ownership check error:", error);
      return res.status(500).json({
        error: "Failed to verify ownership"
      });
    }
  };
}

/**
 * Middleware to verify job ownership
 * Checks if the authenticated user is the assigned technician for a job
 */
export function requireJobOwnership(paramName: string = "id") {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const jobId = req.params[paramName];
    if (!jobId) {
      return res.status(400).json({
        error: "Missing job ID"
      });
    }

    try {
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({
          error: "Job not found"
        });
      }

      const user = req.user as User;
      
      // Get bookings for this job
      const bookings = await storage.getBookingsByJob(jobId);
      
      // Check if user is the assigned technician for any booking
      if (user.role === "technician") {
        const technician = await storage.getTechnicianByUserId(user.id);
        const isAssigned = bookings.some(b => b.technicianId === technician?.id);
        
        if (!isAssigned) {
          return res.status(403).json({
            error: "Unauthorized",
            message: "Cette mission ne vous est pas assignée"
          });
        }
      } else {
        return res.status(403).json({
          error: "Unauthorized",
          message: "Seuls les techniciens peuvent accéder à cette ressource"
        });
      }

      next();
    } catch (error) {
      console.error("Job ownership check error:", error);
      return res.status(500).json({
        error: "Failed to verify ownership"
      });
    }
  };
}

/**
 * Simple rate limiting middleware for AI endpoints
 * Tracks requests per IP address
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxRequests: number = 10, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    
    const record = rateLimitStore.get(ip);
    
    // Clean up expired records
    if (record && now > record.resetAt) {
      rateLimitStore.delete(ip);
    }
    
    const current = rateLimitStore.get(ip);
    
    if (!current) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    
    if (current.count >= maxRequests) {
      return res.status(429).json({
        error: "Too many requests",
        message: `Veuillez patienter avant de réessayer. Limite: ${maxRequests} requêtes par ${windowMs / 1000} secondes.`,
        retryAfter: Math.ceil((current.resetAt - now) / 1000)
      });
    }
    
    current.count++;
    return next();
  };
}

/**
 * Middleware to optionally load user (doesn't require auth)
 * Useful for routes that change behavior based on authentication
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // User is already loaded by the auth middleware in auth.ts
  // This is just a no-op that signals the route supports both auth and non-auth
  next();
}




