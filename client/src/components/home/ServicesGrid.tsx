import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
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
  Sparkles 
} from "lucide-react";

const services = [
  { id: "plomberie", icon: Droplets, color: "bg-blue-500/10 text-blue-500" },
  { id: "electricite", icon: Zap, color: "bg-yellow-500/10 text-yellow-500" },
  { id: "peinture", icon: Paintbrush, color: "bg-purple-500/10 text-purple-500" },
  { id: "menuiserie", icon: Hammer, color: "bg-amber-600/10 text-amber-600" },
  { id: "climatisation", icon: Wind, color: "bg-cyan-500/10 text-cyan-500" },
  { id: "maconnerie", icon: Building, color: "bg-orange-500/10 text-orange-500" },
  { id: "carrelage", icon: Grid3X3, color: "bg-teal-500/10 text-teal-500" },
  { id: "serrurerie", icon: Key, color: "bg-slate-500/10 text-slate-500" },
  { id: "jardinage", icon: TreePine, color: "bg-green-500/10 text-green-500" },
  { id: "nettoyage", icon: Sparkles, color: "bg-pink-500/10 text-pink-500" },
];

export function ServicesGrid() {
  const { t } = useI18n();

  return (
    <section className="py-16 md:py-20 bg-card/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t("services.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Nos algorithmes IA analysent votre demande et vous connectent avec les artisans spécialisés dans chaque domaine.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link 
                key={service.id} 
                href={`/post-job?service=${service.id}`}
              >
                <Card 
                  className="p-6 text-center hover-elevate cursor-pointer transition-all group"
                  data-testid={`card-service-${service.id}`}
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${service.color} mb-4 transition-transform group-hover:scale-110`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-medium text-sm">
                    {t(`services.${service.id}`)}
                  </h3>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
