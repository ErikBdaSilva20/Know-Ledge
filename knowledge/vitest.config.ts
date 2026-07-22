import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Standalone Vitest config kept separate from vite.config.ts (which is a
// protected foundation file). The `@/` alias mirrors tsconfig.json's paths so
// tests import modules exactly as the app does. jsdom gives the handful of
// tests that touch localStorage / window events a real DOM.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}", "dev/**/*.{test,spec}.ts"],
    globals: false,
  },
});
