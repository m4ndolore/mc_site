# Implementation Plan

> This file tracks implementation progress for mc_site.

## Status

**Last Updated:** 2026-01-20
**Current Phase:** Phase 1 - Public API Integration

## Completed

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

### Phase 2: Build-time Seeding (Not Started)
- [ ] `npm run build` fetches and caches company data
- [ ] Static JSON written to `public/data/companies.json`
- [ ] Build fails gracefully if API unreachable (uses cached data)
- [ ] Cache invalidation strategy documented

### Phase 3: Private API Integration (Not Started)
- [ ] VIA OAuth login flow works (`/auth/login`)
- [ ] Authenticated requests include Bearer token
- [ ] Private content only shown to logged-in users
- [ ] Session persists across page navigation

## Discovered Issues

### API Backend Issues
- **Issue:** Public API endpoints at `api.sigmablox.com` return application-level errors
  - `/api/public/companies` returns `{"error":"Failed to fetch companies"}`
  - `/api/public/companies/filters` returns `{"error":"Failed to fetch filter options"}`
- **Status:** Endpoints are network-reachable but backend data source appears unavailable
- **Workaround:** Mock data fallback is active for local development

### Script Module Warnings
- **Issue:** Vite warns about scripts without `type="module"` attribute
- **Files affected:** `script.js`, `js/scroll-reveal.js` across multiple HTML files
- **Impact:** Non-blocking, build succeeds
- **Fix:** Add `type="module"` to script tags (low priority)

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
