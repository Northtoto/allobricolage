import { eq, desc } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { reviews, type Review, type InsertReview } from "@/db/schema.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { v4 as uuidv4 } from "uuid";

export class ReviewRepository {
  async findAll(): Promise<Review[]> {
    return db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async findById(id: string): Promise<Review | undefined> {
    const results = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    return results[0];
  }

  async findByTechnicianId(technicianId: string): Promise<Review[]> {
    return db.select().from(reviews)
      .where(eq(reviews.technicianId, technicianId))
      .orderBy(desc(reviews.createdAt));
  }

  async findByClientId(clientId: string): Promise<Review[]> {
    return db.select().from(reviews)
      .where(eq(reviews.clientId, clientId))
      .orderBy(desc(reviews.createdAt));
  }

  async findByBookingId(bookingId: string): Promise<Review | undefined> {
    const results = await db.select().from(reviews).where(eq(reviews.bookingId, bookingId)).limit(1);
    return results[0];
  }

  async create(data: InsertReview): Promise<Review> {
    const id = uuidv4();
    const result = await db.insert(reviews).values({ ...data, id }).returning();
    return result[0];
  }

  async update(id: string, data: Partial<InsertReview>): Promise<Review> {
    const result = await db.update(reviews)
      .set(data)
      .where(eq(reviews.id, id))
      .returning();

    if (!result[0]) {
      throw new NotFoundError("Review", id);
    }
    return result[0];
  }
}

export const reviewRepository = new ReviewRepository();
