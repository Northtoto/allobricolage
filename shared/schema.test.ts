import { describe, it, expect } from "vitest";
import {
  insertUserSchema,
  insertTechnicianSchema,
  insertBookingSchema,
  insertPaymentSchema,
  insertReviewSchema,
  insertQuoteSchema,
  insertJobSchema,
  insertBusinessProfileSchema,
  insertBusinessRetainerSchema,
  insertDisputeSchema,
  insertVirtualIdCardSchema,
  insertJobAddressSchema,
} from "./schema.ts";

describe("insertUserSchema", () => {
  it("parses a valid minimal user (only the required fields)", () => {
    const result = insertUserSchema.safeParse({ username: "jdupont", name: "Jean Dupont" });
    expect(result.success).toBe(true);
  });

  it("rejects a user missing the required username", () => {
    const result = insertUserSchema.safeParse({ name: "Jean Dupont" });
    expect(result.success).toBe(false);
  });

  it("rejects a user missing the required name", () => {
    const result = insertUserSchema.safeParse({ username: "jdupont" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-string username", () => {
    const result = insertUserSchema.safeParse({ username: 12345, name: "Jean Dupont" });
    expect(result.success).toBe(false);
  });

  it("accepts an arbitrary role string (role is plain text, not a pgEnum, so USER_ROLES is not enforced at this layer)", () => {
    const result = insertUserSchema.safeParse({ username: "jdupont", name: "Jean Dupont", role: "superadmin" });
    expect(result.success).toBe(true);
  });

  it("accepts a phone value that does not match Moroccan phone format (that format is enforced by moroccanPhoneSchema in server/utils/password-policy.ts, not here)", () => {
    const result = insertUserSchema.safeParse({ username: "jdupont", name: "Jean Dupont", phone: "not-a-phone" });
    expect(result.success).toBe(true);
  });

  it("allows omitting nullable/defaulted fields like email, city and password", () => {
    const result = insertUserSchema.safeParse({ username: "jdupont", name: "Jean Dupont" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeUndefined();
      expect(result.data.city).toBeUndefined();
    }
  });
});

describe("insertTechnicianSchema", () => {
  const validTechnician = { userId: "550e8400-e29b-41d4-a716-446655440000" };

  it("parses a valid minimal technician (userId is the only required field)", () => {
    const result = insertTechnicianSchema.safeParse(validTechnician);
    expect(result.success).toBe(true);
  });

  it("rejects a technician missing the required userId", () => {
    const result = insertTechnicianSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a userId longer than the 36-character varchar column limit", () => {
    const result = insertTechnicianSchema.safeParse({ userId: "u".repeat(37) });
    expect(result.success).toBe(false);
  });

  it("accepts a userId at exactly the 36-character limit", () => {
    const result = insertTechnicianSchema.safeParse({ userId: "u".repeat(36) });
    expect(result.success).toBe(true);
  });

  it("rejects a non-integer hourlyRate", () => {
    const result = insertTechnicianSchema.safeParse({ ...validTechnician, hourlyRate: 150.5 });
    expect(result.success).toBe(false);
  });

  it("accepts a negative hourlyRate (no positive-amount constraint at this layer)", () => {
    const result = insertTechnicianSchema.safeParse({ ...validTechnician, hourlyRate: -50 });
    expect(result.success).toBe(true);
  });

  it("rejects services provided as a string instead of an array", () => {
    const result = insertTechnicianSchema.safeParse({ ...validTechnician, services: "plomberie" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid services array", () => {
    const result = insertTechnicianSchema.safeParse({ ...validTechnician, services: ["plomberie", "electricite"] });
    expect(result.success).toBe(true);
  });
});

describe("insertBookingSchema", () => {
  const validBooking = {
    jobId: "550e8400-e29b-41d4-a716-446655440000",
    technicianId: "550e8400-e29b-41d4-a716-446655440001",
    clientName: "Sara Alaoui",
    clientPhone: "0612345678",
    scheduledDate: "2026-09-01",
    scheduledTime: "14:00",
  };

  it("parses a valid minimal booking", () => {
    const result = insertBookingSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it("rejects a booking missing the required clientName", () => {
    const { clientName, ...rest } = validBooking;
    const result = insertBookingSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a booking missing the required clientPhone", () => {
    const { clientPhone, ...rest } = validBooking;
    const result = insertBookingSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a booking missing the required scheduledDate", () => {
    const { scheduledDate, ...rest } = validBooking;
    const result = insertBookingSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a technicianId longer than the 36-character varchar column limit", () => {
    const result = insertBookingSchema.safeParse({ ...validBooking, technicianId: "t".repeat(37) });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer estimatedCost", () => {
    const result = insertBookingSchema.safeParse({ ...validBooking, estimatedCost: 199.99 });
    expect(result.success).toBe(false);
  });

  it("accepts a negative estimatedCost (no positive-amount constraint at this layer)", () => {
    const result = insertBookingSchema.safeParse({ ...validBooking, estimatedCost: -100 });
    expect(result.success).toBe(true);
  });

  it("accepts an arbitrary status string (BOOKING_STATUS is not enforced at this layer)", () => {
    const result = insertBookingSchema.safeParse({ ...validBooking, status: "not-a-real-status" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-boolean isEmergency", () => {
    const result = insertBookingSchema.safeParse({ ...validBooking, isEmergency: "yes" });
    expect(result.success).toBe(false);
  });
});

describe("insertPaymentSchema", () => {
  const validPayment = {
    bookingId: "550e8400-e29b-41d4-a716-446655440000",
    amount: 250,
    paymentMethod: "cmi",
  };

  it("parses a valid minimal payment", () => {
    const result = insertPaymentSchema.safeParse(validPayment);
    expect(result.success).toBe(true);
  });

  it("rejects a payment missing the required amount", () => {
    const { amount, ...rest } = validPayment;
    const result = insertPaymentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a payment missing the required bookingId", () => {
    const { bookingId, ...rest } = validPayment;
    const result = insertPaymentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a payment missing the required paymentMethod", () => {
    const { paymentMethod, ...rest } = validPayment;
    const result = insertPaymentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a string amount instead of a number", () => {
    const result = insertPaymentSchema.safeParse({ ...validPayment, amount: "250" });
    expect(result.success).toBe(false);
  });

  it("accepts a zero or negative amount (PAYMENT_METHODS enums and positive-amount checks are enforced by createPaymentSchema in payments.routes.ts, not here)", () => {
    const zero = insertPaymentSchema.safeParse({ ...validPayment, amount: 0 });
    const negative = insertPaymentSchema.safeParse({ ...validPayment, amount: -250 });
    expect(zero.success).toBe(true);
    expect(negative.success).toBe(true);
  });

  it("accepts an arbitrary paymentMethod string (PAYMENT_METHODS is not enforced at this layer)", () => {
    const result = insertPaymentSchema.safeParse({ ...validPayment, paymentMethod: "crypto" });
    expect(result.success).toBe(true);
  });
});

describe("insertReviewSchema", () => {
  const validReview = {
    technicianId: "550e8400-e29b-41d4-a716-446655440000",
    clientId: "550e8400-e29b-41d4-a716-446655440001",
    rating: 5,
    comment: "Excellent travail, ponctuel et professionnel.",
  };

  it("parses a valid minimal review", () => {
    const result = insertReviewSchema.safeParse(validReview);
    expect(result.success).toBe(true);
  });

  it("rejects a review missing the required rating", () => {
    const { rating, ...rest } = validReview;
    const result = insertReviewSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a review missing the required comment", () => {
    const { comment, ...rest } = validReview;
    const result = insertReviewSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer rating", () => {
    const result = insertReviewSchema.safeParse({ ...validReview, rating: 4.5 });
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric rating", () => {
    const result = insertReviewSchema.safeParse({ ...validReview, rating: "5" });
    expect(result.success).toBe(false);
  });
});

describe("insertQuoteSchema", () => {
  const validQuote = {
    bookingId: "550e8400-e29b-41d4-a716-446655440000",
    technicianId: "550e8400-e29b-41d4-a716-446655440001",
    description: "Remplacement du chauffe-eau",
    amount: 800,
  };

  it("parses a valid minimal quote", () => {
    const result = insertQuoteSchema.safeParse(validQuote);
    expect(result.success).toBe(true);
  });

  it("rejects a quote missing the required amount", () => {
    const { amount, ...rest } = validQuote;
    const result = insertQuoteSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a quote missing the required description", () => {
    const { description, ...rest } = validQuote;
    const result = insertQuoteSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("defaults laborCost and materialsCost to being optional (they have DB defaults of 0)", () => {
    const result = insertQuoteSchema.safeParse(validQuote);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.laborCost).toBeUndefined();
      expect(result.data.materialsCost).toBeUndefined();
    }
  });

  it("accepts an arbitrary priceFlag string (normal/above_market/below_market is not enforced at this layer)", () => {
    const result = insertQuoteSchema.safeParse({ ...validQuote, priceFlag: "totally_made_up" });
    expect(result.success).toBe(true);
  });
});

describe("insertJobSchema", () => {
  const validJob = {
    description: "Fuite d'eau sous l'évier",
    service: "plomberie",
    city: "Casablanca",
  };

  it("parses a valid minimal job", () => {
    const result = insertJobSchema.safeParse(validJob);
    expect(result.success).toBe(true);
  });

  it("rejects a job missing the required description", () => {
    const { description, ...rest } = validJob;
    const result = insertJobSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a job missing the required city", () => {
    const { city, ...rest } = validJob;
    const result = insertJobSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("accepts a city not in MOROCCAN_CITIES (that enum is only enforced by createJobSchema in jobs.routes.ts, not here)", () => {
    const result = insertJobSchema.safeParse({ ...validJob, city: "Paris" });
    expect(result.success).toBe(true);
  });

  it("accepts an arbitrary urgency string (URGENCY_LEVELS is not enforced at this layer)", () => {
    const result = insertJobSchema.safeParse({ ...validJob, urgency: "yesterday-please" });
    expect(result.success).toBe(true);
  });

  it("rejects extractedKeywords provided as a non-array of strings", () => {
    const result = insertJobSchema.safeParse({ ...validJob, extractedKeywords: "leak,pipe" });
    expect(result.success).toBe(false);
  });
});

describe("insertBusinessProfileSchema", () => {
  const validProfile = {
    userId: "550e8400-e29b-41d4-a716-446655440000",
    companyName: "Café Central",
  };

  it("parses a valid minimal business profile", () => {
    const result = insertBusinessProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("rejects a profile missing the required companyName", () => {
    const result = insertBusinessProfileSchema.safeParse({ userId: validProfile.userId });
    expect(result.success).toBe(false);
  });

  it("rejects a profile missing the required userId", () => {
    const result = insertBusinessProfileSchema.safeParse({ companyName: validProfile.companyName });
    expect(result.success).toBe(false);
  });

  it("rejects a userId longer than the 36-character varchar column limit", () => {
    const result = insertBusinessProfileSchema.safeParse({ ...validProfile, userId: "u".repeat(37) });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer siteCount", () => {
    const result = insertBusinessProfileSchema.safeParse({ ...validProfile, siteCount: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe("insertBusinessRetainerSchema", () => {
  const validRetainer = {
    businessId: "550e8400-e29b-41d4-a716-446655440000",
    tier: "essentiel",
  };

  it("parses a valid minimal retainer", () => {
    const result = insertBusinessRetainerSchema.safeParse(validRetainer);
    expect(result.success).toBe(true);
  });

  it("rejects a retainer missing the required tier (tier has no DB default, unlike businessType on business_profiles)", () => {
    const result = insertBusinessRetainerSchema.safeParse({ businessId: validRetainer.businessId });
    expect(result.success).toBe(false);
  });

  it("rejects a retainer missing the required businessId", () => {
    const result = insertBusinessRetainerSchema.safeParse({ tier: validRetainer.tier });
    expect(result.success).toBe(false);
  });

  it("accepts an arbitrary tier string (essentiel/pro/enterprise is only enforced by retainerSchema in business.routes.ts, not here)", () => {
    const result = insertBusinessRetainerSchema.safeParse({ ...validRetainer, tier: "platinum-plus" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-integer slaHours", () => {
    const result = insertBusinessRetainerSchema.safeParse({ ...validRetainer, slaHours: 24.5 });
    expect(result.success).toBe(false);
  });
});

describe("insertDisputeSchema", () => {
  const validDispute = {
    bookingId: "550e8400-e29b-41d4-a716-446655440000",
    clientId: "550e8400-e29b-41d4-a716-446655440001",
    technicianId: "550e8400-e29b-41d4-a716-446655440002",
    reason: "Travail non terminé",
    description: "Le technicien est parti sans finir l'installation.",
  };

  it("parses a valid minimal dispute", () => {
    const result = insertDisputeSchema.safeParse(validDispute);
    expect(result.success).toBe(true);
  });

  it("rejects a dispute missing the required reason", () => {
    const { reason, ...rest } = validDispute;
    const result = insertDisputeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a dispute missing the required description", () => {
    const { description, ...rest } = validDispute;
    const result = insertDisputeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a non-boolean isWarrantyClaim", () => {
    const result = insertDisputeSchema.safeParse({ ...validDispute, isWarrantyClaim: "yes" });
    expect(result.success).toBe(false);
  });
});

describe("insertVirtualIdCardSchema", () => {
  const validCard = {
    cardNumber: "MB-2026-000123",
    technicianId: "550e8400-e29b-41d4-a716-446655440000",
    qrCodeData: "https://m3allem.ma/id/MB-2026-000123",
    issuedDate: new Date("2026-01-01"),
    expiryDate: new Date("2027-01-01"),
  };

  it("parses a valid card with real Date instances", () => {
    const result = insertVirtualIdCardSchema.safeParse(validCard);
    expect(result.success).toBe(true);
  });

  it("rejects an ISO date string for issuedDate (the timestamp column requires an actual Date instance, not a string)", () => {
    const result = insertVirtualIdCardSchema.safeParse({ ...validCard, issuedDate: "2026-01-01T00:00:00.000Z" });
    expect(result.success).toBe(false);
  });

  it("rejects a card missing the required expiryDate", () => {
    const { expiryDate, ...rest } = validCard;
    const result = insertVirtualIdCardSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a card missing the required cardNumber", () => {
    const { cardNumber, ...rest } = validCard;
    const result = insertVirtualIdCardSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("insertJobAddressSchema", () => {
  const validAddress = {
    bookingId: "550e8400-e29b-41d4-a716-446655440000",
    address: "12 Rue des Fleurs",
    city: "Rabat",
    latitude: 34.020882,
    longitude: -6.84165,
  };

  it("parses a valid minimal job address", () => {
    const result = insertJobAddressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });

  it("rejects an address missing the required latitude", () => {
    const { latitude, ...rest } = validAddress;
    const result = insertJobAddressSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric longitude", () => {
    const result = insertJobAddressSchema.safeParse({ ...validAddress, longitude: "not-a-number" });
    expect(result.success).toBe(false);
  });
});
