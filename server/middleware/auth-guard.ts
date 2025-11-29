import { Request, Response, NextFunction } from "express";

/**
 * Middleware to require authentication
 * Use this on routes that should only be accessible to authenticated users
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user && !req.userId) {
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

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        message: "Vous n'avez pas les autorisations nécessaires"
      });
    }

    next();
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


