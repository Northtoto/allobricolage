import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const apiRequest = vi.fn();
const toast = vi.fn();
vi.mock("@/lib/queryClient", () => ({ apiRequest: (...a: unknown[]) => apiRequest(...a) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/", vi.fn()] }));
// framer-motion: render children plainly so we can assert on content.
vi.mock("framer-motion", () => ({
  motion: new Proxy({}, { get: () => (p: any) => <div>{p.children}</div> }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

import { JobImageAnalyzer } from "./JobImageAnalyzer";

beforeEach(() => {
  apiRequest.mockReset();
  toast.mockReset();
});

// A minimal FileReader stub that yields a fixed data URL synchronously-ish.
function stubFileReader(dataUrl: string) {
  class FR {
    result: string | null = null;
    onloadend: (() => void) | null = null;
    readAsDataURL() {
      this.result = dataUrl;
      this.onloadend?.();
    }
  }
  vi.stubGlobal("FileReader", FR as unknown as typeof FileReader);
}

function uploadFile(type = "image/png") {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(["x"], "broken.png", { type });
  fireEvent.change(input, { target: { files: [file] } });
}

describe("JobImageAnalyzer", () => {
  it("posts imageDataUrl and unwraps the { data } envelope to show the estimate", async () => {
    stubFileReader("data:image/png;base64,iVBORw0KGgo=");
    apiRequest.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          analysis: { service: "plomberie", urgency: "high", subServices: [], complexity: "moderate", estimatedDuration: "2h", confidence: 0.8 },
          costEstimate: { minCost: 300, likelyCost: 450, maxCost: 600, explanation: "fuite visible" },
        },
      }),
    });

    render(<JobImageAnalyzer />);
    uploadFile();
    fireEvent.click(await screen.findByText(/Lancer le diagnostic IA/i));

    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(
      "POST",
      "/api/jobs/analyze-image",
      expect.objectContaining({ imageDataUrl: expect.stringContaining("data:image/png") }),
    ));
    // The unwrapped costEstimate renders (proves we read body.data, not body).
    expect(await screen.findByText(/300 - 600 MAD/)).toBeInTheDocument();
  });

  it("rejects an unsupported file type with a friendly toast", () => {
    stubFileReader("data:image/gif;base64,R0lGODlh");
    render(<JobImageAnalyzer />);
    uploadFile("image/gif");
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Format non supporté" }));
    expect(apiRequest).not.toHaveBeenCalled();
  });
});
