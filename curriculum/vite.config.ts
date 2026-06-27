import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/curriculum/",
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      "/api": {
        target: "https://api.mergecombinator.com",
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
