import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";
import { 
  Banknote, 
  TrendingDown, 
  TrendingUp, 
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState } from "react";
import type { CostEstimate } from "@shared/schema";

interface CostEstimateCardProps {
  estimate: CostEstimate | null;
  isLoading?: boolean;
}

export function CostEstimateCard({ estimate, isLoading }: CostEstimateCardProps) {
  const { t } = useI18n();
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-chart-2/10">
            <Banknote className="h-5 w-5 text-chart-2 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold">Calcul du prix</h3>
            <p className="text-sm text-muted-foreground">Estimation en cours...</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        </div>
      </Card>
    );
  }

  if (!estimate) {
    return null;
  }

  const marketComparison = ((estimate.likelyCost - 300) / 300) * 100;
  const isBelowMarket = marketComparison < 0;

  return (
    <Card className="p-6 border-chart-2/20 bg-chart-2/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-chart-2/10">
          <Banknote className="h-5 w-5 text-chart-2" />
        </div>
        <div>
          <h3 className="font-semibold">{t("match.estimatedCost")}</h3>
          <p className="text-sm text-muted-foreground">Estimation IA dynamique</p>
        </div>
      </div>

      {/* Main Price Display */}
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-chart-2 mb-2">
          {estimate.likelyCost} <span className="text-xl">{t("common.mad")}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Fourchette: {estimate.minCost} - {estimate.maxCost} {t("common.mad")}
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{t("price.confidence")}</span>
          <span className="text-sm font-medium">{Math.round(estimate.confidence * 100)}%</span>
        </div>
        <Progress value={estimate.confidence * 100} className="h-2" />
      </div>

      {/* Market Comparison */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {isBelowMarket ? (
          <>
            <TrendingDown className="h-4 w-4 text-green-500" />
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 border">
              {Math.abs(Math.round(marketComparison))}% {t("price.belowMarket")}
            </Badge>
          </>
        ) : (
          <>
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 border">
              {Math.round(marketComparison)}% {t("price.aboveMarket")}
            </Badge>
          </>
        )}
      </div>

      {/* Breakdown Toggle */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        data-testid="button-price-breakdown"
      >
        <Info className="h-4 w-4" />
        {t("price.breakdown")}
        {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {/* Breakdown Details */}
      {showBreakdown && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("price.base")}</span>
            <span className="font-medium">{estimate.breakdown.baseRate} {t("common.mad")}</span>
          </div>
          {estimate.breakdown.urgencyPremium > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("price.urgency")}</span>
              <span className="font-medium text-orange-500">
                +{estimate.breakdown.urgencyPremium} {t("common.mad")}
              </span>
            </div>
          )}
          {estimate.breakdown.timePremium > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("price.time")}</span>
              <span className="font-medium text-orange-500">
                +{estimate.breakdown.timePremium} {t("common.mad")}
              </span>
            </div>
          )}
          {estimate.breakdown.complexityPremium > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("price.complexity")}</span>
              <span className="font-medium text-orange-500">
                +{estimate.breakdown.complexityPremium} {t("common.mad")}
              </span>
            </div>
          )}
          
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground italic">
              {estimate.explanation}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
