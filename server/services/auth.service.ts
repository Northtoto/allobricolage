import bcrypt from "bcryptjs";
import { userRepository } from "@/repositories/user.repository.ts";
import { technicianRepository } from "@/repositories/technician.repository.ts";
import { generateToken } from "@/middleware/auth.ts";
import { UnauthorizedError, ConflictError, NotFoundError, ForbiddenError } from "@/utils/errors.ts";
import { validatePassword } from "@/utils/password-policy.ts";
import {
  checkLockoutStatus,
  recordFailedLogin,
  recordSuccessfulLogin,
} from "@/middleware/account-lockout.ts";
import { securityAudit } from "@/middleware/audit-logger.ts";
import type { InsertUser, User } from "@/db/schema.ts";
import type { Request } from "express";

export interface AuthResult {
  user: Omit<User, "password" | "googleId">;
  token: string;
}

export interface SignupInput extends InsertUser {
  password: string;
  services?: string[];
  yearsExperience?: string | number;
  hourlyRate?: string | number;
  bio?: string;
}

function stripUser(user: User): Omit<User, "password" | "googleId"> {
  const { password: _password, googleId: _googleId, ...safe } = user;
  return safe as Omit<User, "password" | "googleId">;
}

export class AuthService {
  async login(username: string, password: string, req?: Request): Promise<AuthResult> {
    const lockout = checkLockoutStatus(username);
    if (lockout.isLocked) {
      securityAudit("auth.login.locked", req ?? ({} as Request), {
        username,
        remainingSeconds: lockout.lockedUntil ? Math.ceil((lockout.lockedUntil - Date.now()) / 1000) : 0,
      });
      throw new ForbiddenError(
        `Trop de tentatives échouées. Réessayez dans ${Math.ceil((lockout.lockedUntil! - Date.now()) / 60000)} minutes.`
      );
    }

    const user = await userRepository.findByUsername(username);

    if (!user || !user.password) {
      recordFailedLogin(username);
      securityAudit("auth.login.failed", req ?? ({} as Request), { username, reason: "invalid_username" });
      throw new UnauthorizedError("Nom d'utilisateur ou mot de passe incorrect");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      recordFailedLogin(username);
      const remaining = Math.max(0, 5 - (lockout.attempts + 1));
      securityAudit("auth.login.failed", req ?? ({} as Request), {
        username,
        reason: "invalid_password",
        remainingAttempts: remaining,
      });
      throw new UnauthorizedError(
        remaining > 0
          ? `Nom d'utilisateur ou mot de passe incorrect (${remaining} tentative${remaining === 1 ? "" : "s"} restante${remaining === 1 ? "" : "s"})`
          : "Nom d'utilisateur ou mot de passe incorrect"
      );
    }

    recordSuccessfulLogin(username);
    securityAudit("auth.login.success", req ?? ({} as Request), { username, userId: user.id });

    const token = generateToken(user.id, user.role);
    return { user: stripUser(user), token };
  }

  async signup(data: SignupInput): Promise<AuthResult> {
    const passwordCheck = validatePassword(data.password);
    if (!passwordCheck.isValid) {
      throw new UnauthorizedError("Mot de passe trop faible: " + passwordCheck.feedback.join(", "));
    }

    const exists = await userRepository.existsByUsername(data.username);
    if (exists) {
      throw new ConflictError("Ce nom d'utilisateur existe déjà");
    }

    if (data.email) {
      const emailExists = await userRepository.existsByEmail(data.email);
      if (emailExists) {
        throw new ConflictError("Cette adresse email est déjà utilisée");
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await userRepository.create({
      ...data,
      password: hashedPassword,
    });

    if (data.role === "technician") {
      const yearsExp = typeof data.yearsExperience === "string"
        ? parseInt(data.yearsExperience, 10)
        : (data.yearsExperience ?? 1);
      const hourlyRt = typeof data.hourlyRate === "string"
        ? parseInt(data.hourlyRate, 10)
        : (data.hourlyRate ?? 150);

      await technicianRepository.create({
        userId: user.id,
        services: data.services ?? [],
        rating: 0,
        reviewCount: 0,
        completedJobs: 0,
        responseTimeMinutes: 30,
        completionRate: 0.95,
        yearsExperience: Number.isNaN(yearsExp) ? 1 : yearsExp,
        hourlyRate: Number.isNaN(hourlyRt) ? 150 : hourlyRt,
        isVerified: false,
        isAvailable: true,
        isPro: false,
        isPromo: false,
        availability: "Sur RDV",
        skills: [],
        certifications: [],
        languages: ["francais", "arabe"],
      });
    }

    const token = generateToken(user.id, user.role);
    return { user: stripUser(user), token };
  }

  async getCurrentUser(userId: string): Promise<Omit<User, "password" | "googleId">> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }
    return stripUser(user);
  }

  async googleLogin(googleId: string, profile: {
    name: string;
    email: string;
    picture?: string;
  }): Promise<AuthResult> {
    let user = await userRepository.findByGoogleId(googleId);

    if (!user) {
      const existingEmail = await userRepository.findByEmail(profile.email);
      if (existingEmail) {
        user = await userRepository.update(existingEmail.id, {
          googleId,
          profilePicture: profile.picture || existingEmail.profilePicture,
        });
        if (!user) {
          throw new UnauthorizedError("Échec de la mise à jour de l'utilisateur");
        }
      } else {
        const username = `${profile.email.split("@")[0]}_${Date.now()}`;
        user = await userRepository.create({
          username,
          password: null,
          name: profile.name,
          email: profile.email,
          role: "client",
          googleId,
          profilePicture: profile.picture,
          phone: null,
          city: null,
        });
      }
    }

    const token = generateToken(user.id, user.role);
    return { user: stripUser(user), token };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }
    if (!user.password) {
      throw new UnauthorizedError("Impossible de changer le mot de passe pour les comptes OAuth");
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedError("Le mot de passe actuel est incorrect");
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      throw new UnauthorizedError("Mot de passe trop faible: " + passwordCheck.feedback.join(", "));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await userRepository.update(userId, { password: hashedPassword });
  }
}

export const authService = new AuthService();
