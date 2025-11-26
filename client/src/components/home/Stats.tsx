import { Cpu, Users, Star, Clock } from "lucide-react";

const stats = [
  {
    icon: Cpu,
    value: "47",
    label: "Modèles IA",
    description: "Travaillent ensemble",
  },
  {
    icon: Users,
    value: "10K+",
    label: "Artisans",
    description: "Vérifiés au Maroc",
  },
  {
    icon: Star,
    value: "4.8",
    label: "Note moyenne",
    description: "Sur 500K+ travaux",
  },
  {
    icon: Clock,
    value: "<2min",
    label: "Temps de match",
    description: "Garantie IA",
  },
];

export function Stats() {
  return (
    <section className="py-16 md:py-20 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                className="text-center"
                data-testid={`stat-${index}`}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 mb-4">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-1">{stat.value}</div>
                <div className="font-semibold mb-1">{stat.label}</div>
                <div className="text-sm opacity-80">{stat.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
