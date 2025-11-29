import type { Express } from "express";
import { storage } from "./storage";
import * as PaymentService from "./payment-service";

export function registerPaymentRoutes(app: Express) {
  
  // Get available payment methods
  app.get("/api/payment/methods", async (req, res) => {
    try {
      const methods = PaymentService.getAvailablePaymentMethods();
      res.json(methods);
    } catch (error) {
      console.error("Get payment methods error:", error);
      res.status(500).json({ error: "Failed to get payment methods" });
    }
  });

  // Get bank transfer details
  app.get("/api/payment/bank-transfer/details", async (req, res) => {
    try {
      const { bookingId } = req.query;
      if (!bookingId) {
        return res.status(400).json({ error: "Booking ID is required" });
      }

      const details = PaymentService.getBankTransferDetails();
      const reference = PaymentService.generateBankTransferReference(bookingId as string);
      
      res.json({ 
        ...details, 
        reference 
      });
    } catch (error) {
      console.error("Get bank transfer details error:", error);
      res.status(500).json({ error: "Failed to get bank transfer details" });
    }
  });

  // Create CMI payment session
  app.post("/api/payment/cmi/create", async (req, res) => {
    try {
      const { bookingId, amount, returnUrl } = req.body;
      
      if (!bookingId || !amount) {
        return res.status(400).json({ error: "Booking ID and amount are required" });
      }

      const result = await PaymentService.createCMIPayment(
        amount,
        bookingId,
        returnUrl || `${process.env.BASE_URL || 'http://localhost:5000'}/payment/confirm/${bookingId}`
      );

      // Create payment record
      await storage.createPayment({
        bookingId,
        amount,
        currency: "MAD",
        paymentMethod: "cmi",
        status: "pending",
        transactionId: result.sessionId,
        paymentDetails: result,
      });

      res.json(result);
    } catch (error) {
      console.error("CMI payment creation error:", error);
      res.status(500).json({ error: "Failed to create CMI payment" });
    }
  });

  // Create Cash Plus reference
  app.post("/api/payment/cashplus/create", async (req, res) => {
    try {
      const { bookingId, amount, clientPhone } = req.body;
      
      if (!bookingId || !amount) {
        return res.status(400).json({ error: "Booking ID and amount are required" });
      }

      const result = await PaymentService.createCashPlusPayment(
        amount,
        bookingId,
        clientPhone || ""
      );

      // Create payment record
      await storage.createPayment({
        bookingId,
        amount,
        currency: "MAD",
        paymentMethod: "cashplus",
        status: "pending",
        transactionId: result.referenceCode,
        paymentDetails: result,
      });

      res.json(result);
    } catch (error) {
      console.error("Cash Plus payment creation error:", error);
      res.status(500).json({ error: "Failed to create Cash Plus payment" });
    }
  });

  // Create bank transfer payment record
  app.post("/api/payment/create", async (req, res) => {
    try {
      const { bookingId, amount, paymentMethod, bankReference } = req.body;
      
      if (!bookingId || !amount || !paymentMethod) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const payment = await storage.createPayment({
        bookingId,
        amount,
        currency: "MAD",
        paymentMethod,
        status: "pending",
        bankReference: bankReference || null,
        paymentDetails: { bankReference },
      });

      res.json(payment);
    } catch (error) {
      console.error("Payment creation error:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  // Get payment for booking
  app.get("/api/payment/booking/:bookingId", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const payment = await storage.getPaymentByBooking(bookingId);
      res.json(payment || null);
    } catch (error) {
      console.error("Get payment error:", error);
      res.status(500).json({ error: "Failed to get payment" });
    }
  });

  // Get booking details (needed for payment page)
  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      console.error("Get booking error:", error);
      res.status(500).json({ error: "Failed to get booking" });
    }
  });

  // Confirm payment (manual confirmation for bank transfer/cash plus)
  app.post("/api/payment/:id/confirm", async (req, res) => {
    try {
      const { id } = req.params;
      const { transactionId } = req.body;

      const existingPayment = await storage.getPayment(id);
      if (!existingPayment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const payment = await storage.updatePayment(id, {
        status: "completed",
        paidAt: new Date(),
        transactionId: transactionId || existingPayment.transactionId,
      });

      if (payment) {
        // Update booking status
        const booking = await storage.getBooking(payment.bookingId);
        if (booking) {
          await storage.updateBooking(booking.id, { 
            status: "accepted" 
          });

          // Create notification for technician
          const tech = await storage.getTechnicianWithUser(booking.technicianId);
          if (tech) {
            await storage.createNotification({
              userId: tech.userId,
              type: "payment",
              title: "💰 Paiement reçu",
              message: `Paiement de ${payment.amount} MAD confirmé pour votre réservation du ${booking.scheduledDate}`,
              bookingId: booking.id,
              paymentId: payment.id,
              isRead: false,
            });
          }

          // Create notification for client (using system if no clientId)
          await storage.createNotification({
            userId: "system",
            type: "booking",
            title: "✅ Réservation confirmée",
            message: `Votre réservation du ${booking.scheduledDate} à ${booking.scheduledTime} est confirmée`,
            bookingId: booking.id,
            paymentId: payment.id,
            isRead: false,
          });
        }
      }

      res.json(payment);
    } catch (error) {
      console.error("Payment confirmation error:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // CMI webhook (for payment notifications)
  app.post("/api/webhooks/cmi", async (req, res) => {
    try {
      // CMI sends payment status updates here
      const { sessionId, status, transactionId } = req.body;

      // Find payment by transaction ID
      const payments = await storage.getAllPayments();
      const payment = payments.find(p => p.transactionId === sessionId);

      if (payment && status === "success") {
        await storage.updatePayment(payment.id, {
          status: "completed",
          paidAt: new Date(),
          transactionId,
        });

        // Update booking and send notifications
        const booking = await storage.getBooking(payment.bookingId);
        if (booking) {
          await storage.updateBooking(booking.id, { status: "accepted" });

          const tech = await storage.getTechnicianWithUser(booking.technicianId);
          if (tech) {
            await storage.createNotification({
              userId: tech.userId,
              type: "payment",
              title: "💳 Paiement CMI reçu",
              message: `Paiement de ${payment.amount} MAD par carte bancaire confirmé`,
              bookingId: booking.id,
              paymentId: payment.id,
              isRead: false,
            });
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("CMI webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Cash Plus webhook (for payment notifications)
  app.post("/api/webhooks/cashplus", async (req, res) => {
    try {
      const { referenceCode, status, amount } = req.body;

      // Find payment by reference code
      const payments = await storage.getAllPayments();
      const payment = payments.find(p => p.transactionId === referenceCode);

      if (payment && status === "paid") {
        await storage.updatePayment(payment.id, {
          status: "completed",
          paidAt: new Date(),
        });

        // Update booking and send notifications
        const booking = await storage.getBooking(payment.bookingId);
        if (booking) {
          await storage.updateBooking(booking.id, { status: "accepted" });

          const tech = await storage.getTechnicianWithUser(booking.technicianId);
          if (tech) {
            await storage.createNotification({
              userId: tech.userId,
              type: "payment",
              title: "💵 Paiement Cash Plus reçu",
              message: `Paiement de ${amount} MAD via Cash Plus confirmé`,
              bookingId: booking.id,
              paymentId: payment.id,
              isRead: false,
            });
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Cash Plus webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  console.log("✅ Payment routes registered");
}

