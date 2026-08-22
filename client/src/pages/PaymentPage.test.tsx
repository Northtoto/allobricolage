import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// get() backs every useQuery in PaymentPage (booking, payment status, bank
// details) via the app's default queryFn — mock it and branch per path.
const getMock = vi.fn();
vi.mock("@/lib/api-client", async (orig) => {
  const actual = await orig<typeof import("@/lib/api-client")>();
  return { ...actual, get: (path: string) => getMock(path) };
});

// apiRequest() backs the POST /api/payments/create call in handlePayment.
const apiRequestMock = vi.fn();
vi.mock("@/lib/queryClient", async (orig) => {
  const actual = await orig<typeof import("@/lib/queryClient")>();
  return { ...actual, apiRequest: (...args: unknown[]) => apiRequestMock(...args) };
});

vi.mock("wouter", () => ({
  useRoute: () => [true, { bookingId: "booking-1" }],
  useLocation: () => ["/payment/booking-1", vi.fn()],
}));

const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastMock }) }));

vi.mock("@/components/layout/Header", () => ({ Header: () => <div data-testid="mock-header" /> }));
vi.mock("@/components/layout/Footer", () => ({ Footer: () => <div data-testid="mock-footer" /> }));

import PaymentPage from "./PaymentPage";
import { getQueryFn } from "@/lib/queryClient";

const booking = {
  id: "booking-1",
  estimatedCost: 350,
  clientPhone: "+212600000000",
  clientName: "Ahmed",
  status: "completed",
  service: "plomberie",
  scheduledDate: "2026-08-20",
  scheduledTime: "10:00",
};

const bankDetails = {
  reference: "AB-TESTXX-0001",
  companyName: "M3allem SARL",
  bankName: "Banque Centrale Populaire",
  rib: "007810000123456789012349",
  accountNumber: "12345678901234567890",
  swift: "BCPCMAMC",
};

function defaultGet(path: string) {
  if (path.startsWith("/bookings/")) return Promise.resolve(booking);
  if (path.startsWith("/payments/booking/")) return Promise.resolve(null);
  if (path.startsWith("/payments/bank-transfer/details")) return Promise.resolve(bankDetails);
  return Promise.reject(new Error(`Unexpected get() call: ${path}`));
}

function setup() {
  const qc = new QueryClient({
    defaultOptions: { queries: { queryFn: getQueryFn({ on401: "throw" }), retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <PaymentPage />
    </QueryClientProvider>
  );
}

const cashButton = () => screen.getByRole("button", { name: /Confirmer \(payer en espèces/ });

beforeEach(() => {
  vi.clearAllMocks();
  getMock.mockImplementation(defaultGet);
});

describe("PaymentPage payment method selection", () => {
  it("defaults to cash and lets the user switch between all four methods", async () => {
    setup();
    await waitFor(() => expect(cashButton()).toBeInTheDocument());

    fireEvent.click(screen.getByText("Carte bancaire marocaine (CMI)"));
    expect(screen.getByRole("button", { name: "Procéder au paiement" })).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cash Plus"));
    expect(screen.getByRole("button", { name: "Générer la référence" })).toBeInTheDocument();

    fireEvent.click(screen.getByText("Virement bancaire (RIB)"));
    expect(screen.getByRole("button", { name: "Confirmer les instructions" })).toBeInTheDocument();
    // Bank details fetch fires only once bank_transfer is selected.
    expect(await screen.findByText("M3allem SARL")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Espèces après le service"));
    expect(cashButton()).toBeInTheDocument();
  });
});

describe("PaymentPage happy paths", () => {
  it("submits a cash payment using the server-authoritative amount, not a client-edited one", async () => {
    setup();
    await waitFor(() => expect(cashButton()).toBeInTheDocument());

    // The amount is only ever rendered as text — there is no input to edit it.
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.getAllByText("350 MAD").length).toBeGreaterThan(0);

    apiRequestMock.mockResolvedValueOnce({
      json: async () => ({ paymentId: "p1", transactionId: "TRX-AAAA1111", status: "pending", bankReference: null }),
    });
    fireEvent.click(cashButton());

    await waitFor(() =>
      expect(apiRequestMock).toHaveBeenCalledWith("POST", "/api/payments/create", {
        bookingId: "booking-1",
        amount: 350,
        paymentMethod: "cash",
        currency: "MAD",
      })
    );
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Paiement en espèces confirmé" })
      )
    );
  });

  it("submits a bank transfer and syncs the on-screen reference with the one the server actually stored", async () => {
    setup();
    fireEvent.click(await screen.findByText("Virement bancaire (RIB)"));
    await screen.findByText("M3allem SARL");
    // Pre-payment reference comes from the bank-transfer/details fetch.
    expect(screen.getByText("AB-TESTXX-0001")).toBeInTheDocument();

    apiRequestMock.mockResolvedValueOnce({
      json: async () => ({ paymentId: "p2", transactionId: "TRX-BBBB2222", status: "processing", bankReference: "VIR-99998888" }),
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmer les instructions" }));

    await waitFor(() =>
      expect(apiRequestMock).toHaveBeenCalledWith(
        "POST",
        "/api/payments/create",
        expect.objectContaining({ bookingId: "booking-1", amount: 350, paymentMethod: "bank_transfer" })
      )
    );
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Instructions de virement" }))
    );
    // Reference shown now matches payment.bankReference (what reconciliation uses).
    expect(await screen.findByText("VIR-99998888")).toBeInTheDocument();
    expect(screen.queryByText("AB-TESTXX-0001")).not.toBeInTheDocument();
  });

  it("surfaces the real CashPlus reference (payment.bankReference), not the internal transactionId", async () => {
    setup();
    fireEvent.click(await screen.findByText("Cash Plus"));

    apiRequestMock.mockResolvedValueOnce({
      json: async () => ({ paymentId: "p3", transactionId: "TRX-CCCC3333", status: "pending", bankReference: "CP-DEAD1234" }),
    });
    fireEvent.click(screen.getByRole("button", { name: "Générer la référence" }));

    expect(await screen.findByText("CP-DEAD1234")).toBeInTheDocument();
    expect(screen.queryByText("TRX-CCCC3333")).not.toBeInTheDocument();
  });
});

describe("PaymentPage blocked / edge states", () => {
  it("blocks payment and explains why when the booking has no estimatedCost yet (no devis sent)", async () => {
    getMock.mockImplementation((path: string) => {
      if (path.startsWith("/bookings/")) return Promise.resolve({ ...booking, estimatedCost: null });
      return defaultGet(path);
    });
    setup();

    expect(await screen.findByText(/montant n'est pas encore défini/i)).toBeInTheDocument();
    expect(screen.queryByText("Espèces après le service")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Confirmer/ })).not.toBeInTheDocument();
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("shows a not-found state for an unknown booking", async () => {
    getMock.mockImplementation((path: string) => {
      if (path.startsWith("/bookings/")) return Promise.reject(new Error("404: booking not found"));
      return defaultGet(path);
    });
    setup();

    expect(await screen.findByText("Réservation introuvable")).toBeInTheDocument();
  });

  it("shows the confirmed state and hides the method picker once payment is already completed", async () => {
    getMock.mockImplementation((path: string) => {
      if (path.startsWith("/payments/booking/")) return Promise.resolve({ status: "completed", amount: 350 });
      return defaultGet(path);
    });
    setup();

    expect(await screen.findByText("Paiement reçu avec succès!")).toBeInTheDocument();
    expect(screen.queryByText("Espèces après le service")).not.toBeInTheDocument();
  });
});

describe("PaymentPage error handling", () => {
  it("shows the server's real validation message instead of the raw JSON error envelope", async () => {
    setup();
    await waitFor(() => expect(cashButton()).toBeInTheDocument());

    apiRequestMock.mockRejectedValueOnce(
      new Error(
        '400: {"success":false,"error":{"code":"VALIDATION_ERROR","message":"Le montant n\'est pas encore défini. Le technicien doit d\'abord envoyer un devis.","details":{"fields":{"amount":"not_set"}}}}'
      )
    );
    fireEvent.click(cashButton());

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({
        title: "Erreur",
        description: "Le montant n'est pas encore défini. Le technicien doit d'abord envoyer un devis.",
        variant: "destructive",
      })
    );
  });

  it("shows a friendly connection message on a network failure", async () => {
    setup();
    await waitFor(() => expect(cashButton()).toBeInTheDocument());

    apiRequestMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    fireEvent.click(cashButton());

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Erreur",
          description: "Problème de connexion. Vérifiez votre réseau internet.",
        })
      )
    );
  });
});
