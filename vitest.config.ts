import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./server"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["server/**/*.test.ts", "shared/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["server/services/**", "server/utils/**", "server/middleware/validate-request.ts"],
      reporter: ["text", "html"],
    },
  },
});
