# Merge Combinator Platform — mc_site

## Project Overview

mc_site is the public front door for the Merge Combinator defense tech platform. It is a static HTML/CSS/JS site built with Vite and deployed on Cloudflare Pages.

**Canonical hosts** (see `docs/plans/2026-02-22-platform-convergence-architecture.md`):
- `mergecombinator.com` — this repo. Public marketing, /access entry point, programs, blog.
- `guild.mergecombinator.com` — authenticated platform SPA (Guild). Source: `signal-incubator/apps/console`.
- `wingman.mergecombinator.com` — separate messaging intelligence product.
- `api.mergecombinator.com` — single API entrypoint (CF Workers).
- `via.mergecombinator.com` — VIA identity provider (Authentik, OIDC).
- `sigmablox.com` — public-only campaign microsite (Ghost CMS). Being deprecated as auth surface.

**The boundary rule:** If it requires knowing who you are, it lives on `guild.mergecombinator.com`. mc_site is public-only with optional personalization.

## Tech Stack

- **Build:** Vite 6 (multi-page HTML build)
- **Styling:** Vanilla CSS with design tokens (C2UX dark-native, Inter font, 2px radius)
- **JS:** Vanilla ES modules (no framework)
- **Hosting:** Cloudflare Pages
- **Routing:** Cloudflare Worker (`cloudflare/merge-router.js`) handles subdomain routing and legacy redirects
- **Auth:** VIA (Authentik) OIDC — mc_site does NOT store tokens; auth redirects to Guild
- **API Proxy:** `cloudflare/auth.js` handles PKCE flow for auth endpoints

## Development

```bash
npm run dev          # Vite dev server (port 3000)
npm run build        # Production build
npm run preview      # Preview production build
```

## Key Directories

```
├── access.html, index.html, ...   # HTML pages (Vite entry points)
├── js/                            # ES modules (navbar.js, theme.js, builders/, etc.)
├── styles/                        # CSS (styles.css, light-theme.css, page-specific)
├── cloudflare/                    # CF Workers (merge-router.js, auth.js, opportunities-api)
├── docs/plans/                    # Architecture & design docs
├── docs/sigmablox-review.md       # Full SigmaBlox architecture inventory
├── scripts/                       # Migration scripts (user migration, etc.)
├── specs/                         # API integration specs
├── .rtmx/                         # RTMX requirements tracking
│   ├── database.csv               # Requirements database
│   └── requirements/              # Requirement specs by category
└── tests/                         # Playwright visual regression tests
```

## Related Repositories

- **signal-incubator** (`../signal-incubator/`) — Guild SPA + Wingman Dashboard monorepo (React, @mc/ui, pnpm workspaces)
- **sigmablox** (`../sigmablox/`) — Legacy platform (Node.js/Express, PostgreSQL/Prisma, Ghost CMS). Auth and business logic being migrated to MC.

## Platform Convergence (REQ-PLATFORM-001)

Active migration: all authenticated content moving from SigmaBlox → MC Guild platform.

- **Architecture doc:** `docs/plans/2026-02-22-platform-convergence-architecture.md`
- **Strategic convergence:** `../sigmablox/docs/architecture/STRATEGIC-CONVERGENCE-2026-02.md`
- **SigmaBlox inventory:** `docs/sigmablox-review.md`

Key decisions:
- Single CF Workers API project at `api.mergecombinator.com` with route modules (Guild, Builders, Wingman)
- Postgres via Cloudflare Hyperdrive (not D1). Prisma as schema source of truth.
- Strangler fig migration: endpoints move one-at-a-time from SigmaBlox monolith to Workers.
- Guild API is sole authority for cross-cutting user primitives (profiles, notes, notifications).

## RTMX

This project uses RTMX for requirements traceability.

### Quick Commands
- `rtmx status` - Show RTM progress
- `rtmx backlog` - View prioritized backlog
- `rtmx health` - Run health checks

### When Implementing Requirements
1. Check the RTM: `rtmx status`
2. Mark tests with `@pytest.mark.req("REQ-XXX-NNN")`
3. Update status when complete

### RTM Location
- Database: `.rtmx/database.csv`
- Specs: `.rtmx/requirements/`

## Design System (C2UX)

- Dark-native with light mode support (`styles/light-theme.css`)
- Tokens: `--blue` (#3b82f6), `--offwhite`, `--gray-light`, `--gray-medium`
- Typography: Inter, monospace for labels/data
- Radius: 2px (sharp edges, command-center aesthetic)
- Theme toggle: `js/theme.js`, persisted in localStorage
