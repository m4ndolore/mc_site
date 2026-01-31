# REQ-BUG-003: Missing /combine page (broken nav link)

## Description
The navigation across 16+ pages links to `/combine` which does not exist. Vite serves `index.html` as fallback, making it appear to work but actually showing the homepage instead of dedicated Combine content.

## Problem
1. User clicks "Combine" in navigation
2. URL changes to `/combine`
3. User sees homepage content (not dedicated Combine page)
4. Confusing UX - clicking a nav link appears to do nothing

## Affected Files
- All pages with primary navigation (16 files)
- Footer links to `/combine`

## Target
**Metric**: `/combine` either resolves to a dedicated page OR navigation links are updated to appropriate target

## Acceptance Criteria
- [x] Option A: Create `combine.html` with dedicated content about The Combine program
- [ ] ~~Option B: Update nav links to point to appropriate section (e.g., `/#combine` anchor)~~
- [x] No broken/misleading navigation links

## Implementation Options

### Option A: Create dedicated page (Recommended)
Create `combine.html` with:
- Program overview (5-day operator integration cycle)
- Application process
- Upcoming cohort dates
- Past cohort highlights
- Apply CTA

### Option B: Anchor link
If Combine info is meant to be on homepage:
- Add `id="combine"` to the Combine section
- Update all nav links to `/#combine`

## Context
"The Combine" is described in index.html as:
> "5-day operator integration cycle. Problem validation, team formation, prototype scoping."

This is Phase 01 of the Ecosystem Modules and deserves dedicated content.

## Implementation
- **Status**: COMPLETE
- **Phase**: 2
- **Priority**: MEDIUM

## Validation
- **Method**: Manual Test
1. Click "Combine" in navigation
2. Verify dedicated page loads (not homepage)
3. Verify page title is "The Combine" or similar
4. Verify content matches program description

## Dependencies
- None

## Related
- REQ-C2UX-001 (C2UX transformation - added nav links)
- index.html Ecosystem Modules section

## Sitrep - 2026-01-30

**Session**: claude-session
**Status**: COMPLETE

### Completed
- Created `combine.html` with C2UX-compliant design
- 5-day program timeline with Day 1-5 activities
- Participant requirements section with 4 key criteria
- Cohort history panel showing past 3 cohorts
- Next session panel with Cohort 04 details
- Request Access CTA linking to /access
- Added to vite.config.js build inputs
- Visual verification passed (Playwright screenshot)

### Implementation Details
- Panel-based layout following C2UX doctrine
- Dark theme with design tokens from styles.css
- Sharp edges (2px radius), no rounded cards
- Operational language: "Recruiting", "Cohort", "Validation Review"
- Responsive grid adjusts at 1100px, 900px, 600px breakpoints

### Validation Results
- Build: PASS (npm run build exits 0)
- Navigation: PASS (clicking Combine from homepage loads /combine)
- Page title: "The Combine — Merge Combinator"
- Visual: C2UX compliant, no marketing language

### Next Steps
- None - requirement complete
