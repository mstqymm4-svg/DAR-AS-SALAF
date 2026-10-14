import { defineConfig } from "vitest/config";

export default defineConfig({
  // Prevent Vite from loading the frontend's root postcss/tailwind config.
  css: { postcss: {} },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    testTimeout: 20000,
  },
});
