# AlloBricolage Payment System Implementation Guide

## 🎯 Overview

This guide documents the complete payment system implementation for AlloBricolage with multiple Moroccan payment methods.

## ✅ What's Been Completed

### 1. Database Schema ✓
- Added `payments` table with support for multiple payment methods
- Added `notifications` table for alerts
- Added payment method and status constants
- File: `shared/schema.ts`

### 2. Payment Service Backend ✓
- Created comprehensive payment service
- Support for 5 payment methods:
  - **Stripe** (International cards)
  - **CMI** (Moroccan cards via Centre Monétaire Interbancaire)
  - **Cash Plus** (Moroccan payment service)
  - **Bank Transfer** (RIB/IBAN)
  - **Cash** (Pay on delivery)
- File: `server/payment-service.ts`

## 📋 Remaining Implementation Steps

### Step 1: Update Storage Implementations

You need to add the payment and notification methods to `MemStorage` and `SQLiteStorage` classes in `server/storage.ts` and `server/sqlite-storage.ts`.

#### Add to MemStorage (around line 479):

```typescript
// In the constructor, add:
private payments: Map<string, Payment>;
private notifications: Map<string, Notification>;

// In constructor initialization:
this.payments = new Map();
this.notifications = new Map();

// Add these methods after bookings methods:

// Payments
async getPayment(id: string): Promise<Payment | undefined> {
  return this.payments.get(id);
}

async getPaymentByBooking(bookingId: string): Promise<Payment | undefined> {
  return Array.from(this.payments.values()).find(p => p.bookingId === bookingId);
}

async getAllPayments(): Promise<Payment[]> {
  return Array.from(this.payments.values());
}

async createPayment(insertPayment: InsertPayment): Promise<Payment> {
  const id = randomUUID();
  const payment: Payment = {
    id,
    ...insertPayment,
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  this.payments.set(id, payment);
  return payment;
}

async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
  const existing = this.payments.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date() };
  this.payments.set(id, updated);
  return updated;
}

// Notifications
async getNotification(id: string): Promise<Notification | undefined> {
  return this.notifications.get(id);
}

async getNotificationsByUser(userId: string): Promise<Notification[]> {
  return Array.from(this.notifications.values())
    .filter(n => n.userId === userId)
    .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
}

async getUnreadNotificationsByUser(userId: string): Promise<Notification[]> {
  return Array.from(this.notifications.values())
    .filter(n => n.userId === userId && !n.isRead);
}

async createNotification(insertNotification: InsertNotification): Promise<Notification> {
  const id = randomUUID();
  const notification: Notification = {
    id,
    ...insertNotification,
    bookingId: insertNotification.bookingId ?? null,
    paymentId: insertNotification.paymentId ?? null,
    createdAt: new Date(),
  };
  this.notifications.set(id, notification);
  return notification;
}

async markNotificationAsRead(id: string): Promise<Notification | undefined> {
  const existing = this.notifications.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, isRead: true };
  this.notifications.set(id, updated);
  return updated;
}

async markAllNotificationsAsRead(userId: string): Promise<void> {
  for (const [id, notification] of this.notifications.entries()) {
    if (notification.userId === userId) {
      this.notifications.set(id, { ...notification, isRead: true });
    }
  }
}
```

### Step 2: Update SQLite Storage

Add similar implementations to `server/sqlite-storage.ts`:

1. **Add table creation in `initTables()` method:**

```typescript
// Add to initTables() method:

// Create payments table
this.db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'MAD',
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_intent_id TEXT,
    transaction_id TEXT,
    bank_reference TEXT,
    payment_details TEXT,
    paid_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
  )
`);

// Create notifications table
this.db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    booking_id TEXT,
    payment_id TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);
```

2. **Add helper methods for row conversion**
3. **Implement all payment and notification methods**

### Step 3: Create Payment Routes

Create `server/payment-routes.ts`:

```typescript
import { Express } from "express";
import { storage } from "./storage";
import * as PaymentService from "./payment-service";

export function registerPaymentRoutes(app: Express) {
  
  // Get available payment methods
  app.get("/api/payment/methods", async (req, res) => {
    try {
      const methods = PaymentService.getAvailablePaymentMethods();
      res.json(methods);
    } catch (error) {
      res.status(500).json({ error: "Failed to get payment methods" });
    }
  });

  // Create payment intent (Stripe)
  app.post("/api/payment/stripe/intent", async (req, res) => {
    try {
      const { bookingId, amount, description } = req.body;
      const result = await PaymentService.createStripePaymentIntent(
        amount,
        bookingId,
        description
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Create CMI payment
  app.post("/api/payment/cmi/create", async (req, res) => {
    try {
      const { bookingId, amount, returnUrl } = req.body;
      const result = await PaymentService.createCMIPayment(
        amount,
        bookingId,
        returnUrl
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to create CMI payment" });
    }
  });

  // Create Cash Plus reference
  app.post("/api/payment/cashplus/create", async (req, res) => {
    try {
      const { bookingId, amount, clientPhone } = req.body;
      const result = await PaymentService.createCashPlusPayment(
        amount,
        bookingId,
        clientPhone
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
      res.status(500).json({ error: "Failed to create Cash Plus payment" });
    }
  });

  // Get bank transfer details
  app.get("/api/payment/bank-transfer/details", async (req, res) => {
    try {
      const details = PaymentService.getBankTransferDetails();
      const { bookingId } = req.query;
      const reference = PaymentService.generateBankTransferReference(bookingId as string);
      res.json({ ...details, reference });
    } catch (error) {
      res.status(500).json({ error: "Failed to get bank transfer details" });
    }
  });

  // Confirm payment
  app.post("/api/payment/:id/confirm", async (req, res) => {
    try {
      const { id } = req.params;
      const { transactionId } = req.body;
      
      const payment = await storage.updatePayment(id, {
        status: "completed",
        paidAt: new Date(),
        transactionId,
      });
      
      if (payment) {
        // Update booking status
        const booking = await storage.getBooking(payment.bookingId);
        if (booking) {
          await storage.updateBooking(booking.id, { status: "accepted" });
          
          // Send notification to technician
          const tech = await storage.getTechnicianWithUser(booking.technicianId);
          if (tech) {
            await storage.createNotification({
              userId: tech.userId,
              type: "payment",
              title: "Paiement reçu",
              message: `Paiement de ${payment.amount} MAD confirmé pour votre réservation`,
              bookingId: booking.id,
              paymentId: payment.id,
              isRead: false,
            });
          }
        }
      }
      
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // Get payment for booking
  app.get("/api/payment/booking/:bookingId", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const payment = await storage.getPaymentByBooking(bookingId);
      res.json(payment || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to get payment" });
    }
  });

  // Stripe webhook
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const signature = req.headers["stripe-signature"] as string;
      const event = await PaymentService.verifyStripeWebhook(
        req.rawBody as Buffer,
        signature
      );
      
      // Handle different event types
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        // Update payment status in database
        // Send notification to technician
      }
      
      res.json({ received: true });
    } catch (error) {
      res.status(400).json({ error: "Webhook verification failed" });
    }
  });
}
```

### Step 4: Update main routes file

Add to `server/routes.ts`:

```typescript
import { registerPaymentRoutes } from "./payment-routes";

// In registerRoutes function, add:
registerPaymentRoutes(app);
```

### Step 5: Create Payment Modal Component

Create `client/src/components/payment/PaymentModal.tsx`:

```tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Building2, Wallet, Banknote, DollarSign } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  amount: number;
  onPaymentComplete: () => void;
}

export function PaymentModal({ 
  open, 
  onClose, 
  bookingId, 
  amount,
  onPaymentComplete 
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [loading, setLoading] = useState(false);

  const paymentMethods = [
    { id: "stripe", name: "Carte bancaire (Stripe)", icon: CreditCard, available: true },
    { id: "cmi", name: "Carte bancaire marocaine (CMI)", icon: CreditCard, available: true },
    { id: "cashplus", name: "Cash Plus", icon: Wallet, available: true },
    { id: "bank_transfer", name: "Virement bancaire", icon: Building2, available: true },
    { id: "cash", name: "Paiement en espèces", icon: Banknote, available: true },
  ];

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Handle different payment methods
      if (paymentMethod === "stripe") {
        // Stripe payment flow
      } else if (paymentMethod === "cmi") {
        // CMI payment flow
      } else if (paymentMethod === "cashplus") {
        // Cash Plus payment flow
      } else if (paymentMethod === "bank_transfer") {
        // Bank transfer flow
      } else if (paymentMethod === "cash") {
        // Cash payment flow
      }
      
      onPaymentComplete();
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Paiement sécurisé</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Montant à payer</span>
              <span className="text-2xl font-bold text-blue-600">
                {amount} MAD
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="font-semibold mb-4">Choisissez votre mode de paiement</h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={method.id}
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        paymentMethod === method.id ? "border-blue-500 bg-blue-50" : ""
                      }`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Icon className="h-5 w-5 text-gray-500" />
                      <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                        {method.name}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Paiement 100% sécurisé et crypté</span>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handlePayment} disabled={loading} className="flex-1">
              {loading ? "Traitement..." : `Payer ${amount} MAD`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## 🔧 Environment Variables

Add to your `.env` file:

```env
# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# CMI (Optional)
CMI_MERCHANT_ID=your_cmi_merchant_id
CMI_API_KEY=your_cmi_api_key
CMI_ENDPOINT=https://payment.cmi.co.ma/fim/api

# Cash Plus (Optional)
CASHPLUS_MERCHANT_ID=your_cashplus_merchant_id
CASHPLUS_API_KEY=your_cashplus_api_key

# Base URL for webhooks
BASE_URL=http://localhost:5000
```

## 📱 Next Steps

1. Implement the storage methods (Step 1 & 2)
2. Add payment routes (Step 3 & 4)
3. Create UI components (Step 5)
4. Test each payment method
5. Configure webhooks for production
6. Add SMS notifications to technicians

## 🔐 Security Checklist

- ✅ Never store card details on your server
- ✅ Use HTTPS in production
- ✅ Verify webhook signatures
- ✅ Validate payment amounts server-side
- ✅ Require user authentication
- ✅ Log all payment transactions
- ✅ Implement rate limiting on payment endpoints

## 📞 Support

For implementation help, refer to:
- Stripe Docs: https://stripe.com/docs
- CMI Integration Guide (contact CMI for documentation)
- Cash Plus API (contact Cash Plus for API access)



