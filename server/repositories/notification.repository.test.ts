import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Notification } from "@shared/schema.ts";

// Chainable Drizzle query builder mock. Every chain method defaults to
// returning `this` so calls like db.select().from().where().limit() chain
// freely; tests override the terminal method for that call with
// mockResolvedValueOnce(...) to control the resolved rows.
const mockDb = vi.hoisted(() => {
  const db: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    orderBy: vi.fn(),
    insert: vi.fn(),
    values: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    returning: vi.fn(),
  };
  Object.values(db).forEach((fn) => fn.mockReturnThis());
  return db;
});

vi.mock("@/db/index.ts", () => ({ db: mockDb }));
vi.mock("uuid", () => ({ v4: () => "generated-uuid" }));

import { notificationRepository } from "./notification.repository.ts";
import { NotFoundError } from "@/utils/errors.ts";

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(mockDb).forEach((fn) => fn.mockReturnThis());
});

const makeNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: "notif-1",
  userId: "user-1",
  type: "booking_accepted",
  title: "Réservation acceptée",
  message: "Un technicien a accepté votre réservation",
  bookingId: "booking-1",
  paymentId: null,
  isRead: false,
  createdAt: new Date("2026-08-01T00:00:00Z"),
  ...overrides,
});

describe("notificationRepository.findByUserId", () => {
  it("returns all notifications for the user ordered by createdAt desc", async () => {
    const rows = [makeNotification({ id: "n1" }), makeNotification({ id: "n2", isRead: true })];
    mockDb.orderBy.mockResolvedValueOnce(rows);

    const result = await notificationRepository.findByUserId("user-1");

    expect(result).toEqual(rows);
    expect(mockDb.where).toHaveBeenCalled();
    expect(mockDb.orderBy).toHaveBeenCalled();
  });

  it("returns an empty array when the user has no notifications", async () => {
    mockDb.orderBy.mockResolvedValueOnce([]);

    const result = await notificationRepository.findByUserId("user-none");

    expect(result).toEqual([]);
  });
});

describe("notificationRepository.findUnreadByUserId", () => {
  it("returns only unread notifications for the user", async () => {
    const rows = [makeNotification({ id: "n1", isRead: false })];
    mockDb.orderBy.mockResolvedValueOnce(rows);

    const result = await notificationRepository.findUnreadByUserId("user-1");

    expect(result).toEqual(rows);
    expect(mockDb.where).toHaveBeenCalled();
  });

  it("returns an empty array when the user has no unread notifications", async () => {
    mockDb.orderBy.mockResolvedValueOnce([]);

    const result = await notificationRepository.findUnreadByUserId("user-1");

    expect(result).toEqual([]);
  });
});

describe("notificationRepository.findById", () => {
  it("returns the notification when found", async () => {
    const row = makeNotification({ id: "n1" });
    mockDb.limit.mockResolvedValueOnce([row]);

    const result = await notificationRepository.findById("n1");

    expect(result).toEqual(row);
    expect(mockDb.limit).toHaveBeenCalledWith(1);
  });

  it("returns undefined when no notification matches", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const result = await notificationRepository.findById("missing");

    expect(result).toBeUndefined();
  });
});

describe("notificationRepository.create", () => {
  it("generates an id and inserts the notification", async () => {
    const insertData = {
      userId: "user-1",
      type: "booking_accepted",
      title: "Réservation acceptée",
      message: "Un technicien a accepté votre réservation",
      bookingId: "booking-1",
    };
    const created = makeNotification({ id: "generated-uuid", ...insertData });
    mockDb.returning.mockResolvedValueOnce([created]);

    const result = await notificationRepository.create(insertData as never);

    expect(result).toEqual(created);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith({ ...insertData, id: "generated-uuid" });
  });
});

describe("notificationRepository.markAsRead", () => {
  it("marks the notification read and returns it", async () => {
    const updated = makeNotification({ id: "n1", isRead: true });
    mockDb.returning.mockResolvedValueOnce([updated]);

    const result = await notificationRepository.markAsRead("n1");

    expect(result).toEqual(updated);
    expect(mockDb.set).toHaveBeenCalledWith({ isRead: true });
  });

  it("throws NotFoundError when the notification does not exist", async () => {
    mockDb.returning.mockResolvedValueOnce([]);

    await expect(notificationRepository.markAsRead("missing")).rejects.toThrow(NotFoundError);
  });
});

describe("notificationRepository.markAllAsRead", () => {
  it("updates all notifications for the user without returning rows", async () => {
    mockDb.where.mockResolvedValueOnce(undefined);

    await expect(notificationRepository.markAllAsRead("user-1")).resolves.toBeUndefined();

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith({ isRead: true });
    expect(mockDb.where).toHaveBeenCalled();
  });
});
