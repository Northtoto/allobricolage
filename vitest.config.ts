import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const r = (p: string) => path.resolve(__dirname, p);

export default defineConfig({
  test: {
    // Two projects: server code (node, @ -> server) and client code
    // (jsdom + React, @ -> client/src). Each needs its own alias + environment.
    projects: [
      {
        resolve: { alias: { "@": r("./server"), "@shared": r("./shared") } },
        test: {
          name: "server",
          globals: true,
          environment: "node",
          setupFiles: ["./vitest.setup.ts"],
          include: ["server/**/*.test.ts", "shared/**/*.test.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: { alias: { "@": r("./client/src"), "@shared": r("./shared") } },
        test: {
          name: "client",
          globals: true,
          environment: "jsdom",
          setupFiles: ["./vitest.client-setup.ts"],
          include: ["client/src/**/*.test.{ts,tsx}"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: [
        "server/services/**",
        "server/utils/**",
        "server/middleware/validate-request.ts",
        "server/middleware/account-lockout.ts",
        "client/src/lib/api-client.ts",
      ],
      reporter: ["text", "html"],
    },
  },
});
