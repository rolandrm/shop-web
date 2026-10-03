import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(
        import.meta.dirname,
        "node_modules/server-only/empty.js",
      ),
    },
  },
  test: {
    environment: "jsdom",
    server: { deps: { inline: ["next-intl"] } },
    setupFiles: ["./vitest.setup.ts"],
    env: {
      BACKEND_API_URL: "http://backend.test",
    },
  },
});
