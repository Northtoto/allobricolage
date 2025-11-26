# AlloBricolage - AI-Powered Handyman Marketplace

## Overview

AlloBricolage is an AI-native marketplace platform connecting clients with handyman technicians in Morocco. The platform provides intelligent job matching, automated cost estimation, and dynamic pricing using Google Gemini and OpenAI models. The core business logic is driven by AI decision-making, from natural language job description parsing to technician matching algorithms.

The platform supports bilingual operations (French and Arabic with RTL support) and focuses on 10 primary handyman services across major Moroccan cities including Casablanca, Rabat, Marrakech, and others.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens following the "New York" style variant
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite

**Design System Approach**
The application follows a reference-based hybrid design approach, drawing inspiration from Airbnb's marketplace trust signals, Uber's real-time matching UI, and Material Design's data-dense patterns. Typography uses Inter for primary content and Cairo for Arabic RTL support. The layout system employs consistent Tailwind spacing primitives (3, 4, 6, 8, 12, 16, 20 units) with a max-width container of 7xl.

**Key UI Patterns**
- Conversational card-based job posting flow with real-time AI feedback
- Technician matching results displayed in responsive card grids (2-3 columns desktop, 1 column mobile)
- Match score badges with AI-generated explanations for transparency
- Progressive disclosure pattern for complex forms

### Backend Architecture

**Technology Stack**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (via Neon serverless)
- **AI Services**: Google Gemini 2.5 Flash and OpenAI GPT-5
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions

**API Design**
RESTful API with route handlers organized in `server/routes.ts`. Key endpoints include:
- `/api/jobs/analyze` - AI-powered job description analysis
- `/api/jobs` - Job creation with automatic technician matching
- `/api/bookings` - Booking management with upsell suggestions
- `/api/client/stats` - Client dashboard statistics
- `/api/client/jobs` - Client job listings
- `/api/chat/darija` - DarijaChat AI support (Darija/French/Arabic)

**AI Service Layer**
Centralized in `server/ai-service.ts`, implementing multiple AI-powered features:
- Natural language processing for job descriptions (supports French and Arabic)
- Service category extraction using keyword mapping
- Urgency and complexity level detection
- Dynamic cost estimation with market comparison
- Technician matching algorithm (XGBoost-style scoring)
- Personalized upsell suggestions based on job context
- DarijaChat: AI-powered customer support in Moroccan Darija

**Data Storage Strategy**
Dual-layer approach:
- **Development**: In-memory storage implementation (`MemStorage` class) for rapid prototyping
- **Production**: PostgreSQL with Drizzle ORM for persistent storage

The schema supports technicians, jobs, bookings, and users with proper relational constraints. Service categories and Moroccan cities are defined as typed constants for type safety.

### Core Business Logic

**AI-Native Decision Engine**
Every major user interaction flows through AI models:

1. **Job Analysis Pipeline**: User describes problem in natural language → AI extracts service type, urgency, complexity, and specific issues → Returns structured data for matching
2. **Cost Estimation**: Combines job complexity, service type, city market rates, and urgency to calculate price ranges with confidence scores
3. **Technician Matching**: Scores available technicians based on service expertise, location proximity, availability, response time, completion rate, and years of experience
4. **Upsell Generation**: Analyzes job context to suggest complementary services with dynamic pricing and discount optimization

**Matching Algorithm Factors**
- Service expertise match (primary filter)
- Geographic proximity to job location
- Technician availability and response time
- Historical completion rates and ratings
- Years of experience in specific service category
- Real-time availability status

### Internationalization & Localization

**Bilingual Support**
- Built-in i18n context provider (`client/src/lib/i18n.tsx`)
- Language toggle between French and Arabic
- RTL layout support for Arabic using Cairo font
- Translation keys organized by feature area (navigation, services, job posting, etc.)

**Moroccan Market Specifics**
- Service categories tailored to Moroccan handyman market (10 categories from plumbing to gardening)
- City-specific pricing and availability
- Dual-language keyword matching for AI service extraction

### Theme System

Custom theme provider with light/dark mode support. Color tokens defined using HSL with CSS custom properties for dynamic theming. Includes specialized tokens for:
- Card variants (default, sidebar, popover)
- Primary, secondary, muted, accent, and destructive color schemes
- Chart colors for data visualization
- Shadow and elevation utilities

## External Dependencies

### AI & Machine Learning Services

**Google Gemini API** (`@google/genai`)
- Model: gemini-2.5-flash
- Primary use: Natural language understanding for job descriptions, urgency detection, and complexity analysis
- Handles bilingual input (French/Arabic)

**OpenAI API** (`openai`)
- Model: GPT-5 (released August 7, 2025)
- Primary use: Intent extraction, structured data generation, and cost estimation
- Provides JSON-formatted outputs for job analysis

### Database & Storage

**Neon Serverless PostgreSQL** (`@neondatabase/serverless`)
- Serverless PostgreSQL database
- Managed via `DATABASE_URL` environment variable
- Drizzle ORM configuration in `drizzle.config.ts`

**Drizzle ORM** (`drizzle-orm`, `drizzle-zod`)
- Type-safe database queries
- Schema-to-Zod validation generation
- Migration management via `drizzle-kit`

### UI Component Libraries

**Radix UI** (multiple packages)
- Headless, accessible UI primitives
- Components used: Dialog, Dropdown Menu, Select, Accordion, Avatar, Badge, Checkbox, Popover, Progress, Radio Group, Scroll Area, Slider, Switch, Tabs, Toast, Tooltip

**shadcn/ui**
- Pre-configured Radix UI components with Tailwind styling
- Configuration in `components.json` with "new-york" style variant

### Build & Development Tools

**Vite**
- Frontend build tool and dev server
- Custom configuration with Replit-specific plugins for development
- Production builds output to `dist/public`

**TypeScript**
- Strict mode enabled
- Path aliases configured (@/, @shared/, @assets/)
- ESNext module resolution with bundler mode

### Supporting Libraries

- **TanStack Query** - Server state management and caching
- **Wouter** - Lightweight client-side routing
- **React Hook Form** + **Zod** - Form validation
- **Tailwind CSS** + **PostCSS** - Styling
- **date-fns** - Date manipulation
- **class-variance-authority** - Component variant management
- **cmdk** - Command palette component

### Environment Requirements

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `OPENAI_API_KEY` - OpenAI API authentication
- `GEMINI_API_KEY` - Google Gemini API authentication
- `NODE_ENV` - Environment indicator (development/production)
- `SESSION_SECRET` - Express session secret for cookie signing

## Recent Changes (November 2025)

### Authentication System Updates
- **bcrypt password hashing**: Replaced insecure Base64 encoding with bcrypt (10 rounds) for secure password storage
- **Middleware ordering fix**: User-loading middleware now runs before route handlers to ensure req.user is available
- **Dual registration flows**: Separate `/signup/client` and `/signup/technician` pages with role-specific forms
- **Extended signup payload**: Technician registration now captures services, yearsExperience, hourlyRate, and bio

### Schema Refactoring
- **Technician-User linking**: Technicians table now uses mandatory `userId` field (unique, not null) to link to users table
- **Profile data consolidation**: Personal details (name, phone, city) stored only in users table; professional metadata (services, bio, rates) in technicians table
- **TechnicianWithUser type**: Merged type for frontend display combining technician + user fields

### Key Files
- `server/auth.ts` - Passport.js local strategy with bcrypt, session handling
- `server/storage.ts` - MemStorage with paired user+technician seeding
- `shared/schema.ts` - Drizzle schemas with insert/select types
- `client/src/lib/auth.tsx` - Auth context with signupClient, signupTechnician methods

### DarijaChat Support Widget (November 2025)
- **Component**: `client/src/components/chat/DarijaChat.tsx` - Floating chat widget
- **Features**: Minimizable/expandable, trilingual support (Darija/French/Arabic)
- **AI Backend**: Uses OpenAI GPT-5 or Gemini 2.5 Flash with Darija prompts
- **Fallback**: Pre-defined Darija responses when AI unavailable

### Client Dashboard (November 2025)
- **Component**: `client/src/pages/ClientDashboard.tsx`
- **Stats Cards**: Active jobs, completed jobs, total spent, average rating given
- **Tabs**: Overview (recent jobs + help), Active jobs, History
- **API**: `/api/client/stats`, `/api/client/jobs`

### Terminology Update (November 2025)
- Changed all references from "artisans" to "techniciens" in UI and translations
- Removed "47 modèles IA" marketing references from Hero and Footer
- Updated Hero badge to "Matching intelligent des techniciens"

### Design System Colors
- **Primary (Royal Blue)**: #1e40af / hsl(223, 71%, 40%)
- **Accent (Sunset Orange)**: #ea580c / hsl(21, 90%, 48%)

### Technician Directory & Booking System (November 2025)
- **TechnicianDirectory**: `/technicians` page with grid layout, search, service/city filters
- **TechnicianProfile**: `/technician/:id` page with 2-column layout (30% sidebar, 70% content)
- **TechnicianCard**: Vertical card layout with top-half image, PRO (green) and Promo (red) badges
- **BookingModal**: Enhanced with "Améliorer avec IA" button for AI description enhancement
- **API Updates**: 
  - `/api/technicians` and `/api/technicians/:id` now return `TechnicianWithUser` objects
  - `/api/bookings` supports direct bookings (auto-creates job when `jobId="direct"`)
- **Key Files**:
  - `client/src/pages/TechnicianDirectory.tsx` - Directory page
  - `client/src/pages/TechnicianProfile.tsx` - Profile page
  - `client/src/components/technician/TechnicianCard.tsx` - Card component
  - `client/src/components/booking/BookingModal.tsx` - Booking modal

### Recommended Next Steps
1. Add Zod validation for signup payload (numeric ranges, phone formatting)
2. Backfill hashed passwords for seeded test accounts
3. Build remaining screens (technician dashboard improvements, admin screens)
4. Implement remaining REST API endpoints per specification