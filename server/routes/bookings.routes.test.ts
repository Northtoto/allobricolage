import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

let currentUser: { id: string; role: string; name: string; city?: string } = {
  id: "client-1",
  role: "client",
  name: "C",
};
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

const bookingFindById = vi.fn();
const bookingFindByClientId = vi.fn();
const bookingFindByTechnicianId = vi.fn();
const bookingFindAll = vi.fn();
const bookingCreate = vi.fn();
const bookingUpdate = vi.fn();
const jobCreate = vi.fn();
const technicianFindById = vi.fn();
const technicianFindByUserId = vi.fn();
const notificationCreate = vi.fn();

vi.mock("@/repositories/booking.repository.ts", () => ({
  bookingRepository: {
    findById: (id: string) => bookingFindById(id),
    findByClientId: (id: string) => bookingFindByClientId(id),
    findByTechnicianId: (id: string) => bookingFindByTechnicianId(id),
    findAll: () => bookingFindAll(),
    create: (d: any) => bookingCreate(d),
    update: (id: string, d: any) => bookingUpdate(id, d),
  },
}));
vi.mock("@/repositories/job.repository.ts", () => ({
  jobRepository: { create: (d: any) => jobCreate(d) },
}));
vi.mock("@/repositories/technician.repository.ts", () => ({
  technicianRepository: {
    findById: (id: string) => technicianFindById(id),
    findByUserId: (id: string) => technicianFindByUserId(id),
  },
}));
vi.mock("@/repositories/notification.repository.ts", () => ({
  notificationRepository: { create: (d: any) => notificationCreate(d) },
}));

import { app } from "@/index.ts";

const BOOKING = "22222222-2222-2222-2222-222222222222";
const TECH_ID = "33333333-3333-3333-3333-333333333333";

const validBookingBody = {
  jobId: "job-1",
  technicianId: TECH_ID,
  clientName: "Client Test",
  clientPhone: "0600000000",
  scheduledDate: "2026-09-01",
  scheduledTime: "14:30",
};

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = { id: "client-1", role: "client", name: "C" };
  technicianFindById.mockResolvedValue(undefined);
});

describe("POST /api/bookings", () => {
  it("creates a booking for an existing job without touching jobRepository", async () => {
    bookingCreate.mockResolvedValue({ id: BOOKING, ...validBookingBody, status: "pending" });
    const res = await request(app).post("/api/bookings").send(validBookingBody);

    expect(res.status).toBe(201);
    expect(jobCreate).not.toHaveBeenCalled();
    expect(bookingCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: "job-1",
        technicianId: TECH_ID,
        clientId: "client-1",
        clientName: "Client Test",
        status: "pending",
      })
    );
  });

  it("creates a direct-booking job when jobId is 'direct', applying defaults", async () => {
    currentUser = { id: "client-1", role: "client", name: "C", city: "Rabat" };
    jobCreate.mockResolvedValue({ id: "new-job-id" });
    bookingCreate.mockResolvedValue({ id: BOOKING, status: "pending" });

    const res = await request(app)
      .post("/api/bookings")
      .send({ ...validBookingBody, jobId: "direct" });

    expect(res.status).toBe(201);
    expect(jobCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-1",
        description: "Réservation directe",
        service: "services_generaux",
        city: "Rabat",
        urgency: "normal",
        complexity: "moderate",
        status: "pending",
      })
    );
    expect(bookingCreate).toHaveBeenCalledWith(expect.objectContaining({ jobId: "new-job-id" }));
  });

  it("falls back to Casablanca for a direct booking when the client has no city", async () => {
    jobCreate.mockResolvedValue({ id: "new-job-id" });
    bookingCreate.mockResolvedValue({ id: BOOKING, status: "pending" });

    await request(app).post("/api/bookings").send({ ...validBookingBody, jobId: "direct" });

    expect(jobCreate).toHaveBeenCalledWith(expect.objectContaining({ city: "Casablanca" }));
  });

  it("applies +50% emergency pricing, rounded", async () => {
    bookingCreate.mockResolvedValue({ id: BOOKING, status: "pending" });
    await request(app)
      .post("/api/bookings")
      .send({ ...validBookingBody, isEmergency: true, estimatedCost: 999 });

    expect(bookingCreate).toHaveBeenCalledWith(
      expect.objectContaining({ isEmergency: true, estimatedCost: 1499 })
    );
  });

  it("leaves the cost untouched when not an emergency", async () => {
    bookingCreate.mockResolvedValue({ id: BOOKING, status: "pending" });
    await request(app)
      .post("/api/bookings")
      .send({ ...validBookingBody, estimatedCost: 1000 });

    expect(bookingCreate).toHaveBeenCalledWith(expect.objectContaining({ estimatedCost: 1000 }));
  });

  it("notifies the matched technician when one is found", async () => {
    bookingCreate.mockResolvedValue({ id: BOOKING, status: "pending" });
    technicianFindById.mockResolvedValue({ id: TECH_ID, userId: "tech-user-1" });

    await request(app).post("/api/bookings").send(validBookingBody);

    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "tech-user-1", type: "booking", bookingId: BOOKING })
    );
  });

  it("skips the notification when the technician cannot be found", async () => {
    bookingCreate.mockResolvedValue({ id: BOOKING, status: "pending" });
    technicianFindById.mockResolvedValue(undefined);

    const res = await request(app).post("/api/bookings").send(validBookingBody);

    expect(res.status).toBe(201);
    expect(notificationCreate).not.toHaveBeenCalled();
  });

  it("rejects a body missing required fields (400)", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .send({ jobId: "job-1", technicianId: TECH_ID });

    expect(res.status).toBe(400);
    expect(bookingCreate).not.toHaveBeenCalled();
  });

  it("rejects an invalid technicianId (400)", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .send({ ...validBookingBody, technicianId: "not-a-uuid" });

    expect(res.status).toBe(400);
    expect(bookingCreate).not.toHaveBeenCalled();
  });

  it("rejects a malformed scheduledDate (400)", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .send({ ...validBookingBody, scheduledDate: "01-09-2026" });

    expect(res.status).toBe(400);
    expect(bookingCreate).not.toHaveBeenCalled();
  });

  it("rejects a technician trying to create a booking (403)", async () => {
    currentUser = { id: "tech-user-1", role: "technician", name: "T" };
    const res = await request(app).post("/api/bookings").send(validBookingBody);

    expect(res.status).toBe(403);
    expect(bookingCreate).not.toHaveBeenCalled();
  });

  it("allows an admin to create a booking", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    bookingCreate.mockResolvedValue({ id: BOOKING, status: "pending" });

    const res = await request(app).post("/api/bookings").send(validBookingBody);

    expect(res.status).toBe(201);
    expect(bookingCreate).toHaveBeenCalledWith(expect.objectContaining({ clientId: "admin-1" }));
  });
});

describe("GET /api/bookings", () => {
  it("returns the client's own bookings", async () => {
    bookingFindByClientId.mockResolvedValue([{ id: BOOKING }]);
    const res = await request(app).get("/api/bookings");

    expect(res.status).toBe(200);
    expect(bookingFindByClientId).toHaveBeenCalledWith("client-1");
    expect(res.body.data).toEqual([{ id: BOOKING }]);
  });

  it("returns the technician's own bookings when a technician profile exists", async () => {
    currentUser = { id: "tech-user-1", role: "technician", name: "T" };
    technicianFindByUserId.mockResolvedValue({ id: TECH_ID, userId: "tech-user-1" });
    bookingFindByTechnicianId.mockResolvedValue([{ id: BOOKING }]);

    const res = await request(app).get("/api/bookings");

    expect(res.status).toBe(200);
    expect(bookingFindByTechnicianId).toHaveBeenCalledWith(TECH_ID);
  });

  it("returns an empty list for a technician user with no technician profile", async () => {
    currentUser = { id: "tech-user-1", role: "technician", name: "T" };
    technicianFindByUserId.mockResolvedValue(undefined);

    const res = await request(app).get("/api/bookings");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(bookingFindByTechnicianId).not.toHaveBeenCalled();
  });

  it("returns all bookings for an admin", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    bookingFindAll.mockResolvedValue([{ id: BOOKING }, { id: "other" }]);

    const res = await request(app).get("/api/bookings");

    expect(res.status).toBe(200);
    expect(bookingFindAll).toHaveBeenCalled();
    expect(res.body.data).toHaveLength(2);
  });
});

describe("GET /api/bookings/:id", () => {
  it("rejects an invalid id (400)", async () => {
    const res = await request(app).get("/api/bookings/not-a-uuid");
    expect(res.status).toBe(400);
  });

  it("404s for an unknown booking", async () => {
    bookingFindById.mockResolvedValue(undefined);
    const res = await request(app).get(`/api/bookings/${BOOKING}`);
    expect(res.status).toBe(404);
  });

  it("allows the owning client", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: TECH_ID });
    const res = await request(app).get(`/api/bookings/${BOOKING}`);
    expect(res.status).toBe(200);
  });

  it("allows the owning technician", async () => {
    currentUser = { id: "tech-user-1", role: "technician", name: "T" };
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: TECH_ID });
    technicianFindById.mockResolvedValue({ id: TECH_ID, userId: "tech-user-1" });

    const res = await request(app).get(`/api/bookings/${BOOKING}`);
    expect(res.status).toBe(200);
  });

  it("rejects an unrelated client (403)", async () => {
    currentUser = { id: "someone-else", role: "client", name: "X" };
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: TECH_ID });

    const res = await request(app).get(`/api/bookings/${BOOKING}`);
    expect(res.status).toBe(403);
  });

  it("rejects an unrelated technician (403)", async () => {
    currentUser = { id: "other-tech-user", role: "technician", name: "T2" };
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: TECH_ID });
    technicianFindById.mockResolvedValue({ id: TECH_ID, userId: "tech-user-1" });

    const res = await request(app).get(`/api/bookings/${BOOKING}`);
    expect(res.status).toBe(403);
  });

  it("allows an admin regardless of ownership", async () => {
    currentUser = { id: "admin-1", role: "admin", name: "A" };
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: TECH_ID });

    const res = await request(app).get(`/api/bookings/${BOOKING}`);
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/bookings/:id/status", () => {
  it("rejects an invalid status value (400)", async () => {
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: TECH_ID, status: "pending" });
    const res = await request(app).patch(`/api/bookings/${BOOKING}/status`).send({ status: "done" });
    expect(res.status).toBe(400);
    expect(bookingUpdate).not.toHaveBeenCalled();
  });

  it("404s for an unknown booking", async () => {
    bookingFindById.mockResolvedValue(undefined);
    const res = await request(app).patch(`/api/bookings/${BOOKING}/status`).send({ status: "accepted" });
    expect(res.status).toBe(404);
  });

  it("rejects an unrelated client (403)", async () => {
    currentUser = { id: "someone-else", role: "client", name: "X" };
    bookingFindById.mockResolvedValue({ id: BOOKING, clientId: "client-1", technicianId: TECH_ID, status: "pending" });

    const res = await request(app).patch(`/api/bookings/${BOOKING}/status`).send({ status: "accepted" });
    expect(res.status).toBe(403);
    expect(bookingUpdate).not.toHaveBeenCalled();
  });

  it("stamps actualEndTime and opens the guarantee window on first completion", async () => {
    bookingFindById.mockResolvedValue({
      id: BOOKING,
      clientId: "client-1",
      technicianId: TECH_ID,
      status: "in_progress",
      actualEndTime: null,
    });
    bookingUpdate.mockResolvedValue({ id: BOOKING, status: "completed" });

    const res = await request(app).patch(`/api/bookings/${BOOKING}/status`).send({ status: "completed" });

    expect(res.status).toBe(200);
    expect(bookingUpdate).toHaveBeenCalledWith(
      BOOKING,
      expect.objectContaining({ status: "completed", guaranteePeriodDays: 7, actualEndTime: expect.any(Date) })
    );
  });

  it("preserves an already-stamped actualEndTime instead of overwriting it", async () => {
    const existingEnd = new Date("2026-08-01T10:00:00.000Z");
    bookingFindById.mockResolvedValue({
      id: BOOKING,
      clientId: "client-1",
      technicianId: TECH_ID,
      status: "in_progress",
      actualEndTime: existingEnd,
    });
    bookingUpdate.mockResolvedValue({ id: BOOKING, status: "completed" });

    await request(app).patch(`/api/bookings/${BOOKING}/status`).send({ status: "completed" });

    expect(bookingUpdate).toHaveBeenCalledWith(
      BOOKING,
      expect.objectContaining({ actualEndTime: existingEnd })
    );
  });

  it("does not re-stamp guarantee fields when the booking is already completed", async () => {
    bookingFindById.mockResolvedValue({
      id: BOOKING,
      clientId: "client-1",
      technicianId: TECH_ID,
      status: "completed",
      actualEndTime: new Date("2026-08-01T10:00:00.000Z"),
    });
    bookingUpdate.mockResolvedValue({ id: BOOKING, status: "completed" });

    await request(app).patch(`/api/bookings/${BOOKING}/status`).send({ status: "completed" });

    expect(bookingUpdate).toHaveBeenCalledWith(BOOKING, { status: "completed" });
  });

  it("passes through a plain status change with no guarantee fields", async () => {
    bookingFindById.mockResolvedValue({
      id: BOOKING,
      clientId: "client-1",
      technicianId: TECH_ID,
      status: "pending",
    });
    bookingUpdate.mockResolvedValue({ id: BOOKING, status: "accepted" });

    await request(app).patch(`/api/bookings/${BOOKING}/status`).send({ status: "accepted" });

    expect(bookingUpdate).toHaveBeenCalledWith(BOOKING, { status: "accepted" });
  });

  it("allows the owning technician to change status", async () => {
    currentUser = { id: "tech-user-1", role: "technician", name: "T" };
    bookingFindById.mockResolvedValue({
      id: BOOKING,
      clientId: "client-1",
      technicianId: TECH_ID,
      status: "pending",
    });
    technicianFindById.mockResolvedValue({ id: TECH_ID, userId: "tech-user-1" });
    bookingUpdate.mockResolvedValue({ id: BOOKING, status: "in_progress" });

    const res = await request(app).patch(`/api/bookings/${BOOKING}/status`).send({ status: "in_progress" });
    expect(res.status).toBe(200);
  });
});
