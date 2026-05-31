import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { users, type User, type InsertUser } from "@/db/schema.ts";
import { NotFoundError, ConflictError } from "@/utils/errors.ts";
import { v4 as uuidv4 } from "uuid";

export class UserRepository {
  async findAll(): Promise<User[]> {
    return db.select().from(users);
  }

  async findById(id: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0];
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users)
      .where(eq(users.username, username))
      .limit(1);
    return results[0];
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users)
      .where(eq(users.email, email))
      .limit(1);
    return results[0];
  }

  async findByGoogleId(googleId: string): Promise<User | undefined> {
    const results = await db.select().from(users)
      .where(eq(users.googleId, googleId))
      .limit(1);
    return results[0];
  }

  async create(data: InsertUser): Promise<User> {
    const id = uuidv4();
    const result = await db.insert(users).values({ ...data, id }).returning();
    return result[0];
  }

  async update(id: string, data: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    if (!result[0]) {
      throw new NotFoundError("User", id);
    }
    return result[0];
  }

  async delete(id: string): Promise<void> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    if (!result[0]) {
      throw new NotFoundError("User", id);
    }
  }

  async existsByUsername(username: string): Promise<boolean> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.username, username));
    return (result[0]?.count ?? 0) > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.email, email));
    return (result[0]?.count ?? 0) > 0;
  }
}

export const userRepository = new UserRepository();
