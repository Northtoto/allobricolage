import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { bookings, type Booking, type InsertBooking } from "@/db/schema.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { v4 as uuidv4 } from "uuid";

export class BookingRepository {
  async findAll(): Promise<Booking[]> {
    return db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async findById(id: string): Promise<Booking | undefined> {
    const results = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return results[0];
  }

  async findByTechnicianId(technicianId: string): Promise<Booking[]> {
    return db.select().from(bookings)
      .where(eq(bookings.technicianId, technicianId))
      .orderBy(desc(bookings.createdAt));
  }

  async findByClientId(clientId: string): Promise<Booking[]> {
    return db.select().from(bookings)
      .where(eq(bookings.clientId, clientId))
      .orderBy(desc(bookings.createdAt));
  }

  async create(data: InsertBooking): Promise<Booking> {
    const id = uuidv4();
    const result = await db.insert(bookings).values({ ...data, id }).returning();
    return result[0];
  }

  async update(id: string, data: Partial<InsertBooking>): Promise<Booking> {
    const result = await db.update(bookings)
      .set(data)
      .where(eq(bookings.id, id))
      .returning();

    if (!result[0]) {
      throw new NotFoundError("Booking", id);
    }
    return result[0];
  }

  async findPendingByTechnician(technicianId: string): Promise<Booking[]> {
    return db.select().from(bookings)
      .where(and(eq(bookings.technicianId, technicianId), eq(bookings.status, "pending")))
      .orderBy(desc(bookings.createdAt));
  }

  async getStats(technicianId: string): Promise<{
    totalBookings: number;
    pendingBookings: number;
    completedBookings: number;
    totalEarnings: number;
  }> {
    const techBookings = await db.select().from(bookings)
      .where(eq(bookings.technicianId, technicianId));

    const completed = techBookings.filter((b) => b.status === "completed");
    return {
      totalBookings: techBookings.length,
      pendingBookings: techBookings.filter((b) => b.status === "pending").length,
      completedBookings: completed.length,
      totalEarnings: completed.reduce((sum, b) => sum + (b.finalCost ?? b.estimatedCost ?? 0), 0),
    };
  }

  async getClientStats(clientId: string): Promise<{
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
  }> {
    const clientBookings = await db.select().from(bookings)
      .where(eq(bookings.clientId, clientId));

    return {
      totalBookings: clientBookings.length,
      activeBookings: clientBookings.filter((b) =>
        b.status === "pending" || b.status === "accepted"
      ).length,
      completedBookings: clientBookings.filter((b) => b.status === "completed").length,
    };
  }
}

export const bookingRepository = new BookingRepository();
