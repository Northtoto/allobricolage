import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the api-client get() — the fix routes the fetch through it so the
// { success, data } envelope is unwrapped to the array. This guards the
// regression where raw fetch().json() returned the envelope -> "0 found".
const get = vi.fn();
vi.mock("@/lib/api-client", () => ({ get: (p: string) => get(p) }));
vi.mock("wouter", () => ({ useLocation: () => ["/", vi.fn()] }));

import { FastBookingFlow } from "./FastBookingFlow";

const tech = (id: string, services: string[]) => ({
  id, userId: "u" + id, name: "Tech " + id, phone: null, email: null, city: "Casablanca",
  services, skills: [], bio: null, photo: null, rating: 4.5, reviewCount: 10, completedJobs: 5,
  responseTimeMinutes: 20, completionRate: 0.95, yearsExperience: 3, hourlyRate: 200,
  isVerified: true, isAvailable: true, isPro: false, isPromo: false, availability: "Sur RDV",
  certifications: [], latitude: null, longitude: null, languages: ["francais"],
});

function renderFlow() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <FastBookingFlow isOpen serviceType="Plomberie" onClose={() => {}} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FastBookingFlow technician fetch (envelope-unwrap regression)", () => {
  it("calls the unwrapped api path without the /api prefix and maps the service slug", async () => {
    get.mockResolvedValue([tech("1", ["plomberie"])]);
    renderFlow();
    // The query fires on mount (enabled: isOpen) regardless of the animation timer.
    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(get).toHaveBeenCalledWith("/technicians?available=true&service=plomberie");
  });

  it("renders the technicians returned by the unwrapped array (not zero)", async () => {
    get.mockResolvedValue([tech("1", ["plomberie"]), tech("2", ["plomberie"])]);
    renderFlow();
    // Wait past the ~2.5s search animation for the selection step to render.
    await waitFor(() => expect(screen.getByText(/2 Techniciens trouvés/)).toBeInTheDocument(), {
      timeout: 4000,
    });
    expect(screen.queryByText(/Aucun technicien trouvé/)).not.toBeInTheDocument();
  });
});
