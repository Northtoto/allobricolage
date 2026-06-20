import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VerificationBadge, type VerificationLadder } from "./VerificationBadge";

// P0-4: the badge must honestly reflect the server ladder — a neutral chip when
// unverified, the tier label otherwise, and the full checklist in expanded mode.

function ladder(overrides: Partial<VerificationLadder> = {}): VerificationLadder {
  return {
    level: 2,
    tierKey: "qualified",
    label: "Qualification vérifiée",
    checklist: [
      { key: "identity", label: "Pièce d'identité (CIN) + selfie", done: true },
      { key: "qualified", label: "Diplôme / OFPPT", done: true },
      { key: "trusted", label: "Parcours confirmé (10+ missions)", done: false },
    ],
    ...overrides,
  };
}

describe("VerificationBadge", () => {
  it("shows a neutral chip when unverified (tierKey none)", () => {
    render(
      <VerificationBadge
        verification={ladder({ level: 0, tierKey: "none", label: "Non vérifié" })}
        compact
      />,
    );
    expect(screen.getByText("Non vérifié")).toBeInTheDocument();
  });

  it("renders the tier label for a verified technician", () => {
    render(<VerificationBadge verification={ladder()} compact />);
    expect(screen.getByText("Qualification vérifiée")).toBeInTheDocument();
  });

  it("renders the full what's-verified checklist in expanded mode", () => {
    render(<VerificationBadge verification={ladder()} />);
    const list = screen.getByTestId("verification-checklist");
    expect(list).toBeInTheDocument();
    expect(screen.getByText("Diplôme / OFPPT")).toBeInTheDocument();
    expect(screen.getByText("Parcours confirmé (10+ missions)")).toBeInTheDocument();
  });
});
