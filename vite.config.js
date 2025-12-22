import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        blog: resolve(__dirname, 'blog.html'),
        portfolio: resolve(__dirname, 'portfolio.html'),
        builders: resolve(__dirname, 'builders.html'),
      }
    },
    // Copy script.js to output
    copyPublicDir: false
  },
  publicDir: false
})