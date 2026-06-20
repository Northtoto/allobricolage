import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const apiRequest = vi.fn();
const toast = vi.fn();
vi.mock("@/lib/queryClient", () => ({ apiRequest: (...a: unknown[]) => apiRequest(...a) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

import { CashCollectedButton } from "./CashCollectedButton";

function jsonOk(data: unknown) {
  return { ok: true, status: 200, json: async () => ({ success: true, data }) };
}

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CashCollectedButton bookingId="b-1" />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  apiRequest.mockReset();
  toast.mockReset();
});

describe("CashCollectedButton", () => {
  it("renders nothing for a non-cash payment method", async () => {
    apiRequest.mockResolvedValueOnce(jsonOk({ paymentId: "p1", status: "processing", paymentMethod: "stripe", bankReference: null }));
    const { container } = setup();
    await waitFor(() => expect(apiRequest).toHaveBeenCalled());
    expect(screen.queryByTestId("button-cash-collected")).not.toBeInTheDocument();
    expect(container.querySelector('[data-testid="cash-collected-done"]')).toBeNull();
  });

  it("shows the button for an unsettled cash payment and confirms collection", async () => {
    apiRequest.mockResolvedValueOnce(jsonOk({ paymentId: "p1", status: "pending", paymentMethod: "cash", bankReference: null }));
    setup();

    const btn = await screen.findByTestId("button-cash-collected");
    expect(btn).toHaveTextContent("Cash collecté");

    apiRequest.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true, data: {} }) });
    fireEvent.click(btn);

    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith("POST", "/api/payments/p1/confirm-cash"));
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Encaissement confirmé" }));
  });

  it("shows a settled state for an already-collected payment", async () => {
    apiRequest.mockResolvedValueOnce(jsonOk({ paymentId: "p1", status: "completed", paymentMethod: "cashplus", bankReference: "CP-ABCD1234" }));
    setup();
    expect(await screen.findByTestId("cash-collected-done")).toBeInTheDocument();
  });
});
