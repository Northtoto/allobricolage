import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { randomUUID } from "crypto";

const SALT_ROUNDS = 10;

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
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

  // Get current user
  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = req.user;
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Missing username or password" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set session
      if (req.session) {
        req.session.userId = user.id;
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

  // Signup
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { username, password, name, role, phone, city, services, yearsExperience, hourlyRate, bio } = req.body;

      if (!username || !password || !name || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }

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
          yearsExperience: parseInt(yearsExperience) || 1,
          hourlyRate: parseInt(hourlyRate) || 150,
          bio: bio || null,
          isVerified: false,
          isAvailable: true,
        });
      }

      // Set session
      if (req.session) {
        req.session.userId = user.id;
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
