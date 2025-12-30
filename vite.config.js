import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://webhook-667608980042.us-central1.run.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        blog: resolve(__dirname, 'blog.html'),
        portfolio: resolve(__dirname, 'portfolio.html'),
        builders: resolve(__dirname, 'builders.html'),
        merch: resolve(__dirname, 'merch.html'),
        // Blog articles
        'blog-counter-drone': resolve(__dirname, 'blog/counter-drone-jiatf-401.html'),
        'blog-ndaa': resolve(__dirname, 'blog/ndaa-speed-act.html'),
        'blog-eisenhower': resolve(__dirname, 'blog/uss-eisenhower-lessons.html'),
      }
    },
    // Copy public folder to output (includes _redirects, _headers for Cloudflare)
    copyPublicDir: true
  }
})