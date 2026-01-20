# Implementation Plan

> This file tracks implementation progress for mc_site.

## Status

**Last Updated:** 2026-01-20
**Current Phase:** Phase 4 - Additional Pages Seeding (Public API Complete)

## Completed

### Exponential Backoff for Rate Limiting (2026-01-20)
- [x] Added `fetchWithRetry()` function in `js/builders/api.js` with configurable retry logic
- [x] Exponential backoff: base delay * 2^attempt with 25% jitter to prevent thundering herd
- [x] Respects `Retry-After` header when present (both seconds and HTTP-date formats)
- [x] Retryable statuses: 429 (rate limit), 500, 502, 503, 504 (server errors)
- [x] Updated `fetchCompanies()`, `fetchFilterOptions()`, `fetchCompanyById()`, `fetchPrivateApi()` to use retry logic
- [x] Private API excludes 401/403 from retry (auth errors require re-authentication)
- [x] Default config: 3 retries, 1s base delay, 10s max delay

### Phase 4 Homepage Stats Integration (2026-01-20)
- [x] Created `js/homepage/index.js` - Client-side module for loading stats from seeded data
- [x] Added `data-stat` attributes to stat elements in index.html (companies, operators, problem-sets)
- [x] Hero section stats dynamically update from seeded company data
- [x] Ecosystem section company count dynamically updates
- [x] Stats calculated: company count from data, problem sets from unique mission areas
- [x] Operators stat preserved as static (not in company data)

### Phase 4 Portfolio API Integration (2026-01-20)
- [x] Created `js/portfolio/index.js` - Client-side module for loading seeded company data
- [x] Added filter functionality with category mapping (autonomy, isr, logistics, cyber, c2)
- [x] Updated `portfolio.html` to include portfolio module script
- [x] Added `portfolio-filters__count` CSS styling for results counter
- [x] Portfolio page dynamically renders companies from `/data/companies.json`
- [x] Filter buttons show/hide companies by mission area category
- [x] Results count updates dynamically ("X of Y records")

### Phase 3 Client-side Auth Integration (2026-01-20)
- [x] Created `js/builders/auth.js` - Client-side auth service
- [x] Auth service checks `/auth/me` endpoint for session status
- [x] Modal content changes based on authentication state
- [x] Return URL preserved in login link for seamless redirect
- [x] CSS styling for authenticated state modal
- [x] Private content (videoUrl, pitchUrl) restricted to authenticated users only

### Build-time Seeding (2026-01-20)
- [x] Added `scripts/seed-companies.mjs` for build-time data fetching
- [x] Updated `js/builders/api.js` to load from seeded static JSON
- [x] Added CSS for modal details spacing fix
- [x] Data fallback chain: Live API → Cached data → Mock data

### Script Module Fixes (2026-01-20)
- [x] Added `type="module"` to script tags in 9 HTML files
- [x] Build completes without warnings
- [x] Git tag `0.0.1` created

### Error Handling: 401/403 Redirect to Login (2026-01-20)
- [x] Added `handleApiResponse()` function in `js/builders/auth.js` for centralized error handling
- [x] Added `authFetch()` wrapper for authenticated API calls with automatic 401/403 handling
- [x] Auth cache invalidation on 401 response via `clearAuthCache()`
- [x] Redirect prevention flag to avoid multiple simultaneous redirects
- [x] Added `fetchPrivateApi()` in `js/builders/api.js` for private endpoint calls with auth error handling
- [x] Return URL preserved in redirect for seamless post-login navigation

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

### Phase 4: Additional Pages Seeding (Public API Complete)
Per spec, additional pages need API integration:
- [x] `/portfolio` - Cohort showcase from public API (now uses seeded data)
- [x] `/` (homepage) - Stats from seeded company data
- [ ] `/about` - Team members (DEFERRED - requires private Ghost CMS API or static content)

**Note on /about:** The about page currently redirects to homepage. Previous static team content was intentionally removed and backlogged. Team member data requires either private Ghost CMS API access or static content to be provided. This is beyond the public API integration scope.

### Error Handling Improvements (Complete)
- [x] 401/403 response redirects to login
- [x] Rate limiting handled with exponential backoff
- [x] No API keys exposed in client-side code (verified)
- [x] Network errors show user-friendly message (C2UX compliant)

### Phase 5: Real-time Updates (Not Started)
- [ ] WebSocket or polling for live data updates

---

## Completed Phases

### Phase 1: Public API Integration (COMPLETED)
- [x] Companies load on `/builders` page (mock data working, live API returns errors)
- [x] Filters populate from data
- [x] Company modals show full detail
- [x] Graceful fallback when API unavailable (mock data fallback implemented)
- [x] API base URL configurable via `window.MCBuildersConfig.apiBase`

**Note:** Live API at `api.sigmablox.com` returns `{"error":"Failed to fetch companies"}` - backend data source issue on SigmaBlox side. Workaround: seeded/mock data fallback is active.

### Phase 2: Build-time Seeding (COMPLETED)
- [x] `npm run build` fetches and caches company data
- [x] Static JSON written to `public/data/companies.json`
- [x] Build fails gracefully if API unreachable (uses cached/fallback data)
- [x] Cache invalidation strategy documented

**Cache Invalidation Strategy:**
- **Automatic invalidation**: Every `npm run build` attempts fresh API fetch
- **Data staleness tracking**: `metadata.fetchedAt` records last successful API fetch
- **Source tracking**: `metadata.source` indicates data origin (api/cache/fallback)
- **Build frequency**: Cloudflare Pages rebuilds on git push, refreshing cache
- **Manual invalidation**: Delete `public/data/companies.json` before build to force fresh fetch
- **Graceful degradation**: If API fails, cached data serves until next successful fetch

### Phase 3: Private API Integration (COMPLETED)
- [x] VIA OAuth login flow works (`/auth/login`) - Cloudflare Worker handles OAuth PKCE flow
- [x] Authenticated requests include Bearer token - Token stored in encrypted session cookie
- [x] Private content only shown to logged-in users - Video/pitch URLs restricted to authenticated users
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
