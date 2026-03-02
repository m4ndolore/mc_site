# REQ-BUG-015: Docs page redirects back to base site instead of loading

## Description
Clicking the Docs link in the Guild SPA navigation redirects back to the base site (mergecombinator.com) instead of loading docs.mergecombinator.com. This may be a routing issue in merge-router, a missing DNS record, or an Outline Wiki configuration problem.

## Target
Docs link loads docs.mergecombinator.com with VIA SSO session intact.

## Acceptance Criteria
- [ ] Docs link navigates to docs.mergecombinator.com
- [ ] Page loads without redirect loop
- [ ] SSO session carries over (user is authenticated)

## Implementation
- **Status**: BLOCKED
- **Phase**: 9 (Platform Convergence)
- **Priority**: MEDIUM
- **Effort**: 0.5w
- **Dependencies**: REQ-DOCS-001
- **Notes**: Root cause identified: mc-router CF Worker catches `docs.mergecombinator.com` via route pattern and proxies to MC Pages (mc-site-dr4.pages.dev) instead of Outline Wiki. Needs Cloudflare dashboard action.

---

## Sitrep - 2026-03-01

**Session**: claude-2026-03-01
**Status**: BLOCKED (requires Cloudflare dashboard action)

### Root Cause Analysis
The mc-router CF Worker is bound to `*mergecombinator.com/*` routes in Cloudflare. When `docs.mergecombinator.com` receives a request:

1. Worker intercepts it (host = `docs.mergecombinator.com`)
2. Not in `ALIAS_HOSTS` (www, build) — no redirect
3. Not in `SUBDOMAIN_REDIRECTS` (only app) — no redirect
4. No route prefix matches — falls to default
5. Default handler proxies to `MC_PAGES_ORIGIN` (mc-site-dr4.pages.dev)
6. MC Pages serves `index.html` → user sees mc_site, not Outline Wiki

### Fix Options

**Option A (Recommended): Exclude docs from worker route**
- In Cloudflare dashboard → Workers Routes, change `*mergecombinator.com/*` to exclude `docs.mergecombinator.com/*`
- Or add a more specific route: `docs.mergecombinator.com/*` → (no worker)
- Requires: DNS for docs.mergecombinator.com pointing to Outline Wiki host (homelab `100.66.200.39` per sitrep 2026-01-23, likely via Cloudflare Tunnel or direct A record)

**Option B: Proxy in merge-router**
- Add `DOCS_ORIGIN` env var pointing to Outline Wiki
- Early-return in fetch handler: if host === `docs.mergecombinator.com`, proxy to DOCS_ORIGIN
- Downside: adds latency hop through CF Worker

**Option C: Early passthrough**
- If docs.mergecombinator.com has a Cloudflare Tunnel or CNAME to the wiki, simply `return fetch(request)` for unknown hosts
- This would let CF's DNS resolution handle it without the worker intervening

### Blocked On
- Cloudflare dashboard access to modify worker routes (Option A) or Outline Wiki origin URL (Option B)
- Verification that Outline Wiki is still running and accessible
