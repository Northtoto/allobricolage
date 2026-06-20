import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const apiRequest = vi.fn();
const toast = vi.fn();
vi.mock("@/lib/queryClient", () => ({ apiRequest: (...a: unknown[]) => apiRequest(...a) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

import { WarrantyClaimButton } from "./WarrantyClaimButton";

beforeEach(() => {
  apiRequest.mockReset();
  toast.mockReset();
});

function openDialog() {
  render(<WarrantyClaimButton bookingId="b-1" />);
  fireEvent.click(screen.getByTestId("button-warranty-claim"));
}

describe("WarrantyClaimButton", () => {
  it("keeps submit disabled until the description meets the 20-char minimum", () => {
    openDialog();
    const submit = screen.getByTestId("button-warranty-submit");
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByTestId("input-warranty-description"), {
      target: { value: "trop court" },
    });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByTestId("input-warranty-description"), {
      target: { value: "La fuite est réapparue deux jours après la réparation." },
    });
    expect(submit).not.toBeDisabled();
  });

  it("posts the claim and toasts success on a 201", async () => {
    apiRequest.mockResolvedValue({ ok: true, status: 201 });
    openDialog();
    fireEvent.change(screen.getByTestId("input-warranty-description"), {
      target: { value: "La fuite est réapparue deux jours après la réparation." },
    });
    fireEvent.click(screen.getByTestId("button-warranty-submit"));

    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(
      "POST",
      "/api/disputes/warranty-claim",
      expect.objectContaining({ bookingId: "b-1" }),
    ));
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Réclamation envoyée" }));
  });

  it("surfaces a friendly message when the service is out of warranty (422)", async () => {
    apiRequest.mockResolvedValue({ ok: false, status: 422 });
    openDialog();
    fireEvent.change(screen.getByTestId("input-warranty-description"), {
      target: { value: "La fuite est réapparue deux jours après la réparation." },
    });
    fireEvent.click(screen.getByTestId("button-warranty-submit"));

    await waitFor(() => expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" }),
    ));
  });
});
