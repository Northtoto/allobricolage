# 🛠️ AlloBricolage - B2B Maintenance Services Platform

> AI-Powered Handyman Marketplace for Moroccan Businesses

Connect B2B clients (cafés, restaurants, companies) with professional maintenance technicians (plumbers, electricians, painters, etc.) across Morocco.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/allobricolage)

**📖 [Complete Deployment Guide](./VERCEL_DEPLOYMENT.md)**

## ✨ Features

- 🤖 AI-Powered Job Analysis
- 🎯 Smart Technician Matching
- 💰 Dynamic Cost Estimation
- 💳 Multiple Payment Methods (CMI, Cash Plus, Bank Transfer)
- 🌐 Bilingual Support (French & Arabic)
- 📍 Real-time GPS Tracking
- 💬 DarijaChat AI Support
- 📊 Analytics Dashboards

## 🗄️ Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **Deployment**: Vercel
- **AI**: OpenAI + Google Gemini (optional)

## 📋 Prerequisites

- Node.js 18+
- Neon PostgreSQL database (free at https://neon.tech)
- Vercel account (free at https://vercel.com)

## 🎯 Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example.txt .env
# Edit .env and add your DATABASE_URL

# Initialize database
npm run db:init

# Start development server
npm run dev
```

Open http://localhost:5000

## 🚀 Deploy to Vercel

1. **Get a Neon database**: https://neon.tech
2. **Push to GitHub**: `git push origin main`
3. **Import to Vercel**: https://vercel.com/new
4. **Add environment variables**:
   - `DATABASE_URL` (from Neon)
   - `SESSION_SECRET` (generate with `openssl rand -base64 32`)
5. **Deploy!**

**📖 [Detailed Deployment Guide](./VERCEL_DEPLOYMENT.md)**

## ⚙️ Environment Variables

### Required:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key

### Optional:
- `OPENAI_API_KEY` - For AI job analysis
- `GEMINI_API_KEY` - For smart matching
- `GOOGLE_MAPS_API_KEY` - For GPS tracking
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - For OAuth
- Payment provider keys (Stripe, CMI, Cash Plus)

## 📱 Application Structure

```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types & schema
├── api/             # Vercel serverless functions
└── dist/            # Production build
```

## 🧪 Sample Data

After running `npm run db:init`, the database is seeded with:
- 70+ technicians across all Moroccan cities
- All service categories (plumbing, electrical, painting, etc.)
- Realistic ratings and reviews

## 🤝 Services Available

Plomberie • Électricité • Peinture • Menuiserie • Climatisation • Maçonnerie • Carrelage • Serrurerie • Jardinage • Nettoyage

## 🏙️ Cities Served

Casablanca • Rabat • Marrakech • Fès • Tanger • Agadir • Meknès • Oujda • Kenitra • Tétouan • Salé • Nador • Beni Mellal • El Jadida • Khouribga • Safi • Mohammedia

## 📝 License

MIT

---

**Built with ❤️ for AUI System Analysis and Design Course**

**🚀 Ready for Vercel Deployment**

