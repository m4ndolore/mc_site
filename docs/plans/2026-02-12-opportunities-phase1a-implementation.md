# Opportunities Phase 1a: Frontend Migration & API Foundation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate SBIR frontend from Railway to Cloudflare Pages, establish unified API structure, eliminate proxy issues.

**Architecture:** React frontend on CF Pages, API Worker for opportunities endpoints, existing SBIR scraper continues on Railway as data source.

**Tech Stack:** React 19, TypeScript, Vite, Cloudflare Pages, Cloudflare Workers, Hono (API framework)

---

## Prerequisites

- Working in worktree: `.worktrees/opportunities-expansion`
- SBIR scraper repo at: `/Users/paulgarcia/Dev/misfits_scraper`
- CF account with Pages and Workers access

---

## Task 1: Create Opportunities Frontend Project

**Files:**
- Create: `opportunities/` (new directory in mc_site)
- Create: `opportunities/package.json`
- Create: `opportunities/vite.config.ts`
- Create: `opportunities/tsconfig.json`
- Create: `opportunities/index.html`

**Step 1: Create project structure**

```bash
mkdir -p opportunities/src
cd opportunities
```

**Step 2: Initialize package.json**

Create `opportunities/package.json`:
```json
{
  "name": "mc-opportunities",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.4.0",
    "typescript": "~5.8.0",
    "vite": "^6.0.0"
  }
}
```

**Step 3: Create vite.config.ts**

Create `opportunities/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5174,
  },
})
```

**Step 4: Create tsconfig.json**

Create `opportunities/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**Step 5: Create index.html**

Create `opportunities/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Opportunities | Merge Combinator</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 6: Install dependencies**

```bash
cd opportunities && npm install
```

**Step 7: Commit**

```bash
git add opportunities/
git commit -m "feat(opportunities): initialize frontend project structure"
```

---

## Task 2: Create Base React App with MC Branding

**Files:**
- Create: `opportunities/src/main.tsx`
- Create: `opportunities/src/App.tsx`
- Create: `opportunities/src/styles/globals.css`
- Create: `opportunities/src/components/Layout.tsx`

**Step 1: Create main.tsx entry point**

Create `opportunities/src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

**Step 2: Create globals.css with MC design tokens**

Create `opportunities/src/styles/globals.css`:
```css
:root {
  /* MC Design Tokens */
  --mc-bg: #0b1116;
  --mc-bg-secondary: #111820;
  --mc-bg-tertiary: #1a222c;
  --mc-border: rgba(255, 255, 255, 0.1);
  --mc-text: #e5e7eb;
  --mc-text-muted: rgba(229, 231, 235, 0.6);
  --mc-accent: #0ea5e9;
  --mc-accent-hover: #38bdf8;
  --mc-success: #22c55e;
  --mc-warning: #f59e0b;
  --mc-error: #ef4444;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--mc-bg);
  color: var(--mc-text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--mc-accent);
  text-decoration: none;
}

a:hover {
  color: var(--mc-accent-hover);
}
```

**Step 3: Create Layout component**

Create `opportunities/src/components/Layout.tsx`:
```tsx
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <a href="https://mergecombinator.com" className="logo">
            Merge Combinator
          </a>
          <span className="page-title">Opportunities</span>
        </div>
      </header>
      <main className="main">
        {children}
      </main>
      <footer className="footer">
        <div className="footer-content">
          <span>© 2026 Merge Combinator</span>
          <nav className="footer-nav">
            <a href="https://mergecombinator.com/builders">Builders</a>
            <a href="https://mergecombinator.com/combine">Combine</a>
            <a href="https://mergecombinator.com/knowledge">Knowledge</a>
          </nav>
        </div>
      </footer>
      <style>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .header {
          background: var(--mc-bg);
          border-bottom: 1px solid var(--mc-border);
          padding: 12px 24px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
        }
        .logo {
          font-weight: 600;
          font-size: 18px;
          color: var(--mc-text);
        }
        .page-title {
          color: var(--mc-text-muted);
          font-size: 14px;
        }
        .main {
          flex: 1;
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          width: 100%;
        }
        .footer {
          background: var(--mc-bg);
          border-top: 1px solid var(--mc-border);
          padding: 16px 24px;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
          font-size: 14px;
          color: var(--mc-text-muted);
        }
        .footer-nav {
          display: flex;
          gap: 24px;
        }
        .footer-nav a {
          color: var(--mc-text-muted);
        }
        .footer-nav a:hover {
          color: var(--mc-accent);
        }
      `}</style>
    </div>
  )
}
```

**Step 4: Create App.tsx**

Create `opportunities/src/App.tsx`:
```tsx
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'

function HomePage() {
  return (
    <div>
      <h1 style={{ marginBottom: '16px' }}>Defense Opportunities</h1>
      <p style={{ color: 'var(--mc-text-muted)' }}>
        Find relevant contracts, grants, and opportunities.
      </p>
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Layout>
  )
}
```

**Step 5: Test dev server**

```bash
cd opportunities && npm run dev
```

Expected: Dev server runs on http://localhost:5174, shows MC-branded page

**Step 6: Commit**

```bash
git add opportunities/src/
git commit -m "feat(opportunities): add base React app with MC branding"
```

---

## Task 3: Set Up Opportunities API Worker

**Files:**
- Create: `cloudflare/opportunities-api/`
- Create: `cloudflare/opportunities-api/package.json`
- Create: `cloudflare/opportunities-api/wrangler.toml`
- Create: `cloudflare/opportunities-api/src/index.ts`

**Step 1: Create API worker directory**

```bash
mkdir -p cloudflare/opportunities-api/src
```

**Step 2: Create package.json**

Create `cloudflare/opportunities-api/package.json`:
```json
{
  "name": "opportunities-api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest"
  },
  "dependencies": {
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "typescript": "^5.0.0",
    "wrangler": "^3.0.0",
    "vitest": "^1.0.0"
  }
}
```

**Step 3: Create wrangler.toml**

Create `cloudflare/opportunities-api/wrangler.toml`:
```toml
name = "opportunities-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
SBIR_API_URL = "https://sbir.mergecombinator.com"

# Future: Add D1 database binding
# [[d1_databases]]
# binding = "DB"
# database_name = "opportunities"
# database_id = "xxx"
```

**Step 4: Create tsconfig.json**

Create `cloudflare/opportunities-api/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src"]
}
```

**Step 5: Create API with Hono**

Create `cloudflare/opportunities-api/src/index.ts`:
```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  SBIR_API_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS for frontend
app.use('*', cors({
  origin: [
    'https://mergecombinator.com',
    'https://www.mergecombinator.com',
    'http://localhost:5174',
  ],
}))

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// List opportunities (proxy to SBIR for now)
app.get('/api/opportunities', async (c) => {
  const { page = '0', size = '25' } = c.req.query()

  // For now, proxy to existing SBIR API
  const searchParams = { topicStatuses: ['591', '592'] }
  const encodedParams = encodeURIComponent(JSON.stringify(searchParams))
  const url = `https://www.dodsbirsttr.mil/topics/api/public/topics/search?searchParam=${encodedParams}&size=${size}&page=${page}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    return c.json({
      success: true,
      data: data.data || [],
      pagination: {
        page: parseInt(page),
        size: parseInt(size),
        total: data.totalElements || 0,
      },
      source: 'sbir',
    })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch opportunities' }, 500)
  }
})

// Get single opportunity
app.get('/api/opportunities/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const response = await fetch(
      `https://www.dodsbirsttr.mil/topics/api/public/topics/${id}/details`
    )
    const data = await response.json()

    return c.json({ success: true, data })
  } catch (error) {
    return c.json({ success: false, error: 'Opportunity not found' }, 404)
  }
})

export default app
```

**Step 6: Install dependencies**

```bash
cd cloudflare/opportunities-api && npm install
```

**Step 7: Test locally**

```bash
npm run dev
```

Expected: Worker runs, `curl http://localhost:8787/health` returns `{"status":"ok"}`

**Step 8: Commit**

```bash
git add cloudflare/opportunities-api/
git commit -m "feat(opportunities): add API worker with Hono"
```

---

## Task 4: Create Opportunity Types and API Client

**Files:**
- Create: `opportunities/src/types/opportunity.ts`
- Create: `opportunities/src/lib/api.ts`

**Step 1: Create opportunity types**

Create `opportunities/src/types/opportunity.ts`:
```typescript
export interface Opportunity {
  id: string
  topicId: string
  topicCode: string
  topicTitle: string
  description: string
  objective?: string
  component: string
  program: string
  topicStatus: string
  openDate?: string
  closeDate?: string
  technologyAreas?: string[]
  focusAreas?: string[]
  keywords?: string[]

  // Unified fields (for future multi-source)
  source: 'sbir' | 'sam' | 'grants' | 'diu' | 'afwerx'
  postedDate: string
  responseDeadline?: string
  estimatedValue?: {
    min?: number
    max?: number
  }
}

export interface OpportunityListResponse {
  success: boolean
  data: Opportunity[]
  pagination: {
    page: number
    size: number
    total: number
  }
  source: string
}

export interface OpportunityDetailResponse {
  success: boolean
  data: Opportunity
}
```

**Step 2: Create API client**

Create `opportunities/src/lib/api.ts`:
```typescript
import type { OpportunityListResponse, OpportunityDetailResponse } from '../types/opportunity'

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8787'
  : 'https://opportunities-api.defensebuilders.workers.dev'

export async function fetchOpportunities(
  page = 0,
  size = 25
): Promise<OpportunityListResponse> {
  const response = await fetch(
    `${API_BASE}/api/opportunities?page=${page}&size=${size}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch opportunities')
  }

  return response.json()
}

export async function fetchOpportunity(
  id: string
): Promise<OpportunityDetailResponse> {
  const response = await fetch(`${API_BASE}/api/opportunities/${id}`)

  if (!response.ok) {
    throw new Error('Opportunity not found')
  }

  return response.json()
}
```

**Step 3: Commit**

```bash
git add opportunities/src/types/ opportunities/src/lib/
git commit -m "feat(opportunities): add types and API client"
```

---

## Task 5: Create Opportunity List Component

**Files:**
- Create: `opportunities/src/components/OpportunityCard.tsx`
- Create: `opportunities/src/components/OpportunityList.tsx`
- Modify: `opportunities/src/App.tsx`

**Step 1: Create OpportunityCard component**

Create `opportunities/src/components/OpportunityCard.tsx`:
```tsx
import type { Opportunity } from '../types/opportunity'

interface OpportunityCardProps {
  opportunity: Opportunity
  onClick: () => void
}

export function OpportunityCard({ opportunity, onClick }: OpportunityCardProps) {
  return (
    <div className="opportunity-card" onClick={onClick}>
      <div className="card-header">
        <span className="topic-code">{opportunity.topicCode}</span>
        <span className="component">{opportunity.component}</span>
      </div>
      <h3 className="title">{opportunity.topicTitle}</h3>
      <p className="description">
        {opportunity.description?.slice(0, 200)}
        {opportunity.description && opportunity.description.length > 200 ? '...' : ''}
      </p>
      <div className="card-footer">
        <span className="status">{opportunity.topicStatus}</span>
        {opportunity.closeDate && (
          <span className="deadline">
            Due: {new Date(opportunity.closeDate).toLocaleDateString()}
          </span>
        )}
      </div>
      <style>{`
        .opportunity-card {
          background: var(--mc-bg-secondary);
          border: 1px solid var(--mc-border);
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .opportunity-card:hover {
          border-color: var(--mc-accent);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
        }
        .topic-code {
          color: var(--mc-accent);
          font-weight: 600;
        }
        .component {
          color: var(--mc-text-muted);
        }
        .title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          line-height: 1.4;
        }
        .description {
          font-size: 14px;
          color: var(--mc-text-muted);
          margin-bottom: 12px;
          line-height: 1.5;
        }
        .card-footer {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        .status {
          color: var(--mc-success);
        }
        .deadline {
          color: var(--mc-warning);
        }
      `}</style>
    </div>
  )
}
```

**Step 2: Create OpportunityList component**

Create `opportunities/src/components/OpportunityList.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { OpportunityCard } from './OpportunityCard'
import { fetchOpportunities } from '../lib/api'
import type { Opportunity } from '../types/opportunity'

interface OpportunityListProps {
  onSelect: (opportunity: Opportunity) => void
}

export function OpportunityList({ onSelect }: OpportunityListProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetchOpportunities(page, 25)
        setOpportunities(response.data)
        setTotal(response.pagination.total)
      } catch (err) {
        setError('Failed to load opportunities')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page])

  if (loading) {
    return <div className="loading">Loading opportunities...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="opportunity-list">
      <div className="list-header">
        <span>{total} opportunities found</span>
      </div>
      <div className="list-grid">
        {opportunities.map((opp) => (
          <OpportunityCard
            key={opp.topicId || opp.id}
            opportunity={opp}
            onClick={() => onSelect(opp)}
          />
        ))}
      </div>
      <div className="pagination">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Previous
        </button>
        <span>Page {page + 1}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={(page + 1) * 25 >= total}
        >
          Next
        </button>
      </div>
      <style>{`
        .opportunity-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .list-header {
          color: var(--mc-text-muted);
          font-size: 14px;
        }
        .list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 16px;
        }
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 16px 0;
        }
        .pagination button {
          background: var(--mc-bg-tertiary);
          color: var(--mc-text);
          border: 1px solid var(--mc-border);
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pagination button:not(:disabled):hover {
          border-color: var(--mc-accent);
        }
        .loading, .error {
          text-align: center;
          padding: 48px;
          color: var(--mc-text-muted);
        }
        .error {
          color: var(--mc-error);
        }
      `}</style>
    </div>
  )
}
```

**Step 3: Update App.tsx to use OpportunityList**

Modify `opportunities/src/App.tsx`:
```tsx
import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { OpportunityList } from './components/OpportunityList'
import type { Opportunity } from './types/opportunity'

function HomePage() {
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)

  return (
    <div>
      <div className="page-header">
        <h1>Defense Opportunities</h1>
        <p>Find relevant contracts, grants, and opportunities.</p>
      </div>
      <OpportunityList onSelect={setSelectedOpp} />
      {selectedOpp && (
        <div className="modal-overlay" onClick={() => setSelectedOpp(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedOpp(null)}>×</button>
            <h2>{selectedOpp.topicTitle}</h2>
            <p><strong>Code:</strong> {selectedOpp.topicCode}</p>
            <p><strong>Component:</strong> {selectedOpp.component}</p>
            <p><strong>Status:</strong> {selectedOpp.topicStatus}</p>
            <p>{selectedOpp.description}</p>
          </div>
        </div>
      )}
      <style>{`
        .page-header {
          margin-bottom: 24px;
        }
        .page-header h1 {
          margin-bottom: 8px;
        }
        .page-header p {
          color: var(--mc-text-muted);
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal {
          background: var(--mc-bg-secondary);
          border: 1px solid var(--mc-border);
          border-radius: 8px;
          padding: 24px;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        }
        .close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          color: var(--mc-text-muted);
          font-size: 24px;
          cursor: pointer;
        }
        .modal h2 {
          margin-bottom: 16px;
          padding-right: 32px;
        }
        .modal p {
          margin-bottom: 12px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Layout>
  )
}
```

**Step 4: Test integration**

Run both servers:
```bash
# Terminal 1: API worker
cd cloudflare/opportunities-api && npm run dev

# Terminal 2: Frontend
cd opportunities && npm run dev
```

Expected: Frontend loads opportunities from API, displays in grid

**Step 5: Commit**

```bash
git add opportunities/src/components/ opportunities/src/App.tsx
git commit -m "feat(opportunities): add opportunity list and card components"
```

---

## Task 6: Configure Cloudflare Pages Deployment

**Files:**
- Create: `opportunities/wrangler.toml`
- Modify: `cloudflare/merge-router.js` (update route)

**Step 1: Create Pages config**

Create `opportunities/wrangler.toml`:
```toml
name = "mc-opportunities"
pages_build_output_dir = "dist"

[build]
command = "npm run build"

# Environment variables injected at build time
[vars]
VITE_API_URL = "https://opportunities-api.defensebuilders.workers.dev"
```

**Step 2: Build and test**

```bash
cd opportunities && npm run build
```

Expected: Build completes, `dist/` folder created

**Step 3: Update router to point to CF Pages**

Modify `cloudflare/merge-router.js` - change the opportunities route:
```javascript
// In getRoutes function, replace:
{ prefix: "/opportunities", origin: origins.sbir, stripPrefix: true, redirectOnly: true },

// With:
{ prefix: "/opportunities", origin: env.OPPORTUNITIES_PAGES_URL || "https://mc-opportunities.pages.dev", stripPrefix: true },
```

**Step 4: Deploy Pages**

```bash
cd opportunities
npx wrangler pages deploy dist --project-name=mc-opportunities
```

**Step 5: Deploy API worker**

```bash
cd cloudflare/opportunities-api
npm run deploy
```

**Step 6: Test production**

```bash
curl https://opportunities-api.defensebuilders.workers.dev/health
curl https://mc-opportunities.pages.dev/
```

**Step 7: Commit**

```bash
git add opportunities/wrangler.toml cloudflare/merge-router.js
git commit -m "feat(opportunities): configure CF Pages deployment"
```

---

## Summary

After completing all tasks:

1. ✅ New React frontend at `opportunities/`
2. ✅ API worker at `cloudflare/opportunities-api/`
3. ✅ Opportunity types and API client
4. ✅ Opportunity list with pagination
5. ✅ CF Pages + Workers deployment
6. ✅ Router updated to serve from CF Pages

**Next Phase (1b):**
- Add Beta.SAM forecast scraper
- Add search/filter functionality
- Add SAM.gov profile import (UEI lookup)
