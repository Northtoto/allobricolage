import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const apiRequest = vi.fn();
vi.mock("@/lib/queryClient", () => ({ apiRequest: (...a: unknown[]) => apiRequest(...a) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { SubmitQuoteDialog } from "./SubmitQuoteDialog";

const BOOKING_ID = "33333333-3333-3333-3333-333333333333";

function renderDialog() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SubmitQuoteDialog bookingId={BOOKING_ID} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  apiRequest.mockResolvedValue({ json: async () => ({ id: "quote-1" }) });
});

describe("SubmitQuoteDialog", () => {
  it("submit is disabled until a description and a positive total are provided", () => {
    renderDialog();
    fireEvent.click(screen.getByTestId(`button-submit-quote-${BOOKING_ID}`));
    expect(screen.getByTestId("button-confirm-quote")).toBeDisabled();
  });

  it("opens the devis form and submits labor+materials cost to POST /api/quotes", async () => {
    renderDialog();
    fireEvent.click(screen.getByTestId(`button-submit-quote-${BOOKING_ID}`));

    fireEvent.change(screen.getByTestId("textarea-quote-description"), {
      target: { value: "Remplacement du robinet" },
    });
    fireEvent.change(screen.getByTestId("input-quote-labor-cost"), { target: { value: "250" } });
    fireEvent.change(screen.getByTestId("input-quote-materials-cost"), { target: { value: "100" } });

    expect(screen.getByTestId("button-confirm-quote")).not.toBeDisabled();
    fireEvent.click(screen.getByTestId("button-confirm-quote"));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        "POST",
        "/api/quotes",
        expect.objectContaining({
          bookingId: BOOKING_ID,
          description: "Remplacement du robinet",
          laborCost: 250,
          materialsCost: 100,
        })
      )
    );
  });
});
