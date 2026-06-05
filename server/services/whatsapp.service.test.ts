import { describe, it, expect } from "vitest";
import {
  formatMoroccanPhone,
  buildWhatsAppLink,
  generateOtp,
  sendWhatsAppText,
} from "./whatsapp.service.ts";

describe("formatMoroccanPhone", () => {
  it("converts a local 0-prefixed number to 212…", () => {
    expect(formatMoroccanPhone("0612345678")).toBe("212612345678");
  });

  it("strips a leading + and separators from an international number", () => {
    expect(formatMoroccanPhone("+212 612-345-678")).toBe("212612345678");
  });

  it("handles a 00212 prefix", () => {
    expect(formatMoroccanPhone("00212612345678")).toBe("212612345678");
  });

  it("assumes Morocco for a bare national number", () => {
    expect(formatMoroccanPhone("612345678")).toBe("212612345678");
  });
});

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link with a URL-encoded prefilled message", () => {
    const link = buildWhatsAppLink("0612345678", "Bonjour, c'est pour ma réservation");
    expect(link).toContain("https://wa.me/212612345678?text=");
    expect(link).toContain(encodeURIComponent("réservation"));
  });

  it("omits the query string when no text is given", () => {
    expect(buildWhatsAppLink("0612345678")).toBe("https://wa.me/212612345678");
  });
});

describe("generateOtp", () => {
  it("produces a 6-digit numeric code by default", () => {
    const code = generateOtp();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("respects a custom length", () => {
    expect(generateOtp(4)).toMatch(/^\d{4}$/);
  });
});

describe("sendWhatsAppText (graceful no-op when unconfigured)", () => {
  it("returns sent:false without throwing when the Cloud API is not configured", async () => {
    const result = await sendWhatsAppText("0612345678", "Test");
    expect(result.sent).toBe(false);
    expect(result.reason).toBe("not_configured");
  });
});
