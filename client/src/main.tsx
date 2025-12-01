import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n/config";
import { initializeSeedData } from "./data/seedData";

// Initialize seed data on first load
initializeSeedData();

createRoot(document.getElementById("root")!).render(<App />);
