# REQ-BUG-014: Guild SPA returns 404 on /guild/me and /builders after login

## Description
After logging in via VIA on the Guild SPA (`guild.mergecombinator.com`), navigating to /guild/me, /builders/companies, or /builders/coaches returns 404. The Guild SPA is not correctly routing API calls to `api.mergecombinator.com` with the Bearer token, or the SPA routes themselves are not mounted.

## Target
Authenticated users see their profile at /guild/me and builder listings at /builders/*.

## Acceptance Criteria
- [ ] Guild SPA sends access token as `Authorization: Bearer <token>` to api.mergecombinator.com
- [ ] /guild/me returns 200 with user profile and guild_user_id
- [ ] /builders/companies returns 200 with paginated company list
- [ ] /builders/coaches returns 200 with paginated coach list

## Implementation
- **Status**: PARTIAL
- **Phase**: 9 (Platform Convergence)
- **Priority**: HIGH
- **Effort**: 1.0w
- **Dependencies**: REQ-PLATFORM-001
- **Notes**: Guild SPA deployed to CF Pages. Custom domain `guild.mergecombinator.com` serves the React app. SPA fallback routing works. API integration (Bearer token auth to api.mergecombinator.com) needs end-to-end verification with a logged-in user.

## Sitrep - 2026-02-27

**Session**: claude-2026-02-27-guild-spa-fixes
**Status**: PARTIAL (SPA deployed, API integration needs E2E verification)

### Root Cause
Guild SPA (`signal-incubator/apps/console`) was built but NOT deployed. No Cloudflare Pages project existed. The `mc-app-placeholder` project already had `guild.mergecombinator.com` custom domain bound, serving a placeholder page.

### Fix Applied
- Added `public/_redirects` with `/* /index.html 200` for SPA client-side routing
- Built Guild SPA: `tsc && vite build` → 304KB JS + 11KB CSS
- Deployed `dist/` to CF Pages project `mc-app-placeholder` (replacing placeholder)
- `CONSOLE_ROLLOUT_MODE` already set to `"on"` in api-worker (no change needed)

### Verification
- `guild.mergecombinator.com/` → serves React SPA (MC Console)
- `guild.mergecombinator.com/builders` → SPA fallback works (deep link returns index.html)
- Commit: `0b3b7c9` (signal-incubator)

### Remaining
- E2E verification with authenticated user (VIA → Guild → API calls with Bearer token)
- Verify `/guild/me` and `/builders/companies` API calls work from Guild SPA
