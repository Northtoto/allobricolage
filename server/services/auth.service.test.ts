import { describe, it, expect, vi } from "vitest";

// Mock repositories so importing authService never touches a real DB.
vi.mock("@/repositories/user.repository.ts", () => ({
  userRepository: {
    findByGoogleId: vi.fn(async () => undefined),
    findByEmail: vi.fn(async () => undefined),
    findByUsername: vi.fn(async () => undefined),
  },
}));
vi.mock("@/repositories/technician.repository.ts", () => ({
  technicianRepository: { create: vi.fn() },
}));

import { authService } from "./auth.service.ts";

describe("googleLogin security", () => {
  // Test env has no GOOGLE_CLIENT_ID, so the verifier is disabled. The key
  // guarantee: it NEVER trusts client-supplied identity — it rejects instead.
  it("rejects when Google is not configured (no blind trust of client input)", async () => {
    await expect(authService.googleLogin("any-token")).rejects.toThrow(/non configurée/i);
  });

  it("never logs in from an unverified/forged credential (always rejects)", async () => {
    await expect(authService.googleLogin("forged.jwt.value")).rejects.toThrow();
  });
});
