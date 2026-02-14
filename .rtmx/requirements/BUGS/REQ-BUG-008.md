# REQ-BUG-008: Auth check logs console errors on every page load

## Description
The navbar auth check (`/auth/me`) logs `console.error` on every page load when running locally or when the auth worker is not available. Vite dev server returns 200 + HTML for unknown routes, causing `response.json()` to throw a SyntaxError. The builders auth module similarly logs errors on 404 responses.

## Target
**Metric**: Zero console errors on page load when auth endpoint is unavailable

## Acceptance Criteria
- [x] `navbar.js` handles non-JSON `/auth/me` responses without console errors
- [x] `builders/auth.js` handles 404/non-JSON `/auth/me` responses without console errors
- [x] Auth still works correctly when the Cloudflare Worker is available in production
- [x] No console errors on localhost dev server

## Root Cause
- `navbar.js:174` calls `response.json()` without checking content-type. Vite SPA fallback returns 200 + HTML.
- `builders/auth.js:41` throws on non-200, which is then caught and logged as error instead of handled silently.

## Fix
1. Check `response.headers.get('content-type')` includes `application/json` before parsing
2. Downgrade `console.error` to `console.debug` for expected auth-unavailable scenarios
3. Return unauthenticated fallback silently on non-JSON or failed responses

## Status
- **Status**: COMPLETE
- **Phase**: 5
- **Priority**: LOW

## Sitrep - 2026-02-14

**Session**: claude-2026-02-14
**Status**: COMPLETE

### Completed
- `navbar.js`: Added content-type check before `response.json()` — returns early (keeps default sign-in buttons) when response is not JSON
- `builders/auth.js`: Returns unauthenticated fallback on non-200 without throwing; added content-type guard before JSON parse; downgraded catch log from `console.error` to `console.debug`
- Verified zero console errors on homepage, builders, and all other pages via Playwright

### Remaining
- None

### Blockers
- None

### Next Steps
- Browser-level 404 network error for `/auth/me` still appears in devtools Network tab on localhost (expected — Vite has no auth worker). This is browser native behavior and cannot be suppressed from JS.
