# REQ-C2UX-008: Global Light/Dark Mode System

## Requirement
Add a theme toggle to the site header that allows users to switch between dark (default) and light themes. Respect `prefers-color-scheme` on first load. Persist choice in `localStorage`.

## Acceptance Criteria
1. Theme toggle visible in navbar (all pages)
2. Dark theme is default (current site appearance preserved exactly)
3. Light theme provides readable, C2UX-compliant light palette
4. `prefers-color-scheme: light` users see light theme on first visit
5. User choice persisted in `localStorage` across sessions
6. No FOUC (flash of unstyled content) on page load
7. Transition between themes is smooth (CSS transition on background/color)
8. All 28 pages work correctly in both themes
9. Responsive — toggle works on mobile navbar too

## Design Constraints
- C2UX doctrine: operational, not friendly. Toggle is a utility control, not a decorative feature
- Light theme must remain dense and scannable — not "friendly whitespace"
- Toggle icon: sun/moon or similar minimal indicator. No labels needed
- Position: navbar utility area (near auth controls)

## Technical Approach
- `js/theme.js` module: detects preference, manages localStorage, applies class
- `body.light-theme` class toggles light overrides (existing stub at styles.css:105)
- Script loaded in `<head>` with blocking to prevent FOUC
- navbar.js integrates toggle button

## Dependencies
- REQ-UX-008 (unified navbar) — COMPLETE
- REQ-UX-002 (unified dark theme) — COMPLETE

## Target Files
- `js/theme.js` (new)
- `styles.css` (light theme overrides)
- `js/navbar.js` (toggle button integration)
- All `*.html` (theme script in head)
