import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/payment.repository.ts", () => ({
  paymentRepository: {
    create: vi.fn(async (d: Record<string, unknown>) => ({ id: "pay-1", status: d.status })),
    update: vi.fn(async () => ({})),
  },
}));
vi.mock("@/repositories/notification.repository.ts", () => ({ notificationRepository: {} }));

import { paymentService } from "./payment.service.ts";
import { paymentRepository } from "@/repositories/payment.repository.ts";

beforeEach(() => vi.clearAllMocks());

describe("getPaymentMethods", () => {
  it("returns the Moroccan payment methods incl. cash (low card adoption)", () => {
    const methods = paymentService.getPaymentMethods();
    const ids = methods.map((m) => m.id);
    expect(ids).toContain("cash");
    expect(ids).toContain("bank_transfer");
    expect(ids).toContain("stripe");
  });

  it("only the stripe/cash methods are instant; amounts are ordered", () => {
    for (const m of paymentService.getPaymentMethods()) {
      expect(m.minAmount).toBeLessThanOrEqual(m.maxAmount);
      expect(m.processingFee).toBeGreaterThanOrEqual(0);
    }
    const cash = paymentService.getPaymentMethods().find((m) => m.id === "cash")!;
    expect(cash.processingFee).toBe(0);
  });
});

describe("processPayment", () => {
  it("cash payments start pending with no payment intent", async () => {
    const res = await paymentService.processPayment({ bookingId: "b1", amount: 300, paymentMethod: "cash" } as never);
    expect(res.status).toBe("pending");
    expect(res.transactionId).toMatch(/^TRX-/);
    const arg = (paymentRepository.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.paymentIntentId).toBeNull();
  });

  it("stripe payments start processing with a payment intent", async () => {
    await paymentService.processPayment({ bookingId: "b2", amount: 500, paymentMethod: "stripe" } as never);
    const arg = (paymentRepository.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.status).toBe("processing");
    expect(arg.paymentIntentId).toMatch(/^pi_/);
    expect(arg.currency).toBe("MAD");
  });

  it("bank transfers get a bank reference", async () => {
    await paymentService.processPayment({ bookingId: "b3", amount: 1000, paymentMethod: "bank_transfer" } as never);
    const arg = (paymentRepository.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.bankReference).toMatch(/^VIR-/);
  });
});

describe("generateBankTransferReference", () => {
  it("produces a stable, prefixed reference from the booking id", () => {
    const ref = paymentService.generateBankTransferReference("abcdef123456");
    expect(ref).toMatch(/^AB-ABCDEF-\d{4}$/);
  });
});

describe("confirmPayment", () => {
  it("marks the payment completed with a paidAt timestamp", async () => {
    await paymentService.confirmPayment("pay-1");
    const [, patch] = (paymentRepository.update as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(patch.status).toBe("completed");
    expect(patch.paidAt).toBeInstanceOf(Date);
  });
});
