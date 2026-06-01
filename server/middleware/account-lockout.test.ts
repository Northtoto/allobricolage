import { describe, it, expect } from "vitest";
import {
  checkLockoutStatus,
  recordFailedLogin,
  recordSuccessfulLogin,
} from "./account-lockout.ts";

// No REDIS_URL in test env → in-memory store path.
describe("account lockout (in-memory path)", () => {
  it("starts unlocked with full attempts", async () => {
    const status = await checkLockoutStatus("fresh-user-1");
    expect(status.isLocked).toBe(false);
    expect(status.remainingAttempts).toBe(5);
  });

  it("locks the account after 5 failed attempts", async () => {
    const u = "lock-target-user";
    for (let i = 0; i < 5; i++) await recordFailedLogin(u);
    const status = await checkLockoutStatus(u);
    expect(status.isLocked).toBe(true);
    expect(status.lockedUntil).toBeTypeOf("number");
  });

  it("decrements remaining attempts before locking", async () => {
    const u = "partial-fail-user";
    await recordFailedLogin(u);
    await recordFailedLogin(u);
    const status = await checkLockoutStatus(u);
    expect(status.isLocked).toBe(false);
    expect(status.remainingAttempts).toBe(3);
  });

  it("clears lockout state on successful login", async () => {
    const u = "reset-user";
    await recordFailedLogin(u);
    await recordFailedLogin(u);
    await recordSuccessfulLogin(u);
    const status = await checkLockoutStatus(u);
    expect(status.remainingAttempts).toBe(5);
    expect(status.attempts).toBe(0);
  });

  it("counts concurrent failed logins without losing increments", async () => {
    const u = "concurrent-user";
    // Fire 4 failed logins concurrently — must not undercount (no lost updates).
    await Promise.all([recordFailedLogin(u), recordFailedLogin(u), recordFailedLogin(u), recordFailedLogin(u)]);
    const status = await checkLockoutStatus(u);
    expect(status.attempts).toBe(4);
    expect(status.remainingAttempts).toBe(1);
  });
});
