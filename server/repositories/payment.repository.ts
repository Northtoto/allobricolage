import { eq, desc } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { payments, type Payment, type InsertPayment } from "@/db/schema.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { v4 as uuidv4 } from "uuid";

export class PaymentRepository {
  async findById(id: string): Promise<Payment | undefined> {
    const results = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return results[0];
  }

  async findByBookingId(bookingId: string): Promise<Payment | undefined> {
    const results = await db.select().from(payments)
      .where(eq(payments.bookingId, bookingId))
      .limit(1);
    return results[0];
  }

  async create(data: InsertPayment): Promise<Payment> {
    const id = uuidv4();
    const result = await db.insert(payments).values({ ...data, id }).returning();
    return result[0];
  }

  async update(id: string, data: Partial<InsertPayment>): Promise<Payment> {
    const result = await db.update(payments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();

    if (!result[0]) {
      throw new NotFoundError("Payment", id);
    }
    return result[0];
  }
}

export const paymentRepository = new PaymentRepository();
