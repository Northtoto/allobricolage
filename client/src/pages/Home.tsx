import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ParticleSystem } from "@/components/effects/ParticleSystem";
import { FloatingTools3D } from "@/components/effects/FloatingTools3D";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock,
  Paintbrush,
  Wind,
  Hammer,
  Star,
  Wrench,
  Zap,
  Home as HomeIcon,
  Key,
  Grid3x3,
  Droplets,
  Lightbulb,
  Building2,
  Settings,
  CheckCircle2,
  TrendingUp,
  Award,
  Flame,
} from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { JobImageAnalyzer } from "@/components/ai/JobImageAnalyzer";
import { B2BVideoSection } from "@/components/home/B2BVideoSection";

// ALL 14 SERVICE CATEGORIES - COMPLETE LIST
const serviceCategories = [
  {
    title: "Plomberie",
    description: "Installation, réparation et maintenance de systèmes de plomberie. Fuites, débouchage, sanitaires.",
    icon: Wrench,
    image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Électricité",
    description: "Installations électriques, mise aux normes, dépannage et maintenance. Experts certifiés.",
    icon: Zap,
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80",
    color: "from-yellow-500 to-orange-500",
  },
  {
    title: "Peinture",
    description: "Peinture murale, décoration intérieure, enduit et finitions décoratives professionnelles.",
    icon: Paintbrush,
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80",
    color: "from-pink-500 to-rose-500",
  },
  {
    title: "Menuiserie",
    description: "Travaux de menuiserie bois, portes, fenêtres, placards sur mesure et aménagements.",
    icon: Hammer,
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80",
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "Climatisation",
    description: "Installation, maintenance et réparation de systèmes de climatisation et ventilation.",
    icon: Wind,
    image: "https://images.unsplash.com/photo-1631545806609-c2f4f1c6b2c3?auto=format&fit=crop&w=600&q=80",
    color: "from-sky-500 to-blue-500",
  },
  {
    title: "Réparation d'appareils",
    description: "Diagnostic et réparation d'électroménager, chauffe-eau et appareils domestiques.",
    icon: Settings,
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=600&q=80",
    color: "from-purple-500 to-indigo-500",
  },
  {
    title: "Petites rénovations",
    description: "Rénovation intérieure, rafraîchissement et amélioration de vos espaces professionnels.",
    icon: HomeIcon,
    image: "https://images.unsplash.com/photo-1503387762-d7580373b476?auto=format&fit=crop&w=600&q=80",
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Portes/Serrures",
    description: "Installation et réparation de portes, serrurerie, dépannage d'urgence 24/7.",
    icon: Key,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
    color: "from-slate-500 to-gray-600",
  },
  {
    title: "Métallerie",
    description: "Travaux de métallerie, portails, grilles, garde-corps et structures métalliques.",
    icon: Hammer,
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80",
    color: "from-zinc-500 to-slate-600",
  },
  {
    title: "Carrelage",
    description: "Pose de carrelage sol et mural, faïence, mosaïque et revêtements décoratifs.",
    icon: Grid3x3,
    image: "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=600&q=80",
    color: "from-orange-500 to-red-500",
  },
  {
    title: "Étanchéité",
    description: "Travaux d'étanchéité toiture, terrasse, salle de bain. Protection contre l'humidité.",
    icon: Droplets,
    image: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?auto=format&fit=crop&w=600&q=80",
    color: "from-blue-600 to-indigo-600",
  },
  {
    title: "Installation Luminaires",
    description: "Installation de luminaires, spots LED, éclairage décoratif et domotique.",
    icon: Lightbulb,
    image: "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&w=600&q=80",
    color: "from-yellow-400 to-amber-500",
  },
  {
    title: "Travaux Construction",
    description: "Maçonnerie, construction, extension et gros œuvre pour vos projets d'envergure.",
    icon: Building2,
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
    color: "from-stone-500 to-neutral-600",
  },
  {
    title: "Services Généraux",
    description: "Maintenance générale, petits travaux et services polyvalents pour votre établissement.",
    icon: Wrench,
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
    color: "from-teal-500 to-cyan-600",
  },
];

const testimonials = [
  {
    name: "Sofia Benali",
    company: "Concept Café - Rabat",
    quote: "AlloBricolage nous a trouvé un plombier en moins de 10 minutes pour sauver le service du midi. Respect des normes, communication impeccable.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=60",
    rating: 5,
  },
  {
    name: "Hassan Idrissi",
    company: "Riad Atlas - Marrakech",
    quote: "La combinaison IA + artisans locaux change tout. Electriciens qualifiés, suivi en Darija et reporting digital pour mes équipes.",
    avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=60",
    rating: 5,
  },
  {
    name: "Nadia El Amrani",
    company: "Studios Zellige",
    quote: "Le design du site et les cartes services donnent confiance à nos clients internationaux. Bravo pour l'expérience mobile!",
    avatar: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=60",
    rating: 5,
  },
];

import { MoroccoMap } from "@/components/home/MoroccoMap";
import { ServiceCard } from "@/components/design/ServiceCard";
import { Search, MapPin } from "lucide-react";
import { FastBookingFlow } from "@/components/booking/FastBookingFlow";
import { useState } from "react";

// HERO SECTION - Map-First Design (Uber Style)
function HeroSection() {
  const [, setLocation] = useLocation();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("Plomberie");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);

  const handleStartBooking = (service: string, isSearch: boolean = false) => {
    setSelectedService(service);
    setIsSearchMode(isSearch);
    setBookingOpen(true);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      handleStartBooking(searchQuery, true);
    }
  };

  return (
    <section className="relative h-[90vh] w-full overflow-hidden">
      {/* 1. Fullscreen Morocco Map with Real Cities */}
      <MoroccoMap />

      {/* 2. 3D Floating Tools - Compact version overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-[200px] pointer-events-none z-[5] opacity-60 hover:opacity-100 transition-opacity duration-500">
        <FloatingTools3D compact />
      </div>

      {/* 2. Floating UI Overlay */}
      <div className="relative z-10 h-full flex flex-col justify-between pt-24 pb-10 px-4 max-w-7xl mx-auto pointer-events-none">

        {/* Top: Search Bar */}
        <motion.div
          className="pointer-events-auto w-full max-w-2xl mx-auto"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-2 flex items-center gap-4 border border-slate-100">
            <div className="pl-4 text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quel service recherchez-vous ? (ex: Plombier)"
              className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-slate-800 placeholder:text-slate-400 h-12"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              className="rounded-xl px-6 h-12 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30"
              onClick={handleSearch}
            >
              Trouver
            </Button>
          </div>
        </motion.div>

        {/* Center: "Get Help Now" Pulse (Mobile mostly) */}
        <div className="flex-1 flex items-center justify-center pointer-events-none">
          {/* Space for map interaction if needed */}
        </div>

        {/* Bottom: Service Categories (Horizontal Scroll) */}
        <motion.div
          className="pointer-events-auto space-y-4"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between text-slate-800 mb-2 px-2">
            <h2 className="text-2xl font-bold drop-shadow-sm">Services à proximité</h2>
            <Button variant="link" className="text-primary font-semibold" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>
              Voir tout
            </Button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-8 pt-2 px-2 -mx-4 md:mx-0 scrollbar-hide snap-x">
            {serviceCategories.slice(0, 5).map((category, index) => (
              <div key={category.title} className="min-w-[280px] snap-center">
                <ServiceCard
                  title={category.title}
                  icon={category.icon}
                  price="Dès 150 Dhs"
                  rating={4.9}
                  eta="15 min"
                  color={category.color}
                  onClick={() => handleStartBooking(category.title, false)}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Fast Booking Flow Modal */}
      <FastBookingFlow
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        serviceType={selectedService}
        isSearch={isSearchMode}
      />
    </section>
  );
}

// SERVICES SECTION - ALL 14 Categories
function ServicesSection() {
  return (
    <section id="services" className="py-32 relative bg-gradient-to-b from-background to-card/30">
      <div className="max-w-7xl mx-auto px-4 space-y-20">
        {/* Section Header */}
        <ScrollReveal direction="up" className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.span
            className="inline-block px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold uppercase tracking-wider"
            whileHover={{ scale: 1.05 }}
          >
            Nos Services
          </motion.span>
          <h2 className="text-5xl md:text-6xl font-bold leading-tight">
            Des services pensés pour les{" "}
            <span className="gradient-text-animated">professionnels</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            14 catégories de services avec des artisans qualifiés et vérifiés pour tous vos besoins
          </p>
        </ScrollReveal>

        {/* Services Grid - ALL 14 Services */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {serviceCategories.map((category, index) => (
            <ScrollReveal key={category.title} delay={index * 0.05} direction="up">
              <MagneticButton strength={0.15}>
                <motion.article
                  className="group relative rounded-3xl overflow-hidden cursor-pointer h-full flex flex-col"
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <motion.img
                      src={category.image}
                      alt={category.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Icon Badge */}
                    <motion.div
                      className="absolute top-3 right-3 p-3 rounded-2xl glass-enhanced"
                      whileHover={{ scale: 1.15, rotate: 12 }}
                    >
                      <category.icon className="h-6 w-6 text-white" />
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="relative p-6 space-y-3 bg-card/95 backdrop-blur-sm flex-1 flex flex-col">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {category.description}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-primary font-semibold pt-2">
                      Voir les artisans
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </motion.div>
                    </div>
                  </div>
                </motion.article>
              </MagneticButton>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// WHY CHOOSE US SECTION
function WhyChooseUsSection() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-background to-card/30" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <ScrollReveal direction="left">
            <div className="space-y-8">
              <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold uppercase tracking-wider">
                Notre Différence
              </span>

              <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                Expérience{" "}
                <span className="gradient-text-animated">premium</span>
                {" "}inspirée des meilleurs
              </h2>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Interface fluide, artisanat marocain et technologie de pointe pour une expérience utilisateur exceptionnelle.
              </p>

              <div className="space-y-6 pt-4">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Techniciens vérifiés & assurés",
                    desc: "Contrôles qualité rigoureux, badges de confiance et historique transparent."
                  },
                  {
                    icon: Clock,
                    title: "Réservation instantanée",
                    desc: "Formulaires simplifiés et processus optimisé pour gagner du temps."
                  },
                  {
                    icon: TrendingUp,
                    title: "IA locale performante",
                    desc: "Matching intelligent entre vos besoins et les meilleurs artisans disponibles."
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    className="flex gap-5 items-start group cursor-pointer p-4 rounded-2xl hover:bg-card/50 transition-colors"
                    whileHover={{ x: 10 }}
                  >
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-bold text-xl group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.desc}
                      </p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Visual */}
          <ScrollReveal direction="right">
            <div className="relative">
              <div className="glass-enhanced p-10 rounded-3xl space-y-8 shadow-2xl">
                <h3 className="text-3xl font-bold">Ce que vous obtenez</h3>

                <ul className="space-y-5">
                  {[
                    "UI responsive optimisée mobile-first",
                    "Animations 3D et effets visuels modernes",
                    "Sections modulaires et personnalisables",
                    "Accessibilité et performance optimales",
                    "Support multilingue (FR/AR)",
                    "Intégration IA pour matching intelligent",
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      className="flex items-center gap-4 text-base group hover:translate-x-2 transition-transform"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="p-1.5 rounded-full bg-green-500/20">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                      <span className="group-hover:text-primary transition-colors">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Decorative Element */}
              <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-gradient-to-br from-accent to-primary rounded-3xl blur-3xl opacity-40" />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// TESTIMONIALS SECTION
function TestimonialsSection() {
  return (
    <section className="py-32 relative overflow-hidden bg-gradient-to-b from-background to-card/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,64,175,0.05)_0%,transparent_100%)]" />

      <div className="max-w-7xl mx-auto px-4 space-y-16 relative z-10">
        <ScrollReveal direction="up" className="text-center space-y-6">
          <span className="inline-block px-5 py-2 rounded-full bg-yellow-500/10 text-yellow-600 text-sm font-semibold uppercase tracking-wider">
            Témoignages
          </span>
          <h2 className="text-5xl md:text-6xl font-bold">
            Ils adorent <span className="gradient-text-animated">AlloBricolage</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Des centaines de professionnels nous font confiance chaque jour
          </p>
        </ScrollReveal>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((review, index) => (
            <ScrollReveal key={review.name} delay={index * 0.15} direction="up">
              <motion.article
                className="glass-enhanced p-8 rounded-3xl flex flex-col gap-6 h-full group cursor-pointer"
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-1">
                  {[...Array(review.rating)].map((_, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + idx * 0.05 }}
                      viewport={{ once: true }}
                    >
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </motion.div>
                  ))}
                </div>

                <p className="text-base leading-relaxed flex-1 italic">
                  "{review.quote}"
                </p>

                <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                  <div className="relative">
                    <motion.img
                      src={review.avatar}
                      alt={review.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20"
                      whileHover={{ scale: 1.1 }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{review.name}</p>
                    <p className="text-sm text-muted-foreground">{review.company}</p>
                  </div>
                </div>
              </motion.article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA SECTION
function CTASection() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 hero-bg-animated opacity-10" />

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <ScrollReveal direction="scale">
          <div className="glass-enhanced p-12 md:p-20 rounded-3xl text-center space-y-10 shadow-2xl">
            <motion.span
              className="inline-block px-5 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 text-primary text-sm font-semibold uppercase tracking-wider"
              whileHover={{ scale: 1.05 }}
            >
              Prêt à commencer?
            </motion.span>

            <h2 className="text-5xl md:text-7xl font-bold leading-tight">
              Modernisez vos interventions{" "}
              <span className="gradient-text-animated block mt-3">dès aujourd'hui</span>
            </h2>

            <p className="text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Design premium, efficacité terrain et artisans d'excellence.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6">
              <MagneticButton strength={0.2}>
                <Button
                  size="lg"
                  className="rounded-full px-12 py-7 text-xl shadow-2xl shadow-primary/50 hover:shadow-primary/70 hover:scale-110 transition-all bg-gradient-to-r from-primary to-accent"
                  onClick={() => setLocation("/post-job")}
                >
                  <Flame className="h-6 w-6 mr-2" />
                  Lancer une demande
                  <ArrowRight className="h-6 w-6 ml-2" />
                </Button>
              </MagneticButton>

              <MagneticButton strength={0.15}>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-12 py-7 text-xl border-2 hover:scale-110 transition-all backdrop-blur-sm"
                  onClick={() => setLocation("/signup/technician")}
                >
                  Rejoindre le réseau
                </Button>
              </MagneticButton>
            </div>

            <div className="flex flex-wrap justify-center gap-10 pt-10">
              {[
                { icon: ShieldCheck, text: "100% Sécurisé" },
                { icon: Clock, text: "Support 24/7" },
                { icon: Award, text: "Certifié" },
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  className="flex items-center gap-3 text-base"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  viewport={{ once: true }}
                >
                  <item.icon className="h-6 w-6 text-primary" />
                  <span className="font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// MAIN HOME COMPONENT
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--page-bg)" }}>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <JobImageAnalyzer />
        <ServicesSection />
        <WhyChooseUsSection />
        <TestimonialsSection />
        <B2BVideoSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
