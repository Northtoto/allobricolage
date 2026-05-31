import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { config } from "@/config/index.ts";
import { db } from "@/db/index.ts";
import { users } from "@/db/schema.ts";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors.ts";
import type { AuthenticatedRequest } from "@/types/express.ts";
import { logger } from "@/utils/logger.ts";

interface JwtPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export function generateToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
}

async function findUserById(userId: string) {
  const results = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return results[0];
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication required");
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    const user = await findUserById(payload.userId);

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    const { password: _password, googleId: _googleId, ...safeUser } = user;
    (req as AuthenticatedRequest).user = safeUser as unknown as typeof user;
    (req as AuthenticatedRequest).token = token;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError("Invalid token"));
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError("Token expired"));
      return;
    }
    next(error);
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      next(new UnauthorizedError("Authentication required"));
      return;
    }

    if (!roles.includes(user.role)) {
      next(new ForbiddenError(`Required role: ${roles.join(" or ")}`));
      return;
    }

    next();
  };
}

export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token);
    findUserById(payload.userId)
      .then((user) => {
        if (user) {
          const { password: _password, googleId: _googleId, ...safeUser } = user;
          (req as AuthenticatedRequest).user = safeUser as unknown as typeof user;
          (req as AuthenticatedRequest).token = token;
        }
        next();
      })
      .catch((error) => {
        logger.warn("Optional auth lookup failed", { error });
        next();
      });
  } catch {
    next();
  }
}
