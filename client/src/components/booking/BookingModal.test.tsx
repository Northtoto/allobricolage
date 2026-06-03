import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Authenticated user + a booking mutation we can assert on.
const apiRequest = vi.fn();
vi.mock("@/lib/queryClient", () => ({ apiRequest: (...a: unknown[]) => apiRequest(...a) }));
vi.mock("wouter", () => ({ useLocation: () => ["/", vi.fn()] }));
vi.mock("@/lib/i18n", () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { BookingModal } from "./BookingModal";

const technician = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Test Tech", photo: null, rating: 4.8, reviewCount: 30, isVerified: true,
  hourlyRate: 200, city: "Casablanca", services: ["plomberie"],
} as never;

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // Seed the auth query so the modal sees an authenticated user.
  qc.setQueryData(["/api/auth/me"], { id: "user-1", name: "Client" });
  return render(
    <QueryClientProvider client={qc}>
      <BookingModal isOpen onClose={() => {}} technician={technician} jobId="direct" />
    </QueryClientProvider>
  );
}

function fillDetails() {
  fireEvent.change(screen.getByTestId("input-client-name"), { target: { value: "Ahmed" } });
  fireEvent.change(screen.getByTestId("input-client-phone"), { target: { value: "+212600000000" } });
  fireEvent.change(screen.getByTestId("input-scheduled-date"), { target: { value: "2026-06-15" } });
  fireEvent.change(screen.getByTestId("select-scheduled-time"), { target: { value: "10:00" } });
}

beforeEach(() => {
  vi.clearAllMocks();
  apiRequest.mockResolvedValue({ json: async () => ({ id: "booking-1" }) });
});

describe("BookingModal 2-step flow (adopted booking pattern)", () => {
  it("does not book directly from the details step — shows a review step first", async () => {
    setup();
    fillDetails();
    fireEvent.click(screen.getByTestId("button-continue-booking"));

    await waitFor(() => expect(screen.getByTestId("booking-review-step")).toBeInTheDocument());
    // API must NOT have been called yet (no accidental direct booking).
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("surfaces the written-devis trust step on review (anti-arnaque expectation)", async () => {
    setup();
    fillDetails();
    fireEvent.click(screen.getByTestId("button-continue-booking"));
    await waitFor(() => screen.getByTestId("booking-review-step"));
    expect(screen.getByText(/devis écrit à valider/i)).toBeInTheDocument();
  });

  it("books only after explicit confirm on the review step", async () => {
    setup();
    fillDetails();
    fireEvent.click(screen.getByTestId("button-continue-booking"));
    await waitFor(() => screen.getByTestId("button-confirm-booking"));
    fireEvent.click(screen.getByTestId("button-confirm-booking"));
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith("POST", "/api/bookings", expect.objectContaining({
      technicianId: technician.id, clientName: "Ahmed",
    })));
  });

  it("can go back from review to edit details", async () => {
    setup();
    fillDetails();
    fireEvent.click(screen.getByTestId("button-continue-booking"));
    await waitFor(() => screen.getByTestId("button-back-booking"));
    fireEvent.click(screen.getByTestId("button-back-booking"));
    expect(screen.getByTestId("input-client-name")).toBeInTheDocument();
  });
});
