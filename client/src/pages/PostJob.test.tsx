import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the API layer the mutations go through, plus every collaborator that
// isn't the thing under test (mirrors the BookingModal.test.tsx pattern).
const apiRequest = vi.fn();
vi.mock("@/lib/queryClient", () => ({ apiRequest: (...a: unknown[]) => apiRequest(...a) }));

let mockSearch = "";
vi.mock("wouter", () => ({
  useLocation: () => ["/post-job", vi.fn()],
  useSearch: () => mockSearch,
}));

vi.mock("@/lib/i18n", () => ({ useI18n: () => ({ t: (k: string) => k }) }));

const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

vi.mock("@/components/layout/Header", () => ({ Header: () => <div data-testid="mock-header" /> }));
vi.mock("@/components/layout/Footer", () => ({ Footer: () => <div data-testid="mock-footer" /> }));
vi.mock("@/components/job/AIAnalysisPanel", () => ({ AIAnalysisPanel: () => null }));
vi.mock("@/components/job/CostEstimateCard", () => ({ CostEstimateCard: () => null }));
vi.mock("@/components/technician/TechnicianCard", () => ({ TechnicianMatchCard: () => null }));
vi.mock("@/components/booking/BookingModal", () => ({ BookingModal: () => null }));
vi.mock("@/components/booking/UpsellSuggestions", () => ({ UpsellSuggestions: () => null }));

// Radix Select needs pointer-capture/ResizeObserver polyfills this project's
// jsdom setup doesn't provide; swap it for a native <select> so city choice
// is driven the same way BookingModal.test.tsx drives its native selects.
vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) => (
    <select data-testid="select-city" value={value} onChange={(e) => onValueChange(e.target.value)}>
      <option value="" />
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
}));

import PostJob from "./PostJob";

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <PostJob />
    </QueryClientProvider>
  );
}

// Kept short (<= 20 chars) on purpose: the component also auto-fires the
// analyze mutation 1s after typing once description.length > 20 && city is
// set. Staying under that threshold means only the explicit submit click
// triggers the mutation, so assertions on apiRequest call count stay exact.
const SHORT_DESCRIPTION = "Fuite d'eau salon";

beforeEach(() => {
  vi.clearAllMocks();
  mockSearch = "";
});

describe("PostJob required-field validation", () => {
  it("keeps the analyze button disabled until description and city are both filled", () => {
    setup();
    const button = screen.getByTestId("button-analyze-job");
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByTestId("input-job-description"), { target: { value: SHORT_DESCRIPTION } });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByTestId("select-city"), { target: { value: "Casablanca" } });
    expect(button).not.toBeDisabled();
  });

  it("never calls the API when a required field is missing", () => {
    setup();
    fireEvent.change(screen.getByTestId("input-job-description"), { target: { value: SHORT_DESCRIPTION } });
    // City still empty -> button stays disabled -> click is a no-op.
    fireEvent.click(screen.getByTestId("button-analyze-job"));
    expect(apiRequest).not.toHaveBeenCalled();
  });
});

describe("PostJob successful submission", () => {
  it("submits the analyze request with the right payload and advances to the analysis step", async () => {
    const analysis = { service: "plomberie", urgency: "normal", complexity: "simple", estimatedDuration: "1h", confidence: 0.9, keywords: [] };
    apiRequest.mockResolvedValueOnce({ json: async () => ({ analysis, costEstimate: { likelyCost: 300 } }) });

    setup();
    fireEvent.change(screen.getByTestId("input-job-description"), { target: { value: SHORT_DESCRIPTION } });
    fireEvent.change(screen.getByTestId("select-city"), { target: { value: "Casablanca" } });
    fireEvent.click(screen.getByTestId("button-analyze-job"));

    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith("POST", "/api/jobs/analyze", {
      description: SHORT_DESCRIPTION,
      city: "Casablanca",
      urgency: "normal",
    }));

    await waitFor(() => expect(screen.getByTestId("button-find-matches")).toBeInTheDocument());
    expect(screen.getByText(SHORT_DESCRIPTION)).toBeInTheDocument();
  });

  it("submits the match request with the analysis payload and shows the matches step", async () => {
    const analysis = { service: "plomberie", urgency: "normal", complexity: "simple", estimatedDuration: "1h", confidence: 0.9, keywords: [] };
    apiRequest
      .mockResolvedValueOnce({ json: async () => ({ analysis, costEstimate: { likelyCost: 300 } }) })
      .mockResolvedValueOnce({ json: async () => ({ job: { id: "job-1" }, matches: [], upsellSuggestions: [] }) });

    setup();
    fireEvent.change(screen.getByTestId("input-job-description"), { target: { value: SHORT_DESCRIPTION } });
    fireEvent.change(screen.getByTestId("select-city"), { target: { value: "Casablanca" } });
    fireEvent.click(screen.getByTestId("button-analyze-job"));
    await waitFor(() => screen.getByTestId("button-find-matches"));

    fireEvent.click(screen.getByTestId("button-find-matches"));

    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith("POST", "/api/jobs", {
      description: SHORT_DESCRIPTION,
      city: "Casablanca",
      urgency: "normal",
      analysis,
    }));

    await waitFor(() => expect(screen.getByText(/artisans trouvés/)).toBeInTheDocument());
    expect(screen.getByText("0 artisans trouvés")).toBeInTheDocument();
  });
});

describe("PostJob failed submission", () => {
  it("surfaces an error toast and stays on the input step when analyze fails", async () => {
    apiRequest.mockRejectedValueOnce(new Error("500: boom"));

    setup();
    fireEvent.change(screen.getByTestId("input-job-description"), { target: { value: SHORT_DESCRIPTION } });
    fireEvent.change(screen.getByTestId("select-city"), { target: { value: "Casablanca" } });
    fireEvent.click(screen.getByTestId("button-analyze-job"));

    await waitFor(() => expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive", description: "Impossible d'analyser votre demande." })
    ));
    expect(screen.getByTestId("button-analyze-job")).toBeInTheDocument();
    expect(screen.queryByTestId("button-find-matches")).not.toBeInTheDocument();
  });

  it("surfaces an error toast and stays on the analysis step when finding matches fails", async () => {
    const analysis = { service: "plomberie", urgency: "normal", complexity: "simple", estimatedDuration: "1h", confidence: 0.9, keywords: [] };
    apiRequest
      .mockResolvedValueOnce({ json: async () => ({ analysis, costEstimate: { likelyCost: 300 } }) })
      .mockRejectedValueOnce(new Error("500: boom"));

    setup();
    fireEvent.change(screen.getByTestId("input-job-description"), { target: { value: SHORT_DESCRIPTION } });
    fireEvent.change(screen.getByTestId("select-city"), { target: { value: "Casablanca" } });
    fireEvent.click(screen.getByTestId("button-analyze-job"));
    await waitFor(() => screen.getByTestId("button-find-matches"));

    fireEvent.click(screen.getByTestId("button-find-matches"));

    await waitFor(() => expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive", description: "Impossible de trouver des artisans." })
    ));
    expect(screen.getByTestId("button-find-matches")).toBeInTheDocument();
  });
});

describe("PostJob URL prefill and navigation", () => {
  it("prefills the description from a ?service= query param", () => {
    mockSearch = "?service=plomberie";
    setup();
    expect(screen.getByTestId("input-job-description")).toHaveValue("J'ai besoin d'un plombier pour ");
  });

  it("lets the user go back from the analysis step to input without calling the API again", async () => {
    const analysis = { service: "plomberie", urgency: "normal", complexity: "simple", estimatedDuration: "1h", confidence: 0.9, keywords: [] };
    apiRequest.mockResolvedValueOnce({ json: async () => ({ analysis, costEstimate: { likelyCost: 300 } }) });

    setup();
    fireEvent.change(screen.getByTestId("input-job-description"), { target: { value: SHORT_DESCRIPTION } });
    fireEvent.change(screen.getByTestId("select-city"), { target: { value: "Casablanca" } });
    fireEvent.click(screen.getByTestId("button-analyze-job"));
    await waitFor(() => screen.getByTestId("button-find-matches"));

    fireEvent.click(screen.getByTestId("button-back"));

    expect(screen.getByTestId("input-job-description")).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledTimes(1);
  });
});
