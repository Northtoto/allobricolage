import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Shield, Award, Crown, Gem, Diamond } from "lucide-react";

export type TrustTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

interface TrustBadgeProps {
  score: number;
  tier: TrustTier;
  compact?: boolean;
}

const TIER_CONFIG: Record<TrustTier, { label: string; color: string; bg: string; icon: typeof Shield }> = {
  bronze: { label: "Bronze", color: "text-amber-700", bg: "bg-amber-100", icon: Shield },
  silver: { label: "Argent", color: "text-slate-600", bg: "bg-slate-200", icon: Award },
  gold: { label: "Or", color: "text-yellow-600", bg: "bg-yellow-100", icon: Crown },
  platinum: { label: "Platine", color: "text-slate-500", bg: "bg-slate-100", icon: Gem },
  diamond: { label: "Diamant", color: "text-blue-500", bg: "bg-blue-50", icon: Diamond },
};

export function TrustBadge({ score, tier, compact = false }: TrustBadgeProps) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${config.bg} ${config.color} border-0 px-2 py-0.5 text-xs font-semibold flex items-center gap-1`}>
              <Icon className="w-3 h-3" />
              {config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm font-medium">Score de confiance: {score}/100</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`rounded-xl p-3 ${config.bg} border border-opacity-20`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${config.color}`} />
        <span className={`font-bold ${config.color}`}>{config.label}</span>
        <span className="text-sm text-muted-foreground ml-auto">{score}/100</span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
}

/** Calculate trust tier from raw score */
export function getTrustTier(score: number): TrustTier {
  if (score >= 90) return "diamond";
  if (score >= 75) return "platinum";
  if (score >= 60) return "gold";
  if (score >= 40) return "silver";
  return "bronze";
}
