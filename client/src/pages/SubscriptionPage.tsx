import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, Zap, Star, Crown } from "lucide-react";

const TIERS = [
  {
    id: "free",
    name: "Gratuit",
    price: 0,
    leads: 3,
    color: "bg-slate-100 text-slate-700",
    borderColor: "border-slate-200",
    icon: Zap,
    features: ["Profil public", "3 leads par mois", "Reception des demandes"],
  },
  {
    id: "bronze",
    name: "Bronze",
    price: 99,
    leads: 10,
    color: "bg-amber-700 text-white",
    borderColor: "border-amber-200",
    icon: Star,
    features: ["10 leads par mois", "Badge Bronze", "Mise en avant basique"],
    popular: false,
  },
  {
    id: "silver",
    name: "Silver",
    price: 249,
    leads: 30,
    color: "bg-slate-400 text-white",
    borderColor: "border-slate-300",
    icon: Star,
    features: ["30 leads par mois", "Badge Silver", "Mise en avant recherche", "Analytics basiques"],
    popular: true,
  },
  {
    id: "gold",
    name: "Gold",
    price: 499,
    leads: 999,
    color: "bg-amber-500 text-white",
    borderColor: "border-amber-300",
    icon: Crown,
    features: ["Leads illimités", "Badge Gold", "Mise en avant prioritaire", "Analytics avances", "Support prioritaire"],
    popular: false,
  },
];

interface SubscriptionData {
  tier: string;
  tierName: string;
  leadsRemaining: number;
}

export default function SubscriptionPage() {
  const { toast } = useToast();
  const { data: currentSub, isLoading, refetch } = useQuery<SubscriptionData>({
    queryKey: ["/api/subscriptions/my"],
  });

  const upgradeMutation = useMutation({
    mutationFn: async (tier: string) => {
      const res = await apiRequest("POST", "/api/subscriptions/upgrade", { tier });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Abonnement mis a jour", description: "Votre forfait a ete active." });
      refetch();
    },
    onError: (e: any) => {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    },
  });

  const currentTier = currentSub?.tier ?? "free";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Abonnements Artisans</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Debloquez plus de leads et beneficiez d'une meilleure visibilite pour developper votre activite.
          </p>
          {currentSub && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <span className="font-semibold capitalize">{currentSub.tierName}</span>
              <span className="text-sm">— {currentSub.leadsRemaining} leads restants ce mois</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier) => {
            const isCurrent = currentTier === tier.id;
            const Icon = tier.icon;

            return (
              <Card
                key={tier.id}
                className={`relative ${tier.popular ? "ring-2 ring-primary shadow-lg scale-[1.02]" : ""} ${isCurrent ? "border-green-400" : tier.borderColor}`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white">
                    Populaire
                  </Badge>
                )}
                {isCurrent && (
                  <Badge className="absolute -top-3 right-4 bg-green-500 text-white">
                    Actif
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={`w-14 h-14 rounded-2xl ${tier.color} mx-auto mb-3 flex items-center justify-center`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground"> DH/mois</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-sm text-muted-foreground mb-4">
                    {tier.leads >= 900 ? "Leads illimites" : `${tier.leads} leads par mois`}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || upgradeMutation.isPending}
                    onClick={() => tier.id !== "free" && upgradeMutation.mutate(tier.id)}
                  >
                    {isCurrent ? "Forfait actuel" : tier.price === 0 ? "Gratuit" : "Souscrire"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
