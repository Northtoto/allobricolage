import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { notifications, type Notification, type InsertNotification } from "@/db/schema.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { v4 as uuidv4 } from "uuid";

export class NotificationRepository {
  async findByUserId(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .orderBy(desc(notifications.createdAt));
  }

  async findById(id: string): Promise<Notification | undefined> {
    const results = await db.select().from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);
    return results[0];
  }

  async create(data: InsertNotification): Promise<Notification> {
    const id = uuidv4();
    const result = await db.insert(notifications).values({ ...data, id }).returning();
    return result[0];
  }

  async markAsRead(id: string): Promise<Notification> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();

    if (!result[0]) {
      throw new NotFoundError("Notification", id);
    }
    return result[0];
  }

  async markAllAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }
}

export const notificationRepository = new NotificationRepository();
