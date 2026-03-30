# Guild SPA Auth & Data Findings — 2026-03-03

## Auth: Two Separate Auth Systems

The Guild SPA (`guild.mergecombinator.com`) and the main site (`mergecombinator.com`) use **different auth mechanisms**:

| Property | Main Site (merge-router) | Guild SPA |
|----------|--------------------------|-----------|
| Library | Custom OAuth in `cloudflare/auth.js` | `oidc-client-ts` PKCE |
| Storage | `mc_session` cookie (`.mergecombinator.com`) | `sessionStorage` (per-tab) |
| Token use | Cookie passed on requests | `Authorization: Bearer` header |
| Entry point | `/auth/login` | Auto-redirect from Guild SPA |
| Callback | `/auth/callback` | `/login/callback` |

### Consequence
- Signing in on `/access` → `/auth/login` creates a cookie session for the main site **only**
- Guild SPA ignores the `mc_session` cookie — it has its own OIDC flow
- To use Guild: navigate directly to `guild.mergecombinator.com` — SPA detects no OIDC session, redirects to VIA, and if user has active VIA session, auto-completes

### TODO: Fix /access Entry Point
The `/access` page "Already a member?" link (`/auth/login`) should either:
1. Redirect to `guild.mergecombinator.com` (preferred — lets Guild SPA handle OIDC)
2. Or add `returnTo=https://guild.mergecombinator.com` to `/auth/login` so merge-router redirects after cookie auth

### OIDC Config (Verified Working)
```
authority: https://via.mergecombinator.com/application/o/defense-builders/
client_id: mc-web-prod
redirect_uri: https://guild.mergecombinator.com/login/callback
post_logout_redirect_uri: https://mergecombinator.com/access
scopes: openid email profile groups offline_access
```
- VIA accepts the authorize request (302 to login flow)
- Redirect URI registered in VIA
- Post-logout URI registered in VIA

## Data: Missing Database Tables

The api-worker endpoints (`/builders/companies`, `/builders/coaches`) query PostgreSQL tables that **don't exist**:

| Table | Status | Used By |
|-------|--------|---------|
| `guild_users` | EXISTS (migrated) | `/guild/me` |
| `"Company"` | MISSING | `/builders/companies` |
| `"Coach"` | MISSING | `/builders/coaches` |
| `"Cohort"` | MISSING | Company JOIN |

### Consequence
- All `/builders/*` endpoints return 503 `DB_ERROR` ("relation does not exist")
- Strangler router marks these as "native" routes — they do NOT fall back to SigmaBlox
- The Guild SPA's Builders/Champions pages show no data

### TODO: Create Tables + Seed Data
1. Add `Company`, `Coach`, `Cohort` models to `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev`
3. Seed from Airtable (or create sync job)
4. Alternative: Change strangler routes to `proxy_legacy` temporarily until tables exist

## Infrastructure Checks (All Passing)

- `guild.mergecombinator.com/` → 200, SPA shell loads
- `guild.mergecombinator.com/login/callback` → 200, SPA fallback
- `api.mergecombinator.com/health` → 200, CORS correct for guild.*
- `/guild/me`, `/builders/companies`, `/builders/coaches` → 401 (auth required)
- Logout → 302 → VIA `defense-builders/end-session/` → 302 (no 404)
- `CONSOLE_ROLLOUT_MODE = "on"` (ungated)
- No `credentials: include` on critical paths (only `watchlist.ts` legacy)
