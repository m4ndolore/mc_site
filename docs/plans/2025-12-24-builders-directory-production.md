# Defense Builders Directory - Production Ready

**Date:** 2025-12-24
**Status:** Approved for implementation

## Goal

Make the Defense Builders Directory production-ready with a professional, YC Launches-inspired design. Fix broken modal, improve card layout, add login CTA to drive conversions.

## Design Decisions

### Visual Style: Hybrid (Dark page + Light modal)
- Dark page background maintains mc_site aesthetic
- Light modal creates contrast, draws focus to company details
- Proven pattern from reference theme (`company-modal.css`)

### Card Layout: Single-Row (YC Launches style)
- Cards stack vertically, not in a grid
- More scannable, cleaner presentation
- Each card: logo | name + tagline | tags

### Modal Content: Essential + CTA
- Logo, name, cohort, website link
- Full description (not truncated)
- All mission areas and tech areas
- CTA box: "Want to see more? Login to access pitch decks, team info..."
- Two buttons: [Login to Access] [Visit Website →]

## Technical Fixes Required

### Issue 1: Modal CSS/HTML Mismatch
- **Problem:** CSS expects `.modal-overlay.active`, HTML uses `.builder-modal`
- **Fix:** Align class names, import proven modal styles from reference

### Issue 2: JS DOM ID Mismatch
- **Problem:** JS looks for `#modal-body`, HTML has `#modal-content`
- **Fix:** Update HTML IDs to match JS expectations

### Issue 3: Card Layout
- **Problem:** Grid layout, cards are boxy
- **Fix:** Single-row flex layout, horizontal card design

## Files to Modify

| File | Changes |
|------|---------|
| `styles/builders.css` | Replace modal styles, single-row card layout |
| `builders.html` | Fix modal HTML structure, update IDs |
| `js/builders/components.js` | Update card/modal render, add CTA box |
| `js/builders/index.js` | Fix DOM element selectors |

## Implementation Tasks

1. **Fix modal HTML structure** - Align IDs with JS expectations
2. **Update modal CSS** - Light modal with dark overlay, from reference theme
3. **Refactor card layout** - Single-row cards (flex column)
4. **Update card component** - Horizontal layout with logo left, content right
5. **Update modal component** - Add CTA box with login/website buttons
6. **Test locally** - Verify modal opens, filters work, responsive
7. **Commit and verify build**

## References

- `/combine` page from Ghost theme (`reference_theme/custom-combine.hbs`)
- Company modal CSS (`reference_theme/assets/css/company-modal.css`)
- YC Launches (https://www.ycombinator.com/launches)

## Success Criteria

- [ ] Cards display in single-row layout
- [ ] Clicking card opens light modal
- [ ] Modal shows company details + CTA to login
- [ ] Escape key and overlay click close modal
- [ ] Filters and search work
- [ ] Responsive on mobile
- [ ] Production build succeeds
