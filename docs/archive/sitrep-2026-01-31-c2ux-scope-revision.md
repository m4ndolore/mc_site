# Sitrep: C2UX Scope Revision & Unified Navigation

**Date**: 2026-01-31
**Session**: claude-session

## Summary

Revised C2UX implementation scope based on user feedback. Established two-tier design approach: glossy marketing pages for visitors, C2UX for authenticated operators.

## Key Decision

> "I appreciate C2UX but parts of the website are for marketing and branding... Both should have glossy marketing homepages like Anduril and Palantir!"

## Changes Made

### 1. Reverted Marketing Pages to Pre-C2UX
- `index.html` - Original marketing homepage restored
- `portfolio.html` - Glossy portfolio showcase restored
- `archive.html` - Restored
- `opportunities.html` - Restored

Backups kept locally (not in git):
- `index.html.c2ux-backup`
- `portfolio.html.c2ux-backup`
- `archive.html.c2ux-backup`
- `opportunities.html.c2ux-backup`

### 2. Created /status Page
The C2UX homepage was preserved as `/status` for operators:
- Ecosystem operations console
- Stats grid, operational pipeline, system capabilities
- C2UX design language maintained

### 3. Unified Navigation (All 18 Pages)
```
[Logo] Defense Builders | Combine | Merch | Platform ▼ | [Access]
                                            └── Status
                                            └── Opportunities
                                            └── Knowledge
                                            └── Docs
```

- Logo links to `/` on all pages
- Logo structure: `<span>Merge</span><span>Combinator</span>` + arrows
- Platform dropdown on hover (desktop) / tap (mobile)
- Single blue Access button (compact: 8px/16px padding)
- Platform has hover underline like other nav items

### 4. Mobile Dropdown Support
- Added CSS for mobile dropdown behavior
- Added JS handler in `script.js` (`initDropdownMenu()`)
- Dropdown expands on tap in mobile view

## Design Philosophy (Documented in REQ-C2UX-001)

| Tier | Pages | Style |
|------|-------|-------|
| Marketing | `/`, `/portfolio`, `/combine`, landing pages | Glossy, branded, storytelling |
| Operational | `/status`, `/dashboard`, `/builders` | C2UX, data-dense, sharp |

**Rationale**: The front door is for marketing. C2UX is for operators once they're inside.

## Files Changed

### HTML (18 pages)
All pages with standard nav received unified navbar

### CSS
- `styles.css` - Added dropdown styles, `nav__btn--access`, mobile dropdown

### JS
- `script.js` - Added `initDropdownMenu()` function

### Config
- `vite.config.js` - Added `status.html` to build inputs

### Docs
- `.rtmx/requirements/C2UX/REQ-C2UX-001.md` - Scope clarification added
- `.rtmx/STATUS.md` - Session notes updated

## Current State

- **Build**: Passes cleanly
- **Deployed**: Yes (pushed to main, Cloudflare Pages auto-deploys)
- **Marketing homepage**: Restored and live
- **C2UX console**: Available at `/status`

## Blocked Items (Unchanged)

- REQ-AUTH-004: Needs VIA admin API token
- REQ-INFRA-001: Needs DNS record for api.mergecombinator.com
- REQ-DOCS-003: Needs API endpoint

## Next Session Recommendations

1. **Review `/status` page** - Decide if it needs refinement or features from `/dashboard`
2. **Consider blending** - User mentioned blending best features of C2UX console with dashboard
3. **Glossy marketing polish** - Homepage could benefit from Anduril/Palantir-style polish
4. **Mobile testing** - Verify dropdown works on actual devices (tested via code review only)
