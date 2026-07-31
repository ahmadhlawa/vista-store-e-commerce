import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server proxies the API and the uploaded media so the browser talks to a
// single origin; deep links such as /product/slug fall back to the SPA entry point.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/media": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/health": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    css: false,
    include: ["src/**/*.test.{js,jsx}"],
  },
});
