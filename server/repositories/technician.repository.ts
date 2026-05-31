import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { technicians, users, reviews, type Technician, type InsertTechnician, type TechnicianWithUser } from "@/db/schema.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { v4 as uuidv4 } from "uuid";

export interface TechnicianFilters {
  city?: string;
  service?: string;
  minRating?: number;
  available?: boolean;
  search?: string;
  sortBy?: "rating" | "price-low" | "price-high" | "reviews" | "experience";
  page?: number;
  limit?: number;
}

export class TechnicianRepository {
  async findAll(): Promise<Technician[]> {
    return db.select().from(technicians);
  }

  async findById(id: string): Promise<Technician | undefined> {
    const results = await db.select().from(technicians).where(eq(technicians.id, id)).limit(1);
    return results[0];
  }

  async findByUserId(userId: string): Promise<Technician | undefined> {
    const results = await db.select().from(technicians)
      .where(eq(technicians.userId, userId))
      .limit(1);
    return results[0];
  }

  async findWithUser(id: string): Promise<TechnicianWithUser | undefined> {
    const tech = await this.findById(id);
    if (!tech) return undefined;
    return this.mergeWithUser(tech);
  }

  async findAllWithUsers(filters?: TechnicianFilters): Promise<{ items: TechnicianWithUser[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [];

    if (filters?.available !== undefined) {
      conditions.push(eq(technicians.isAvailable, filters.available));
    }
    if (filters?.minRating) {
      conditions.push(sql`${technicians.rating} >= ${filters.minRating}`);
    }

    let query = db.select().from(technicians);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const allTechs = await query;
    let results = await Promise.all(
      allTechs.map((t) => this.mergeWithUser(t))
    );

    if (filters?.service) {
      results = results.filter((t) => t.services.includes(filters.service!));
    }

    if (filters?.city) {
      results = results.filter((t) => t.city?.toLowerCase() === filters.city!.toLowerCase());
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter((t) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.bio?.toLowerCase().includes(searchLower) ||
        t.skills.some((s) => s.toLowerCase().includes(searchLower))
      );
    }

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case "rating": results.sort((a, b) => b.rating - a.rating); break;
        case "price-low": results.sort((a, b) => a.hourlyRate - b.hourlyRate); break;
        case "price-high": results.sort((a, b) => b.hourlyRate - a.hourlyRate); break;
        case "reviews": results.sort((a, b) => b.reviewCount - a.reviewCount); break;
        case "experience": results.sort((a, b) => b.yearsExperience - a.yearsExperience); break;
      }
    }

    const total = results.length;
    const items = results.slice(offset, offset + limit);

    return { items, total };
  }

  async create(data: InsertTechnician): Promise<Technician> {
    const id = uuidv4();
    const result = await db.insert(technicians).values({ ...data, id }).returning();
    return result[0];
  }

  async update(id: string, data: Partial<InsertTechnician>): Promise<Technician> {
    const result = await db.update(technicians)
      .set(data)
      .where(eq(technicians.id, id))
      .returning();

    if (!result[0]) {
      throw new NotFoundError("Technician", id);
    }
    return result[0];
  }

  async delete(id: string): Promise<void> {
    const result = await db.delete(technicians).where(eq(technicians.id, id)).returning();
    if (!result[0]) {
      throw new NotFoundError("Technician", id);
    }
  }

  async updateRating(technicianId: string): Promise<void> {
    const techReviews = await db.select().from(reviews)
      .where(eq(reviews.technicianId, technicianId));

    if (techReviews.length === 0) return;

    const avgRating = techReviews.reduce((sum, r) => sum + r.rating, 0) / techReviews.length;
    await db.update(technicians)
      .set({
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: techReviews.length,
      })
      .where(eq(technicians.id, technicianId));
  }

  private async mergeWithUser(tech: Technician): Promise<TechnicianWithUser> {
    const userRows = await db.select().from(users).where(eq(users.id, tech.userId)).limit(1);
    const user = userRows[0];

    return {
      id: tech.id,
      userId: tech.userId,
      name: user?.name ?? "",
      phone: user?.phone ?? null,
      email: user?.email ?? null,
      city: user?.city ?? null,
      services: tech.services,
      skills: tech.skills,
      bio: tech.bio,
      photo: tech.photo,
      rating: tech.rating,
      reviewCount: tech.reviewCount,
      completedJobs: tech.completedJobs,
      responseTimeMinutes: tech.responseTimeMinutes,
      completionRate: tech.completionRate,
      yearsExperience: tech.yearsExperience,
      hourlyRate: tech.hourlyRate,
      isVerified: tech.isVerified,
      isAvailable: tech.isAvailable,
      isPro: tech.isPro,
      isPromo: tech.isPromo,
      availability: tech.availability,
      certifications: tech.certifications,
      latitude: tech.latitude,
      longitude: tech.longitude,
      languages: tech.languages,
    };
  }
}

export const technicianRepository = new TechnicianRepository();
