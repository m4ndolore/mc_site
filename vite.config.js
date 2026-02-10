import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    allowedHosts: ['macbook-pro.tail45afa7.ts.net'],
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
        dashboard: resolve(__dirname, 'dashboard.html'),
        status: resolve(__dirname, 'status.html'),
        merch: resolve(__dirname, 'merch.html'),
        opportunities: resolve(__dirname, 'opportunities.html'),
        knowledge: resolve(__dirname, 'knowledge.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
        security: resolve(__dirname, 'security.html'),
        archive: resolve(__dirname, 'archive.html'),
        access: resolve(__dirname, 'access.html'),
        contribute: resolve(__dirname, 'contribute.html'),
        // combine.html removed - redirects to /programs/the-combine
        wingman: resolve(__dirname, 'wingman.html'),
        guild: resolve(__dirname, 'guild.html'),
        briefs: resolve(__dirname, 'briefs.html'),
        about: resolve(__dirname, 'about.html'),
        '404': resolve(__dirname, '404.html'),
        // Programs
        'programs-index': resolve(__dirname, 'programs/index.html'),
        'programs-combine': resolve(__dirname, 'programs/the-combine.html'),
        // Knowledge base
        'knowledge-gtm': resolve(__dirname, 'knowledge/go-to-market.html'),
        'knowledge-acq': resolve(__dirname, 'knowledge/acquisition.html'),
        'knowledge-sbir': resolve(__dirname, 'knowledge/sbir.html'),
        'knowledge-compliance': resolve(__dirname, 'knowledge/compliance.html'),
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
