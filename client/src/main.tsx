import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App";
import "./index.css";
import "./i18n/config";

// Error tracking for production
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__allobricolage_errors = [];

  window.addEventListener("error", (event) => {
    const errors = (window as unknown as Record<string, Array<Record<string, unknown>>>).__allobricolage_errors;
    errors.push({
      type: "error",
      message: event.error?.message ?? event.message,
      stack: event.error?.stack,
      url: window.location.href,
      time: new Date().toISOString(),
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const errors = (window as unknown as Record<string, Array<Record<string, unknown>>>).__allobricolage_errors;
    errors.push({
      type: "unhandledrejection",
      message: String(event.reason),
      url: window.location.href,
      time: new Date().toISOString(),
    });
  });
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element not found");
}

createRoot(rootEl).render(
  <>
    <App />
    <Analytics />
    <SpeedInsights />
  </>,
);
