import { logger } from "@/utils/logger.ts";
import { redisClient } from "@/utils/redis.ts";

interface LockoutEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const WINDOW_SECONDS = Math.ceil(ATTEMPT_WINDOW_MS / 1000);
const LOCK_SECONDS = Math.ceil(LOCKOUT_DURATION_MS / 1000);

function getKey(username: string): string {
  return username.toLowerCase().trim();
}
function attemptsKey(username: string): string {
  return `lockout:attempts:${getKey(username)}`;
}
function lockKey(username: string): string {
  return `lockout:locked:${getKey(username)}`;
}

export interface LockoutStatus {
  isLocked: boolean;
  remainingAttempts: number;
  lockedUntil: number | null;
  attempts: number;
}

// ---------------------------------------------------------------------------
// Redis path: atomic primitives (INCR / SET EX / PTTL). INCR is atomic, so
// concurrent failed logins can never undercount attempts (the race the JSON
// read-modify-write previously had). Window/lock expiry is handled by key TTL.
// ---------------------------------------------------------------------------
async function checkRedis(username: string): Promise<LockoutStatus> {
  const lockTtlMs = await redisClient!.pttl(lockKey(username)); // >0 = locked; -2 none; -1 no-expire
  if (lockTtlMs > 0) {
    return { isLocked: true, remainingAttempts: 0, lockedUntil: Date.now() + lockTtlMs, attempts: MAX_ATTEMPTS };
  }
  const raw = await redisClient!.get(attemptsKey(username));
  const attempts = raw ? parseInt(raw, 10) : 0;
  return { isLocked: false, remainingAttempts: Math.max(0, MAX_ATTEMPTS - attempts), lockedUntil: null, attempts };
}

async function recordFailedRedis(username: string): Promise<void> {
  const key = attemptsKey(username);
  const attempts = await redisClient!.incr(key); // atomic
  // Set/refresh the window on the first attempt of a new window.
  if (attempts === 1) {
    await redisClient!.expire(key, WINDOW_SECONDS);
  }
  if (attempts >= MAX_ATTEMPTS) {
    await redisClient!.set(lockKey(username), "1", "EX", LOCK_SECONDS);
    logger.warn("Account locked due to failed login attempts", { username: getKey(username), attempts });
  }
}

// ---------------------------------------------------------------------------
// In-memory path: single-threaded Node makes the synchronous read-modify-write
// atomic within the event loop, so no Redis-style race exists here.
// ---------------------------------------------------------------------------
const lockoutMap = new Map<string, LockoutEntry>();

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of Array.from(lockoutMap.entries())) {
    if (now - entry.lastAttempt > ATTEMPT_WINDOW_MS * 2) {
      lockoutMap.delete(key);
    }
  }
}
const cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL_MS);
cleanupTimer.unref?.();

function checkMemory(username: string): LockoutStatus {
  const key = getKey(username);
  const entry = lockoutMap.get(key);
  const now = Date.now();

  if (!entry) return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null, attempts: 0 };

  if (entry.lockedUntil && now >= entry.lockedUntil) {
    lockoutMap.delete(key);
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null, attempts: 0 };
  }
  if (entry.lockedUntil) {
    return { isLocked: true, remainingAttempts: 0, lockedUntil: entry.lockedUntil, attempts: entry.attempts };
  }
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

function recordFailedMemory(username: string): void {
  const key = getKey(username);
  const now = Date.now();
  const existing = lockoutMap.get(key);

  if (!existing || now - existing.lastAttempt > ATTEMPT_WINDOW_MS) {
    lockoutMap.set(key, { attempts: 1, firstAttempt: now, lastAttempt: now, lockedUntil: null });
    return;
  }

  const attempts = existing.attempts + 1;
  const lockedUntil = attempts >= MAX_ATTEMPTS ? now + LOCKOUT_DURATION_MS : null;
  lockoutMap.set(key, { ...existing, attempts, lastAttempt: now, lockedUntil });

  if (lockedUntil) {
    logger.warn("Account locked due to failed login attempts", {
      username: key,
      attempts,
      lockedUntil: new Date(lockedUntil).toISOString(),
    });
  }
}

// ---------------------------------------------------------------------------
// Public async API (backend-agnostic).
// ---------------------------------------------------------------------------
export async function checkLockoutStatus(username: string): Promise<LockoutStatus> {
  return redisClient ? checkRedis(username) : checkMemory(username);
}

export async function recordFailedLogin(username: string): Promise<void> {
  if (redisClient) return recordFailedRedis(username);
  recordFailedMemory(username);
}

export async function recordSuccessfulLogin(username: string): Promise<void> {
  if (redisClient) {
    await redisClient.del(attemptsKey(username), lockKey(username));
    return;
  }
  lockoutMap.delete(getKey(username));
}

export async function getRemainingLockoutSeconds(username: string): Promise<number> {
  const status = await checkLockoutStatus(username);
  if (!status.isLocked || !status.lockedUntil) return 0;
  return Math.max(0, Math.ceil((status.lockedUntil - Date.now()) / 1000));
}
