# Implementation Plan

> This file tracks implementation progress for mc_site.

## Status

**Last Updated:** 2026-01-20
**Current Phase:** Maintenance - Phases 1-4 Complete, Phase 5 Deferred

## Completed

### Bug Fixes

#### Seed Script Missing Directory Bug (2026-01-20)
- [x] Issue: Build failed with `ENOENT: no such file or directory, open 'public/data/companies.json'`
- [x] Root cause: `public/data/` directory was deleted (tracked in git as deleted), and seed script assumed directory existed
- [x] Fix: Added `mkdirSync()` with `recursive: true` to create directory if it doesn't exist at module load time
- [x] Files modified: `scripts/seed-companies.mjs`
- [x] Verification: `npm run build` now creates directory and writes seeded data successfully

#### Localhost fetchCompanies() Not Using Seeded Data (2026-01-20)
- [x] Issue: /builders page showed "Data unavailable" on localhost with CORS errors and retry delays
- [x] Root cause: `fetchCompanies()` in `js/builders/api.js` was calling live API on localhost (only `shouldUseMockData()` case used local data)
- [x] Fix: Added explicit localhost check in `fetchCompanies()` to prioritize seeded data:
  1. On localhost: Load from `/data/companies.json` first, fall back to mock data (no live API)
  2. In production: Try live API first, fall back to seeded data on failure
- [x] Added `loadSeededData()` helper function to load and validate seeded JSON
- [x] Files modified: `js/builders/api.js`
- [x] Verification: /builders page now loads instantly on localhost using seeded data (6 companies)

#### Localhost Loading Delay on /builders Page (2026-01-20)
- [x] Issue: /builders page took 10+ seconds to load on localhost due to CORS errors and retries
- [x] Root cause: `fetchCompanies()` and `fetchFilterOptions()` tried live API first, causing CORS failures and exponential backoff retries before falling back to seeded data
- [x] Fix: Changed data loading priority for localhost:
  - `fetchCompanies()`: Prioritizes seeded data first on localhost, then mock data fallback
  - `fetchFilterOptions()`: Uses mock filters directly on localhost (no API call)
- [x] Production behavior unchanged: Still tries live API first with seeded data fallback
- [x] Verification: /builders page now loads instantly on localhost

#### Cohorts Stat Showing Zero on /builders Page (2026-01-20)
- [x] Issue: Cohorts stat displayed 0 instead of actual count
- [x] Root cause: `updateStats()` in `js/builders/index.js` was not passing `cohorts` property to display function
- [x] Fix: Added `cohorts: filterOptions.cohorts?.length || 0` to the `updateStats()` call
- [x] Note: Data extraction was already working correctly in `extractFilterOptions()` from `api.js`
- [x] Verification: Cohorts stat now displays correct count matching available filter options

#### Build-time Seeding Empty Data Bug (2026-01-20)
- [x] Issue: Build-time seeding script (`scripts/seed-companies.mjs`) wrote empty data when API returned empty array
- [x] Root cause: API returns HTTP 200 with `{companies: []}` (empty array), which was treated as successful API response
- [x] Fix: Added check for empty companies array in seed script - treats empty response as failure and falls back to cached data or mock data
- [x] Verification: `npm run build` now correctly falls back to mock data (6 companies) when API returns empty data

#### Portfolio Page CORS Errors on Localhost (2026-01-20)
- [x] Issue: /portfolio page showed CORS errors and failed to load data on localhost
- [x] Root cause: `loadCompanies()` in `js/portfolio/index.js` was making direct API calls to `api.sigmablox.com` without localhost handling
- [x] Fix: Added localhost detection and seeded data priority:
  1. Added `isLocalhost()` helper function
  2. Added `loadSeededData()` to fetch from `/data/companies.json`
  3. On localhost: Load seeded data only (no live API calls)
  4. In production: Try live API first, fall back to seeded data on failure
- [x] Files modified: `js/portfolio/index.js`
- [x] Verification: /portfolio page now loads instantly on localhost with 6 companies from seeded data

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

### Phase 5: Real-time Updates (DEFERRED)
- [ ] WebSocket or polling for live data updates

**Assessment (2026-01-20):** Real-time updates would require significant infrastructure changes:
- **Backend:** WebSocket server (Cloudflare Workers with Durable Objects) or SSE endpoint
- **Client:** Subscription management, state synchronization, reconnection handling
- **Current Architecture:** Static-first with build-time seeding; single fetch on page load; no real-time infrastructure exists

**Recommendation:** Defer to separate initiative. Current architecture is optimized for static portfolio/directory use case. Real-time features should be evaluated against actual user need before investing in implementation.

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
- **Issue:** Public API endpoints at `api.sigmablox.com` return empty data or errors
  - `/api/public/companies` returns `{companies: [], ...}` (empty array with HTTP 200)
  - `/api/public/companies/filters` returns `{"error":"Failed to fetch filter options"}`
- **Status:** Endpoints are network-reachable but backend data source appears to have no data
- **Workaround:**
  - Build-time seeding treats empty API response as failure (falls back to mock data)
  - Client-side: Localhost uses seeded data; production falls back to seeded data on API failure

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
