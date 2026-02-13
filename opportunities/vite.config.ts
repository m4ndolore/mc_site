import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/opportunities/",
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: "https://opportunities-api.defensebuilders.workers.dev",
        changeOrigin: true,
      },
    },
  },
});
