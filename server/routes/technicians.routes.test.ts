import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

let currentUser: { id: string; role: string; name: string } = { id: "tech-user-1", role: "technician", name: "T" };
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

const findAllWithUsers = vi.fn();
const findByUserId = vi.fn();
const findWithUser = vi.fn();
const techUpdate = vi.fn();
vi.mock("@/repositories/technician.repository.ts", () => ({
  technicianRepository: {
    findAllWithUsers: (f: any) => findAllWithUsers(f),
    findByUserId: (id: string) => findByUserId(id),
    findWithUser: (id: string) => findWithUser(id),
    update: (id: string, d: any) => techUpdate(id, d),
  },
}));

const findByTechnicianId = vi.fn();
vi.mock("@/repositories/review.repository.ts", () => ({
  reviewRepository: {
    findByTechnicianId: (id: string) => findByTechnicianId(id),
  },
}));

import { app } from "@/index.ts";

const TECH_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_TECH_ID = "22222222-2222-2222-2222-222222222222";

function techRow(overrides: Record<string, unknown> = {}) {
  return {
    id: TECH_ID,
    userId: "tech-user-1",
    name: "Karim",
    services: ["plomberie"],
    skills: ["fuite"],
    rating: 4.5,
    reviewCount: 10,
    hourlyRate: 200,
    yearsExperience: 5,
    isAvailable: true,
    isVerified: true,
    isPro: false,
    latitude: 33.5731,
    longitude: -7.5898,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = { id: "tech-user-1", role: "technician", name: "T" };
  findAllWithUsers.mockResolvedValue({ items: [], total: 0 });
});

describe("GET /api/technicians", () => {
  it("lists technicians with default pagination meta", async () => {
    findAllWithUsers.mockResolvedValue({ items: [techRow()], total: 1 });
    const res = await request(app).get("/api/technicians");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({ total: 1, page: 1, limit: 20 });
    expect(findAllWithUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        city: undefined,
        service: undefined,
        minRating: undefined,
        available: undefined,
        search: undefined,
        sortBy: undefined,
        page: undefined,
        limit: undefined,
      })
    );
  });

  it("passes transformed query filters through to the repository", async () => {
    const res = await request(app).get(
      "/api/technicians?city=Casablanca&service=plomberie&minRating=4.5&available=true&sortBy=rating&page=2&limit=10"
    );

    expect(res.status).toBe(200);
    expect(findAllWithUsers).toHaveBeenCalledWith({
      city: "Casablanca",
      service: "plomberie",
      minRating: 4.5,
      available: true,
      search: undefined,
      sortBy: "rating",
      page: 2,
      limit: 10,
    });
    expect(res.body.meta).toEqual({ total: 0, page: 2, limit: 10 });
  });

  it("rejects an invalid sortBy value (400)", async () => {
    const res = await request(app).get("/api/technicians?sortBy=cheapest");
    expect(res.status).toBe(400);
    expect(findAllWithUsers).not.toHaveBeenCalled();
  });

  it("rejects a repeated query param that fails the string schema (400)", async () => {
    const res = await request(app).get("/api/technicians?city=Casablanca&city=Rabat");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/technicians/search/nearby", () => {
  it("requires lat and lng (400)", async () => {
    const res = await request(app).get("/api/technicians/search/nearby");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(findAllWithUsers).not.toHaveBeenCalled();
  });

  it("returns only technicians within the radius, nearest first, with a distance field", async () => {
    // Casablanca center; one tech ~5km away, one tech far away in Marrakech.
    findAllWithUsers.mockResolvedValue({
      items: [
        techRow({ id: "near", latitude: 33.6, longitude: -7.6 }),
        techRow({ id: "far", latitude: 31.63, longitude: -8.0 }),
        techRow({ id: "no-coords", latitude: null, longitude: null }),
      ],
      total: 3,
    });

    const res = await request(app).get("/api/technicians/search/nearby?lat=33.5731&lng=-7.5898&radius=20");

    expect(res.status).toBe(200);
    expect(findAllWithUsers).toHaveBeenCalledWith({ service: undefined, available: true, limit: 500 });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe("near");
    expect(typeof res.body.data[0].distance).toBe("number");
  });

  it("defaults the radius to 20km when not provided or invalid", async () => {
    findAllWithUsers.mockResolvedValue({ items: [techRow({ latitude: 33.6, longitude: -7.6 })], total: 1 });
    const res = await request(app).get("/api/technicians/search/nearby?lat=33.5731&lng=-7.5898");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

// "/me" must resolve before "/:id" (Express route ordering), otherwise "me" is
// parsed as a UUID param and fails validation with 400.
describe("GET /api/technicians/me", () => {
  it("returns 404 when the authenticated user has no technician profile", async () => {
    findByUserId.mockResolvedValue(undefined);
    const res = await request(app).get("/api/technicians/me");
    expect(res.status).toBe(404);
  });

  it("returns the authenticated technician's own profile (200)", async () => {
    findByUserId.mockResolvedValue({ id: TECH_ID, userId: "tech-user-1" });
    findWithUser.mockResolvedValue(techRow());
    const res = await request(app).get("/api/technicians/me");
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(TECH_ID);
    expect(findWithUser).toHaveBeenCalledWith(TECH_ID);
  });
});

describe("GET /api/technicians/:id", () => {
  it("rejects an invalid id (400)", async () => {
    const res = await request(app).get("/api/technicians/not-a-uuid");
    expect(res.status).toBe(400);
    expect(findWithUser).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown technician", async () => {
    findWithUser.mockResolvedValue(undefined);
    const res = await request(app).get(`/api/technicians/${TECH_ID}`);
    expect(res.status).toBe(404);
  });

  it("returns the technician profile without requiring auth (200)", async () => {
    findWithUser.mockResolvedValue(techRow());
    const res = await request(app).get(`/api/technicians/${TECH_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(TECH_ID);
  });
});

describe("GET /api/technicians/:id/reviews", () => {
  it("rejects an invalid id (400)", async () => {
    const res = await request(app).get("/api/technicians/not-a-uuid/reviews");
    expect(res.status).toBe(400);
  });

  it("returns the technician's reviews (200)", async () => {
    findByTechnicianId.mockResolvedValue([{ id: "r1", technicianId: TECH_ID, rating: 5 }]);
    const res = await request(app).get(`/api/technicians/${TECH_ID}/reviews`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(findByTechnicianId).toHaveBeenCalledWith(TECH_ID);
  });
});

describe("POST /api/technicians/:id/photo", () => {
  it("lets a technician update their own photo (200)", async () => {
    findByUserId.mockResolvedValue({ id: TECH_ID, userId: "tech-user-1" });
    const res = await request(app).post(`/api/technicians/${TECH_ID}/photo`);
    expect(res.status).toBe(200);
    expect(res.body.data.photo).toContain("https://");
    expect(techUpdate).toHaveBeenCalledWith(TECH_ID, { photo: expect.any(String) });
  });

  it("rejects a technician updating someone else's photo (403)", async () => {
    findByUserId.mockResolvedValue({ id: OTHER_TECH_ID, userId: "tech-user-1" });
    const res = await request(app).post(`/api/technicians/${TECH_ID}/photo`);
    expect(res.status).toBe(403);
    expect(techUpdate).not.toHaveBeenCalled();
  });

  it("rejects an authenticated user with no technician profile at all (403)", async () => {
    currentUser = { id: "client-1", role: "client", name: "C" };
    findByUserId.mockResolvedValue(undefined);
    const res = await request(app).post(`/api/technicians/${TECH_ID}/photo`);
    expect(res.status).toBe(403);
    expect(techUpdate).not.toHaveBeenCalled();
  });

  it("lets an admin update any technician's photo (200)", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    const res = await request(app).post(`/api/technicians/${TECH_ID}/photo`);
    expect(res.status).toBe(200);
    expect(findByUserId).not.toHaveBeenCalled();
    expect(techUpdate).toHaveBeenCalledWith(TECH_ID, { photo: expect.any(String) });
  });
});
