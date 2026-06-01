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
const REDIS_TTL_SECONDS = Math.ceil((ATTEMPT_WINDOW_MS * 2) / 1000);

function getKey(username: string): string {
  return username.toLowerCase().trim();
}

function redisKey(username: string): string {
  return `lockout:${getKey(username)}`;
}

// Storage abstraction: Redis when configured (persists across serverless
// invocations / instances), otherwise an in-memory Map. The in-memory store is
// only safe for a single long-lived process.
const lockoutMap = new Map<string, LockoutEntry>();

async function readEntry(username: string): Promise<LockoutEntry | undefined> {
  if (redisClient) {
    const raw = await redisClient.get(redisKey(username));
    return raw ? (JSON.parse(raw) as LockoutEntry) : undefined;
  }
  return lockoutMap.get(getKey(username));
}

async function writeEntry(username: string, entry: LockoutEntry): Promise<void> {
  if (redisClient) {
    await redisClient.set(redisKey(username), JSON.stringify(entry), "EX", REDIS_TTL_SECONDS);
    return;
  }
  lockoutMap.set(getKey(username), entry);
}

async function deleteEntry(username: string): Promise<void> {
  if (redisClient) {
    await redisClient.del(redisKey(username));
    return;
  }
  lockoutMap.delete(getKey(username));
}

// Periodic cleanup only applies to the in-memory store; Redis entries expire via TTL.
function cleanup(): void {
  if (redisClient) return;
  const now = Date.now();
  for (const [key, entry] of Array.from(lockoutMap.entries())) {
    if (now - entry.lastAttempt > ATTEMPT_WINDOW_MS * 2) {
      lockoutMap.delete(key);
    }
  }
}

const cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL_MS);
cleanupTimer.unref?.();

export interface LockoutStatus {
  isLocked: boolean;
  remainingAttempts: number;
  lockedUntil: number | null;
  attempts: number;
}

export async function checkLockoutStatus(username: string): Promise<LockoutStatus> {
  const entry = await readEntry(username);
  const now = Date.now();

  if (!entry) {
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null, attempts: 0 };
  }

  // Lockout period expired
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    await deleteEntry(username);
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null, attempts: 0 };
  }

  if (entry.lockedUntil) {
    return { isLocked: true, remainingAttempts: 0, lockedUntil: entry.lockedUntil, attempts: entry.attempts };
  }

  // Attempt window expired (reset)
  if (now - entry.lastAttempt > ATTEMPT_WINDOW_MS) {
    await deleteEntry(username);
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockedUntil: null, attempts: 0 };
  }

  return {
    isLocked: false,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - entry.attempts),
    lockedUntil: null,
    attempts: entry.attempts,
  };
}

export async function recordFailedLogin(username: string): Promise<void> {
  const now = Date.now();
  const existing = await readEntry(username);

  if (!existing || now - existing.lastAttempt > ATTEMPT_WINDOW_MS) {
    await writeEntry(username, { attempts: 1, firstAttempt: now, lastAttempt: now, lockedUntil: null });
    return;
  }

  const attempts = existing.attempts + 1;
  const lockedUntil = attempts >= MAX_ATTEMPTS ? now + LOCKOUT_DURATION_MS : null;

  await writeEntry(username, { ...existing, attempts, lastAttempt: now, lockedUntil });

  if (lockedUntil) {
    logger.warn("Account locked due to failed login attempts", {
      username: getKey(username),
      attempts,
      lockedUntil: new Date(lockedUntil).toISOString(),
    });
  }
}

export async function recordSuccessfulLogin(username: string): Promise<void> {
  await deleteEntry(username);
}

export async function getRemainingLockoutSeconds(username: string): Promise<number> {
  const status = await checkLockoutStatus(username);
  if (!status.isLocked || !status.lockedUntil) return 0;
  return Math.max(0, Math.ceil((status.lockedUntil - Date.now()) / 1000));
}
