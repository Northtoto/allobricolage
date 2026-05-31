import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { SpotlightCard } from "@/components/effects/SpotlightCard";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import {
  Droplets,
  Zap,
  Paintbrush,
  Hammer,
  Wind,
  Building,
  Grid3X3,
  Key,
  TreePine,
  Sparkles,
  Wrench,
  Shield,
  TrendingUp
} from "lucide-react";

/**
 * 2026 Design: Bento Box Grid Layout
 * Asymmetric, visually weighted grid inspired by Apple's promotional layouts.
 * Features spotlight hover effects, gradient borders, and animated icons.
 */
const services = [
  { id: "plomberie", icon: Droplets, color: "#3b82f6", bg: "bg-blue-500", popular: true },
  { id: "electricite", icon: Zap, color: "#eab308", bg: "bg-yellow-500", popular: true },
  { id: "peinture", icon: Paintbrush, color: "#a855f7", bg: "bg-purple-500" },
  { id: "menuiserie", icon: Hammer, color: "#d97706", bg: "bg-amber-600" },
  { id: "climatisation", icon: Wind, color: "#06b6d4", bg: "bg-cyan-500" },
  { id: "reparation_appareils", icon: Wrench, color: "#f97316", bg: "bg-orange-500" },
  { id: "carrelage", icon: Grid3X3, color: "#14b8a6", bg: "bg-teal-500" },
  { id: "portes_serrures", icon: Key, color: "#64748b", bg: "bg-slate-500" },
  { id: "metallerie", icon: Shield, color: "#22c55e", bg: "bg-green-500" },
  { id: "etancheite", icon: TrendingUp, color: "#ec4899", bg: "bg-pink-500" },
];

export function ServicesGrid() {
  const { t } = useI18n();
  const { ref: sectionRef, isVisible } = useScrollReveal<HTMLElement>();

  return (
    <section ref={sectionRef} className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div
          className={`text-center mb-14 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <Badge variant="outline" className="mb-4 text-accent border-accent/30 px-4 py-1">
            14 services couverts
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Tous vos besoins en <span className="gradient-text">bricolage</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Nos algorithmes IA analysent votre demande et vous connectent avec les artisans
            spécialisés dans chaque domaine.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {services.map((service, index) => {
            const Icon = service.icon;
            const delay = index * 0.06;

            return (
              <Link
                key={service.id}
                href={`/post-job?service=${service.id}`}
              >
                <SpotlightCard
                  className={`rounded-2xl cursor-pointer transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                  style={{ transitionDelay: `${delay}s` } as React.CSSProperties}
                  glowColor={`${service.color}20`}
                >
                  <Card className="relative p-5 md:p-6 border border-border/50 bg-card/80 backdrop-blur-sm hover:border-[${service.color}]/30 hover:shadow-lg hover:shadow-[${service.color}]/10 transition-all duration-300 h-full">
                    {/* Popular badge */}
                    {service.popular && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary/90 text-white text-[10px] px-1.5 py-0">
                          Populaire
                        </Badge>
                      </div>
                    )}

                    {/* Icon with animated background */}
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-opacity-10 mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                      style={{ backgroundColor: `${service.color}20`, color: service.color }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3 className="font-semibold text-sm md:text-base mb-1">
                      {t(`services.${service.id}`) || service.id}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Trouvez un expert
                    </p>

                    {/* Subtle gradient line at bottom */}
                    <div
                      className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ backgroundColor: service.color }}
                    />
                  </Card>
                </SpotlightCard>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
