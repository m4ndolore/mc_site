# Ralph Status

## Current Session
- **Started**: 2026-01-31 00:00
- **Task**: REQ-C2UX-001 scope revision + unified navbar (COMPLETE)

## Queue (Next 5)
1. REQ-AUTH-004 - Passkey setup prompt (BLOCKED - needs VIA admin API token)
2. REQ-INFRA-001 - api.mergecombinator.com (BLOCKED - needs DNS record)
3. REQ-DOCS-003 - Contributor access workflow Phase 3 (BLOCKED - needs API endpoint)
4. -
5. -

## Recently Completed
- REQ-C2UX-001 scope revision - marketing vs operational split (2026-01-31)
- Unified navbar with Platform dropdown (2026-01-31)
- REQ-UX-001 - Mobile UI/UX review - all pages pass (2026-01-31)
- REQ-BUG-006 - Portfolio case study links fixed with pending state (2026-01-30)
- REQ-BUG-005 - Script loading inconsistency fixed (2026-01-30)
- REQ-BUG-004 - Partner logo path fix in index.html (2026-01-30)
- REQ-BUG-003 - Missing /combine page fixed (2026-01-30)

## Blocked / Needs Human
- REQ-AUTH-004: Requires AUTHENTIK_ADMIN_TOKEN in .env.local for VIA API access
- REQ-INFRA-001: DNS record for api.mergecombinator.com
- REQ-INFRA-002: Create mc-docs-contributors group in VIA + Outline (manual admin setup)
- REQ-DOCS-003 Phase 3: API endpoint at api.sigmablox.com/api/contributor-request

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

## Session Notes - 2026-01-30

### Bug Fix Session (23:30)
- Ran automated codebase scan for bugs via Explore agent
- Found and fixed 2 issues:

**REQ-BUG-005: Script Loading Inconsistency**
- `dashboard.html` and `combine.html` had `script.js` without `type="module"`
- `builders.html` had `auth-nav.js` with unnecessary `type="module"`
- Fixed to standardize: `script.js` always module, `auth-nav.js` never module

**REQ-BUG-006: Portfolio Case Study Links**
- 7 "View Case Study" links pointing to `href="#"` - non-functional
- Following C2UX explicit state doctrine, replaced with disabled spans
- Added "PENDING" badge with amber styling (matches access.html pattern)
- CSS: dashed border, 50% opacity, pointer-events: none

### Console Errors (Expected in Local Dev)
- `/auth/me` returns HTML 404 (Cloudflare Worker not running locally)
- Builder images 404 (Cloudflare Image Resizing not available locally)
- These resolve in production environment

### Build Warnings (Non-blocking)
- `<script>` tags for `auth-nav.js` without `type="module"` - expected, IIFE doesn't need module

---
_Last updated: 2026-01-31 00:30_
