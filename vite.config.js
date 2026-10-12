import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Forward /api calls to the Node backend so the browser has no CORS trouble
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:5000" } },
});
