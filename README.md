# 🛠️ AlloBricolage - B2B Maintenance Services Platform

> AI-Powered Handyman Marketplace for Moroccan Businesses

A modern web platform connecting B2B clients (cafés, restaurants, companies) with maintenance service professionals (plumbers, electricians, painters, etc.) in Morocco.

## 🎓 Project Information

**Course**: System Analysis and Design  
**University**: Al Akhawayn University in Ifrane (AUI)

## ✨ Features

- 🤖 **AI-Powered Job Analysis** - Natural language job description processing
- 🎯 **Smart Technician Matching** - Algorithm-based technician recommendations
- 💰 **Dynamic Cost Estimation** - Market-aware pricing suggestions
- 💳 **Multiple Payment Methods** - CMI, Cash Plus, Bank Transfer
- 🔒 **Secure Payment System** - PCI-compliant payment processing
- 🌐 **Bilingual Support** - French & Arabic with RTL support
- 💬 **DarijaChat** - AI customer support in Moroccan Darija
- 📊 **Dashboard Analytics** - Client and technician dashboards
- 🔔 **Real-time Notifications** - Alerts for bookings and payments

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

1. **Clone or download the project**

2. **Navigate to the project folder**
```bash
cd ALLOBRICOLAGE
```

3. **Install dependencies**
```bash
npm install
```

4. **Create environment file**

Copy `env.example.txt` to `.env`:
```bash
copy env.example.txt .env
```

Or create `.env` with these contents:
```env
USE_SQLITE=true
SESSION_SECRET=allobricolage-dev-secret-2024
PORT=5000
NODE_ENV=development
```

5. **Initialize the database**
```bash
npm run db:init
```

6. **Start the development server**
```bash
npm run dev
```

7. **Open in browser**
```
http://localhost:5000
```

## 📁 Project Structure

```
ALLOBRICOLAGE/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities, hooks, contexts
│   │   └── hooks/          # Custom React hooks
│   └── public/             # Static assets
│
├── server/                 # Backend Express API
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Storage interface & Postgres implementation
│   ├── sqlite-storage.ts   # SQLite storage implementation
│   ├── auth.ts             # Authentication logic
│   ├── ai-service.ts       # AI integration (OpenAI/Gemini)
│   ├── app.ts              # Express app setup
│   └── init-db.ts          # Database initialization script
│
├── shared/                 # Shared code between client/server
│   └── schema.ts           # Database schema & types
│
├── data/                   # SQLite database (auto-created)
│   └── allobricolage.db
│
└── package.json            # Dependencies & scripts
```

## 🗄️ Database Options

### Option 1: SQLite (Recommended for Development)
- ✅ No setup required
- ✅ Data persists between restarts
- ✅ Perfect for local development

Set in `.env`:
```env
USE_SQLITE=true
```

### Option 2: PostgreSQL (Neon - for Production)
- Required for production deployment
- Requires Neon account and DATABASE_URL

Set in `.env`:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Option 3: In-Memory (Fallback)
- Used automatically if other options fail
- ⚠️ Data is lost on server restart

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:init` | Initialize database with sample data |
| `npm run setup` | Install deps + initialize DB |
| `npm run check` | TypeScript type checking |

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Jobs
- `POST /api/jobs/analyze` - AI job analysis
- `POST /api/jobs` - Create job with matching
- `GET /api/jobs/:id` - Get job details

### Technicians
- `GET /api/technicians` - List technicians (filter by city/service)
- `GET /api/technicians/:id` - Get technician profile

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List all bookings

### Dashboards
- `GET /api/client/stats` - Client statistics
- `GET /api/client/jobs` - Client's jobs
- `GET /api/technician/stats` - Technician statistics
- `GET /api/technician/pending-jobs` - Pending jobs for technician

### AI Chat
- `POST /api/chat/darija` - DarijaChat AI support

## 🛠️ Technology Stack

### Frontend
- **React** + TypeScript
- **Vite** (Build tool)
- **Wouter** (Routing)
- **TanStack Query** (Data fetching)
- **Radix UI** + **shadcn/ui** (Components)
- **Tailwind CSS** (Styling)

### Backend
- **Node.js** + TypeScript
- **Express.js** (API framework)
- **Drizzle ORM** (Database)
- **SQLite** / **PostgreSQL** (Database)
- **bcrypt** (Password hashing)

### AI Services (Optional)
- **OpenAI GPT** - Job analysis
- **Google Gemini** - Match explanations

## 🧪 Demo Accounts

After running `npm run db:init`, these technician accounts are available:

| Username | City | Service |
|----------|------|---------|
| youssef_elfassi | Casablanca | Plomberie |
| karim_bennani | Marrakech | Electricité |
| fatima_alaoui | Rabat | Peinture |
| ahmed_benali | Casablanca | Plomberie |
| hassan_chraibi | Casablanca | Menuiserie |
| nadia_senhaji | Casablanca | Nettoyage |

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `USE_SQLITE` | No | Set to `true` for local SQLite storage |
| `DATABASE_URL` | No* | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Session encryption key |
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `OPENAI_API_KEY` | No | For AI job analysis |
| `GEMINI_API_KEY` | No | For AI match explanations |

*Either `USE_SQLITE=true` or `DATABASE_URL` should be set for persistent storage.

## 📱 Pages

- `/` - Home page with services overview
- `/post-job` - Create new maintenance request
- `/technicians` - Browse technician directory
- `/technician/:id` - Technician profile
- `/payment/:bookingId` - **Secure payment page** 💳
- `/client-dashboard` - Client dashboard
- `/technician-dashboard` - Technician dashboard
- `/login` - User login
- `/signup` - Registration selection
- `/signup/client` - Client registration
- `/signup/technician` - Technician registration

## 💳 Payment Methods

The platform supports **3 payment methods** tailored for Morocco:

### 1. CMI (Centre Monétaire Interbancaire)
- **Best for**: Moroccan bank cards (Visa, Mastercard)
- **Process**: Secure redirect to CMI payment gateway
- **Status**: Automatic confirmation
- **Fees**: ~2.5%

### 2. Cash Plus
- **Best for**: Cash payments
- **Process**: Generate reference code → Pay at any Cash Plus location
- **Status**: Automatic confirmation via webhook
- **Fees**: 15 MAD flat fee

### 3. Bank Transfer (RIB/IBAN)
- **Best for**: Direct bank transfers
- **Process**: Transfer to provided RIB/IBAN with unique reference
- **Status**: Manual verification
- **Fees**: None

### Payment Flow:
1. Client books a technician
2. Redirected to secure payment page
3. Choose payment method
4. Complete payment
5. Technician receives notification
6. Booking confirmed ✅

## 🤝 Services Available

1. 🔧 **Plomberie** (Plumbing)
2. ⚡ **Électricité** (Electrical)
3. 🎨 **Peinture** (Painting)
4. 🪵 **Menuiserie** (Carpentry)
5. ❄️ **Climatisation** (AC/HVAC)
6. 🧱 **Maçonnerie** (Masonry)
7. 🔲 **Carrelage** (Tiling)
8. 🔐 **Serrurerie** (Locksmith)
9. 🌿 **Jardinage** (Gardening)
10. 🧹 **Nettoyage** (Cleaning)

## 🏙️ Cities Served

Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir, Meknès, Oujda, Kenitra, Tétouan

---

**Built with ❤️ for AUI System Analysis and Design Course**


