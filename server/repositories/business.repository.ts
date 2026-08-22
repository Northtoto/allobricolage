import { eq, desc } from "drizzle-orm";
import { db } from "@/db/index.ts";
import {
  businessProfiles,
  businessRetainers,
  type BusinessProfile,
  type InsertBusinessProfile,
  type BusinessRetainer,
  type InsertBusinessRetainer,
} from "@/db/schema.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { v4 as uuidv4 } from "uuid";

export class BusinessRepository {
  async findProfileByUserId(userId: string): Promise<BusinessProfile | undefined> {
    const rows = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, userId))
      .limit(1);
    return rows[0];
  }

  async findProfileById(id: string): Promise<BusinessProfile | undefined> {
    const rows = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.id, id))
      .limit(1);
    return rows[0];
  }

  async createProfile(data: InsertBusinessProfile): Promise<BusinessProfile> {
    const id = uuidv4();
    const rows = await db.insert(businessProfiles).values({ ...data, id }).returning();
    return rows[0];
  }

  async updateProfile(id: string, data: Partial<InsertBusinessProfile>): Promise<BusinessProfile> {
    const rows = await db
      .update(businessProfiles)
      .set(data)
      .where(eq(businessProfiles.id, id))
      .returning();

    if (!rows[0]) {
      throw new NotFoundError("BusinessProfile", id);
    }
    return rows[0];
  }

  async findActiveRetainer(businessId: string): Promise<BusinessRetainer | undefined> {
    const rows = await db
      .select()
      .from(businessRetainers)
      .where(eq(businessRetainers.businessId, businessId))
      .orderBy(desc(businessRetainers.startedAt))
      .limit(1);
    return rows[0];
  }

  async createRetainer(data: InsertBusinessRetainer): Promise<BusinessRetainer> {
    const id = uuidv4();
    const rows = await db.insert(businessRetainers).values({ ...data, id }).returning();
    return rows[0];
  }
}

export const businessRepository = new BusinessRepository();
