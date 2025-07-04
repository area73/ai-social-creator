/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: true,
    // Include files in src directory
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    // Exclude build and node_modules
    exclude: ["node_modules", "dist", ".astro"],
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
