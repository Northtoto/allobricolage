import { Express, Request, Response } from "express";
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { randomUUID } from "crypto";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
      session?: session.Session & { userId?: string };
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return Buffer.from(password).toString("base64");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function setupAuth(app: Express) {
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
      if (!user || !verifyPassword(password, user.password)) {
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
      const { username, password, name, role } = req.body;

      if (!username || !password || !name || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }

      // Create user
      const user = await storage.createUser({
        username,
        password: hashPassword(password),
        role,
        name,
      });

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

  // Middleware to load user
  app.use((req: Request, res: Response, next) => {
    if (req.session?.userId) {
      storage.getUser(req.session.userId).then((user) => {
        if (user) {
          req.userId = user.id;
          req.user = user;
        }
        next();
      });
    } else {
      next();
    }
  });
}
