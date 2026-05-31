import { logger } from "@/utils/logger.ts";

interface LockoutEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

// In production: replace with Redis
const lockoutMap = new Map<string, LockoutEntry>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

function getKey(username: string): string {
  return username.toLowerCase().trim();
}

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of Array.from(lockoutMap.entries())) {
    if (now - entry.lastAttempt > ATTEMPT_WINDOW_MS * 2) {
      lockoutMap.delete(key);
    }
  }
}

setInterval(cleanup, CLEANUP_INTERVAL_MS);

export interface LockoutStatus {
  isLocked: boolean;
  remainingAttempts: number;
  lockedUntil: number | null;
  attempts: number;
}

export function checkLockoutStatus(username: string): LockoutStatus {
  const key = getKey(username);
  const entry = lockoutMap.get(key);
  const now = Date.now();

  if (!entry) {
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null, attempts: 0 };
  }

  // Check if lockout period expired
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    lockoutMap.delete(key);
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null, attempts: 0 };
  }

  if (entry.lockedUntil) {
    return { isLocked: true, remainingAttempts: 0, lockedUntil: entry.lockedUntil, attempts: entry.attempts };
  }

  // Check if attempt window expired (reset)
  if (now - entry.lastAttempt > ATTEMPT_WINDOW_MS) {
    lockoutMap.delete(key);
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null, attempts: 0 };
  }

  return {
    isLocked: false,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - entry.attempts),
    lockedUntil: null,
    attempts: entry.attempts,
  };
}

export function recordFailedLogin(username: string): void {
  const key = getKey(username);
  const now = Date.now();
  const existing = lockoutMap.get(key);

  if (!existing) {
    lockoutMap.set(key, {
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
      lockedUntil: null,
    });
    return;
  }

  // Reset if window expired
  if (now - existing.lastAttempt > ATTEMPT_WINDOW_MS) {
    lockoutMap.set(key, {
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
      lockedUntil: null,
    });
    return;
  }

  existing.attempts += 1;
  existing.lastAttempt = now;

  if (existing.attempts >= MAX_ATTEMPTS) {
    existing.lockedUntil = now + LOCKOUT_DURATION_MS;
    logger.warn("Account locked due to failed login attempts", {
      username: key,
      attempts: existing.attempts,
      lockedUntil: new Date(existing.lockedUntil).toISOString(),
    });
  }
}

export function recordSuccessfulLogin(username: string): void {
  const key = getKey(username);
  lockoutMap.delete(key);
}

export function getRemainingLockoutSeconds(username: string): number {
  const status = checkLockoutStatus(username);
  if (!status.isLocked || !status.lockedUntil) return 0;
  return Math.max(0, Math.ceil((status.lockedUntil - Date.now()) / 1000));
}
