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
      // Shared mc-site assets — loaded dynamically from main.tsx with
      // absolute paths (/styles.css, /js/navbar.js) to avoid Vite's base
      // rewriting. Forward to the main site dev server (port 3000).
      "/styles.css": { target: "http://localhost:3000", changeOrigin: true },
      "/styles/": { target: "http://localhost:3000", changeOrigin: true },
      "/js/": { target: "http://localhost:3000", changeOrigin: true },
      "/data/": { target: "http://localhost:3000", changeOrigin: true },
      "/assets/": { target: "http://localhost:3000", changeOrigin: true },
      "/auth/": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
});
