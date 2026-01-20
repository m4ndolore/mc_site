# Implementation Plan

> This file tracks implementation progress for mc_site.

## Status

**Last Updated:** 2026-01-20
**Current Phase:** Phase 3 - Private API Integration (In Progress)

## Completed

### Phase 3 Client-side Auth Integration (2026-01-20)
- [x] Created `js/builders/auth.js` - Client-side auth service
- [x] Auth service checks `/auth/me` endpoint for session status
- [x] Modal content changes based on authentication state
- [x] Return URL preserved in login link for seamless redirect
- [x] CSS styling for authenticated state modal

### Build-time Seeding (2026-01-20)
- [x] Added `scripts/seed-companies.mjs` for build-time data fetching
- [x] Updated `js/builders/api.js` to load from seeded static JSON
- [x] Added CSS for modal details spacing fix
- [x] Data fallback chain: Live API → Cached data → Mock data

### Script Module Fixes (2026-01-20)
- [x] Added `type="module"` to script tags in 9 HTML files
- [x] Build completes without warnings
- [x] Git tag `0.0.1` created

### C2UX Language Compliance (2026-01-20)
- [x] Removed marketing subtitle "Discover the next generation of defense innovation" from /builders
- [x] Updated modal CTA from "Want to learn more?" to "Restricted Access"
- [x] Changed "Login to Access" to "Authenticate"
- [x] Changed "Visit Website" to "External Site"
- [x] Replaced rocket emoji upvote (🚀) with neutral triangle (▲)
- [x] Changed "Upvote" aria-label to "Track"
- [x] Updated "Loading builders..." to "Retrieving data..."
- [x] Updated "No matching builders" to "No results"
- [x] Updated "X builders active" to "X records"
- [x] Changed "Failed to load builders" to "Data unavailable"

## Prioritized Tasks

### Phase 1: Public API Integration (In Progress)
- [x] Companies load on `/builders` page (mock data working, live API returns errors)
- [x] Filters populate from data
- [x] Company modals show full detail
- [x] Graceful fallback when API unavailable (mock data fallback implemented)
- [x] API base URL configurable via `window.MCBuildersConfig.apiBase`

**Blocked:** Live API at `api.sigmablox.com` returns `{"error":"Failed to fetch companies"}` - backend data source issue on SigmaBlox side.

### Phase 2: Build-time Seeding (COMPLETED)
- [x] `npm run build` fetches and caches company data
- [x] Static JSON written to `public/data/companies.json`
- [x] Build fails gracefully if API unreachable (uses cached/fallback data)
- [x] Cache invalidation strategy documented

**Implementation Notes:**
- Added `scripts/seed-companies.mjs` build script
- Script tries API first, falls back to cached data, then fallback mock data
- Runs automatically before `vite build` via `npm run seed`

**Cache Invalidation Strategy:**
- **Automatic invalidation**: Every `npm run build` attempts fresh API fetch
- **Data staleness tracking**: `metadata.fetchedAt` records last successful API fetch
- **Source tracking**: `metadata.source` indicates data origin (api/cache/fallback)
- **Build frequency**: Cloudflare Pages rebuilds on git push, refreshing cache
- **Manual invalidation**: Delete `public/data/companies.json` before build to force fresh fetch
- **Graceful degradation**: If API fails, cached data serves until next successful fetch

### Phase 3: Private API Integration (In Progress)
- [x] VIA OAuth login flow works (`/auth/login`) - Cloudflare Worker handles OAuth PKCE flow
- [x] Authenticated requests include Bearer token - Token stored in encrypted session cookie
- [ ] Private content only shown to logged-in users (in progress)
- [x] Session persists across page navigation - 7-day encrypted cookie

**Note:** Auth endpoints require Cloudflare Worker (production/staging). On localhost, auth check returns 404 and falls back to unauthenticated state gracefully.

## Discovered Issues

### API Backend Issues
- **Issue:** Public API endpoints at `api.sigmablox.com` return application-level errors
  - `/api/public/companies` returns `{"error":"Failed to fetch companies"}`
  - `/api/public/companies/filters` returns `{"error":"Failed to fetch filter options"}`
- **Status:** Endpoints are network-reachable but backend data source appears unavailable
- **Workaround:** Mock data fallback is active for local development

### ~~Script Module Warnings~~ (RESOLVED)
- **Issue:** Vite warns about scripts without `type="module"` attribute
- **Resolution:** Added `type="module"` to all script tags in commit `ac00516`
- **Files fixed:** 404.html, knowledge.html, merch.html, opportunities.html, privacy.html, security.html, terms.html, builders.html, index.html

### ~~Filter Dropdown Crash~~ (RESOLVED)
- **Issue:** `populateFilters()` crashed with "Cannot read properties of undefined (reading 'map')" when `cohorts` property was missing from filter options
- **Root cause:** `MOCK_FILTERS` in `api.js` didn't include `cohorts` array, and `populateFilters()` in `filters.js` didn't handle missing properties defensively
- **Resolution:**
  - Added `cohorts` to `MOCK_FILTERS` in `js/builders/api.js`
  - Made `populateFilters()` defensive with null-safe property access and length checks

## Technical Notes

### C2UX Doctrine Reference
Per `docs/theme/ux.md`, operational language requirements:
- No reassurance, no cheerleading - just state + next action
- Replace CMS/consumer terms with operational vocabulary
- Status + notification: inline status for low consequence events

### Validation Checklist
```
VISUAL VERIFICATION:
[x] Layout renders correctly
[x] Typography hierarchy correct
[x] No broken images
[x] No console errors (except expected mock data warning)
[x] Operational language (C2UX compliant)
```
