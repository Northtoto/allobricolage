import { describe, it, expect, vi, beforeEach } from "vitest";

// Configure Google + define the mock fn BEFORE config/auth.service import.
// Declared via vi.hoisted so it exists when the hoisted vi.mock factory runs.
const { verifyIdToken } = vi.hoisted(() => {
  process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
  return { verifyIdToken: vi.fn() };
});
vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn(() => ({ verifyIdToken })),
}));
vi.mock("@/repositories/user.repository.ts", () => ({
  userRepository: {
    findByGoogleId: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock("@/repositories/technician.repository.ts", () => ({ technicianRepository: {} }));

import { authService } from "./auth.service.ts";
import { userRepository } from "@/repositories/user.repository.ts";

const payload = (over: Record<string, unknown> = {}) => ({
  getPayload: () => ({ sub: "g-123", email: "new@gmail.com", email_verified: true, name: "New User", ...over }),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("googleLogin (configured) — identity from verified token only", () => {
  it("creates a new account from a verified token and strips googleId", async () => {
    verifyIdToken.mockResolvedValue(payload());
    (userRepository.findByGoogleId as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (userRepository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (userRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u9", role: "client", name: "New User", email: "new@gmail.com",
      password: null, googleId: "g-123", username: "new_123", phone: null, city: null,
      profilePicture: null, referralCode: null, referredBy: null, createdAt: new Date(),
    });

    const res = await authService.googleLogin("valid.token");

    expect(res.token).toBeTruthy();
    expect(userRepository.create).toHaveBeenCalledTimes(1);
    // identity came from the verified payload, not client input
    expect((userRepository.create as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatchObject({
      email: "new@gmail.com",
      googleId: "g-123",
    });
    expect(res.user).not.toHaveProperty("googleId");
  });

  it("rejects a token whose email is not verified", async () => {
    verifyIdToken.mockResolvedValue(payload({ email_verified: false }));
    await expect(authService.googleLogin("t")).rejects.toThrow(/invalide/i);
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it("links the verified googleId to an existing email account", async () => {
    verifyIdToken.mockResolvedValue(payload({ email: "exists@gmail.com" }));
    (userRepository.findByGoogleId as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (userRepository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u5", profilePicture: null });
    (userRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u5", role: "client", name: "Existing", email: "exists@gmail.com",
      password: "$h", googleId: "g-123", username: "existing", phone: null, city: null,
      profilePicture: null, referralCode: null, referredBy: null, createdAt: new Date(),
    });

    const res = await authService.googleLogin("valid.token");

    expect(userRepository.update).toHaveBeenCalledWith("u5", expect.objectContaining({ googleId: "g-123" }));
    expect(res.token).toBeTruthy();
  });

  it("rejects when verification throws (forged/expired token)", async () => {
    verifyIdToken.mockRejectedValue(new Error("invalid signature"));
    await expect(authService.googleLogin("forged")).rejects.toThrow(/invalide/i);
  });
});
