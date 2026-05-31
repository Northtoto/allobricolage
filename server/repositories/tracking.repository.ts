import { eq, desc } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { technicianLocations, jobAddresses, type TechnicianLocation, type InsertTechnicianLocation, type JobAddress, type InsertJobAddress } from "@/db/schema.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { v4 as uuidv4 } from "uuid";

export class TrackingRepository {
  async findLatestByBookingId(bookingId: string): Promise<TechnicianLocation | undefined> {
    const results = await db.select().from(technicianLocations)
      .where(eq(technicianLocations.bookingId, bookingId))
      .orderBy(desc(technicianLocations.timestamp))
      .limit(1);
    return results[0];
  }

  async createLocation(data: InsertTechnicianLocation): Promise<TechnicianLocation> {
    const id = uuidv4();
    const result = await db.insert(technicianLocations)
      .values({ ...data, id })
      .returning();
    return result[0];
  }

  async deactivateByBookingId(bookingId: string): Promise<void> {
    await db.update(technicianLocations)
      .set({ isActive: false })
      .where(eq(technicianLocations.bookingId, bookingId));
  }

  async findAddressByBookingId(bookingId: string): Promise<JobAddress | undefined> {
    const results = await db.select().from(jobAddresses)
      .where(eq(jobAddresses.bookingId, bookingId))
      .limit(1);
    return results[0];
  }

  async createAddress(data: InsertJobAddress): Promise<JobAddress> {
    const id = uuidv4();
    const result = await db.insert(jobAddresses).values({ ...data, id }).returning();
    return result[0];
  }
}

export const trackingRepository = new TrackingRepository();
