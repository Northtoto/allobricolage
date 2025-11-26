# AlloBricolage Design Guidelines

## Design Approach
**Reference-Based Hybrid**: Drawing from Airbnb's marketplace trust signals + Uber's real-time matching UI + Material Design's data-dense patterns. This is a utility-first platform where clarity and trust drive conversions.

## Typography System
- **Primary Font**: Inter (Google Fonts) - exceptional readability for bilingual content
- **Secondary Font**: Cairo (Google Fonts) - optimized for Arabic RTL support
- **Hierarchy**:
  - Hero/H1: text-4xl to text-5xl, font-bold
  - Section Headers/H2: text-3xl, font-semibold  
  - Card Titles/H3: text-xl, font-semibold
  - Body Text: text-base, font-normal
  - Captions/Meta: text-sm, font-medium
  - Small Print: text-xs

## Layout System
**Spacing Primitives**: Use Tailwind units of 3, 4, 6, 8, 12, 16, 20 for consistency
- Section padding: py-16 md:py-20
- Card padding: p-6 md:p-8
- Element spacing: gap-4, gap-6, gap-8
- Container: max-w-7xl mx-auto px-4

## Core Components

### Navigation
- Sticky top navigation with dual-language toggle (AR/FR)
- Split layout: Logo left, "Post Job" + "Find Technicians" CTAs right
- Mobile: Hamburger menu with clear role selection (Client vs Technician)

### Hero Section (Home)
- **Full-width hero with overlay image**: Moroccan handymen at work (authentic, diverse)
- Centered search bar (prominent): "Describe your job in your own words..."
- Trust indicators below search: "47 AI Models • 500K+ Jobs Completed • 2-minute Matching"
- Hero height: min-h-[60vh]

### Job Posting Interface
- **Conversational card-based flow**: Large text area for natural language input
- Real-time AI feedback panel: Shows extracted details (service type, urgency, location) as user types
- Progressive disclosure: Basic → Details → Photos → Confirm
- Estimated cost range displayed prominently with confidence indicator

### Technician Matching Results
- **Card grid layout**: 2-3 columns on desktop, 1 on mobile
- Each card contains:
  - Profile photo (rounded-lg, border accent)
  - Name, rating stars, review count
  - Match score badge (top-right): "92% Match"
  - Key stats row: Distance • Response time • Jobs completed
  - AI explanation box (light background): "Why this match" with bullet points
  - Price estimate range
  - Availability status (green dot + "Available now" or next available time)
  - Primary CTA: "Book Ahmed" button

### Pricing Display
- **Transparent breakdown card**: 
  - Base rate + itemized premiums (urgency, timing, distance)
  - Confidence interval visualization (horizontal bar chart)
  - Comparison: "15% below market average" indicator
  - "Why this price?" expandable section

### Booking Flow
- **Stepper progress indicator** (top): Select Technician → Schedule → Confirm → Payment
- Side-by-side layout: Booking details (left 2/3) + Summary card (right 1/3, sticky)
- Upsell suggestions: Subtle card carousel "While they're there..."

### Technician Profiles
- **Split-screen layout**: 
  - Left: Photo, stats, badges, availability calendar
  - Right: Reviews (sortable), completed jobs gallery, skills tags
- Trust signals prominent: Verification badges, insurance status, years of experience

### Dashboard (Technicians)
- **Data-dense layout**: Metrics cards row (earnings, jobs, rating trend)
- Incoming job offers: List view with quick accept/decline actions
- Map view: Nearby job opportunities visualization

## Visual Elements

### Trust & Transparency Indicators
- Verification badges: Shield icons with checkmarks
- AI confidence scores: Circular progress indicators (0-100%)
- Match explanations: Light background info boxes with icons
- Real-time status: Pulsing green dots for "active now"

### Images Strategy
- **Hero**: Large background image (Moroccan marketplace/handymen working) with dark overlay (opacity-60)
- **Technician photos**: Required, circular or rounded-lg depending on context
- **Job galleries**: Grid layouts showing before/after when available
- **Empty states**: Illustrated SVGs (friendly, approachable)

### Interactive Elements
- **Search bars**: Generous height (h-14), rounded-xl, prominent shadow on focus
- **CTA buttons**: 
  - Primary: Large (px-8 py-4), rounded-lg, font-semibold
  - Secondary: Outlined variant, same size
  - Buttons on images: Backdrop blur (backdrop-blur-md), semi-transparent background
- **Cards**: Hover lift effect (transition-transform), subtle shadow increase
- **Filter chips**: Pill-shaped, toggleable, with counts

## Bilingual Considerations
- RTL/LTR layout switching for Arabic/French
- Consistent spacing regardless of text direction
- Icons that work bidirectionally
- Flag icons for language toggle (Morocco flag + France flag)

## Mobile Optimization
- Bottom navigation bar for key actions (Post Job, Browse, Messages, Profile)
- Swipeable cards for technician browsing
- Sticky booking button on profile pages
- Condensed metrics display (icons > text)

## AI-Specific UI Patterns
- **Loading states**: Animated "AI is matching..." with progress messages
- **Confidence visualization**: Percentage badges with color coding (>90% green, 70-90% yellow, <70% orange)
- **Explanation panels**: Collapsible sections with "How we calculated this" headers
- **Learning indicators**: "We're learning from this booking" subtle footer text

## Data Density Balance
Dense information architecture without overwhelming:
- Use tabs for complex profile sections
- Expandable cards for detailed breakdowns
- Icon + number combinations for quick scanning
- Generous whitespace between major sections (mb-12 to mb-20)

**Deliverable**: A trust-forward, AI-transparent marketplace that feels modern yet approachable, optimized for Morocco's bilingual market with mobile-first interactions and desktop-rich data displays.