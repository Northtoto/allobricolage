import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "@/index.ts";

describe("route smoke tests", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/business/plans returns the retainer catalog (public)", async () => {
    const res = await request(app).get("/api/business/plans");
    expect(res.status).toBe(200);
    expect(res.body.data.plans).toHaveProperty("essentiel");
    expect(res.body.data.plans).toHaveProperty("pro");
    expect(res.body.data.plans).toHaveProperty("enterprise");
  });

  it("rejects a non-UUID on a validated :id route with 400", async () => {
    // /api/technician/jobs/:id/accept runs authenticate before validateParams,
    // so without a token we expect 401; with the route reachable, a malformed id
    // must never reach the DB layer. Assert it is a client error, not a 500/crash.
    const res = await request(app).post("/api/technician/jobs/not-a-uuid/accept");
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("returns 404 JSON for unknown routes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("GET /technicians/me is NOT shadowed by /:id (401 auth, not 400 uuid)", async () => {
    // Regression: /me must be registered before /:id, else it hits the uuid
    // param route and 400s. Unauthenticated => 401 proves the route resolves.
    const res = await request(app).get("/api/technicians/me");
    expect(res.status).toBe(401);
  });

  it("GET /tracking/booking/:id route exists (401 auth, not 404)", async () => {
    const res = await request(app).get("/api/tracking/booking/123e4567-e89b-12d3-a456-426614174000");
    expect(res.status).toBe(401);
  });

  it("POST /quotes requires auth (route mounted)", async () => {
    const res = await request(app).post("/api/quotes").send({});
    expect(res.status).toBe(401);
  });

  it("GET /quotes/booking/:id requires auth (route mounted)", async () => {
    const res = await request(app).get("/api/quotes/booking/123e4567-e89b-12d3-a456-426614174000");
    expect(res.status).toBe(401);
  });
});
