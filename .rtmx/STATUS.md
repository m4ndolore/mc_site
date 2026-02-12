# Ralph Status

## Current Session
- **Started**: 2026-02-11 00:00
- **Task**: REQ-INFRA-003 - Complete MC Router restructuring (PARTIAL)

## Queue (Next 5)
1. REQ-INFRA-003 - Subdomain DNS setup (needs human)
2. REQ-AUTH-005 - VIA local dev integration (PARTIAL)
3. REQ-BUG-001 - VIA passkey flow error UX (PARTIAL)
4. REQ-DOCS-003 - Contributor access workflow (PARTIAL)
5. REQ-AUTH-004 - Passkey setup prompt (BLOCKED - needs VIA lift-and-shift)

## Recently Completed
- REQ-INFRA-003 - Turnstile verification, config hardening, test expansion (2026-02-11)
- REQ-BUG-007 - Identified /opportunities 500 error from Railway origin (2026-02-11)
- REQ-C2UX-001 scope revision - marketing vs operational split (2026-01-31)
- Unified navbar with Platform dropdown (2026-01-31)
- REQ-UX-001 - Mobile UI/UX review - all pages pass (2026-01-31)

## Blocked / Needs Human
- REQ-INFRA-003: DNS records needed for app/wingman/control.mergecombinator.com
- REQ-AUTH-004: VIA lift-and-shift in progress
- REQ-INFRA-001: DNS record for api.mergecombinator.com
- REQ-BUG-007: Railway origin returning 500 for /opportunities proxy

## Session Notes - 2026-02-11

### REQ-INFRA-003: MC Router Restructuring

**Work completed:**

1. **Turnstile Verification** (Section 2)
   - All tests pass on production
   - Site key injection confirmed working
   - Explicit render with onloadTurnstileCallback configured

2. **Configuration Hardening** (Section 3)
   - Added `validateOAuthConfig()` in auth.js - fails fast on missing MC_OAUTH_CLIENT_ID, MC_OAUTH_CLIENT_SECRET, SESSION_SECRET
   - Added CORS warning when API_CORS_ORIGINS empty (console.warn instead of throw for graceful degradation)
   - No DEFAULT_ORIGINS fallbacks found
   - Secrets not logged to console

3. **Test Coverage Expansion** (Section 6)
   - Expanded test-router.mjs from 35 to 47 assertions
   - Added testPublicPaths (8 paths)
   - Added testAuthRedirects (returnTo validation, URL encoding)
   - Added testAuthMeEndpoint (JSON structure check)
   - Added CORS credentials test
   - All tests pass on production

4. **Subdomain Origin Readiness** (Section 8)
   - DNS check results:
     - app.mergecombinator.com: NO DNS ❌
     - wingman.mergecombinator.com: NO DNS ❌
     - control.mergecombinator.com: NO DNS ❌
     - docs.mergecombinator.com: Has DNS ✅
     - sbir.mergecombinator.com: Has DNS ✅
   - Documented status in wrangler.toml comments

5. **Bug Discovery**
   - REQ-BUG-007: /opportunities returns 500 from Railway origin
   - sbir.mergecombinator.com works when accessed directly, fails when proxied

**Remaining work (blocked on human action):**
- DNS records for app/wingman/control subdomains
- Placeholder deployments for each console subdomain
- DEPLOYMENT.md secrets management documentation
- CI/CD test integration documentation

---

## Session Notes - 2026-01-31

### C2UX Scope Revision

**User feedback:** "I appreciate C2UX but parts of the website are for marketing and branding."

**Resolution - Two-tier design approach:**
- **Marketing tier**: Glossy homepages (Anduril/Palantir style) for `/`, `/portfolio`, `/combine`
- **Operational tier**: C2UX for `/status`, `/dashboard`, `/builders` (authenticated views)

**Changes made:**
1. Reverted index.html, portfolio.html, archive.html, opportunities.html to pre-C2UX
2. Created `/status` page from C2UX homepage (preserved for operators)
3. Unified navbar: Defense Builders | Combine | Merch | Platform (dropdown)
4. Platform dropdown contains: Status, Opportunities, Knowledge, Docs
5. Single blue Access button

**Design philosophy:** The front door is for marketing. C2UX is for operators once inside.

---

### Mobile UX Audit (REQ-UX-001)

**Pages Tested:**
- index.html, builders.html, dashboard.html, access.html, combine.html, portfolio.html

**Findings:**
- All acceptance criteria pass
- No horizontal scroll on any page at 375px
- Hamburger menu functional with animated X transition
- Builder modal scrolls correctly on mobile
- Form inputs full-width with adequate touch targets
- CSS has 64 media queries across 3 files (640px, 768px, 1024px breakpoints)

**Method:**
- Visual testing via Playwright at 375px, 414px, 768px
- CSS code review for responsive rules
- Build verification (passes cleanly)

**Result:** COMPLETE - No fixes required, site is well-optimized for mobile.

---
_Last updated: 2026-02-11 06:35_
