import { Card } from "@/components/ui/card";
import { MessageSquare, Cpu, Users, Calendar } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Décrivez votre besoin",
    description: "Expliquez votre problème en quelques mots, en français ou en arabe. Notre IA comprend tout.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Cpu,
    title: "L'IA analyse",
    description: "47 modèles IA analysent votre demande pour identifier le service, l'urgence et la complexité.",
    color: "bg-chart-2/10 text-chart-2",
  },
  {
    icon: Users,
    title: "Matching intelligent",
    description: "Nous trouvons les artisans parfaits basés sur leurs compétences, proximité et disponibilité.",
    color: "bg-chart-3/10 text-chart-3",
  },
  {
    icon: Calendar,
    title: "Réservez instantanément",
    description: "Choisissez votre artisan, confirmez le créneau et recevez une estimation de prix précise.",
    color: "bg-chart-4/10 text-chart-4",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Comment ça marche</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            De la description de votre problème à la réservation, notre plateforme IA gère tout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card 
                key={index} 
                className="p-6 relative"
                data-testid={`card-step-${index + 1}`}
              >
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-sm font-bold text-primary">
                  {index + 1}
                </div>
                
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${step.color} mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
