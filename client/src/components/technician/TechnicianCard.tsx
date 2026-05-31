import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { Star, MapPin, Shield } from "lucide-react";
import { Link } from "wouter";
import { TrustBadge, getTrustTier } from "./TrustBadge";
import type { TechnicianWithUser } from "@shared/schema";

interface TechnicianCardProps {
  technician: TechnicianWithUser;
  onBook?: (technician: TechnicianWithUser) => void;
}

export function TechnicianCard({ technician, onBook }: TechnicianCardProps) {
  const { t } = useI18n();

  // Calculate trust score from available data (mirrors server algorithm)
  const baseScore = (technician.rating / 5) * 30;
  const verificationBonus = technician.isVerified ? 15 : 0;
  const reviewBonus = Math.min(15, Math.log10(Math.max(1, technician.reviewCount)) * 7.5);
  const completionBonus = (technician.completionRate || 0.95) * 15;
  const proBonus = technician.isPro ? 10 : 0;
  const responseBonus = Math.max(0, 10 - (technician.responseTimeMinutes / 12));
  const trustScore = Math.max(0, Math.min(100, Math.round((baseScore + verificationBonus + reviewBonus + completionBonus + proBonus + responseBonus) * 10) / 10));
  const trustTier = getTrustTier(trustScore);

  const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(technician.name)}&size=400&background=1e40af&color=fff`;

  return (
    <Card
      className="overflow-hidden hover-elevate transition-all bg-card"
      data-testid={`card-technician-${technician.id}`}
    >
      <div className="relative h-48">
        <img
          src={technician.photo || defaultImage}
          alt={technician.name}
          className="w-full h-full object-cover"
          data-testid={`img-technician-${technician.id}`}
        />
        <div className="absolute top-2 right-2 flex gap-2">
          {technician.isPro && (
            <Badge
              className="bg-green-500 text-white border-0 rounded-full px-3 py-1 font-semibold"
              data-testid={`badge-pro-${technician.id}`}
            >
              PRO
            </Badge>
          )}
          {technician.isPromo && (
            <Badge
              className="bg-red-500 text-white border-0 px-3 py-1 font-semibold"
              data-testid={`badge-promo-${technician.id}`}
            >
              Promo
            </Badge>
          )}
        </div>
        {technician.isVerified && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-blue-500/90 text-white border-0 px-2 py-0.5 text-xs font-semibold flex items-center gap-1 backdrop-blur">
              <Shield className="w-3 h-3" />
              Vérifié
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            className="font-bold text-lg text-foreground"
            data-testid={`text-name-${technician.id}`}
          >
            {technician.name}
          </h3>
          <TrustBadge score={trustScore} tier={trustTier} compact />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-medium text-foreground">{technician.rating.toFixed(1)}</span>
          </div>
          <span className="text-muted-foreground text-sm">
            ({technician.reviewCount})
          </span>
          <span className="text-muted-foreground text-sm">
            {technician.completedJobs} jobs
          </span>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin className="h-4 w-4" />
          <span data-testid={`text-location-${technician.id}`}>{technician.city}</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {technician.skills.slice(0, 3).map((skill, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="bg-muted text-muted-foreground text-xs font-normal rounded-full"
            >
              {skill}
            </Badge>
          ))}
          {technician.skills.length > 3 && (
            <Badge
              variant="secondary"
              className="bg-muted text-muted-foreground text-xs font-normal rounded-full"
            >
              +{technician.skills.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <span
            className="font-bold text-foreground"
            data-testid={`text-price-${technician.id}`}
          >
            {technician.hourlyRate} MAD / heure
          </span>
          <Badge
            variant="outline"
            className={`font-medium ${
              technician.availability === "Immédiat"
                ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20"
                : "border-muted-foreground text-muted-foreground"
            }`}
            data-testid={`badge-availability-${technician.id}`}
          >
            {technician.availability}
          </Badge>
        </div>

        <Link href={`/technician/${technician.id}`} className="block">
          <Button
            className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700"
            data-testid={`button-book-${technician.id}`}
          >
            {onBook ? "Réserver" : "Voir profil"}
          </Button>
        </Link>
      </div>
    </Card>
  );
}

interface TechnicianMatchCardProps {
  match: {
    technician: TechnicianWithUser;
    matchScore: number;
    explanation: string;
    etaMinutes: number;
    estimatedCost: {
      minCost: number;
      maxCost: number;
      likelyCost: number;
    };
    factors: {
      specializationMatch: number;
      locationScore: number;
      availabilityScore: number;
      responseTimeScore: number;
      completionRateScore: number;
      ratingScore: number;
      priceScore: number;
    };
  };
  rank: number;
  onBook: (match: any) => void;
}

export function TechnicianMatchCard({ match, rank, onBook }: TechnicianMatchCardProps) {
  const { technician } = match;

  const baseScore = (technician.rating / 5) * 30;
  const verificationBonus = technician.isVerified ? 15 : 0;
  const reviewBonus = Math.min(15, Math.log10(Math.max(1, technician.reviewCount)) * 7.5);
  const completionBonus = (technician.completionRate || 0.95) * 15;
  const proBonus = technician.isPro ? 10 : 0;
  const responseBonus = Math.max(0, 10 - (technician.responseTimeMinutes / 12));
  const trustScore = Math.max(0, Math.min(100, Math.round((baseScore + verificationBonus + reviewBonus + completionBonus + proBonus + responseBonus) * 10) / 10));
  const trustTier = getTrustTier(trustScore);

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.9) return "bg-green-500 text-white";
    if (score >= 0.8) return "bg-blue-500 text-white";
    if (score >= 0.7) return "bg-yellow-500 text-white";
    return "bg-orange-500 text-white";
  };

  const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(technician.name)}&size=400&background=1e40af&color=fff`;

  return (
    <Card
      className="overflow-hidden hover-elevate transition-all bg-card relative"
      data-testid={`card-match-${technician.id}`}
    >
      <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md z-10">
        #{rank}
      </div>

      <Badge
        className={`absolute top-2 left-10 ${getMatchScoreColor(match.matchScore)} px-2 py-1 font-bold shadow-md z-10`}
      >
        {Math.round(match.matchScore * 100)}%
      </Badge>

      <div className="relative h-48">
        <img
          src={technician.photo || defaultImage}
          alt={technician.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          {technician.isPro && (
            <Badge className="bg-green-500 text-white border-0 rounded-full px-3 py-1 font-semibold">
              PRO
            </Badge>
          )}
          {technician.isPromo && (
            <Badge className="bg-red-500 text-white border-0 px-3 py-1 font-semibold">
              Promo
            </Badge>
          )}
        </div>
        <div className="absolute bottom-2 left-2 flex gap-1">
          <TrustBadge score={trustScore} tier={trustTier} compact />
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-foreground mb-1">
          {technician.name}
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-medium text-foreground">{technician.rating.toFixed(1)}</span>
          </div>
          <span className="text-muted-foreground text-sm">
            ({technician.reviewCount})
          </span>
          {technician.isVerified && (
            <Badge className="bg-blue-500/90 text-white border-0 px-1.5 py-0 text-[10px]">
              Vérifié
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin className="h-4 w-4" />
          <span>{technician.city} - {match.etaMinutes} min</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {technician.skills.slice(0, 3).map((skill, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="bg-muted text-muted-foreground text-xs font-normal rounded-full"
            >
              {skill}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-foreground">
            {match.estimatedCost.minCost}-{match.estimatedCost.maxCost} MAD
          </span>
          <Badge
            variant="outline"
            className={`font-medium ${
              technician.availability === "Immédiat"
                ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20"
                : "border-muted-foreground text-muted-foreground"
            }`}
          >
            {technician.availability}
          </Badge>
        </div>

        <Button
          className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700"
          onClick={() => onBook(match)}
        >
          Réserver
        </Button>
      </div>
    </Card>
  );
}
