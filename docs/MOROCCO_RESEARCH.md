# AlloBricolage — Morocco Market Research → Product Roadmap

> Deep research on what Moroccan service customers actually need, centered on
> their core pain: **finding a technician they can trust.** Each finding is mapped
> to a concrete feature and tagged against what the codebase already has, so we
> extend existing primitives instead of rebuilding.

_Researched 2026-06-02. Sources at the bottom._

---

## The core insight

The Moroccan home-services problem is **not supply** (2M+ work in crafts/trades) —
it's a **trust gap**. Customers fear the *arnaque*: inflated invoices, exaggerated
diagnoses, unnecessary work, no written quote, no-shows, and shoddy work with no
recourse. The sector is overwhelmingly **informal** (no credentials, no insurance,
no paper trail), so customers fall back on **bouche-à-oreille** (word of mouth)
because there's no trustworthy alternative.

Competitors (Sabab, Bricole) verify ID and show ratings — but **deliberately push
payment OFF-platform** (0% commission, "arrange payment directly"). That feels
free, but it means **zero accountability**: no escrow, no guarantee, no recourse
when the job goes wrong. **That is AlloBricolage's wedge** — be the platform that
*stands behind the work*, which the off-platform players structurally can't.

---

## Morocco-specific structural facts (these constrain every feature)

| Fact | Implication |
|------|-------------|
| **Cash on delivery = 84% of payments**; cards 43%, online wallets ~10% | Never require a card to book. Cash must be a first-class, tracked flow. |
| **WhatsApp: 90%+ of mobile users; 60%+ of e-commerce runs on it** | WhatsApp is THE channel — booking, OTP, notifications, support. Not email. |
| **Smartphone 80%+, internet ~90% mobile-only** | Mobile-perfect, low-data, installable (PWA). Desktop is secondary. |
| **Darija is the spoken language** (FR/standard-AR are written) | Darija UX + voice input for lower-literacy users. |
| **Informal sector, no formal credentials** (OFPPT diplomas exist but most are uncertified) | Verification must be a *ladder*, not a binary — earn trust progressively. |
| **Word of mouth is the trusted channel** | Referrals + verified social proof are acquisition, not afterthoughts. |

---

## Prioritized roadmap (impact on the trust gap × Morocco fit)

### P0 — The anti-*arnaque* trust stack (the wedge)

**1. Transparent pricing + mandatory written devis before work**
The #1 fear is the inflated/surprise invoice. Require a **written quote the client
accepts in-app before work starts**, and flag prices that deviate sharply from the
service's normal band.
- _Have:_ AI cost estimator (Qwen + formula), `min/likely/maxCost` on jobs.
- _Build:_ a `quotes` step (technician proposes → client accepts in-app) + a
  price-band guardrail that warns when a quote is an outlier.

**2. Photo/video → instant estimate (diagnose without the in-person arnaque)**
Let the client snap the broken thing and get a range *before* anyone visits,
removing the "technician invents problems on site" dynamic.
- _Have:_ `/jobs/analyze-image` stub, Qwen estimator, `aiAnalysis` field.
- _Build:_ wire a real vision model (Qwen2.5-VL) to the image route; show the
  range up front.

**3. Service guarantee + escrow release on satisfaction**
The thing competitors can't offer. Hold payment in escrow; release on client
confirmation; **N-day re-intervention warranty** if the work fails.
- _Have:_ `payments.escrowStatus`, full `disputes` flow, `release-escrow`/`refund`.
- _Build:_ a `guaranteePeriodDays` on completed bookings + a "signaler un problème
  sous garantie" action that opens a dispute and can trigger a free re-visit.

**4. Verification ladder with visible tiers** (not a binary "Vérifié")
Mirror what builds trust locally: CIN + selfie liveness → diploma/OFPPT upload →
skill confirmation → track record. Show the tier prominently.
- _Have:_ `verificationDocuments` (documentType/status/adminNotes), `virtualIdCards`
  (QR), `trust-score` (bronze→diamond), `isVerified`.
- _Build:_ CIN + **selfie liveness** capture, an OFPPT/diploma `documentType`, and
  surface the trust tier + "what's verified" checklist on every card/profile.

### P1 — Meet customers where they are

**5. WhatsApp-native flow** (booking confirmations, OTP login, "technicien en
route", reminders, support). This is the single biggest adoption lever.
- _Have:_ `messages.channel` defaults to `"whatsapp"`, WhatsApp link helper.
- _Build:_ WhatsApp Business API integration for outbound notifications + OTP.

**6. Cash-first checkout** — book with no card; pay cash after the job; technician
confirms collection; optional CashPlus voucher. Card/Stripe stays optional.
- _Have:_ payment methods incl. `cash` + `bank_transfer`, bank-transfer details.
- _Build:_ a post-service "cash collected" confirmation step + CashPlus reference
  generation (route exists in the client; backend integration pending).

**7. Darija + voice + low-data PWA** — Darija strings, voice-to-text job
description, installable offline-tolerant shell.
- _Have:_ FR/AR i18n, SEO/meta.
- _Build:_ Darija locale, voice input on the job form, PWA manifest + caching.

### P2 — Reinforce & scale trust

**8. Verified-booking-only reviews + photo proof** (kills fake reviews — a real
problem when competitors allow open ratings).
- _Have:_ `reviews.isVerified`, sub-ratings (serviceQuality, punctuality,
  professionalism, valueForMoney), `technicianResponse`.
- _Build:_ enforce reviews only from completed on-platform bookings; allow before/
  after photos.

**9. Referral loop tuned for bouche-à-oreille** — credit both sides; make sharing a
verified technician one tap (WhatsApp share of the virtual ID card).
- _Have:_ full `referrals` + `referralCodes`, `virtualIdCards` with share count.
- _Build:_ one-tap WhatsApp share of a technician's verified card.

**10. No-show & punctuality accountability** — track ETA vs. arrival, penalize
no-shows in the trust score, auto-rematch if a technician doesn't show.
- _Have:_ `trust-score` (responseTime factor), tracking/location routes,
  `matchScore`.
- _Build:_ arrival confirmation + no-show signal feeding the score and triggering
  rematch.

---

## What NOT to build (avoid the competitors' trap)
- **Don't go 0%-commission / payment-off-platform.** That's Sabab/Bricole's model
  and it's exactly why they can't offer guarantees or recourse. On-platform
  payment + escrow is the moat — keep it.
- **Don't card-gate.** 84% cash means a card requirement kills conversion.
- **Don't email-first.** WhatsApp or it didn't happen.

## Suggested build order
P0-1 (written devis + price guardrail) and P0-3 (guarantee/escrow polish) first —
they're the differentiators and mostly extend code we already have. Then P1-5
(WhatsApp) and P1-6 (cash-first) for adoption. P0-4 (verification ladder) runs in
parallel as the trust surface. Everything else is reinforcement.

---

## Sources
- Trust/arnaque & verification: [Sabab.ma](https://sabab.ma/) · [Bricole](https://bricoleapp.com/) · [Depanneo anti-arnaque guide](https://www.depanneo.com/guide/eviter-arnaques-depannage-domicile-conseils/) · [Smile ID — Morocco identity verification](https://usesmileid.com/countries/morocco/)
- Informal sector & credentials: [IJPSAT — digital institutional gap / trust paradox & informal sector in Morocco](https://ijpsat.org/index.php/ijpsat/article/view/7939) · [BORGEN — Moroccan artisans](https://www.borgenmagazine.com/moroccan-artisans/) · [OFPPT plombier-chauffagiste](https://www.ofppt.ma/fr/filieres-de-formations/plombier-chauffagiste)
- Payments / WhatsApp / mobile behavior: [CODRocket — Morocco COD guide 2025](https://codrocket.com/blog/complete-guide-cod-ecommerce-morocco-2025) · [CODRocket — e-commerce stats 2026](https://codrocket.com/blog/morocco-ecommerce-statistics-trends-2026) · [meatechwatch — online shopping +65%](https://meatechwatch.com/2025/11/04/online-shopping-in-morocco-surges-65-as-e-commerce-adoption-reaches-new-heights/) · [AzulWeb — online payments Morocco](https://azulweb.ma/en/accept-online-payments-morocco/)
