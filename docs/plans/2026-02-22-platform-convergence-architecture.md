# MC Platform Convergence Architecture

**Date:** 2026-02-22
**Status:** Approved
**Tracks:** REQ-PLATFORM-001
**Authors:** Paul Garcia, Claude

---

## Overview

Consolidate all authenticated content from SigmaBlox and signal-incubator into Merge Combinator as the single platform for Defense Builders. SigmaBlox becomes a public-only campaign microsite. MC becomes the canonical authenticated platform.

**The Boundary Rule:**
> If it requires knowing who you are, it lives on **mergecombinator.com** (specifically `guild.mergecombinator.com`).
> If it exists to showcase and attract, it lives on **mergecombinator.com** (public front door) or **sigmablox.com** (campaign microsite).

---

## Section 1: Canonical Hosts & Routing

### Done-State Canonical Hosts

| Host | Role | Auth | Stack |
|------|------|------|-------|
| `mergecombinator.com` | Public front door (marketing, programs, blog, /access) | None (light teasers only) | mc_site, CF Pages |
| `guild.mergecombinator.com` | Authenticated platform (Builders, Champions, Watchlist, Profile, Company, Admin, Notes) | OIDC PKCE | Guild React SPA, CF Pages |
| `wingman.mergecombinator.com` | Separate product (Matrix messaging, AI Advisor) | OIDC PKCE | Wingman SPA, CF Pages |
| `api.mergecombinator.com` | Single API entrypoint (Guild, Builders, Wingman APIs) | Bearer tokens | CF Workers |
| `via.mergecombinator.com` | Identity provider (branded Authentik) | OIDC issuer | Authentik |
| `sigmablox.com` | Campaign microsite (public Combine/cohort showcase) | None | Ghost CMS |

### Routing Rules

**Explicit rule:** Redirects between products, not subpath proxying.

- `mergecombinator.com/access` — canonical entry point. All "apply/login" CTAs link here.
- `mergecombinator.com/api/*` — **redirect** (301) to `api.mergecombinator.com/*`. Redirect, not proxy, to reinforce `api.*` as canonical.
- `mergecombinator.com/combine/*` — redirect to `sigmablox.com/*`.
- `mergecombinator.com/opportunities/*` — Opportunities CF Pages (existing).

### Legacy Redirects

- `mergecombinator.com/app/wingman/*` → `https://wingman.mergecombinator.com/*` (301, takes precedence)
- `mergecombinator.com/app/*` → `https://guild.mergecombinator.com/*` (301)
- `mergecombinator.com/wingman` → `https://wingman.mergecombinator.com/` (301)
- SigmaBlox `/join` → `https://mergecombinator.com/access` (301)

### Auth Contracts

- Guild and Wingman are OAuth clients using **OIDC PKCE** (mobile-ready, no cookie/session coupling across domains).
- VIA (`via.mergecombinator.com`) is the current IdP. Guild depends only on OIDC contracts: **issuer + JWKS + claims → Guild user ID**.
- Canonical identity: `issuer + sub` mapped to a Guild user ID. **Never key on email.**
- VIA is swappable — Guild's IdP Adapter abstracts the specifics.

---

## Section 2: API Architecture & Data Layer

### API Topology

`api.mergecombinator.com` is a **single Cloudflare Workers project** with route modules:

```
api.mergecombinator.com/guild/*      → Guild module
api.mergecombinator.com/builders/*   → Builders module
api.mergecombinator.com/wingman/*    → Wingman module
```

Shared middleware across all modules: OIDC token verification, logging, rate limiting. Split into separate Workers projects only if deployment isolation is truly required later.

### Product API Domains

**Guild API** (`/guild/*`) — shared user-centric primitives:
- IdP Adapter: verify OIDC tokens locally (issuer + JWKS), map `issuer+sub` → Guild user ID
- Roles & entitlements
- Notifications (in-app, email, push) — **Guild Notification Service**
- Device registration + push tokens (mobile-ready, near-term deliverable)
- Audit events
- User profiles
- Notes + Y.js collaboration (user-centric, spans products)

**Builders API** (`/builders/*`) — marketplace workflows:
- Companies (browse, detail, search, filter)
- Coaches/Champions (browse, detail)
- Company claiming + auto-approval
- Company onboarding wizard (7-step)
- Company self-service editor (My Company)
- Watchlist/Pipeline (kanban stages)
- Favorites, interests, intro requests
- Problems (CRUD)

**Wingman API** (`/wingman/*`) — messaging intelligence:
- Connectors: extensible provider model (Matrix, email, other thread/message sources — Matrix is one provider, not the architecture)
- Derived briefs & insights
- Control plane via Workers; ingestion/processing offloaded to Cloud Jobs (GCP Cloud Run/Jobs)

### Token Validation — No Runtime Guild Dependency on Hot Paths

All APIs validate OIDC tokens **locally** using `issuer + JWKS + claims`. Shared OIDC verification middleware used across all API modules.

Guild API is only called when:
- Fetching enriched user profile data
- Resolving entitlements outside token scope
- Admin or audit workflows

No synchronous Guild calls on every request. Prevents internal latency chains, preserves resilience under load.

### Database Architecture

**Postgres via Cloudflare Hyperdrive.** Prisma remains the schema source of truth. Migrations continue to work.

**Target: separate DBs per bounded context** (blast-radius isolation, compliance posture):

| DB | Contents |
|----|----------|
| `guild_db` | Users, roles, entitlements, audit logs, notifications, device tokens, notes + Y.js collaboration state |
| `builders_db` | Companies, coaches, cohorts, claims, onboarding profiles, favorites, watchlist, problems, interests |
| `wingman_db` | Connector accounts, derived briefs/insights, metadata + pointers to blob storage |

**Phase 1 flexibility:** Separate schemas in one Postgres instance to move faster, planned split later.

**Storage rules:**
- Y.js binary state → **Postgres** (`bytea`) alongside note metadata. Transactional, consistent. Revisit object storage only if scale/cost demands it.
- Wingman raw artifacts (emails, attachments, transcripts) → **encrypted blob store** (R2 or GCS). Postgres stores metadata + pointers/hashes/keys only. Never in Postgres long-term.

### Strangler Fig Migration

SigmaBlox Express monolith stays online as a compatibility backend during transition.

**Routing control lives in the Workers layer** (not merge-router). Each endpoint is flagged in a **config map or feature flag table**:

```
/builders/companies     → native       (Workers + Postgres)
/builders/claims        → proxy_legacy (forward to SigmaBlox)
/guild/notifications    → native
...
```

No ad-hoc conditionals per handler.

**Migration sequence:**
1. Read-only browse endpoints (companies, coaches, cohorts)
2. Write flows (favorites, watchlist, interests, intro requests)
3. Company onboarding → claiming → editor (risk-first order)
4. Notes + collaboration (Hocuspocus/Y.js as separate service; Y.js state in Postgres)
5. Admin dashboards + approvals
6. Retire SigmaBlox monolith

**PG → PG migration (not PG → D1):**
- Low traffic: maintenance window + `pg_dump`/`pg_restore`
- Low downtime: logical replication (publication/subscription) until caught up, then cutover
- Validate critical flows pre-cutover: roles, claims, onboarding, favorites/watchlist, notifications

---

## Section 3: Frontend Architecture & Component Strategy

### Cross-Cutting User Data Authority

**Guild API is the sole authority for cross-cutting user primitives:** profiles, notes, notifications, device tokens, audit context. Guild SPA and Wingman SPA never write user-centric data directly to product databases. Builders and Wingman APIs own domain objects only; user context flows through Guild contracts.

### Frontend Surfaces

**mc_site (`mergecombinator.com`)** — static HTML/CSS/JS, Vite build. Public front door only.

Security constraint: mc_site **must not** store bearer tokens in localStorage or sessionStorage. No platform tokens in the browser environment on this domain.

Auth teaser ("Welcome back" personalization) is permitted only via:
- A lightweight session check endpoint (e.g., `GET /guild/me`) — or —
- A redirect-based SSO pattern to `guild.mergecombinator.com`

All authenticated actions redirect to Guild. mc_site is a public front door with optional personalization, not an authenticated app surface.

**Guild SPA (`guild.mergecombinator.com`)** — the single authenticated platform surface. React SPA, CF Pages.

- Source: signal-incubator `apps/console` (this **is** the Guild SPA)
- There is no separate "app" surface. `app.mergecombinator.com` is legacy; redirects to `guild.mergecombinator.com`.
- Stack: React 18, React Router, TanStack Query, @mc/ui
- Auth: OIDC PKCE via VIA. Token-based.

**Token storage policy:** Access tokens in memory (preferred) or secure browser storage scoped to `guild.mergecombinator.com` and `wingman.mergecombinator.com` only. Tokens must never be accessible on `mergecombinator.com`. Silent refresh via OIDC PKCE + refresh token rotation where supported. No cross-domain cookie coupling between mc_site and Guild/Wingman.

Pages:

| Page | Source | Status | API Domain |
|------|--------|--------|------------|
| Builders browse | signal-incubator | Functional | Builders API |
| Builder detail | signal-incubator | Functional | Builders API |
| Champions browse | signal-incubator | Functional | Builders API |
| Champion detail | signal-incubator | Functional | Builders API |
| Watchlist/Pipeline | signal-incubator | **localStorage (temp)** | Builders API (target) |
| Problems | signal-incubator | **localStorage (temp)** | Builders API (target) |
| My Company editor | SigmaBlox port | Not started | Builders API |
| Company onboarding | SigmaBlox port | Not started | Builders API |
| Company claiming | SigmaBlox port | Not started | Builders API |
| Profile/Account | signal-incubator (modal) | Partial | **Guild API** |
| Notes | SigmaBlox port | Not started | **Guild API** |
| Notifications | SigmaBlox port | Not started | **Guild API** |
| Admin dashboards | SigmaBlox port | Not started | **Guild API** + Builders API |

**localStorage is not an acceptable production persistence layer.** Watchlist and Problems pages currently use localStorage as temporary scaffolding. The first frontend hardening milestone is migrating all localStorage state to Builders API persistence backed by Postgres. Required for: mobile parity, multi-device sync, data integrity.

**Wingman SPA (`wingman.mergecombinator.com`)** — separate product surface. React SPA, CF Pages.

- Source: signal-incubator `apps/dashboard`
- Auth: same OIDC PKCE flow, same token format.
- Domain data: `api.mergecombinator.com/wingman/*`
- User primitives (profile, notifications, notes): `api.mergecombinator.com/guild/*`

### Route Ownership (Deep Links)

Routes are owned by their surface. Deep links resolve to the owning surface, never proxied through another SPA.

- `guild.mergecombinator.com/*` — platform routes: builders, profile, notes, admin, watchlist, problems, company management
- `wingman.mergecombinator.com/*` — intelligence routes: `/brief/:id`, advisor, conversations, connectors

Stable deep link routes (`/login/callback`, `/invite/:token`, `/brief/:id`) must be consistent across Guild SPA, Wingman SPA, and mobile apps.

### Shared API Client — Single Origin Discipline

All frontend surfaces (Guild SPA, Wingman SPA, future mobile apps) must:
- Call **only** `https://api.mergecombinator.com/*`
- Use a shared API client wrapper (`@mc/api-client`) that:
  - Attaches Bearer tokens
  - Handles 401 + token refresh
  - Supports deep links and push-opened routes consistently

No direct browser calls to multiple origins.

`@mc/api-client` must be **versioned and backward-compatible** — consumed simultaneously by Guild SPA, Wingman SPA, and mobile apps.

Initially colocated where it exists for speed, but designed for extraction into a unified platform monorepo. Not permanently anchored to signal-incubator.

### Unified Notification UX

Guild Notification Service powers in-app notifications + push + email. Frontend notification centers in Guild and Wingman consume Guild API — no product-specific notification systems.

### Mobile-First Constraints

Mobile readiness is a first-class constraint, not a future consideration:
- Mobile apps are **first-class Guild clients** using the same API and OIDC PKCE auth.
- Same `@mc/api-client`, same deep link routes.
- Device registration + push tokens are a near-term Guild API deliverable.
- No mobile-specific backend fork.

### Design System

- **mc_site**: owns its CSS (`--blue`, `--offwhite`, etc.), C2UX dark-native, Inter font, 2px radius. Static pages only.
- **@mc/ui**: component library for Guild and Wingman SPAs (`--mc-*` tokens, Professional + Terminal themes).

The two systems serve different surfaces and do not need to merge. Visual consistency maintained through shared brand tokens documented separately.

---

## Section 4: Sequencing & Execution Plan

### Phase 0: Surface Boundary & Routing (1 week) — IN PROGRESS

**Goal:** Establish canonical host structure. No new features, just plumbing.

| Deliverable | Status | Detail |
|-------------|--------|--------|
| `/access` page as canonical entry point | Done | Split-panel layout, chips, SSO |
| DNS: `guild.mergecombinator.com` | Not started | CF Pages custom domain binding for Guild SPA |
| OIDC redirect URI + callback validation | Not started | VIA → guild.mergecombinator.com callback registered and verified |
| Redirect: `app.mergecombinator.com/*` → `guild.*` | Not started | 301 in CF redirect rules |
| Redirect: `mergecombinator.com/app/wingman/*` → `wingman.*` | Not started | 301 (precedence over /app/*) |
| Redirect: `mergecombinator.com/app/*` → `guild.*` | Not started | 301 in merge-router |
| Redirect: SigmaBlox `/join` → `mergecombinator.com/access` | Not started | Ghost redirect or CF rule |
| Redirect: `mergecombinator.com/wingman` → `wingman.*` | Not started | 301 |
| Redirect: `mergecombinator.com/api/*` → `api.*` | Not started | 301 redirect (not proxy) |
| Guild SPA auth: OIDC PKCE with VIA | Exists | Verify token-based, not cookie-dependent |
| End-to-end auth flow: `/access` → VIA → Guild SPA | Not started | Critical path verification |

**Exit criteria:** A user can go to `mergecombinator.com/access`, sign in, and land on `guild.mergecombinator.com` with a valid session. All legacy `/app/*` routes redirect to `guild.*`.

### Phase 1: API Spine on Workers (2 weeks)

**Goal:** Stand up `api.mergecombinator.com` on Workers with Hyperdrive → Postgres. Mirror initial read-only endpoints. Strangler config map in place.

| Deliverable | Detail |
|-------------|--------|
| Workers project: `api.mergecombinator.com` | Route modules: `/guild/*`, `/builders/*`, `/wingman/*` |
| Shared OIDC verification middleware | Used across all API modules; local JWKS validation |
| Hyperdrive binding to Postgres | Connection to Postgres (via Cloudflare Hyperdrive) |
| Strangler config map | Each endpoint flagged `native` or `proxy_legacy` |
| IdP Adapter in Guild module | OIDC token validation (issuer + JWKS), `sub` → Guild user ID mapping |
| Read-only Builders endpoints | `GET /builders/companies`, `/companies/:id`, `/coaches`, `/coaches/:id` |
| Guild `/me` endpoint | `GET /guild/me` — returns profile, roles, entitlements |
| Guild SPA switches to `api.mergecombinator.com` | Remove proxy-through-mc_site pattern |

**Exit criteria:** Guild SPA fetches builders/champions from Workers → Postgres (not through SigmaBlox proxy chain). Strangler map routes remaining endpoints to SigmaBlox.

### Phase 2: User & Company Profiles (3 weeks)

**Goal:** Port core authenticated workflows. Migrate localStorage to API persistence. Risk-first migration order.

| Deliverable | Detail |
|-------------|--------|
| Company onboarding → Builders API | Port 7-step wizard + CompanyProfile model (highest risk, migrate first) |
| Company claiming → Builders API | Port claim lifecycle + auto-approval logic |
| My Company editor → Guild SPA | Port self-service editor as React pages |
| Watchlist/Pipeline → Builders API | Replace localStorage with Postgres-backed CRUD |
| Problems → Builders API | Replace localStorage with Postgres-backed CRUD |
| Favorites/Interests → Builders API | Port from SigmaBlox repos |
| Profile management → Guild API | Full profile editing |
| Notifications → Guild API | Guild Notification Service: in-app + email |
| Device registration → Guild API | Push token storage (mobile-ready primitive) |

**Exit criteria:** Users can browse builders, manage watchlist, claim/edit companies, and receive notifications — all on `guild.mergecombinator.com` backed by Workers + Postgres.

### Phase 3: Content, Collaboration & Admin (2 weeks)

**Goal:** Port remaining SigmaBlox features. Monolith becomes progressively read-only.

| Deliverable | Detail |
|-------------|--------|
| Notes + Y.js collaboration → Guild API | Y.js state in Postgres (`bytea`). Hocuspocus as separate service. |
| Coach directory → Builders API | Port if not already native from Phase 1 |
| Success story pipeline → Builders API | Port story-invite, user-draft, company-post |
| Cohort update forms → Builders API | Port CohortUpdate model + access tokens |
| Share links → Builders API | Port CompanyShareLink model |
| Admin dashboards → Guild SPA | Port or rebuild claims mgmt, user mgmt, access requests |
| SigmaBlox monolith → read-only | All write endpoints migrated |

**Exit criteria:** Zero write traffic to SigmaBlox monolith. All authenticated workflows on Guild.

### Phase 4: Wingman & Mobile (separate track)

| Deliverable | Detail |
|-------------|--------|
| Wingman API endpoints → Workers | Connectors, briefs, insights via `/wingman/*` |
| Wingman SPA deployment | `wingman.mergecombinator.com` on CF Pages |
| Mobile: Guild Notification Service | Push notifications via device tokens |
| Mobile: shared API client | Same `@mc/api-client`, same OIDC PKCE, same deep link routes |
| Mobile apps as first-class Guild clients | Same API, no mobile-specific backend fork |
| SigmaBlox monolith retirement | Full decommission after endpoint parity |

---

## Acceptance Criteria (Platform-Level)

1. All authenticated user flows happen on `guild.mergecombinator.com` (zero auth on SigmaBlox, zero auth on mc_site)
2. Users can manage their profile, company, and preferences on Guild
3. Company claiming, onboarding, and self-service editing work on Guild backed by Workers + Postgres
4. Builders and Champions browsing available on Guild with richer authenticated fields
5. SigmaBlox serves only public content (no login buttons, no auth cookies)
6. `/access` page on `mergecombinator.com` is the canonical entry point for all MC products
7. `api.mergecombinator.com` serves all authenticated endpoints (single origin discipline)
8. `app.mergecombinator.com` fully deprecated; all traffic redirected to `guild.*`
9. Mobile apps consume the same APIs and auth flows as web (OIDC PKCE, `@mc/api-client`)
10. Guild Notification Service is the unified notification layer (in-app + push + email)

---

## Key Reference Documents

| Document | Location | Content |
|----------|----------|---------|
| Strategic Convergence | `../sigmablox/docs/architecture/STRATEGIC-CONVERGENCE-2026-02.md` | Master strategic framework |
| ADR-001 Bounded Architecture | `../sigmablox/docs/architecture/ADR-001-sigmablox-bounded-architecture.md` | Feature-by-feature migration spec |
| SigmaBlox Review | `docs/sigmablox-review.md` | Full SigmaBlox architecture inventory (830 lines) |
| REQ-PLATFORM-001 | `.rtmx/requirements/PLATFORM/REQ-PLATFORM-001.md` | Master tracking requirement |
| API Integration Spec | `specs/sigmablox-api-integration.md` | Phased API integration plan |
| User Migration Scripts | `scripts/README-MIGRATION.md` | Ghost CMS → MC user migration |
| Signal-Incubator Plans | `../signal-incubator/docs/plans/` | Console/dashboard architecture (11 files) |
