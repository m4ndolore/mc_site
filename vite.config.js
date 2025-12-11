import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  // Only process the root index.html, ignore Framer exports
  build: {
    rollupOptions: {
      input: './index.html'
    }
  }
})