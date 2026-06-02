import { eq, desc } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { quotes, type Quote, type InsertQuote } from "@/db/schema.ts";
import { v4 as uuidv4 } from "uuid";

export class QuoteRepository {
  async findById(id: string): Promise<Quote | undefined> {
    const rows = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
    return rows[0];
  }

  async findByBookingId(bookingId: string): Promise<Quote[]> {
    return db
      .select()
      .from(quotes)
      .where(eq(quotes.bookingId, bookingId))
      .orderBy(desc(quotes.createdAt));
  }

  async create(data: InsertQuote): Promise<Quote> {
    const id = uuidv4();
    const rows = await db.insert(quotes).values({ ...data, id }).returning();
    return rows[0];
  }

  async update(id: string, data: Partial<InsertQuote>): Promise<Quote | undefined> {
    const rows = await db.update(quotes).set(data).where(eq(quotes.id, id)).returning();
    return rows[0];
  }
}

export const quoteRepository = new QuoteRepository();
