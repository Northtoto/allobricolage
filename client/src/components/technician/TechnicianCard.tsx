import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";
import { 
  Star, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Shield, 
  ChevronDown,
  ChevronUp,
  Zap
} from "lucide-react";
import { useState } from "react";
import type { TechnicianMatch } from "@shared/schema";

interface TechnicianCardProps {
  match: TechnicianMatch;
  rank: number;
  onBook: (match: TechnicianMatch) => void;
}

export function TechnicianCard({ match, rank, onBook }: TechnicianCardProps) {
  const { t } = useI18n();
  const [showExplanation, setShowExplanation] = useState(false);
  const { technician } = match;

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.9) return "bg-green-500 text-white";
    if (score >= 0.8) return "bg-blue-500 text-white";
    if (score >= 0.7) return "bg-yellow-500 text-white";
    return "bg-orange-500 text-white";
  };

  return (
    <Card 
      className="p-6 relative overflow-visible hover-elevate transition-all"
      data-testid={`card-technician-${technician.id}`}
    >
      {/* Rank Badge */}
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
        #{rank}
      </div>

      {/* Match Score Badge */}
      <Badge 
        className={`absolute -top-3 -right-3 ${getMatchScoreColor(match.matchScore)} px-3 py-1 font-bold shadow-md`}
      >
        {Math.round(match.matchScore * 100)}% Match
      </Badge>

      <div className="flex gap-4">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="h-20 w-20 border-2 border-border">
            <AvatarImage src={technician.photo || undefined} alt={technician.name} />
            <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
              {technician.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          {technician.isAvailable && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {technician.name}
                {technician.isVerified && (
                  <Shield className="h-4 w-4 text-blue-500" />
                )}
              </h3>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-medium">{technician.rating.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm">
                  ({technician.reviewCount} {t("common.reviews")})
                </span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{match.etaMinutes} {t("common.min")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{technician.responseTimeMinutes} {t("common.min")} réponse</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              <span>{technician.completedJobs} travaux</span>
            </div>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1 mb-4">
            {technician.skills.slice(0, 4).map((skill, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {technician.skills.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{technician.skills.length - 4}
              </Badge>
            )}
          </div>

          {/* Availability & Price */}
          <div className="flex items-center justify-between mb-4">
            <Badge className={technician.isAvailable 
              ? "bg-green-500/10 text-green-600 border-green-500/20 border" 
              : "bg-muted text-muted-foreground"
            }>
              {technician.isAvailable ? t("match.available") : t("match.nextAvailable")}
            </Badge>
            <div className="text-right">
              <div className="font-bold text-lg text-chart-2">
                {match.estimatedCost.minCost}-{match.estimatedCost.maxCost} {t("common.mad")}
              </div>
              <div className="text-xs text-muted-foreground">Estimation IA</div>
            </div>
          </div>

          {/* Why Match Button */}
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1 text-sm text-primary hover:underline mb-4"
            data-testid={`button-why-match-${technician.id}`}
          >
            {t("match.whyMatch")}
            {showExplanation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {/* Match Explanation */}
          {showExplanation && (
            <div className="mb-4 p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground mb-4">{match.explanation}</p>
              
              {/* Factor Scores */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Spécialisation</span>
                  <span className="font-medium">{Math.round(match.factors.specializationMatch * 100)}%</span>
                </div>
                <Progress value={match.factors.specializationMatch * 100} className="h-1.5" />
                
                <div className="flex items-center justify-between text-xs">
                  <span>Proximité</span>
                  <span className="font-medium">{Math.round(match.factors.locationScore * 100)}%</span>
                </div>
                <Progress value={match.factors.locationScore * 100} className="h-1.5" />
                
                <div className="flex items-center justify-between text-xs">
                  <span>Note client</span>
                  <span className="font-medium">{Math.round(match.factors.ratingScore * 100)}%</span>
                </div>
                <Progress value={match.factors.ratingScore * 100} className="h-1.5" />
                
                <div className="flex items-center justify-between text-xs">
                  <span>Réactivité</span>
                  <span className="font-medium">{Math.round(match.factors.responseTimeScore * 100)}%</span>
                </div>
                <Progress value={match.factors.responseTimeScore * 100} className="h-1.5" />
              </div>
            </div>
          )}

          {/* Book Button */}
          <Button 
            className="w-full" 
            onClick={() => onBook(match)}
            data-testid={`button-book-${technician.id}`}
          >
            {t("match.book")} {technician.name.split(" ")[0]}
          </Button>
        </div>
      </div>
    </Card>
  );
}
