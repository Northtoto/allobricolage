/**
 * AlloBricolage Payment Service
 * 
 * Handles multiple payment methods for Morocco:
 * - Stripe (International cards)
 * - CMI (Centre Monétaire Interbancaire - Moroccan cards)
 * - Cash Plus (Moroccan payment service)
 * - Bank Transfer (RIB/IBAN)
 * - Cash on delivery
 */

import type { Payment, InsertPayment } from "@shared/schema";

// Payment method configurations
const PAYMENT_CONFIG = {
  stripe: {
    enabled: !!process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  },
  cmi: {
    enabled: !!process.env.CMI_MERCHANT_ID,
    merchantId: process.env.CMI_MERCHANT_ID,
    apiKey: process.env.CMI_API_KEY,
    endpoint: process.env.CMI_ENDPOINT || "https://payment.cmi.co.ma/fim/api",
  },
  cashplus: {
    enabled: !!process.env.CASHPLUS_MERCHANT_ID,
    merchantId: process.env.CASHPLUS_MERCHANT_ID,
    apiKey: process.env.CASHPLUS_API_KEY,
    endpoint: process.env.CASHPLUS_ENDPOINT || "https://api.cashplus.ma/api/v1",
  },
  bankTransfer: {
    enabled: true,
    companyName: "AlloBricolage SARL",
    bankName: "Attijariwafa Bank",
    rib: "007 780 0001234567890 12", // Example RIB
    iban: "MA64 007780 0001234567890 12", // Example IBAN
    swift: "BCMAMAMC",
  },
  cash: {
    enabled: true,
  }
};

// Log payment method availability
console.log("💳 Payment Methods Available:");
console.log(`   - Stripe: ${PAYMENT_CONFIG.stripe.enabled ? '✅' : '❌'}`);
console.log(`   - CMI: ${PAYMENT_CONFIG.cmi.enabled ? '✅' : '❌'}`);
console.log(`   - Cash Plus: ${PAYMENT_CONFIG.cashplus.enabled ? '✅' : '❌'}`);
console.log(`   - Bank Transfer: ✅`);
console.log(`   - Cash: ✅`);

/**
 * Get available payment methods
 */
export function getAvailablePaymentMethods() {
  return {
    stripe: PAYMENT_CONFIG.stripe.enabled,
    cmi: PAYMENT_CONFIG.cmi.enabled,
    cashplus: PAYMENT_CONFIG.cashplus.enabled,
    bankTransfer: PAYMENT_CONFIG.bankTransfer.enabled,
    cash: PAYMENT_CONFIG.cash.enabled,
  };
}

/**
 * Get bank transfer details
 */
export function getBankTransferDetails() {
  return PAYMENT_CONFIG.bankTransfer;
}

/**
 * Create Stripe payment intent
 */
export async function createStripePaymentIntent(
  amount: number,
  bookingId: string,
  description: string
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  if (!PAYMENT_CONFIG.stripe.enabled) {
    throw new Error("Stripe is not configured");
  }

  try {
    // Import Stripe dynamically
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert MAD to cents
      currency: "mad",
      description,
      metadata: {
        bookingId,
        platform: "AlloBricolage",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Stripe payment intent creation failed:", error);
    throw new Error("Failed to create Stripe payment");
  }
}

/**
 * Verify Stripe webhook signature
 */
export async function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string
): Promise<any> {
  if (!PAYMENT_CONFIG.stripe.enabled) {
    throw new Error("Stripe is not configured");
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Stripe webhook secret not configured");
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook verification failed:", error);
    throw new Error("Invalid webhook signature");
  }
}

/**
 * Create CMI payment session
 */
export async function createCMIPayment(
  amount: number,
  bookingId: string,
  returnUrl: string
): Promise<{ sessionId: string; redirectUrl: string }> {
  if (!PAYMENT_CONFIG.cmi.enabled) {
    throw new Error("CMI is not configured");
  }

  try {
    // CMI payment gateway integration
    // This is a mock implementation - actual implementation requires CMI SDK
    const sessionId = `cmi_${bookingId}_${Date.now()}`;
    
    // In production, you would call CMI API:
    // const response = await fetch(`${PAYMENT_CONFIG.cmi.endpoint}/payment/create`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'X-Merchant-Id': PAYMENT_CONFIG.cmi.merchantId!,
    //     'X-API-Key': PAYMENT_CONFIG.cmi.apiKey!,
    //   },
    //   body: JSON.stringify({
    //     amount: amount * 100,
    //     currency: 'MAD',
    //     orderId: bookingId,
    //     returnUrl,
    //     callbackUrl: `${process.env.BASE_URL}/api/webhooks/cmi`,
    //   }),
    // });

    return {
      sessionId,
      redirectUrl: `${PAYMENT_CONFIG.cmi.endpoint}/payment/${sessionId}`,
    };
  } catch (error) {
    console.error("CMI payment creation failed:", error);
    throw new Error("Failed to create CMI payment");
  }
}

/**
 * Create Cash Plus payment reference
 */
export async function createCashPlusPayment(
  amount: number,
  bookingId: string,
  clientPhone: string
): Promise<{ referenceCode: string; expiresAt: Date }> {
  if (!PAYMENT_CONFIG.cashplus.enabled) {
    throw new Error("Cash Plus is not configured");
  }

  try {
    // Cash Plus payment integration
    // This is a mock implementation - actual implementation requires Cash Plus API
    const referenceCode = `CP${bookingId.slice(0, 8).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // In production, you would call Cash Plus API:
    // const response = await fetch(`${PAYMENT_CONFIG.cashplus.endpoint}/payments`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'X-Merchant-Id': PAYMENT_CONFIG.cashplus.merchantId!,
    //     'X-API-Key': PAYMENT_CONFIG.cashplus.apiKey!,
    //   },
    //   body: JSON.stringify({
    //     amount,
    //     currency: 'MAD',
    //     orderId: bookingId,
    //     customerPhone: clientPhone,
    //     expiresIn: 86400, // 24 hours
    //   }),
    // });

    console.log(`💵 Cash Plus reference generated: ${referenceCode}`);
    
    return {
      referenceCode,
      expiresAt,
    };
  } catch (error) {
    console.error("Cash Plus payment creation failed:", error);
    throw new Error("Failed to create Cash Plus payment");
  }
}

/**
 * Generate bank transfer reference
 */
export function generateBankTransferReference(bookingId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `ALB-${bookingId.slice(0, 8).toUpperCase()}-${timestamp}`;
}

/**
 * Calculate payment fees
 */
export function calculatePaymentFees(amount: number, method: string): number {
  const fees: Record<string, number> = {
    stripe: 0.029, // 2.9% + fixed fee
    cmi: 0.025, // 2.5%
    cashplus: 15, // Flat fee 15 MAD
    bank_transfer: 0, // No fees
    cash: 0, // No fees
  };

  const feeRate = fees[method] || 0;
  
  if (method === "cashplus") {
    return feeRate; // Flat fee
  }
  
  return Math.round(amount * feeRate);
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string = "MAD"): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Validate payment method
 */
export function isPaymentMethodAvailable(method: string): boolean {
  const methods = getAvailablePaymentMethods();
  return methods[method as keyof typeof methods] === true;
}

/**
 * Get payment method display name
 */
export function getPaymentMethodName(method: string): string {
  const names: Record<string, string> = {
    stripe: "Carte bancaire (Stripe)",
    cmi: "Carte bancaire marocaine (CMI)",
    cashplus: "Cash Plus",
    bank_transfer: "Virement bancaire",
    cash: "Paiement en espèces",
  };
  return names[method] || method;
}

/**
 * Get payment method icon
 */
export function getPaymentMethodIcon(method: string): string {
  const icons: Record<string, string> = {
    stripe: "💳",
    cmi: "🏦",
    cashplus: "💵",
    bank_transfer: "🏛️",
    cash: "💰",
  };
  return icons[method] || "💳";
}





