import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async ({ mode }) => {
  const plugins = [react()];

  // Only load Replit plugins in development and if REPL_ID is set
  if (mode !== "production" && process.env.REPL_ID !== undefined) {
    try {
      const runtimeErrorOverlay = (await import("@replit/vite-plugin-runtime-error-modal")).default;
      const { cartographer } = await import("@replit/vite-plugin-cartographer");
      const { devBanner } = await import("@replit/vite-plugin-dev-banner");
      
      plugins.push(runtimeErrorOverlay(), cartographer(), devBanner());
    } catch (e) {
      // Replit plugins not available, skip them
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
