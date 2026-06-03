# M3allem — Market Domination Strategy (B2B + B2C, #1 in Morocco)

> The plan to make M3allem the **default, category-defining brand** for maintenance & home
> services in Morocco — **#1 in both B2B and B2C**, ahead of AlloPro, Bricall, Bricole, and Sabab.
> Bilingual FR/AR + Darija. Local payments (CMI / CashPlus / cash).

_Last updated: 2026-06-01_

---

## 0. The thesis: one supply pool, two demand engines, one flywheel

Every incumbent in Morocco is **pure B2C peer-to-peer**. That is their fatal weakness, not their strength:
their technicians sit idle between one-off gigs, earn unpredictably, and churn off the platform — so supply
density and availability stay thin, and the customer experience stays unreliable.

**M3allem wins by attacking from a flank they can't defend:**

```
   B2B RETAINERS                    SUPPLY DENSITY                   B2C DOMINANCE
 (cafés, restaurants,   ──────▶   guaranteed monthly      ──────▶   a vetted pro is ALWAYS
  hotels, syndics,                income keeps the best             nearby & available, with
  property managers)              technicians loyal &               transparent pricing →
        │                         densely available                 best B2C experience in MA
        │                                  │                                  │
        └──────────  funds CAC  ◀──────────┴────────  brand + reviews  ◀──────┘
                  & subsidizes the liquidity that no pure-B2C rival can match
```

- **B2B is the moat-builder:** high trust, high margin, recurring, sticky. It pays for the supply.
- **B2C is the volume + brand engine:** mass awareness, the verb "M3allem," data density.
- The two **share the same vetted technician network** — that shared liquidity is the unfair advantage.
  A pure-B2C competitor cannot create guaranteed technician income, so they can never match our
  availability or reliability. **This is why we end up #1 in both.**

---

## 1. Market reality (researched)

The **B2C lane is crowded**; the **B2B lane is wide open**; **nobody owns both**.

| Player | Lane | Weakness we exploit |
|--------|------|---------------------|
| **AlloPro** (allopro.ma) | B2C particulier↔bricoleur | No B2B, no retainers, thin reliability; brand collision risk |
| **Bricall** (bricall.ma) | B2C artisans | Lead-gen only, no SLA, no guaranteed supply income |
| **Bricole** (bricoleapp.com) | B2C, 100k+ users | Volume but commoditized; no recurring contracts |
| **Sabab** (sabab.ma) | B2C verified pros | Trust messaging only; idle supply, no B2B baseload |

Benchmarks: TaskRabbit (real-time + vetting), Thumbtack (lead-gen, 500+ cats), Urban Company
(productized services + supply ownership — **the model to emulate**). Market ~$1.5B (2024) → ~$5.2B (2033), ~15% CAGR.

Demand context that shapes tactics:
- **LinkedIn = #1 B2B channel** in Morocco (~6M members).
- **~77% of SMEs don't take card** → cash + CashPlus must be first-class, not card-first.
- WhatsApp is the default consumer + SMB comms channel.
- ADD + National Digital Strategy = SME digitalization tailwind.

**Sources:** [Bricole](https://bricoleapp.com/fr/ma/) · [AlloPro](https://www.allopro.ma/) ·
[Bricall](https://www.bricall.ma/) · [Sabab](https://sabab.ma/) ·
[On-demand trends Morocco 2025](https://www.appicial.com/blog/top-trends-in-on-demand-app-development-in-morocco-for-2025.html) ·
[Two-sided marketplace playbook](https://www.sharetribe.com/how-to-build/two-sided-marketplace/) ·
[Mastercard SME Index Morocco](https://www.mastercard.com/news/eemea/en/newsroom/press-releases/en/2025-1/february/mastercard-sme-confidence-index-morocco-holds-potential-for-digital-economic-transformation/) ·
[Digital marketing Morocco 2025](https://mymarketing.ma/en/digital-marketing-trends-morocco-2025/)

---

## 2. Positioning: own the category, become the verb

**Master brand:** _M3allem — la maintenance de confiance, partout au Maroc._
Goal: when anything breaks, Moroccans **say the name like a verb**, the way "Allo Taxi" became generic.

Two sub-brands, **one app, one supply network:**

| | **M3allem Pro** (B2B) | **M3allem** (B2C) |
|---|---|---|
| Customer | Cafés, restaurants, hotels, syndics, companies | Households, individuals |
| Promise | "Technicien vérifié <2h, SLA, facture TVA propre" | "Un pro de confiance, prix affiché, aujourd'hui" |
| Hook | Downtime = lost revenue → speed & accountability | Fear of being overcharged → transparent fixed price |
| Revenue | Retainers + SLA + commission | Commission + boosts + subscription perks |

**Non-negotiable differentiators (all already scaffolded in the committed backend):**
1. **Vetted + scored technicians** — `verification.routes.ts` + `trust-score.ts`. Trust is the #1 objection on BOTH sides.
2. **Recurring plans & SLAs** — `subscriptions.routes.ts`. The B2B moat + technician baseload.
3. **Dispute protection** — `disputes.routes.ts`. Removes purchase risk.
4. **Referral engine** — `referrals.routes.ts`. Owner→owner (B2B) and friend→friend (B2C) viral loops.
5. **Transparent dynamic pricing** — kills the "fear of getting ripped off" that defines the informal market.
6. **Bilingual + Darija** — meet every client and technician where they are.

---

## 3. Business model — monetize both sides without choking liquidity

Service marketplaces realistically take **15–20%**. We layer revenue so each segment pays where it's least price-sensitive:

| Stream | B2B | B2C | Why |
|--------|-----|-----|-----|
| **Commission** | 12–15% | 15–20% | Core; zero cost until a job closes → low entry friction |
| **Subscription** (`subscriptions`) | Business retainer / SLA plans per site | Technician Pro/Elite (priority dispatch, badge, lower commission); optional consumer "Care" plan | Predictable revenue + supply loyalty |
| **Boosts / featured** | — | Technician featured placement | Secondary, post-liquidity |
| **Value-add** | TVA invoicing, multi-site dashboard, reporting | Insurance/guarantee on jobs | Stickiness + trust |

**Launch lever — commission holiday:** 0% to the first wave of technicians for 60–90 days to seed supply,
then ramp. Proven cold-start tactic; the retainer income arrives to replace it.

---

## 4. Sequencing — B2B first to build the moat, B2C to scale the brand

You don't launch both at once. You launch B2B to **manufacture supply density**, then flip on B2C
once a technician is guaranteed to be nearby and free.

### Act I — Seed supply (Weeks 1–4, Casablanca only)
- Recruit + **verify 50 technicians** in 4 urgent categories (plomberie, électricité, climatisation, peinture).
- Single-player value so they join before any demand: free profile/portfolio (`PortfolioGallery`,
  `TrustBadge`), free agenda, invoicing, payments, and the coveted **"Vérifié" badge**.
- Commission holiday live.

### Act II — B2B ignition (Weeks 3–8)
- Founder-led direct sales to cafés/restaurants/syndics. Sign **1 anchor account** (café chain / hotel
  group / co-working operator = dozens of sites) + 20–30 SMB retainers.
- Retainers create the **guaranteed baseload** that locks in your best technicians.

### Act III — Flip on B2C (Weeks 6–12)
- Now that supply is dense and reliably available, open consumer demand in the same city.
- Lead B2C marketing with **trust + transparent price + instant availability** — the three things
  incumbents are weakest on. Use B2B-proven technicians and their reviews as social proof.

### Act IV — Replicate & defend (Quarter 2+)
- New city = repeat Act I→III. Never spread thin: **liquidity in one city beats presence in ten.**
- Defend with retainers, reviews, referrals, and on-platform-only perks to stop supply/demand leakage.

---

## 5. Client attraction playbook

### B2B (high-trust, founder-led)
1. **Direct sales / door-to-door** to target neighborhoods (the GreenPal "100k door hangers" energy).
2. **LinkedIn** — #1 Moroccan B2B channel: owner/property-manager targeting, "what downtime costs your café" content, case studies.
3. **Anchor partnerships** — restaurant associations, franchise groups, syndics, co-working chains. One contract = many sites.
4. **Referral credits** (`referrals`) — owner→owner is the cheapest, highest-trust B2B channel.

### B2C (mass, brand-led)
1. **WhatsApp Business** as the primary booking + support surface (Moroccan default).
2. **Local SEO + Google Business** per city/category ("plombier urgence Casablanca", "réparation clim Rabat").
3. **Darija + French short-form video** (TikTok/Instagram/YouTube Shorts): real fixes, before/after, "prix affiché, zéro surprise."
4. **Referral loop** (`referrals`): service credit for both referrer and referee.
5. **Retargeting** for quote-requesters who didn't book.

### Trust = the conversion lever on both sides
- Lead every surface with **verification badges, trust scores, real reviews, dispute protection,
  transparent price ranges.** Fear of being overcharged is the single biggest reason Moroccans avoid
  informal technicians — neutralize it and the market is yours.

---

## 6. 90-day domination plan (Casablanca)

| Weeks | Focus | Exit criteria |
|-------|-------|---------------|
| 1–4 | Seed 50 verified technicians, 4 categories. Commission holiday live. | 50 verified, profiles live, agenda used |
| 3–8 | B2B sales: 1 anchor + 20–30 SMB retainers. WhatsApp + Google Business live. | Recurring baseload covering technicians' min income |
| 6–12 | Flip on B2C; reviews + referrals on; transparent pricing front-and-center. | >70% requests matched; 30% repeat rate |
| 11–13 | Switch on commission; launch Pro tier; prep city #2 (Rabat or Marrakech). | Positive contribution margin per job |

---

## 7. KPIs (the dashboard that tells us we're winning)

- **Liquidity:** % of requests matched & completed (target >70%, world-class >85%).
- **Availability/speed:** time-to-match, time-to-arrival (the promise B2C rivals can't keep).
- **Stickiness:** repeat rate, retainer attach rate, technician retention (the flywheel health metric).
- **Economics:** realized take rate, CAC by channel, LTV (multi-site B2B LTV is the prize).
- **Trust funnel:** verification completion %, review coverage %, dispute rate (keep < 2%).
- **Brand:** branded search volume / "M3allem" mentions — are we becoming the verb?

---

## 8. Risks & how we beat them

- **Brand collision with AlloPro/Bricall** → own B2B + the master-brand verb; run a trademark check now.
- **Supply/demand leakage off-platform** → invoicing, dispute protection, retainers, reviews, and
  perks that only exist on-platform make staying on M3allem the rational choice.
- **Cash economy / low card adoption** → CashPlus + cash are first-class flows, not afterthoughts.
- **Thin liquidity if we spread too early** → dominate one city's density before expanding. Always.
- **Incumbent reaction** → by the time they notice, B2B retainers have locked our supply; they can't
  out-bid guaranteed monthly income with one-off gigs.
