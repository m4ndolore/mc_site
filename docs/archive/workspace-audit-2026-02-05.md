# Workspace Audit: Node/React Apps Inventory

**Date:** 2026-02-05
**Purpose:** Map applications to unified routing at `mergecombinator.com/{app,wingman,control}`

---

## Executive Summary

| App | UI Name | Framework | Deploy Target | Current Domain | Port (Dev) |
|-----|---------|-----------|---------------|----------------|------------|
| mc_site | Marketing + Dashboard | Static HTML/Vite | Vercel + CF Workers | mergecombinator.com | 3000 |
| via-dashboard | Admin Console (VIA Control) | Next.js 16 | GCP Cloud Run | control.sigmablox.com | 3300 |
| signal-incubator/console | MC Console (Defense Builders) | React/Vite | CF Workers (planned) | — | 3003 |
| signal-incubator/dashboard | Wingman Cockpit | React/Vite | — | — | 5173 |

---

## Detailed Inventory

### 1. mc_site (Marketing Site + Ecosystem Status)

**Location:** `/Users/paulgarcia/Dev/mc_site`

| Attribute | Value |
|-----------|-------|
| **Framework** | Static HTML + Vite 7.2 + Tailwind CSS 4 |
| **Type** | Multi-page static site (11+ HTML pages) |
| **Deployment** | Vercel (static) + Cloudflare Workers (auth/routing) |
| **Domain** | `mergecombinator.com` |
| **Dev Port** | 3000 |

**Auth Integration:**
- OAuth 2.0 + PKCE via VIA/Authentik
- Cloudflare Worker handles `/auth/*` endpoints
- Session: AES-GCM encrypted cookie (`mc_session`)
- Cookie domain: `.mergecombinator.com` (cross-subdomain SSO)

**Key Routes:**
```
/                 → Landing page
/dashboard        → Ecosystem Status (Defense Builder view)
/builders         → Defense Builders directory
/access           → Login portal
/status           → Platform status
/opportunities    → SBIR proxy (sbir.mergecombinator.com)
/combine          → SigmaBlox CMS proxy
/auth/*           → OAuth flow endpoints
/api/*            → SigmaBlox API proxy
```

**Configs:**
- `wrangler.toml` — CF Workers config
- `vercel.json` — Vercel deploy config
- `vite.config.js` — Build config

---

### 2. via-dashboard (Admin Console / VIA Control)

**Location:** `/Users/paulgarcia/Dev/sigmablox/apps/via-dashboard`

| Attribute | Value |
|-----------|-------|
| **Framework** | Next.js 16.1.1 + React 19.2.3 + TypeScript |
| **ORM** | Prisma (PostgreSQL) |
| **UI** | Tailwind CSS v4 + Radix UI + shadcn patterns |
| **Deployment** | Docker → GCP Cloud Run (`sigmablox-prod`) |
| **Domain** | `control.sigmablox.com` (or similar) |
| **Dev Port** | 3300 |

**Auth Integration:**
- NextAuth.js v4 with Authentik OAuth provider
- Scopes: `openid email profile groups`
- Admin check: `isViaAdmin` flag from group membership
- Groups: `via-admins`, `sigmablox-admins`, `{site-slug}-admins`

**Key Features (Admin Console):**
```
/                    → Dashboard home (quick stats, actions)
/access-requests     → User enrollment review/approve
/users               → Unified user management (Authentik + Ghost sync)
/roles               → Role definitions per site
/companies           → Company profiles + share links
/claims              → Company ownership claims
/coaches             → Coach/mentor directory
/story-reviews       → Application narrative review
/activity            → Audit log viewer
/cohort-reports      → Analytics dashboards
/settings            → Enrollment policies
```

**External Integrations:**
- Authentik Admin API (user/group management)
- Ghost Admin API (member labels, content gating)
- Webhook service (user provisioning)

**Configs:**
- `Dockerfile` — Multi-stage container build
- `deploy-to-cloud-run.sh` — GCP deployment script
- `prisma/schema.prisma` — Data model

---

### 3. signal-incubator/console (MC Console / Defense Builders)

**Location:** `/Users/paulgarcia/Dev/signal-incubator/apps/console`

| Attribute | Value |
|-----------|-------|
| **Framework** | React 18 + TypeScript + Vite 5 |
| **State** | React Query v5 |
| **Routing** | React Router v6 |
| **UI Lib** | `@mc/ui` (workspace package) |
| **Deployment** | CF Workers (planned, `.wrangler/` exists) |
| **Domain** | TBD |
| **Dev Port** | 3003 |

**Auth Integration:**
- VIA (Authentik) via relative paths
- Proxied to `https://www.mergecombinator.com` in dev
- Endpoints: `/auth/me`, `/auth/login`, `/auth/logout`
- Mock auth support for local dev (`localStorage` flag)

**Key Pages (Defense Builders Console):**
```
/              → Overview
/problems      → Problem Board
/builders      → Builders list
/builders/:id  → Builder details
/champions     → Champions list
/champions/:id → Champion details
/watchlist     → Watchlist
/matches       → (disabled)
/sprints       → (disabled)
/signals       → (disabled)
```

**Configs:**
- `vite.config.ts` — Dev server + proxy config

---

### 4. signal-incubator/dashboard (Wingman Cockpit)

**Location:** `/Users/paulgarcia/Dev/signal-incubator/apps/dashboard`

| Attribute | Value |
|-----------|-------|
| **Framework** | React 18 + TypeScript + Vite |
| **State** | React Query v5 |
| **Icons** | Phosphor Icons |
| **Backend** | Matrix Synapse (direct API) |
| **Deployment** | TBD |
| **Domain** | TBD |
| **Dev Port** | 5173 |

**Auth Integration:**
- **Direct Matrix login** (not VIA)
- Credentials stored in `localStorage` (`matrix:credentials`)
- Matrix homeserver: `VITE_MATRIX_HOMESERVER` env var
- Default: `http://mac-mini-1:8008` (Tailscale)

**Key Features (Wingman):**
```
3-panel layout:
├── ConversationList  — Signal rooms (via Matrix bridge)
├── MessageView       — Message thread display
└── AdvisorPanel      — AI insights + slash commands

Slash Commands:
  /summarize  — Summarize conversation
  /actions    — Extract action items
  /ask        — Ask AI about context
  /digest     — Generate digest
```

**Environment:**
```env
VITE_MATRIX_HOMESERVER=http://mac-mini-1:8008
```

---

## Auth Integration Summary

| App | Auth Provider | Method | Session Storage | SSO Domain |
|-----|---------------|--------|-----------------|------------|
| mc_site | VIA/Authentik | OAuth 2.0 PKCE | Encrypted cookie | `.mergecombinator.com` |
| via-dashboard | Authentik | NextAuth OAuth | JWT | N/A (Cloud Run) |
| console | VIA/Authentik | OAuth (proxied) | Cookie (via mc_site) | `.mergecombinator.com` |
| dashboard (Wingman) | Matrix Synapse | Password login | localStorage | N/A |

**Note:** Wingman uses direct Matrix auth, not VIA. This is intentional for the Signal bridge architecture but could be unified later.

---

## Current Deployment Topology

```
                          ┌─────────────────────────────────┐
                          │         Cloudflare              │
                          │  ┌───────────────────────────┐  │
                          │  │    merge-router.js        │  │
                          │  │  (auth + routing worker)  │  │
                          │  └─────────────┬─────────────┘  │
                          └────────────────┼────────────────┘
                                           │
         ┌─────────────────────────────────┼──────────────────────────────┐
         │                                 │                              │
         ▼                                 ▼                              ▼
┌────────────────┐              ┌─────────────────┐             ┌─────────────────┐
│     Vercel     │              │    SigmaBlox    │             │   GCP Cloud Run │
│   mc_site      │              │     API         │             │  via-dashboard  │
│  (static HTML) │              │ api.sigmablox   │             │ control.sigma.. │
└────────────────┘              └─────────────────┘             └─────────────────┘

                        ┌─────────────────────────────────┐
                        │     VIA (Authentik)             │
                        │   via.mergecombinator.com       │
                        │  (OAuth provider for all apps)  │
                        └─────────────────────────────────┘
```

---

## Proposed Unified Routing

### Target Architecture

Route all apps through `mergecombinator.com` with path-based routing:

| Path | Target App | Internal Subdomain | Notes |
|------|------------|--------------------|-------|
| `/` | mc_site | — | Marketing, landing pages |
| `/dashboard` | mc_site | — | Ecosystem Status (current) |
| `/app/*` | MC Console | `console.internal` | Defense Builders console |
| `/wingman/*` | Wingman | `wingman.internal` | Signal/Matrix cockpit |
| `/control/*` | VIA Dashboard | `control.internal` | Admin console |

### Implementation Options

**Option A: Cloudflare Workers Routing (Recommended)**

Extend `merge-router.js` to route by path prefix:

```javascript
// Proposed routing additions
if (pathname.startsWith('/app/')) {
  return proxyTo('https://console.mergecombinator.com', request);
}
if (pathname.startsWith('/wingman/')) {
  return proxyTo('https://wingman.mergecombinator.com', request);
}
if (pathname.startsWith('/control/')) {
  return proxyTo('https://control.mergecombinator.com', request);
}
```

**Option B: Cloudflare Pages + Functions**

Deploy each app to CF Pages with path-based routing.

**Option C: Vercel Rewrites**

Use Vercel rewrites in `vercel.json` to proxy to subdomains.

### Required Changes per App

| App | Base Path Change | Auth Updates | Deploy Target |
|-----|------------------|--------------|---------------|
| mc_site | None (root) | None | Vercel (as-is) |
| MC Console | Add `/app` base | Proxy to `/auth/*` | CF Pages or Workers |
| Wingman | Add `/wingman` base | Integrate VIA (optional) | CF Pages or Workers |
| VIA Dashboard | Add `/control` base | Update NEXTAUTH_URL | Cloud Run (as-is) or CF |

### Subdomain Mapping

For internal routing, deploy to subdomains:

| Subdomain | App | Current Status |
|-----------|-----|----------------|
| `www.mergecombinator.com` | mc_site | ✅ Active |
| `console.mergecombinator.com` | MC Console | ❌ Not deployed |
| `wingman.mergecombinator.com` | Wingman | ❌ Not deployed |
| `control.mergecombinator.com` | VIA Dashboard | ❌ Not deployed (uses sigmablox) |
| `via.mergecombinator.com` | Authentik | ✅ Active |
| `api.sigmablox.com` | SigmaBlox API | ✅ Active |

---

## Merge Strategy: Defense Builders Console

Per user input, Defense Builders needs to merge:
1. **From via-dashboard:** User management, roles, access requests
2. **From mc-console:** Problem board, builders list, champions, watchlist

**Recommended Approach:**
1. Keep via-dashboard as the admin backend (user/role/access management)
2. Extend mc-console with operational features from via-dashboard
3. Use shared auth (VIA) across both with SSO cookies
4. API calls from mc-console → via-dashboard for user data

---

## Next Steps

1. **Decide routing strategy** (Options A/B/C above)
2. **Configure base paths** in each app's build config
3. **Deploy apps to subdomains** for internal routing
4. **Update CF Worker** to route paths to subdomains
5. **Test SSO** across all apps with `.mergecombinator.com` cookie domain
6. **Integrate Wingman with VIA** (optional, currently uses Matrix auth)

---

## File References

| App | Key Config Files |
|-----|------------------|
| mc_site | `wrangler.toml`, `vercel.json`, `cloudflare/merge-router.js`, `cloudflare/auth.js` |
| via-dashboard | `Dockerfile`, `deploy-to-cloud-run.sh`, `src/lib/auth.ts`, `prisma/schema.prisma` |
| MC Console | `vite.config.ts`, `src/lib/auth.ts` |
| Wingman | `vite.config.ts`, `src/lib/matrix.ts`, `.env` |
