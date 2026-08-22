import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Authenticated as client-1 for the routes that require a session (/logout, /me, /password).
let currentUser: { id: string; role: string; name: string } = { id: "client-1", role: "client", name: "Client" };
vi.mock("@/middleware/auth.ts", async (orig) => {
  const actual = await orig<typeof import("@/middleware/auth.ts")>();
  return {
    ...actual,
    authenticate: (req: any, _res: any, next: any) => {
      req.user = currentUser;
      next();
    },
  };
});

// authLimiter/passwordChangeLimiter share module-level counters across every test in
// this file (max 10 per 15 min) — bypass them so validation/business-rule tests aren't
// flaky depending on how many requests preceded them.
vi.mock("@/middleware/rate-limiter.ts", async (orig) => {
  const actual = await orig<typeof import("@/middleware/rate-limiter.ts")>();
  const passthrough = (_req: any, _res: any, next: any) => next();
  return { ...actual, authLimiter: passthrough, passwordChangeLimiter: passthrough };
});

const login = vi.fn();
const signup = vi.fn();
const googleLogin = vi.fn();
const changePassword = vi.fn();
vi.mock("@/services/auth.service.ts", () => ({
  authService: {
    login: (...args: unknown[]) => login(...args),
    signup: (...args: unknown[]) => signup(...args),
    googleLogin: (...args: unknown[]) => googleLogin(...args),
    changePassword: (...args: unknown[]) => changePassword(...args),
  },
}));

import { app } from "@/index.ts";
import { UnauthorizedError, ForbiddenError, ConflictError } from "@/utils/errors.ts";

const AUTH_RESULT = { user: { id: "u1", username: "bob", role: "client" }, token: "jwt-token" };

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = { id: "client-1", role: "client", name: "Client" };
});

describe("POST /api/auth/login", () => {
  it("rejects a missing username (400) without calling the service", async () => {
    const res = await request(app).post("/api/auth/login").send({ password: "Secret123!" });
    expect(res.status).toBe(400);
    expect(login).not.toHaveBeenCalled();
  });

  it("logs in and returns the service result", async () => {
    login.mockResolvedValue(AUTH_RESULT);
    const res = await request(app).post("/api/auth/login").send({ username: "bob", password: "Secret123!" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: AUTH_RESULT });
    expect(login.mock.calls[0][0]).toBe("bob");
    expect(login.mock.calls[0][1]).toBe("Secret123!");
  });

  it("propagates invalid credentials as 401", async () => {
    login.mockRejectedValue(new UnauthorizedError("Nom d'utilisateur ou mot de passe incorrect"));
    const res = await request(app).post("/api/auth/login").send({ username: "bob", password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("propagates a locked-out account as 403", async () => {
    login.mockRejectedValue(new ForbiddenError("Trop de tentatives échouées. Réessayez dans 5 minutes."));
    const res = await request(app).post("/api/auth/login").send({ username: "bob", password: "wrong" });
    expect(res.status).toBe(403);
  });
});

describe("POST /api/auth/signup", () => {
  const validBody = {
    username: "new_user1",
    password: "Passw0rd!",
    name: "New User",
  };

  it("rejects a weak password (400) without calling the service", async () => {
    const res = await request(app).post("/api/auth/signup").send({ ...validBody, password: "weak" });
    expect(res.status).toBe(400);
    expect(signup).not.toHaveBeenCalled();
  });

  it("rejects an invalid Moroccan phone number (400)", async () => {
    const res = await request(app).post("/api/auth/signup").send({ ...validBody, phone: "0123" });
    expect(res.status).toBe(400);
    expect(signup).not.toHaveBeenCalled();
  });

  it("blocks admin signup through the public API (400)", async () => {
    const res = await request(app).post("/api/auth/signup").send({ ...validBody, role: "admin" });
    expect(res.status).toBe(400);
    expect(res.body.error.details.fields.role).toMatch(/admin/i);
    expect(signup).not.toHaveBeenCalled();
  });

  it("defaults role to client and creates the account (201)", async () => {
    signup.mockResolvedValue(AUTH_RESULT);
    const res = await request(app).post("/api/auth/signup").send(validBody);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, data: AUTH_RESULT });
    expect(signup).toHaveBeenCalledWith(expect.objectContaining({ username: "new_user1", role: "client" }));
  });

  it("propagates a duplicate username as 409", async () => {
    signup.mockRejectedValue(new ConflictError("Ce nom d'utilisateur existe déjà"));
    const res = await request(app).post("/api/auth/signup").send(validBody);
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/google", () => {
  it("rejects a missing credential (400)", async () => {
    const res = await request(app).post("/api/auth/google").send({});
    expect(res.status).toBe(400);
    expect(googleLogin).not.toHaveBeenCalled();
  });

  it("logs in with a verified Google credential", async () => {
    googleLogin.mockResolvedValue(AUTH_RESULT);
    const res = await request(app).post("/api/auth/google").send({ credential: "id-token" });
    expect(res.status).toBe(200);
    expect(googleLogin).toHaveBeenCalledWith("id-token");
  });

  it("propagates an invalid Google token as 401", async () => {
    googleLogin.mockRejectedValue(new UnauthorizedError("Jeton Google invalide"));
    const res = await request(app).post("/api/auth/google").send({ credential: "bad-token" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("returns success for the authenticated user", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { success: true } });
  });
});

describe("GET /api/auth/me", () => {
  it("returns the authenticated user", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(currentUser);
  });
});

describe("POST /api/auth/password", () => {
  it("rejects a weak new password (400) without calling the service", async () => {
    const res = await request(app).post("/api/auth/password").send({ currentPassword: "Old123!", newPassword: "weak" });
    expect(res.status).toBe(400);
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("changes the password for the authenticated user", async () => {
    changePassword.mockResolvedValue(undefined);
    const res = await request(app).post("/api/auth/password").send({ currentPassword: "Old123!", newPassword: "NewPass456!" });
    expect(res.status).toBe(200);
    expect(changePassword).toHaveBeenCalledWith("client-1", "Old123!", "NewPass456!");
  });

  it("propagates an incorrect current password as 401", async () => {
    changePassword.mockRejectedValue(new UnauthorizedError("Le mot de passe actuel est incorrect"));
    const res = await request(app).post("/api/auth/password").send({ currentPassword: "Wrong123!", newPassword: "NewPass456!" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
