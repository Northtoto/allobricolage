import { paymentRepository } from "@/repositories/payment.repository.ts";
import { notificationRepository } from "@/repositories/notification.repository.ts";
import { bookingRepository } from "@/repositories/booking.repository.ts";
import { technicianRepository } from "@/repositories/technician.repository.ts";
import { businessRepository } from "@/repositories/business.repository.ts";
import { computeCommission } from "@/services/commission.service.ts";
import { logger } from "@/utils/logger.ts";
import type { InsertPayment } from "@/db/schema.ts";
import { v4 as uuidv4 } from "uuid";

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  processingFee: number;
  minAmount: number;
  maxAmount: number;
  isInstant: boolean;
}

export class PaymentService {
  getPaymentMethods(): PaymentMethod[] {
    return [
      {
        id: "stripe",
        name: "Carte Bancaire (Stripe)",
        icon: "credit-card",
        description: "Paiement securise par carte Visa/Mastercard",
        processingFee: 0.025,
        minAmount: 50,
        maxAmount: 100000,
        isInstant: true,
      },
      {
        id: "bank_transfer",
        name: "Virement Bancaire",
        icon: "building-2",
        description: "Virement vers notre compte bancaire",
        processingFee: 0,
        minAmount: 100,
        maxAmount: 500000,
        isInstant: false,
      },
      {
        id: "cash",
        name: "Paiement en Especes",
        icon: "banknote",
        description: "Payer l'artisan en especes apres le service",
        processingFee: 0,
        minAmount: 0,
        maxAmount: 10000,
        isInstant: true,
      },
    ];
  }

  async processPayment(data: InsertPayment & { paymentMethodDetails?: Record<string, unknown> }): Promise<{ paymentId: string; transactionId: string; status: string }> {
    const transactionId = `TRX-${uuidv4().substring(0, 8).toUpperCase()}`;

    const split = await this.resolveCommission(data.bookingId, data.amount);

    const payment = await paymentRepository.create({
      bookingId: data.bookingId,
      amount: data.amount,
      currency: data.currency ?? "MAD",
      paymentMethod: data.paymentMethod,
      status: data.paymentMethod === "cash" ? "pending" : "processing",
      paymentIntentId: data.paymentMethod === "stripe" ? `pi_${uuidv4()}` : null,
      transactionId,
      bankReference: data.paymentMethod === "bank_transfer" ? `VIR-${uuidv4().substring(0, 8).toUpperCase()}` : null,
      paymentDetails: data.paymentMethodDetails ?? null,
      commissionRate: split.commissionRate,
      commissionAmount: split.commissionAmount,
      technicianPayout: split.technicianPayout,
    });

    return {
      paymentId: payment.id,
      transactionId,
      status: payment.status,
    };
  }

  /**
   * Resolve the platform/technician revenue split for a booking's payment.
   * Looks up the technician's subscription tier and whether the client is on a
   * B2B retainer, then delegates to the pure commission engine. Falls back to the
   * default (free-tier) rate if any lookup fails — a payment must never break
   * because the split couldn't be resolved.
   */
  private async resolveCommission(bookingId: string, amount: number) {
    try {
      const booking = await bookingRepository.findById(bookingId);
      const tech = booking ? await technicianRepository.findById(booking.technicianId) : undefined;
      let isRetainerClient = false;
      if (booking?.clientId) {
        const business = await businessRepository.findProfileByUserId(booking.clientId);
        if (business) {
          const retainer = await businessRepository.findActiveRetainer(business.id);
          isRetainerClient = retainer?.status === "active";
        }
      }
      return computeCommission({ amount, tier: tech?.subscriptionTier, isRetainerClient });
    } catch (error) {
      logger.warn("Commission resolution failed; using default rate", { bookingId, error });
      return computeCommission({ amount });
    }
  }

  generateBankTransferReference(bookingId: string): string {
    return `AB-${bookingId.substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  }

  async confirmPayment(paymentId: string): Promise<void> {
    await paymentRepository.update(paymentId, {
      status: "completed",
      paidAt: new Date(),
    });
  }
}

export const paymentService = new PaymentService();
