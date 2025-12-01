import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n/config";

// Initialize seed data on first load (development only)
if (import.meta.env.DEV) {
  (async () => {
    const { initializeSeedData } = await import("./data/seedData");
    initializeSeedData();
  })();
}

createRoot(document.getElementById("root")!).render(<App />);
