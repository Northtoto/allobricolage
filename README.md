# 🛠️ AlloBricolage - Demo Mode

> AI-Powered Handyman Marketplace for Moroccan Businesses

Connect B2B clients (cafés, restaurants, companies) with professional maintenance technicians (plumbers, electricians, painters, etc.) across Morocco.

## 🎯 Demo Mode - No Backend Required!

This application runs entirely in the browser using **LocalStorage** instead of a database. Perfect for demonstrations, portfolios, and testing!

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/allobricolage)

**No environment variables needed!** Just click deploy and it works.

**📖 [Demo Mode Documentation](./DEMO_MODE.md)**

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
- **Storage**: Browser LocalStorage
- **Deployment**: Vercel (Static Site)
- **No Backend Required!**

## 📋 Prerequisites

- Node.js 18+
- Modern web browser

## 🎯 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

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
3. **Deploy!** (No environment variables needed)

That's it! The app works entirely in the browser.

## 💾 Data Persistence

- All data stored in browser LocalStorage
- 10 pre-seeded technician profiles
- Data persists across page refreshes
- Clear browser cache to reset data

## 🔄 Reset Demo Data

Open browser console (F12) and run:
```javascript
localStorage.clear();
location.reload();
```

## 📱 Application Structure

```
├── client/          # React frontend (SPA)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── localStorage.ts    # Storage service
│   │   │   ├── apiAdapter.ts      # API routing
│   │   │   └── mockServices.ts    # Mock services
│   │   └── data/
│   │       └── seedData.ts        # Seed data
├── shared/          # Shared types & schema
└── dist/            # Production build
```

## 🧪 Sample Data

The app automatically seeds on first load:
- 10 technician profiles across Moroccan cities
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

