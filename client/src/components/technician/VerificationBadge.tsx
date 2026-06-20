import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, GraduationCap, BadgeCheck, Check, X, ShieldQuestion } from "lucide-react";

/**
 * P0-4 — Verification ladder UI. Mirrors the server's computeVerificationLadder
 * shape (server/utils/verification-ladder.ts): a sequential trust tier plus a
 * "what's verified" checklist so clients see exactly what was checked, not a
 * binary "Vérifié" badge.
 */
export type VerificationTierKey = "none" | "identity" | "qualified" | "trusted";

export interface VerificationRung {
  key: Exclude<VerificationTierKey, "none">;
  label: string;
  done: boolean;
}

export interface VerificationLadder {
  level: number;
  tierKey: VerificationTierKey;
  label: string;
  checklist: VerificationRung[];
}

interface VerificationBadgeProps {
  verification: VerificationLadder;
  /** Compact: just the tier chip with the checklist in a tooltip. */
  compact?: boolean;
}

/** Missions for the top "trusted" rung — mirrors TRUSTED_JOBS_THRESHOLD on the server. */
export const TRUSTED_JOBS_THRESHOLD = 10;

/**
 * Derive a ladder from fields already on a technician list item, so directory
 * cards show a tier without an extra per-card API call. This is a coarse view:
 * - identity  ← isVerified (server sets it once CIN + selfie/photo are approved)
 * - qualified ← has any certification (proxy for an approved diploma/OFPPT)
 * - trusted   ← enough completed missions
 * The authoritative ladder (from /verification/technician/:id) should be
 * preferred on a full profile page; this keeps lists cheap and honest.
 */
export function deriveLadderFromTechnician(tech: {
  isVerified: boolean;
  completedJobs: number;
  certifications: string[];
}): VerificationLadder {
  const identityDone = tech.isVerified;
  const qualifiedDone = (tech.certifications?.length ?? 0) > 0;
  const trustedDone = tech.completedJobs >= TRUSTED_JOBS_THRESHOLD;

  const checklist: VerificationRung[] = [
    { key: "identity", label: "Pièce d'identité (CIN) + selfie", done: identityDone },
    { key: "qualified", label: "Diplôme / OFPPT", done: qualifiedDone },
    { key: "trusted", label: `Parcours confirmé (${TRUSTED_JOBS_THRESHOLD}+ missions)`, done: trustedDone },
  ];

  let level = 0;
  for (const rung of checklist) {
    if (!rung.done) break;
    level += 1;
  }

  const tierKey: VerificationTierKey =
    level >= 3 ? "trusted" : level === 2 ? "qualified" : level === 1 ? "identity" : "none";
  const labels: Record<VerificationTierKey, string> = {
    none: "Non vérifié",
    identity: "Identité vérifiée",
    qualified: "Qualification vérifiée",
    trusted: "Artisan de confiance",
  };

  return { level, tierKey, label: labels[tierKey], checklist };
}

const TIER_CONFIG: Record<
  Exclude<VerificationTierKey, "none">,
  { color: string; bg: string; icon: typeof ShieldCheck }
> = {
  identity: { color: "text-blue-700", bg: "bg-blue-100", icon: ShieldCheck },
  qualified: { color: "text-emerald-700", bg: "bg-emerald-100", icon: GraduationCap },
  trusted: { color: "text-amber-700", bg: "bg-amber-100", icon: BadgeCheck },
};

function Checklist({ checklist }: { checklist: VerificationRung[] }) {
  return (
    <ul className="space-y-1" data-testid="verification-checklist">
      {checklist.map((rung) => (
        <li key={rung.key} className="flex items-center gap-2 text-sm">
          {rung.done ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <X className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          )}
          <span className={rung.done ? "" : "text-muted-foreground"}>{rung.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function VerificationBadge({ verification, compact = false }: VerificationBadgeProps) {
  // Unverified technicians get a neutral chip, never a misleading trust signal.
  if (verification.tierKey === "none") {
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground border-muted px-2 py-0.5 text-xs flex items-center gap-1 w-fit"
        data-testid="verification-badge"
      >
        <ShieldQuestion className="w-3 h-3" />
        {verification.label}
      </Badge>
    );
  }

  const config = TIER_CONFIG[verification.tierKey];
  const Icon = config.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              className={`${config.bg} ${config.color} border-0 px-2 py-0.5 text-xs font-semibold flex items-center gap-1 w-fit`}
              data-testid="verification-badge"
            >
              <Icon className="w-3 h-3" />
              {verification.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm font-semibold mb-1">Ce qui est vérifié</p>
            <Checklist checklist={verification.checklist} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`rounded-xl p-3 ${config.bg} border border-opacity-20`} data-testid="verification-badge">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${config.color}`} />
        <span className={`font-bold ${config.color}`}>{verification.label}</span>
      </div>
      <Checklist checklist={verification.checklist} />
    </div>
  );
}
