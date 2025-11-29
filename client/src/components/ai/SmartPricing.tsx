/**
 * 📊 Smart Pricing Component
 * 
 * Displays dynamic pricing with breakdown of factors
 * affecting the final price.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  MapPin, 
  Star, 
  Zap,
  Sun,
  Moon,
  Tag,
  CheckCircle
} from "lucide-react";

interface PricingResult {
  basePrice: number;
  finalPrice: number;
  currency: string;
  unit: string;
  multipliers: Array<{
    factor: string;
    multiplier?: number;
    addition?: number;
    description: string;
  }>;
  savings: number;
  explanation: string;
  breakdown: {
    labor: number;
    transport: number;
    surge: number;
    premium: number;
    discount: number;
  };
  confidence: number;
}

interface SmartPricingProps {
  serviceType: string;
  city: string;
  urgency: "urgent" | "scheduled" | "flexible";
  scheduledDate?: string;
  scheduledTime?: string;
  technicianId?: string;
  onPriceCalculated?: (price: number) => void;
}

export function SmartPricing({
  serviceType,
  city,
  urgency,
  scheduledDate = new Date().toISOString().split("T")[0],
  scheduledTime = "10:00",
  technicianId,
  onPriceCalculated
}: SmartPricingProps) {
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    valid: boolean;
    discountAmount: number;
    message: string;
  } | null>(null);
  const { toast } = useToast();

  // Fetch dynamic price
  const { data: pricing, isLoading } = useQuery<PricingResult>({
    queryKey: ["pricing", serviceType, city, urgency, scheduledDate, scheduledTime, technicianId],
    queryFn: async () => {
      const response = await fetch("/api/ai/pricing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType,
          city,
          urgency,
          scheduledDate,
          scheduledTime,
          technicianId
        })
      });

      if (!response.ok) {
        throw new Error("Failed to calculate price");
      }

      return response.json();
    }
  });

  // Apply discount code
  const discountMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch("/api/ai/pricing/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: pricing?.finalPrice || 0,
          code
        })
      });

      if (!response.ok) {
        throw new Error("Failed to apply discount");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAppliedDiscount(data);
      if (data.valid) {
        toast({
          title: "✅ Code appliqué!",
          description: data.message
        });
      } else {
        toast({
          title: "❌ Code invalide",
          description: data.message,
          variant: "destructive"
        });
      }
    }
  });

  // Notify parent of price change
  useEffect(() => {
    if (pricing) {
      const finalPrice = appliedDiscount?.valid 
        ? pricing.finalPrice - appliedDiscount.discountAmount
        : pricing.finalPrice;
      onPriceCalculated?.(finalPrice);
    }
  }, [pricing, appliedDiscount, onPriceCalculated]);

  const getFactorIcon = (factor: string) => {
    if (factor.includes("Urgence")) return <Zap className="h-4 w-4 text-red-500" />;
    if (factor.includes("Weekend")) return <Sun className="h-4 w-4 text-orange-500" />;
    if (factor.includes("nocturne")) return <Moon className="h-4 w-4 text-blue-500" />;
    if (factor.includes("Distance")) return <MapPin className="h-4 w-4 text-green-500" />;
    if (factor.includes("Expert") || factor.includes("premium")) return <Star className="h-4 w-4 text-yellow-500" />;
    if (factor.includes("demande")) return <TrendingUp className="h-4 w-4 text-purple-500" />;
    if (factor.includes("Flexible") || factor.includes("Simple")) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Calculator className="h-6 w-6 animate-pulse mr-2" />
            <span>Calcul du prix...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pricing) {
    return null;
  }

  const finalPrice = appliedDiscount?.valid 
    ? pricing.finalPrice - appliedDiscount.discountAmount
    : pricing.finalPrice;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Tarification Dynamique
        </CardTitle>
        <CardDescription>
          Prix calculé en temps réel selon plusieurs facteurs
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Price Display */}
        <div className="text-center py-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Prix estimé</p>
          <div className="flex items-center justify-center gap-2">
            {appliedDiscount?.valid && (
              <span className="text-2xl text-muted-foreground line-through">
                {pricing.finalPrice}
              </span>
            )}
            <span className="text-4xl font-bold text-primary">
              {finalPrice}
            </span>
            <span className="text-lg text-muted-foreground">
              {pricing.currency}/{pricing.unit}
            </span>
          </div>
          {pricing.savings > 0 && (
            <Badge variant="secondary" className="mt-2">
              <TrendingDown className="h-3 w-3 mr-1" />
              Économie: {pricing.savings} MAD
            </Badge>
          )}
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Détail du prix:</p>
          
          {/* Base Price */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prix de base ({serviceType})</span>
            <span>{pricing.basePrice} MAD</span>
          </div>

          {/* Multipliers */}
          {pricing.multipliers.map((mult, i) => (
            <div key={i} className="flex justify-between text-sm items-center">
              <span className="flex items-center gap-2 text-muted-foreground">
                {getFactorIcon(mult.factor)}
                {mult.description}
              </span>
              <span className={mult.multiplier && mult.multiplier < 1 ? "text-green-600" : "text-orange-600"}>
                {mult.multiplier 
                  ? `×${mult.multiplier.toFixed(2)}`
                  : mult.addition 
                    ? `+${mult.addition} MAD`
                    : ""
                }
              </span>
            </div>
          ))}

          {/* Applied Discount */}
          {appliedDiscount?.valid && (
            <div className="flex justify-between text-sm items-center text-green-600">
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Code promo
              </span>
              <span>-{appliedDiscount.discountAmount} MAD</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Breakdown Summary */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 bg-muted rounded">
            <p className="text-muted-foreground">Main d'œuvre</p>
            <p className="font-medium">{pricing.breakdown.labor} MAD</p>
          </div>
          {pricing.breakdown.transport > 0 && (
            <div className="p-2 bg-muted rounded">
              <p className="text-muted-foreground">Déplacement</p>
              <p className="font-medium">{pricing.breakdown.transport} MAD</p>
            </div>
          )}
          {pricing.breakdown.surge > 0 && (
            <div className="p-2 bg-orange-50 rounded">
              <p className="text-orange-600">Forte demande</p>
              <p className="font-medium text-orange-700">+{pricing.breakdown.surge} MAD</p>
            </div>
          )}
          {pricing.breakdown.premium > 0 && (
            <div className="p-2 bg-yellow-50 rounded">
              <p className="text-yellow-600">Premium</p>
              <p className="font-medium text-yellow-700">+{pricing.breakdown.premium} MAD</p>
            </div>
          )}
        </div>

        {/* Discount Code Input */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Code promo:</p>
          <div className="flex gap-2">
            <Input
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              placeholder="WELCOME10"
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => discountMutation.mutate(discountCode)}
              disabled={!discountCode || discountMutation.isPending}
            >
              {discountMutation.isPending ? "..." : "Appliquer"}
            </Button>
          </div>
          {appliedDiscount && (
            <p className={`text-sm ${appliedDiscount.valid ? "text-green-600" : "text-red-600"}`}>
              {appliedDiscount.valid && <CheckCircle className="h-3 w-3 inline mr-1" />}
              {appliedDiscount.message}
            </p>
          )}
        </div>

        {/* Confidence */}
        <div className="text-xs text-muted-foreground text-center">
          Confiance de l'estimation: {Math.round(pricing.confidence * 100)}%
        </div>
      </CardContent>
    </Card>
  );
}

