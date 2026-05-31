import { z } from "zod";

export interface PasswordStrength {
  score: number; // 0-5
  isValid: boolean;
  feedback: string[];
}

const MIN_LENGTH = 8;
const MIN_SCORE = 3;

export function validatePassword(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < MIN_LENGTH) {
    feedback.push(`Le mot de passe doit contenir au moins ${MIN_LENGTH} caractères`);
  } else {
    score += 1;
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Au moins une lettre majuscule (A-Z)");
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Au moins une lettre minuscule (a-z)");
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push("Au moins un chiffre (0-9)");
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Au moins un caractère spécial (!@#$...)");
  }

  if (/(.)(\1{2,})/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push("Évitez les répétitions de caractères");
  }

  if (/^[a-zA-Z]+$/.test(password) && password.length > 0) {
    feedback.push("Ajoutez des chiffres et symboles pour plus de sécurité");
  }

  const commonPasswords = ["password", "123456", "qwerty", "admin", "allobricolage", "maroc"];
  const lower = password.toLowerCase();
  if (commonPasswords.some((c) => lower.includes(c))) {
    score = 0;
    feedback.push("Ce mot de passe est trop courant");
  }

  return {
    score,
    isValid: score >= MIN_SCORE && password.length >= MIN_LENGTH,
    feedback: feedback.length ? feedback : ["Mot de passe fort"],
  };
}

export const passwordSchema = z
  .string()
  .min(MIN_LENGTH, `Le mot de passe doit contenir au moins ${MIN_LENGTH} caractères`)
  .regex(/[A-Z]/, "Au moins une majuscule")
  .regex(/[a-z]/, "Au moins une minuscule")
  .regex(/\d/, "Au moins un chiffre")
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Au moins un caractère spécial");

export const moroccanPhoneSchema = z
  .string()
  .regex(
    /^(\+212|0)(5|6|7)[0-9]{8}$/,
    "Numéro marocain invalide (ex: +212612345678 ou 0612345678)"
  );
