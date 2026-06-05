import { describe, it, expect } from "vitest";
import {
  computeVerificationLadder,
  TRUSTED_JOBS_THRESHOLD,
  type LadderDocument,
} from "./verification-ladder.ts";

// P0-4: the ladder must be sequential (no rung-skipping) so the surfaced tier
// honestly reflects what was checked, and the checklist must always report each
// rung independently so the UI can render "what's verified".

const approved = (documentType: string): LadderDocument => ({ documentType, status: "verified" });
const pending = (documentType: string): LadderDocument => ({ documentType, status: "pending" });

describe("computeVerificationLadder", () => {
  it("is tier 0 (none) with no documents", () => {
    const l = computeVerificationLadder([]);
    expect(l.level).toBe(0);
    expect(l.tierKey).toBe("none");
    expect(l.checklist.every((r) => !r.done)).toBe(true);
  });

  it("reaches tier 1 (identity) with approved CIN + selfie", () => {
    const l = computeVerificationLadder([approved("cin"), approved("selfie")]);
    expect(l.level).toBe(1);
    expect(l.tierKey).toBe("identity");
    expect(l.checklist[0].done).toBe(true);
  });

  it("does not grant identity when the selfie is only pending", () => {
    const l = computeVerificationLadder([approved("cin"), pending("selfie")]);
    expect(l.level).toBe(0);
    expect(l.checklist[0].done).toBe(false);
  });

  it("reaches tier 2 (qualified) with identity + OFPPT diploma", () => {
    const l = computeVerificationLadder([approved("cin"), approved("selfie"), approved("ofppt_diploma")]);
    expect(l.level).toBe(2);
    expect(l.tierKey).toBe("qualified");
  });

  it("does NOT skip to tier 2 when a diploma exists but identity is incomplete", () => {
    // The diploma rung is independently 'done', but the tier must not jump.
    const l = computeVerificationLadder([approved("ofppt_diploma")]);
    expect(l.level).toBe(0);
    expect(l.tierKey).toBe("none");
    expect(l.checklist.find((r) => r.key === "qualified")?.done).toBe(true);
  });

  it("reaches tier 3 (trusted) with full docs + enough completed jobs", () => {
    const docs = [approved("cin"), approved("selfie"), approved("diploma")];
    const l = computeVerificationLadder(docs, { completedJobs: TRUSTED_JOBS_THRESHOLD });
    expect(l.level).toBe(3);
    expect(l.tierKey).toBe("trusted");
  });

  it("caps at tier 2 when the track record is short", () => {
    const docs = [approved("cin"), approved("selfie"), approved("diploma")];
    const l = computeVerificationLadder(docs, { completedJobs: TRUSTED_JOBS_THRESHOLD - 1 });
    expect(l.level).toBe(2);
    expect(l.checklist.find((r) => r.key === "trusted")?.done).toBe(false);
  });
});
