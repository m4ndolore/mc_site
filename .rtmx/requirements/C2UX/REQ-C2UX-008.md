# REQ-C2UX-008: Global Light/Dark Mode System

## Status: COMPLETE

Verified 2026-02-16. All 9 acceptance criteria pass.

## Requirement
Add a theme toggle to the site header that allows users to switch between dark (default) and light themes. Respect `prefers-color-scheme` on first load. Persist choice in `localStorage`.

## Acceptance Criteria
1. [x] Theme toggle visible in navbar (all pages)
2. [x] Dark theme is default (current site appearance preserved exactly)
3. [x] Light theme provides readable, C2UX-compliant light palette
4. [x] `prefers-color-scheme: light` users see light theme on first visit
5. [x] User choice persisted in `localStorage` across sessions
6. [x] No FOUC (flash of unstyled content) on page load
7. [x] Transition between themes is smooth (CSS transition on background/color)
8. [x] All 31 Vite-built pages work correctly in both themes
9. [x] Responsive — toggle works on mobile navbar too

## Design Constraints
- C2UX doctrine: operational, not friendly. Toggle is a utility control, not a decorative feature
- Light theme must remain dense and scannable — not "friendly whitespace"
- Toggle icon: sun/moon or similar minimal indicator. No labels needed
- Position: navbar utility area (near auth controls)

## Implementation
- `js/theme.js` — ES module exporting getTheme/setTheme/toggleTheme. Detects `prefers-color-scheme`, manages localStorage (`mc-theme` key), applies `light-theme` class to `<html>` and `<body>`. Listens for system preference changes.
- `styles/light-theme.css` — 902 lines of light overrides. Inverts design tokens, covers nav, hero, cards, buttons, sections, footer, dashboard, builders, blog, legal, knowledge, combine, merch, opportunities, status, 404, and scroll/selection. Includes `.no-transitions` class for FOUC prevention.
- `js/navbar.js` — imports `toggleTheme` from theme.js, renders sun/moon toggle button in navbar utility area, wires click handler.
- All 31 HTML pages — inline FOUC-prevention script in `<head>` reads localStorage and applies `light-theme` + `no-transitions` classes before first paint. `no-transitions` removed after two rAF frames.

## Dependencies
- REQ-UX-008 (unified navbar) — COMPLETE
- REQ-UX-002 (unified dark theme) — COMPLETE

## Verification Evidence
- `verification-dark-default.png` — homepage in dark mode
- `verification-dark-toggled.png` — homepage after toggle to dark
- `verification-builders-dark-persisted.png` — builders page, dark theme persisted across nav
- `verification-builders-light.png` — builders page in light mode
- `verification-light-blog-article.png` — blog article in light mode
- `verification-mobile-light.png` — mobile homepage in light mode
- `verification-mobile-menu-light.png` — mobile menu showing theme toggle
