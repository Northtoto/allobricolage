import { Card } from "@/components/ui/card";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { MessageSquare, Cpu, Users, Calendar, ChevronRight } from "lucide-react";
import { SpotlightCard } from "@/components/effects/SpotlightCard";

/**
 * 2026 Design: Staggered Process Flow
 * - Connected step indicators with animated lines
 * - Cards with spotlight hover effect
 * - Number badges with gradient backgrounds
 * - Scroll-triggered entrance animations
 */
const steps = [
  {
    icon: MessageSquare,
    title: "Décrivez votre besoin",
    description: "Expliquez votre problème en quelques mots, en français ou en darija. Notre IA comprend tout automatiquement.",
    color: "#3b82f6",
    accent: "bg-blue-500",
  },
  {
    icon: Cpu,
    title: "L'IA analyse en temps réel",
    description: "47 modèles IA analysent votre demande pour identifier le service exact, l'urgence et la complexité.",
    color: "#f97316",
    accent: "bg-orange-500",
  },
  {
    icon: Users,
    title: "Matching intelligent",
    description: "Nous trouvons les artisans parfaits basés sur leurs compétences, proximité géographique et disponibilité.",
    color: "#22c55e",
    accent: "bg-green-500",
  },
  {
    icon: Calendar,
    title: "Réservez instantanément",
    description: "Choisissez votre artisan, confirmez le créneau et recevez une estimation de prix précise et transparente.",
    color: "#a855f7",
    accent: "bg-purple-500",
  },
];

export function HowItWorks() {
  const { ref: sectionRef, isVisible } = useScrollReveal<HTMLElement>();

  return (
    <section ref={sectionRef} className="py-20 md:py-28 relative overflow-hidden">
      {/* Decorative background shape */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Section Header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Comment ça <span className="gradient-text">marche</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            De la description de votre problème à la réservation confirmée, notre plateforme IA gère tout en moins de 2 minutes.
          </p>
        </div>

        {/* Steps Grid with connecting line (desktop) */}
        <div className="relative">
          {/* Horizontal connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-[2px]">
            <div className="h-full bg-gradient-to-r from-blue-500/30 via-orange-500/30 via-green-500/30 to-purple-500/30 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const delay = index * 0.12;

              return (
                <div
                  key={index}
                  className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                  style={{ transitionDelay: `${delay}s` } as React.CSSProperties}
                >
                  <SpotlightCard
                    className="h-full"
                    glowColor={`${step.color}15`}
                  >
                    <Card className="relative p-6 h-full border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group">
                      {/* Step Number Badge */}
                      <div className={`absolute -top-4 left-6 w-9 h-9 rounded-xl ${step.accent} flex items-center justify-center text-sm font-bold text-white shadow-lg`}>
                        {index + 1}
                      </div>

                      {/* Icon */}
                      <div
                        className="mt-4 inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${step.color}15`, color: step.color }}
                      >
                        <Icon className="h-7 w-7" />
                      </div>

                      <h3 className="font-bold text-lg mb-3">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {step.description}
                      </p>

                      {/* Learn more link */}
                      <div className="flex items-center gap-1 text-sm font-medium" style={{ color: step.color }}>
                        <span>En savoir plus</span>
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>

                      {/* Animated bottom border */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ backgroundColor: step.color }}
                      />
                    </Card>
                  </SpotlightCard>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
