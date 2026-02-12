# Ralph Status

## Current Session
- **Started**: 2026-02-11 20:35
- **Task**: REQ-UX-002 - Unify dark theme across all pages (COMPLETE)

## Queue (Next 5)
1. REQ-UX-003 - Add missing footers (PENDING)
2. REQ-UX-004 - Mobile navigation polish (PENDING)
3. REQ-INFRA-003 - Subdomain DNS setup (BLOCKED - needs human)
4. REQ-AUTH-005 - VIA local dev integration (PARTIAL)
5. REQ-BUG-001 - VIA passkey flow error UX (PARTIAL)

## Recently Completed
- REQ-UX-002 - Dark theme unified, deleted dark-theme.css and builders-dark.css (2026-02-11)
- REQ-INFRA-003 - Turnstile verification, config hardening, test expansion (2026-02-11)
- REQ-BUG-007 - Identified /opportunities 500 error from Railway origin (2026-02-11)
- REQ-C2UX-001 scope revision - marketing vs operational split (2026-01-31)
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

### REQ-UX-002: Dark Theme Unification (COMPLETE)

**Work completed:**

1. **Investigation**
   - Found `styles.css` already has dark body defaults (lines 95-108)
   - Found dark theme rules already merged into `styles.css` (lines 4695-5588)
   - Found `builders.css` already dark-native
   - Found `dark-theme.css` only imported by `programs/the-combine.html`

2. **Cleanup**
   - Removed `dark-theme.css` import from `programs/the-combine.html`
   - Deleted `dark-theme.css` (930 lines - redundant)
   - Deleted `styles/builders-dark.css` (169 lines - never imported)

3. **RTMX Database Maintenance**
   - Added REQ-UX-002 through REQ-UX-007 to database.csv (were missing)
   - Created REQ-BUG-007.md requirement file

4. **Visual Verification**
   - Tested: homepage, builders, blog, portfolio, knowledge, combine pages
   - All pages render with consistent dark theme
   - Build passes cleanly

**CSS Architecture (final state):**
- `styles.css` - All base styles + dark theme rules (5588 lines)
- `styles/builders.css` - Builders page dark-native (1189 lines)
- `styles/dashboard.css` - Dashboard C2UX (287 lines)
- `subpage.css` - Subpage styles (717 lines)

---
_Last updated: 2026-02-11 20:50_
