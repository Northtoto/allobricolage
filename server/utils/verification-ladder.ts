/**
 * P0-4 — Verification ladder with visible tiers.
 *
 * Trust in the Moroccan market is built in rungs, not a binary "Vérifié" badge:
 * CIN + selfie liveness → diploma/OFPPT → track record. This pure function turns
 * a technician's approved documents (plus their job history) into a tier the UI
 * can surface, and a "what's verified" checklist so clients see exactly what was
 * checked. It is the single source of truth shared by the API and the cards.
 */

export type VerificationTierKey = "none" | "identity" | "qualified" | "trusted";

export interface VerificationRung {
  key: Exclude<VerificationTierKey, "none">;
  label: string;
  done: boolean;
}

export interface VerificationLadder {
  /** 0 = unverified, 3 = top rung. The number of rungs achieved from the bottom. */
  level: number;
  tierKey: VerificationTierKey;
  label: string;
  checklist: VerificationRung[];
}

export interface LadderDocument {
  documentType: string;
  status: string;
}

export interface LadderOptions {
  /** Completed on-platform jobs — drives the "track record" rung. */
  completedJobs?: number;
}

/** Missions needed to earn the top "Artisan de confiance" rung. */
export const TRUSTED_JOBS_THRESHOLD = 10;

const TIER_LABELS: Record<VerificationTierKey, string> = {
  none: "Non vérifié",
  identity: "Identité vérifiée",
  qualified: "Qualification vérifiée",
  trusted: "Artisan de confiance",
};

// A document counts only once an admin has approved it. Accept both spellings
// the codebase uses for an approved review ("verified" is the current value).
function isApproved(status: string): boolean {
  return status === "verified" || status === "approved";
}

function hasApproved(docs: LadderDocument[], ...types: string[]): boolean {
  return docs.some((d) => types.includes(d.documentType) && isApproved(d.status));
}

export function computeVerificationLadder(
  docs: LadderDocument[],
  opts: LadderOptions = {},
): VerificationLadder {
  const identityDone = hasApproved(docs, "cin") && hasApproved(docs, "selfie");
  const qualifiedDone = hasApproved(docs, "ofppt_diploma", "diploma");
  const trustedDone = (opts.completedJobs ?? 0) >= TRUSTED_JOBS_THRESHOLD;

  const checklist: VerificationRung[] = [
    { key: "identity", label: "Pièce d'identité (CIN) + selfie", done: identityDone },
    { key: "qualified", label: "Diplôme / OFPPT", done: qualifiedDone },
    { key: "trusted", label: `Parcours confirmé (${TRUSTED_JOBS_THRESHOLD}+ missions)`, done: trustedDone },
  ];

  // The tier is the number of rungs climbed *consecutively* from the bottom: a
  // diploma without a verified identity does not skip you to tier 2.
  let level = 0;
  for (const rung of checklist) {
    if (!rung.done) break;
    level += 1;
  }

  const tierKey: VerificationTierKey =
    level >= 3 ? "trusted" : level === 2 ? "qualified" : level === 1 ? "identity" : "none";

  return { level, tierKey, label: TIER_LABELS[tierKey], checklist };
}
