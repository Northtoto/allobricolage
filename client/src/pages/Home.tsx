import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock,
  Droplet,
  PlugZap,
  Paintbrush,
  Wind,
  Hammer,
  Star,
} from "lucide-react";
import { useLocation } from "wouter";

const serviceCategories = [
  {
    title: "Plomberie premium",
    description: "Réparations express et installations sanitaires garantissant l'hygiène de vos espaces.",
    icon: Droplet,
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=60",
  },
  {
    title: "Électricité sécurisée",
    description: "Mises aux normes, tableaux connectés et maintenance préventive des réseaux.",
    icon: PlugZap,
    image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=600&q=60",
  },
  {
    title: "Finitions & peinture",
    description: "Designs contemporains, enduits décoratifs et branding mural pour commerces marocains.",
    icon: Paintbrush,
    image: "https://images.unsplash.com/photo-1503387762-d1526d02d218?auto=format&fit=crop&w=600&q=60",
  },
  {
    title: "Clim & confort",
    description: "Installation et entretien de climatisation pour riads, cafés et espaces corporate.",
    icon: Wind,
    image: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=600&q=60",
  },
];

const testimonials = [
  {
    name: "Sofia Benali",
    company: "Concept Café - Rabat",
    quote:
      "AlloBricolage nous a trouvé un plombier en moins de 10 minutes pour sauver le service du midi. Respect des normes, communication impeccable.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=60",
  },
  {
    name: "Hassan Idrissi",
    company: "Riad Atlas - Marrakech",
    quote:
      "La combinaison IA + artisans locaux change tout. Electriciens qualifiés, suivi en Darija et reporting digital pour mes équipes.",
    avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=60",
  },
  {
    name: "Nadia El Amrani",
    company: "Studios Zellige",
    quote:
      "Le design du site et les cartes services donnent confiance à nos clients internationaux. Bravo pour l'expérience mobile!",
    avatar: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=60",
  },
];

const stories = [
  {
    title: "Comment les cafés de Casablanca modernisent leur maintenance",
    tag: "Tendance locale",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=60",
  },
  {
    title: "Checklist AlloBricolage avant la haute saison à Marrakech",
    tag: "Guide pratique",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=60",
  },
];

function HeroSection() {
  const [, setLocation] = useLocation();

  return (
    <section className="section relative overflow-hidden">
      {/* Background gradient inspired by DGital template but localized with Moroccan palette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at top, rgba(30,64,175,0.35), transparent 55%)" }} />
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10 items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Innovation & Artisans 100% Maroc
          </span>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Une plateforme élégante pour connecter les meilleurs <span className="gradient-text">handyman B2B</span> du Maroc
          </h1>
          <p className="text-lg text-muted-foreground">
            AlloBricolage met en scène vos artisans favoris avec une expérience premium inspirée par les plateformes digitales de classe mondiale. Demandez,
            comparez et réservez en quelques clics.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="rounded-full px-8" onClick={() => setLocation("/post-job")}>
              Réserver un artisan
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8" onClick={() => setLocation("/signup")}>
              Devenir partenaire
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "Clients pro", value: "1 200+" },
              { label: "Techniciens vérifiés", value: "350" },
              { label: "Temps de réponse moyen", value: "12min" },
              { label: "Note moyenne", value: "4.9/5" },
            ].map((stat) => (
              <div key={stat.label} className="glass-panel p-4 text-center">
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 bg-gradient-to-br from-primary/30 via-transparent to-accent/30 blur-3xl" />
          <div className="relative glass-panel overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1503387762-d7580373b476?auto=format&fit=crop&w=1200&q=80"
              alt="Artisans marocains en plein chantier"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoriesSection() {
  return (
    <section id="services" className="section bg-card/60">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Nos expertises</p>
          <h2 className="text-3xl font-bold">Des services pensés pour les cafés, riads, bureaux et boutiques</h2>
          <p className="text-muted-foreground">
            Chaque catégorie s'inspire de l'artisanat marocain tout en adoptant les codes digitaux les plus modernes.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {serviceCategories.map((category) => (
            <article key={category.title} className="gradient-border rounded-3xl overflow-hidden grid grid-cols-1 sm:grid-cols-2">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <category.icon className="h-10 w-10 text-primary" />
                  <h3 className="text-xl font-semibold">{category.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{category.description}</p>
                <div className="flex items-center gap-2 text-sm text-primary font-semibold">
                  Voir les artisans
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <img src={category.image} alt={category.title} className="w-full h-full object-cover" loading="lazy" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExperienceSection() {
  return (
    <section id="about" className="section">
      <div className="max-w-7xl mx-auto px-4 grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Expérience utilisateur inspirée des meilleurs templates internationaux</h2>
          <p className="text-muted-foreground">
            Nous avons adapté les codes visuels des studios digitaux premium (comme DGital Innovation Template) pour raconter une histoire locale : Maroc, artisanat,
            architecture contemporaine. Résultat : une interface fluide, accessible et rassurante.
          </p>
          <div className="space-y-4">
            {[
              { icon: ShieldCheck, title: "Techniciens vérifiés & assurés", desc: "Contrôles qualité, badges de confiance et historique visible." },
              { icon: Clock, title: "Parcours de booking instantané", desc: "CTA récurrents et formulaires simplifiés pour gagner du temps." },
              { icon: Hammer, title: "Storytelling artisanal", desc: "Images immersives, typographie chaleureuse et détails marocains." },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <feature.icon className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel p-8 space-y-6">
          <h3 className="text-xl font-semibold">Ce que vous obtenez</h3>
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li>• UI responsive optimisée mobile-first.</li>
            <li>• Animations douces, ombres subtiles et gradients personnalisables.</li>
            <li>• Sections modulaires : services, témoignages, blog, CTA.</li>
            <li>• Respect des normes d’accessibilité (contraste, focus, alt text).</li>
          </ul>
          <Button className="w-full rounded-full">Voir la démo en live</Button>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="section bg-card/60">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Avis</p>
          <h2 className="text-3xl font-bold">Ils adorent la nouvelle expérience</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((review) => (
            <article key={review.name} className="glass-panel p-6 flex flex-col gap-4 h-full">
              <div className="flex items-center gap-3">
                <img src={review.avatar} alt={`Photo de ${review.name}`} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                <div>
                  <p className="font-semibold">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.company}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground flex-1">“{review.quote}”</p>
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, idx) => <Star key={idx} className="h-4 w-4 fill-amber-400" />)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StoriesSection() {
  return (
    <section id="stories" className="section">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary">Blog</p>
            <h2 className="text-3xl font-bold">Récits terrain & insights</h2>
          </div>
          <Button variant="outline" className="rounded-full">Voir tous les articles</Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {stories.map((story) => (
            <article key={story.title} className="overflow-hidden rounded-3xl border border-border/60 shadow-lg hover:shadow-xl transition-shadow">
              <img src={story.image} alt={story.title} className="w-full h-48 object-cover" loading="lazy" />
              <div className="p-6 space-y-3">
                <span className="text-xs uppercase tracking-[0.3em] text-primary">{story.tag}</span>
                <h3 className="text-xl font-semibold">{story.title}</h3>
                <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                  Lire l'article
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const [, setLocation] = useLocation();

  return (
    <section className="section py-16">
      <div className="max-w-4xl mx-auto px-4 text-center glass-panel space-y-6">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Prêt à moderniser vos interventions?</p>
        <h2 className="text-3xl font-bold">AlloBricolage associe design premium et efficacité terrain.</h2>
        <p className="text-muted-foreground">
          Chaque pixel de ce nouveau site a été pensé pour rassurer vos clients B2B et accélérer la prise de rendez-vous.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" className="rounded-full px-8" onClick={() => setLocation("/post-job")}>
            Lancer une demande
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-8" onClick={() => setLocation("/signup/technician")}>
            Rejoindre le réseau artisans
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--page-bg)" }}>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection />
        <ExperienceSection />
        <TestimonialsSection />
        <StoriesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
