import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { jobs, type Job, type InsertJob } from "@/db/schema.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { v4 as uuidv4 } from "uuid";

export class JobRepository {
  async findAll(page = 1, limit = 20): Promise<{ items: Job[]; total: number }> {
    const offset = (page - 1) * limit;
    const [items, countResult] = await Promise.all([
      db.select().from(jobs).limit(limit).offset(offset).orderBy(desc(jobs.createdAt)),
      db.select({ count: sql<number>`count(*)` }).from(jobs),
    ]);
    return { items, total: countResult[0]?.count ?? 0 };
  }

  async findById(id: string): Promise<Job | undefined> {
    const results = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return results[0];
  }

  async findByClientId(clientId: string): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.clientId, clientId)).orderBy(desc(jobs.createdAt));
  }

  async findByStatus(status: string): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.status, status)).orderBy(desc(jobs.createdAt));
  }

  async create(data: InsertJob): Promise<Job> {
    const id = uuidv4();
    const result = await db.insert(jobs).values({ ...data, id }).returning();
    return result[0];
  }

  async update(id: string, data: Partial<InsertJob>): Promise<Job> {
    const result = await db.update(jobs)
      .set(data)
      .where(eq(jobs.id, id))
      .returning();

    if (!result[0]) {
      throw new NotFoundError("Job", id);
    }
    return result[0];
  }

  async delete(id: string): Promise<void> {
    const result = await db.delete(jobs).where(eq(jobs.id, id)).returning();
    if (!result[0]) {
      throw new NotFoundError("Job", id);
    }
  }
}

export const jobRepository = new JobRepository();
