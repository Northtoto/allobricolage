import { randomInt } from "node:crypto";
import { logger } from "@/utils/logger.ts";
import { config } from "@/config/index.ts";

/**
 * P1-5 — WhatsApp-native flow. In Morocco "WhatsApp or it didn't happen": this
 * is the single biggest adoption lever, so booking confirmations, "technicien en
 * route", reminders and OTP login all go out over WhatsApp.
 *
 * The pure helpers (phone formatting, link building, OTP generation) are fully
 * testable; the network send degrades to a logged no-op when the Cloud API is
 * not configured, so dev/test never depends on a live WhatsApp number.
 */

const GRAPH_API_VERSION = "v21.0";

/**
 * Normalise a Moroccan phone number to E.164 digits (no "+"), the form the
 * WhatsApp Cloud API and wa.me links expect. Handles local "06…/07…",
 * "+212…", "00212…" and already-normalised inputs.
 */
export function formatMoroccanPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  // Strip an international dialling prefix ("00212…") down to the country code.
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("212")) return digits;
  // Local trunk-zero form ("06…/07…").
  if (digits.startsWith("0")) return `212${digits.slice(1)}`;
  // Bare national number (e.g. "612345678") — assume Morocco.
  return `212${digits}`;
}

/** Build a click-to-chat wa.me link with an optional prefilled message. */
export function buildWhatsAppLink(phone: string, text?: string): string {
  const to = formatMoroccanPhone(phone);
  return text
    ? `https://wa.me/${to}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${to}`;
}

/**
 * Generate a numeric one-time code of `length` digits (default 6). Each digit is
 * drawn from a CSPRNG (`crypto.randomInt`) — this code authenticates login, so it
 * must be unpredictable across sessions/users; `Math.random` would be guessable.
 */
export function generateOtp(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

export interface WhatsAppSendResult {
  sent: boolean;
  reason?: string;
}

/**
 * Send a free-form WhatsApp text. Returns { sent: false } (never throws) when
 * the Cloud API is not configured or the request fails, so callers can treat
 * WhatsApp as best-effort and fall back to SMS/in-app.
 */
export async function sendWhatsAppText(to: string, body: string): Promise<WhatsAppSendResult> {
  if (!config.WHATSAPP_ACCESS_TOKEN || !config.WHATSAPP_PHONE_NUMBER_ID) {
    logger.info("WhatsApp not configured — skipping outbound message", { to: formatMoroccanPhone(to) });
    return { sent: false, reason: "not_configured" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formatMoroccanPhone(to),
          type: "text",
          text: { body },
        }),
      }
    );

    if (!res.ok) {
      logger.warn("WhatsApp send returned non-OK status", { status: res.status });
      return { sent: false, reason: `http_${res.status}` };
    }
    return { sent: true };
  } catch (error) {
    logger.warn("WhatsApp send failed", { error });
    return { sent: false, reason: "request_failed" };
  }
}
