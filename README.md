# Merge Combinator — Public Site

Static marketing site for [mergecombinator.com](https://mergecombinator.com). Built with Vite 6, Tailwind CSS 4, and vanilla ES modules + Preact islands. Deployed on Cloudflare Pages.

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000
```

### API Worker (local)

```bash
cp .env.example .env.local
ln -s .env.local .dev.vars        # wrangler reads .dev.vars
npm run dev:worker                 # local CF Worker on :8787
```

Required secrets in `.env.local`: `MC_OAUTH_CLIENT_ID`, `MC_OAUTH_CLIENT_SECRET`, `SESSION_SECRET`, `DATABASE_URL`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Seed data + Vite production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint (js/, scripts/, cloudflare/test-router) |
| `npm run seed` | Generate `public/data/companies.json` |
| `npm run test:visual` | Playwright visual regression tests |
| `npm run deploy` | Deploy mc-router Worker |
| `npm run deploy:pages` | Deploy static site to CF Pages |

## Project Structure

```
├── index.html, about.html, ...   # HTML pages (Vite multi-page input)
├── js/                           # Client JS modules
├── styles/                       # CSS (Tailwind 4)
├── blog/                         # Blog article pages
├── knowledge/                    # Knowledge base pages
├── programs/                     # Program pages
├── public/                       # Static assets copied to dist
├── scripts/                      # Build-time Node scripts (seed, claims)
├── cloudflare/
│   ├── api-worker/               # Hono API Worker (auth, OTP, provisioning)
│   └── merge-router.js           # Edge router Worker
├── config/                       # YAML config (non-secret)
├── tests/visual/                 # Playwright visual regression
└── .github/workflows/ci.yml     # CI: lint → secrets → build → visual tests
```

## Deployment

- **Static site**: Cloudflare Pages (auto-deploy from `main` via CI)
- **API Worker**: `cd cloudflare/api-worker && npx wrangler deploy`
- **Router Worker**: `npm run deploy` (from project root)

Production secrets are set via `wrangler secret put <KEY>`.

## CI Pipeline

Push/PR to `main` triggers: lint → secret scan → build → visual regression tests → preview deploy (PRs only).

Visual regression baselines auto-update on failure and commit back.
