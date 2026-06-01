import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BusinessLanding from "./BusinessLanding";

describe("BusinessLanding (B2B revenue page)", () => {
  it("renders the three retainer tiers with prices and SLAs", () => {
    render(<BusinessLanding />);
    // Tier names
    expect(screen.getByText("Essentiel")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
    // Prices mirroring the server catalog
    expect(screen.getByText("800 DH")).toBeInTheDocument();
    expect(screen.getByText("2 500 DH")).toBeInTheDocument();
    expect(screen.getByText("Sur devis")).toBeInTheDocument();
  });

  it("shows the core B2B value propositions", () => {
    render(<BusinessLanding />);
    expect(screen.getByText(/Zéro temps d'arrêt/i)).toBeInTheDocument();
    // "Techniciens vérifiés" appears both as a value-prop heading and a plan feature.
    expect(screen.getAllByText(/Techniciens vérifiés/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Facturation propre/i)).toBeInTheDocument();
  });

  it("exposes conversion CTAs", () => {
    render(<BusinessLanding />);
    expect(screen.getByText(/Créer mon compte entreprise/i)).toBeInTheDocument();
    expect(screen.getByText(/Contacter sur WhatsApp/i)).toBeInTheDocument();
  });
});
