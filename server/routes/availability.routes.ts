import { Router, type Request, type Response } from "express";
import { authenticate } from "@/middleware/auth.ts";
import { validateBody, validateParams } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { db } from "@/db/index.ts";
import { availabilitySlots, bookings } from "@/db/schema.ts";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const router = Router();

const slotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

const bulkSchema = z.object({
  slots: z.array(slotSchema).min(1),
});

// Get availability for a technician
router.get(
  "/technician/:id",
  validateParams(z.object({ id: z.string().uuid() })),
  asyncHandler(async (req: Request, res: Response) => {
    const technicianId = req.params.id;

    const slots = await db
      .select()
      .from(availabilitySlots)
      .where(eq(availabilitySlots.technicianId, technicianId))
      .orderBy(availabilitySlots.dayOfWeek, availabilitySlots.startTime);

    // Group by day
    const byDay: Record<number, typeof slots> = {};
    for (const slot of slots) {
      if (!byDay[slot.dayOfWeek]) byDay[slot.dayOfWeek] = [];
      byDay[slot.dayOfWeek].push(slot);
    }

    res.json(successResponse({ slots, byDay }));
  })
);

// Get my availability (technician)
router.get(
  "/my",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const tech = await db
      .select()
      .from(availabilitySlots)
      .where(eq(availabilitySlots.technicianId, userId))
      .orderBy(availabilitySlots.dayOfWeek, availabilitySlots.startTime);

    res.json(successResponse(tech));
  })
);

// Set availability slots (bulk) - for technicians
router.post(
  "/",
  authenticate,
  validateBody(bulkSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const technicianId = (req as any).user.id;
    const { slots } = req.body;

    // Clear existing slots
    await db.delete(availabilitySlots).where(eq(availabilitySlots.technicianId, technicianId));

    // Insert new slots
    const inserted = await db
      .insert(availabilitySlots)
      .values(
        slots.map((slot: any) => ({
          id: uuidv4(),
          technicianId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: true,
        }))
      )
      .returning();

    res.json(successResponse(inserted));
  })
);

// Check availability for a specific date范围
router.post(
  "/check",
  validateBody(
    z.object({
      technicianIds: z.array(z.string().uuid()).min(1),
      scheduledDate: z.string(),
      scheduledTime: z.string(),
    })
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const { technicianIds, scheduledDate, scheduledTime } = req.body;

    // Map date to day of week (0 = Sunday)
    const date = new Date(scheduledDate);
    const dayOfWeek = date.getDay();

    // Check slots
    const availableSlots = await db
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.dayOfWeek, dayOfWeek),
          eq(availabilitySlots.isAvailable, true)
        )
      );

    // Filter by requested time
    const [hour, minute] = scheduledTime.split(":").map(Number);
    const requestedMinutes = hour * 60 + minute;

    const matchingTechnicians = [];
    for (const techId of technicianIds) {
      const techSlots = availableSlots.filter((s) => s.technicianId === techId);
      const hasSlot = techSlots.some((slot) => {
        const [sh, sm] = slot.startTime.split(":").map(Number);
        const [eh, em] = slot.endTime.split(":").map(Number);
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;
        return requestedMinutes >= startMins && requestedMinutes < endMins;
      });

      // Also check no conflicting booking
      const existingBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.technicianId, techId),
            eq(bookings.scheduledDate, scheduledDate),
            eq(bookings.scheduledTime, scheduledTime),
            eq(bookings.status, "accepted")
          )
        )
        .limit(1);

      if (hasSlot && existingBookings.length === 0) {
        matchingTechnicians.push(techId);
      }
    }

    res.json(successResponse({ availableTechnicians: matchingTechnicians }));
  })
);

export default router;
