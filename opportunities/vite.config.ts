import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/opportunities/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        sbir: "sbir/index.html",
        sttr: "sttr/index.html",
      },
    },
  },
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
