# 🛠️ M3allem

> AI-Powered Handyman Marketplace for Moroccan Businesses & Households

Connect B2B clients (cafés, restaurants, hotels, companies) and B2C households with professional maintenance technicians (plumbers, electricians, painters, etc.) across Morocco.

## 🏗️ Architecture

Full-stack app: a **React + Vite SPA** talking to an **Express + PostgreSQL (Neon) API** over HTTP.
The client calls the real backend via `client/src/lib/api-client.ts` (base URL `/api`,
overridable with `VITE_BACKEND_URL`). AI cost estimation uses Qwen2.5-7B-Instruct
(Hugging Face) with a deterministic formula fallback.

## 🚀 Deploy to Vercel (single deployment)

`vercel.json` deploys both the SPA **and** the API as a serverless function
(`api/index.ts` wraps the Express app), so one Vercel project serves everything.

**Required environment variables** (set in the Vercel project, or `.env` locally —
see `.env.example`): `DATABASE_URL`, `SESSION_SECRET`, `JWT_SECRET`. Optional:
`HUGGINGFACE_API_KEY` (AI estimator), `GOOGLE_*`, `STRIPE_*`, `GOOGLE_MAPS_API_KEY`.

## ✨ Features

- 🤖 AI-Powered Job Analysis (Mock)
- 🎯 Smart Technician Matching
- 💰 Dynamic Cost Estimation
- 💳 Multiple Payment Methods (Simulated)
- 🌐 Bilingual Support (French & Arabic)
- 📍 Real-time GPS Tracking
- 💬 DarijaChat AI Support
- 📊 Analytics Dashboards
- 🔐 Full Authentication System
- ⭐ Reviews & Ratings
- 📱 Responsive Design

## 🗄️ Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express + TypeScript (Node 20)
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **AI**: Qwen2.5-7B-Instruct (Hugging Face) for cost estimation, with formula fallback
- **Deployment**: Vercel (SPA + serverless API in one project)

## 📋 Prerequisites

- Node.js 20+
- A PostgreSQL database (Neon recommended) — set `DATABASE_URL`

## 🎯 Local Development

```bash
# Install dependencies
npm install

# Copy env template and fill in DATABASE_URL + secrets
cp .env.example .env

# Apply the schema to your database
npm run db:push

# Start API (port 5002) + web (port 5173) together
npm run dev
```

Open `http://localhost:5173` — Vite proxies `/api` to the Express server on 5002.

## 👤 Demo Accounts

### Client Account
- Username: `demo_client`
- Password: `demo123`

### Technician Accounts
- Username: `youssef_elfassi` (Plomberie - Casablanca)
- Username: `karim_bennani` (Électricité - Marrakech)
- Username: `fatima_alaoui` (Peinture - Rabat)
- Password for all: `demo123`

## 🚀 Deploy to Vercel

1. **Push to GitHub**: `git push origin main`
2. **Import to Vercel**: https://vercel.com/new
3. **Set environment variables** in the Vercel project: `DATABASE_URL`, `SESSION_SECRET`,
   `JWT_SECRET` (and any optional keys above).
4. **Deploy!** `vercel.json` builds the SPA and deploys `api/index.ts` as the API function.

The same Vercel project serves the SPA and the `/api` backend (no separate host needed).

## 💾 Data Persistence

- All data is stored in PostgreSQL (Neon) via Drizzle ORM
- The browser keeps only the auth token/session in localStorage
- Schema changes: `npm run db:generate` then `npm run db:push`
- Seed sample data: `npm run db:seed`

## 📱 Application Structure

```
├── client/          # React frontend (SPA)
│   └── src/
│       ├── lib/api-client.ts   # HTTP client → /api
│       └── pages/ components/  # UI
├── server/          # Express API
│   ├── routes/ services/ repositories/ middleware/
│   ├── db/          # Drizzle schema + connection
│   └── index.ts     # App (exported; listens locally, serverless on Vercel)
├── api/index.ts     # Vercel serverless entry (wraps the Express app)
├── shared/          # Shared types & schema
└── migrations/      # Drizzle SQL migrations
```

## 🧪 Sample Data

Run `npm run db:seed` to populate technician profiles, service categories, and
realistic ratings/reviews across Moroccan cities.

## 🤝 Services Available

Plomberie • Électricité • Peinture • Menuiserie • Climatisation • Maçonnerie • Carrelage • Serrurerie • Jardinage • Nettoyage

## 🏙️ Cities Served

Casablanca • Rabat • Marrakech • Fès • Tanger • Agadir • Meknès • Oujda • Kenitra • Tétouan • Salé • Nador • Beni Mellal • El Jadida • Khouribga • Safi • Mohammedia

## 📝 License

MIT

---

**Built with ❤️ for AUI System Analysis and Design Course**

**🚀 Ready for Vercel Deployment**

