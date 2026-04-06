# REQ-BUG-015: Docs host access and session alignment

## Description
The docs host previously redirected back to the base site instead of loading Outline. Routing now appears to work from the main-site navigation, but access is still not aligned with the intended experience: docs and MC require separate logins, and docs is still treated as an internal tool in development rather than a broadly accessible Guild surface.

## Target
`docs.mergecombinator.com` loads successfully, internal users do not need to authenticate twice between MC and docs, and docs remains intentionally gated until it is ready for broader Guild exposure.

## Acceptance Criteria
- [x] Main-site Docs link navigates to `docs.mergecombinator.com`
- [x] Docs host loads without redirecting back to MC
- [ ] Accessed/internal user does not need a second login when moving from MC to docs
- [ ] Docs exposure model is explicit: either hidden from Guild or intentionally linked with correct auth behavior

## Implementation
- **Status**: PARTIAL
- **Phase**: 9 (Platform Convergence)
- **Priority**: MEDIUM
- **Effort**: 0.5w
- **Dependencies**: REQ-DOCS-001
- **Notes**: Routing appears fixed as of 2026-04-06 from the main-site navbar. Remaining gap is session/auth alignment: MC and docs still require separate logins. There is also no current Guild-facing docs entry point in this codebase, which is acceptable for now if docs remains intentionally internal.

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

## Sitrep - 2026-04-06

**Session**: codex-2026-04-06
**Status**: PARTIAL

### Reassessment
- Main-site docs links now resolve to `https://docs.mergecombinator.com` successfully.
- The original redirect-back-to-MC failure mode is no longer the primary issue.
- There is not currently a distinct Guild docs link visible in this codebase.
- Docs and MC still appear to require separate logins, so cross-app session sharing / SSO continuity is not yet working from a user perspective.
- Docs is still intended as an internal tool in development, so lack of broad Guild exposure is not itself a bug if kept intentional.

### Remaining
- Verify whether docs should remain hidden from Guild surfaces for now.
- Fix session continuity so an already-accessed internal user does not need to log in again on docs.
- Update navigation/product docs so expected docs access behavior is explicit.
