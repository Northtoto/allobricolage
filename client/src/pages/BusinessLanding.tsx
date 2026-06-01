import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Clock,
  ShieldCheck,
  FileText,
  Repeat,
  CheckCircle2,
  ArrowRight,
  Coffee,
  UtensilsCrossed,
  Hotel,
} from "lucide-react";

/**
 * B2B landing & pricing page — AlloBricolage Pro.
 * Targets cafés, restaurants, hotels, syndics & companies with SLA-backed
 * recurring maintenance retainers. Mirrors the server catalog in
 * server/routes/business.routes.ts (RETAINER_PLANS). See docs/GO_TO_MARKET.md.
 */

interface Plan {
  tier: string;
  name: string;
  price: string;
  priceNote: string;
  sla: string;
  highlight?: boolean;
  features: string[];
}

const PLANS: Plan[] = [
  {
    tier: "essentiel",
    name: "Essentiel",
    price: "800 DH",
    priceNote: "/ mois",
    sla: "Sous 24h",
    features: [
      "1 établissement",
      "Intervention prioritaire sous 24h",
      "1 visite préventive / mois",
      "Techniciens vérifiés",
      "Facture TVA",
      "Protection litiges",
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    price: "2 500 DH",
    priceNote: "/ mois",
    sla: "Sous 4h garanties",
    highlight: true,
    features: [
      "Jusqu'à 5 établissements",
      "Intervention garantie sous 4h",
      "2 visites préventives / mois",
      "Gestionnaire de compte dédié",
      "Tableau de bord multi-sites",
      "Facture TVA + reporting",
      "Protection litiges prioritaire",
    ],
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    price: "Sur devis",
    priceNote: "",
    sla: "Sous 2h + astreinte 24/7",
    features: [
      "Établissements illimités",
      "Intervention garantie sous 2h",
      "Visites préventives hebdomadaires",
      "Gestionnaire dédié + astreinte 24/7",
      "Reporting personnalisé & SLA contractuel",
    ],
  },
];

const VALUE_PROPS = [
  {
    icon: Clock,
    title: "Zéro temps d'arrêt",
    text: "Une panne = du chiffre d'affaires perdu chaque heure. Un technicien vérifié intervient dans le délai garanti par votre contrat.",
  },
  {
    icon: ShieldCheck,
    title: "Techniciens vérifiés & notés",
    text: "Tous nos artisans sont vérifiés (identité, qualifications) et notés par de vrais clients. Fini l'informel.",
  },
  {
    icon: Repeat,
    title: "Maintenance préventive",
    text: "Des visites planifiées qui évitent les pannes avant qu'elles ne coûtent cher. Vos équipements durent plus longtemps.",
  },
  {
    icon: FileText,
    title: "Facturation propre (TVA)",
    text: "Une facture TVA conforme pour chaque intervention, un tableau de bord multi-sites, et un suivi complet pour votre comptabilité.",
  },
];

const SEGMENTS = [
  { icon: Coffee, label: "Cafés" },
  { icon: UtensilsCrossed, label: "Restaurants" },
  { icon: Hotel, label: "Hôtels" },
  { icon: Building2, label: "Entreprises & Syndics" },
];

export default function BusinessLanding() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Building2 className="h-4 w-4" />
              AlloBricolage Pro — pour les professionnels
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              La maintenance de votre commerce,{" "}
              <span className="gradient-text-animated">sans stress</span>.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Un technicien vérifié, dans le délai garanti, facturé proprement.
              Des contrats de maintenance pensés pour les cafés, restaurants,
              hôtels et entreprises au Maroc.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#plans">
                <Button size="lg" className="rounded-full px-8 bg-gradient-to-r from-primary to-accent">
                  Voir les formules
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </a>
              <a href="#contact">
                <Button size="lg" variant="outline" className="rounded-full px-8">
                  Parler à un conseiller
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-6 mt-10">
              {SEGMENTS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pourquoi les pros choisissent AlloBricolage
          </h2>
          <p className="text-muted-foreground">
            Un réseau dense de techniciens fidélisés grâce aux contrats récurrents :
            un professionnel est toujours disponible près de chez vous.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUE_PROPS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="p-6 rounded-2xl border border-border/40 bg-card hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent mb-4">
                <Icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="plans" className="border-y border-border/20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Des formules de maintenance claires
            </h2>
            <p className="text-muted-foreground">
              Sans surprise. Résiliable. Intervention garantie selon votre SLA.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                className={`relative p-8 rounded-3xl border bg-card flex flex-col ${
                  plan.highlight
                    ? "border-primary shadow-2xl shadow-primary/20 md:scale-105"
                    : "border-border/40"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold">
                    Le plus choisi
                  </span>
                )}
                <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground mb-1">{plan.priceNote}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-primary font-medium mb-6">
                  <Clock className="h-4 w-4" />
                  {plan.sla}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a href="#contact">
                  <Button
                    className={`w-full rounded-full ${
                      plan.highlight ? "bg-gradient-to-r from-primary to-accent" : ""
                    }`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.tier === "enterprise" ? "Demander un devis" : "Démarrer"}
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section id="contact" className="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Prêt à sécuriser votre maintenance ?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Parlez à un conseiller pour choisir la formule adaptée à vos établissements,
          ou créez votre compte entreprise dès maintenant.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/signup/client">
            <Button size="lg" className="rounded-full px-8 bg-gradient-to-r from-primary to-accent">
              <Building2 className="h-4 w-4 mr-2" />
              Créer mon compte entreprise
            </Button>
          </Link>
          <a href="https://wa.me/212600000000" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="rounded-full px-8">
              Contacter sur WhatsApp
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
