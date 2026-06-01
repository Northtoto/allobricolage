import { describe, it, expect, beforeEach, vi } from "vitest";

// Exercise the REAL Redis branch of account-lockout against an in-memory ioredis
// emulation (faithful INCR/EXPIRE/SET EX/PTTL/DEL). Validates the atomic logic;
// real-instance wire compatibility is confirmed separately on deploy.
// The mock instance is created inside the (hoisted) factory to avoid the
// "no top-level variables in vi.mock" hoisting trap.
vi.mock("@/utils/redis.ts", async () => {
  const RedisMock = (await import("ioredis-mock")).default;
  return { redisClient: new RedisMock(), hasRedis: true };
});

import { redisClient } from "@/utils/redis.ts";
import {
  checkLockoutStatus,
  recordFailedLogin,
  recordSuccessfulLogin,
} from "./account-lockout.ts";

beforeEach(async () => {
  await (redisClient as unknown as { flushall: () => Promise<void> }).flushall();
});

describe("account lockout (Redis branch, atomic)", () => {
  it("starts unlocked with full attempts", async () => {
    const s = await checkLockoutStatus("redis-fresh");
    expect(s.isLocked).toBe(false);
    expect(s.remainingAttempts).toBe(5);
  });

  it("increments atomically and locks after 5 failures", async () => {
    const u = "redis-lock";
    for (let i = 0; i < 5; i++) await recordFailedLogin(u);
    const s = await checkLockoutStatus(u);
    expect(s.isLocked).toBe(true);
    expect(s.lockedUntil).toBeTypeOf("number");
  });

  it("does not lose increments under concurrency (the race the JSON blob had)", async () => {
    const u = "redis-concurrent";
    await Promise.all(Array.from({ length: 4 }, () => recordFailedLogin(u)));
    const s = await checkLockoutStatus(u);
    expect(s.attempts).toBe(4); // INCR is atomic — exactly 4, never fewer
    expect(s.remainingAttempts).toBe(1);
  });

  it("clears state on successful login", async () => {
    const u = "redis-reset";
    await recordFailedLogin(u);
    await recordFailedLogin(u);
    await recordSuccessfulLogin(u);
    const s = await checkLockoutStatus(u);
    expect(s.attempts).toBe(0);
    expect(s.remainingAttempts).toBe(5);
  });
});
