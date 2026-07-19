import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Plain Vite SPA — no SSR, no server entry, no server build target.
// See ADR/audit note: this project must build to a static bundle only
// (Importantdoc.md: "Vite (SPA estático)... Sem Next.js / SSR").
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [react(), tailwindcss()],
});
