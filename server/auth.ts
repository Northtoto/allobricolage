import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import { configureGoogleAuth } from "./auth/google-strategy";
import { registerGoogleAuthRoutes } from "./auth/google-routes";
import { rateLimit } from "./middleware/auth-guard";
import { z } from "zod";
import type { User } from "../shared/schema";

const SALT_ROUNDS = 12; // Increased from 10 to 12 for better security

// Input validation schemas
const loginSchema = z.object({
  username: z.string().min(3).max(50).trim(),
  password: z.string().min(6).max(100),
});

const signupSchema = z.object({
  username: z.string().min(3).max(50).trim(),
  password: z.string().min(8).max(100)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2).max(100).trim(),
  role: z.enum(["client", "technician"]),
  phone: z.string().optional(),
  city: z.string().optional(),
  services: z.array(z.string()).optional(),
  yearsExperience: z.union([z.string(), z.number()]).optional(),
  hourlyRate: z.union([z.string(), z.number()]).optional(),
  bio: z.string().max(500).optional(),
});

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: User;
    }
  }
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function setupAuth(app: Express) {
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Configure Google OAuth strategy
  configureGoogleAuth(storage);

  // IMPORTANT: Middleware to load user MUST be registered BEFORE routes
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (req.session?.userId) {
      try {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          req.userId = user.id;
          req.user = user;
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    }
    next();
  });

  // Register Google OAuth routes
  registerGoogleAuthRoutes(app);

  // Get current user
  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.userId || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = req.user as User;
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      profilePicture: user.profilePicture,
    });
  });

  // Login - Rate limited to 5 attempts per minute per IP
  app.post("/api/auth/login", rateLimit(5, 60000), async (req: Request, res: Response) => {
    try {
      // Validate input
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid input",
          details: validation.error.issues.map(i => i.message).join(", ")
        });
      }

      const { username, password } = validation.data;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // OAuth users don't have passwords - reject password login for them
      if (!user.password) {
        return res.status(401).json({ error: "Please sign in with Google" });
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set session and explicitly save it
      if (req.session) {
        req.session.userId = user.id;

        // Explicitly save session
        await new Promise<void>((resolve, reject) => {
          req.session!.save((err) => {
            if (err) {
              console.error("Error saving session on login:", err);
              reject(err);
            } else {
              console.log("✅ Login session saved for user:", user.id);
              resolve();
            }
          });
        });
      }

      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Signup - Rate limited to 3 attempts per 5 minutes per IP
  app.post("/api/auth/signup", rateLimit(3, 300000), async (req: Request, res: Response) => {
    try {
      // Validate input
      const validation = signupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid input",
          details: validation.error.issues.map(i => i.message).join(", ")
        });
      }

      const { username, password, name, role, phone, city, services, yearsExperience, hourlyRate, bio } = validation.data;

      if (role === "technician" && (!services || services.length === 0)) {
        return res.status(400).json({ error: "Technicians must select at least one service" });
      }

      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }

      // Hash password with bcrypt
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        role,
        name,
        phone,
        city,
      });

      // If technician, create professional profile
      if (role === "technician") {
        await storage.createTechnician({
          userId: user.id,
          services: services || [],
          skills: [],
          yearsExperience: parseInt(String(yearsExperience || 1)),
          hourlyRate: parseInt(String(hourlyRate || 150)),
          bio: bio || null,
          isVerified: false,
          isAvailable: true,
        });
      }

      // Set session and explicitly save it
      if (req.session) {
        req.session.userId = user.id;

        // Explicitly save session
        await new Promise<void>((resolve, reject) => {
          req.session!.save((err) => {
            if (err) {
              console.error("Error saving session on signup:", err);
              reject(err);
            } else {
              console.log("✅ Signup session saved for user:", user.id);
              resolve();
            }
          });
        });
      }

      res.status(201).json({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Signup failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy(() => {
        res.json({ success: true });
      });
    } else {
      res.json({ success: true });
    }
  });
}
