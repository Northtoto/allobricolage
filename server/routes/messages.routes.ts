import { Router, type Request, type Response } from "express";
import { authenticate } from "@/middleware/auth.ts";
import { validateBody, validateParams } from "@/middleware/validate-request.ts";
import { asyncHandler } from "@/middleware/error-handler.ts";
import { successResponse } from "@/utils/response.ts";
import { NotFoundError } from "@/utils/errors.ts";
import { db } from "@/db/index.ts";
import { messages, bookings, technicians, users } from "@/db/schema.ts";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const router = Router();

const sendSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  bookingId: z.string().uuid().optional(),
  channel: z.string().default("whatsapp"),
});

// Get messages for a booking
router.get(
  "/booking/:id",
  authenticate,
  validateParams(z.object({ id: z.string().uuid() })),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    // Verify user is part of this booking
    const bk = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    if (!bk.length) {
      throw new NotFoundError("Booking not found");
    }

    const sender = await db
      .select()
      .from(messages)
      .where(eq(messages.bookingId, id))
      .innerJoin(users, eq(messages.senderId, users.id))
      .orderBy(messages.createdAt);

    res.json(successResponse(sender.map((row: any) => ({
      ...row.messages,
      sender: row.users ? { id: row.users.id, name: row.users.name } : null,
    }))));
  })
);

// Send message
router.post(
  "/send",
  authenticate,
  validateBody(sendSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { receiverId, content, bookingId, channel } = req.body;

    // Store message
    const [msg] = await db
      .insert(messages)
      .values({
        id: uuidv4(),
        senderId: userId,
        receiverId,
        bookingId: bookingId ?? null,
        content,
        channel,
        direction: "outbound",
      })
      .returning();

    res.status(201).json(successResponse(msg));
  })
);

// Generate WhatsApp deep link for booking
router.get(
  "/whatsapp-link/:bookingId",
  authenticate,
  validateParams(z.object({ bookingId: z.string().uuid() })),
  asyncHandler(async (req: Request, res: Response) => {
    const { bookingId } = req.params;

    const bk = await db
      .select({
        booking: bookings,
        technician: technicians,
        user: users,
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .innerJoin(technicians, eq(bookings.technicianId, technicians.id))
      .innerJoin(users, eq(technicians.userId, users.id))
      .limit(1);

    if (!bk.length) {
      throw new NotFoundError("Booking not found");
    }

    const technicianPhone = bk[0].user.phone;
    if (!technicianPhone) {
      res.status(404).json(successResponse({ error: "Artisan n'a pas de numéro WhatsApp enregistré" }));
      return;
    }

    // Format phone for WhatsApp (remove leading 0, add +212)
    let waPhone = technicianPhone.replace(/\s/g, "");
    if (waPhone.startsWith("0")) {
      waPhone = `+212${waPhone.substring(1)}`;
    }
    if (!waPhone.startsWith("+")) {
      waPhone = `+212${waPhone}`;
    }

    const message = `Bonjour, je suis intéressé(e) par votre service pour la réservation #${bookingId.substring(0, 8)} chez AlloBricolage.`;

    res.json(successResponse({
      phone: waPhone,
      link: `https://wa.me/${waPhone.replace(/\+/g, "")}?text=${encodeURIComponent(message)}`,
      rawLink: `https://wa.me/${waPhone.replace(/\+/g, "")}`,
      message,
    }));
  })
);

export default router;
