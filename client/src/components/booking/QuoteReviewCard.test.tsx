import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const get = vi.fn();
const apiRequest = vi.fn();
vi.mock("@/lib/api-client", () => ({ get: (p: string) => get(p) }));
vi.mock("@/lib/queryClient", () => ({ apiRequest: (...a: unknown[]) => apiRequest(...a) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { QuoteReviewCard } from "./QuoteReviewCard";

const BOOKING_ID = "11111111-1111-1111-1111-111111111111";
const QUOTE_ID = "22222222-2222-2222-2222-222222222222";

const pendingQuote = {
  id: QUOTE_ID,
  bookingId: BOOKING_ID,
  description: "Remplacement robinet",
  amount: 350,
  laborCost: 250,
  materialsCost: 100,
  status: "pending" as const,
  priceFlag: "normal" as const,
  expectedMin: 200,
  expectedMax: 400,
};

function renderCard() {
  // Mirrors queryClient's getQueryFn: joins the key, strips a leading /api,
  // and routes through the (mocked) api-client get().
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        queryFn: ({ queryKey }) => get((queryKey as string[]).join("/").replace(/^\/api/, "")),
      },
    },
  });
  return render(
    <QueryClientProvider client={qc}>
      <QuoteReviewCard bookingId={BOOKING_ID} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  apiRequest.mockResolvedValue({ json: async () => ({ status: "accepted" }) });
});

describe("QuoteReviewCard", () => {
  it("fetches quotes for the booking and renders the pending one", async () => {
    get.mockResolvedValue([pendingQuote]);
    renderCard();
    expect(get).toHaveBeenCalledWith(`/quotes/booking/${BOOKING_ID}`);
    await waitFor(() => expect(screen.getByText("350 MAD")).toBeInTheDocument());
  });

  it("renders nothing when there is no pending quote", async () => {
    get.mockResolvedValue([{ ...pendingQuote, status: "accepted" }]);
    renderCard();
    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(screen.queryByText(/Devis reçu/)).not.toBeInTheDocument();
  });

  it("accepting a quote calls POST /api/quotes/:id/accept", async () => {
    get.mockResolvedValue([pendingQuote]);
    renderCard();
    const acceptBtn = await screen.findByTestId(`button-accept-quote-${QUOTE_ID}`);
    fireEvent.click(acceptBtn);
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith("POST", `/api/quotes/${QUOTE_ID}/accept`)
    );
  });

  it("rejecting a quote calls POST /api/quotes/:id/reject", async () => {
    get.mockResolvedValue([pendingQuote]);
    renderCard();
    const rejectBtn = await screen.findByTestId(`button-reject-quote-${QUOTE_ID}`);
    fireEvent.click(rejectBtn);
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith("POST", `/api/quotes/${QUOTE_ID}/reject`)
    );
  });
});
