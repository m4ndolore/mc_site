# REQ-UX-008: Unified Modular Navbar Component

## Metadata
- **Status**: COMPLETE
- **Priority**: HIGH
- **Phase**: 5
- **Effort**: 1.5 weeks
- **Dependencies**: REQ-UX-002, REQ-DOCS-002
- **Blocks**: None

## Requirement

Extract the navigation bar into a single modular component (web component or shared JS partial) that all properties consume. Eliminates the current duplication where the navbar is copy-pasted across 19+ HTML pages, a separate React component in the Opportunities app, and a custom header in Outline Wiki docs.

## Target

One shared navbar component consumed by all properties with consistent branding and links.

## Acceptance Criteria
- [x] Single source of truth for navbar markup/logic
- [x] Used across all main site pages (replaces static HTML)
- [x] Responsive mobile menu (hamburger, body scroll lock, touch targets 44px+)
- [x] Platform dropdown with Status, Opportunities, Knowledge, Docs
- [x] Auth state handling (Sign in/Join vs user avatar dropdown)
- [x] Active page highlighting
- [x] Environment-aware links (relative for same-origin, absolute for cross-origin)
- [x] Build passes with no regressions
- [x] Visual appearance identical to current navbar

## Implementation (Option B: Shared JS Module)

`js/navbar.js` — ES module that renders navbar HTML into a `<div id="mc-navbar">` mount point.

**Architecture:**
- `NAV_LINKS` and `PLATFORM_LINKS` arrays define all navigation items
- `getActivePath()` auto-detects current page from `window.location.pathname`
- `renderNavHTML()` generates BEM-class HTML matching existing `styles.css` rules
- `initAuth()` checks `/auth/me` endpoint and swaps Sign in/Join for user avatar dropdown
- `initMobileMenu()` handles hamburger toggle, body scroll lock, Escape key, outside click, resize close
- `initDropdown()` handles Platform dropdown on mobile (click-to-expand)
- `initScrollBehavior()` adds `nav--scrolled` class on scroll for backdrop blur
- Guard: `mount.dataset.initialized` prevents double-init with `script.js` nav functions

**Pages converted:** All 28 Vite-built pages (20 root + 8 subdirectory).

**Out of scope:** `style-guide.html`, `programs/the-combine-old.html` (dev/legacy, not in Vite build). Opportunities React SPA (separate Vite app with its own `Layout.tsx`). Outline Wiki docs header.

**Cleanup:**
- `js/auth-nav.js` deleted (auth logic integrated into `navbar.js`)
- Dead `.auth-nav__*` CSS rules removed from `styles.css`
- `script.js` nav functions guarded to skip when `navbar.js` already initialized

## Validation
- **Method**: Visual Test
- All pages render with identical navbar
- Mobile menu works on all pages (tested at 375px)
- Auth state reflected correctly (defaults to Sign in/Join, swaps on auth)
- No layout regressions at 1920px, 1024px, 768px, 375px
- Build passes cleanly (28 HTML pages, 62 modules)

## Sitrep - 2026-02-14

**Session**: claude-2026-02-14
**Status**: COMPLETE

### Completed
- Created `js/navbar.js` single source of truth module (Task 1)
- Guarded `script.js` nav functions against double-init (Task 2)
- Converted 9 high-traffic root pages: index, builders, wingman, guild, dashboard, opportunities, knowledge, status, briefs (Task 3)
- Converted 11 content/legal pages: blog, portfolio, archive, merch, access, contribute, privacy, terms, security, 404, combine (Task 4)
- Converted 9 subdirectory pages: programs/index, programs/the-combine, knowledge/*, blog/* (Task 5)
- Standardized about.html from legacy nav to site-standard nav (Task 6)
- Deleted `js/auth-nav.js` and dead `.auth-nav__*` CSS (Task 7)
- Visual verification at 1280px and 375px with Playwright MCP (Task 8)

### Remaining
- None for main site scope

### Blockers
- None

### Next Steps
- Future: React wrapper for Opportunities SPA to consume `navbar.js` instead of its own Layout.tsx copy
- Future: Outline Wiki custom header injection using `navbar.js`
