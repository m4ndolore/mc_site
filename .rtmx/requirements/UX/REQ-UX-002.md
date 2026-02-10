# REQ-UX-002: Unify Dark Theme Across All Pages

## Metadata
- **Status**: IN_PROGRESS
- **Priority**: HIGH
- **Phase**: 4
- **Effort**: 0.5 weeks
- **Dependencies**: REQ-C2UX-001
- **Blocks**: REQ-UX-003, REQ-UX-004

## Requirement
Consolidate dark theme implementation into a single, coherent architecture. Currently the site uses multiple override stylesheets (`dark-theme.css`, `builders-dark.css`) which creates maintenance overhead and potential inconsistencies.

## Current State
- `styles.css` - Base styles with `body { background: var(--white); color: var(--charcoal); }` (light default)
- `dark-theme.css` - 931-line override for marketing pages
- `styles/builders-dark.css` - 170-line override for builders page
- Multiple pages use inline `<style>` blocks for dark backgrounds
- Load order complexity: `styles.css → dark-theme.css → [page].css → [page]-dark.css`

## Target Architecture
- Dark theme as default in `styles.css`
- Light pages opt-in via `.light-theme` body class
- Eliminate `dark-theme.css` by merging into base styles
- Eliminate `builders-dark.css` by fixing `builders.css` to be dark-native
- No inline style blocks for theme overrides

## Acceptance Criteria
- [ ] `styles.css` body defaults to `background: var(--black); color: var(--offwhite);`
- [ ] All marketing pages render correctly with dark backgrounds
- [ ] Builders page uses single CSS file (dark-native)
- [ ] `dark-theme.css` deleted or deprecated
- [ ] `builders-dark.css` deleted or deprecated
- [ ] No page-specific inline dark theme overrides
- [ ] Consistent color variables across all pages
- [ ] Visual regression testing passes

## Files Affected
- `styles.css` - Base theme changes
- `dark-theme.css` - Merge into styles.css, then delete
- `styles/builders.css` - Convert to dark-native
- `styles/builders-dark.css` - Delete
- All HTML files - Remove inline dark overrides
- `index.html`, `knowledge.html`, `access.html`, etc. - Verify rendering

## Implementation Steps
1. Update `styles.css` body defaults to dark
2. Merge critical dark-theme.css rules into styles.css
3. Update builders.css to use dark variables natively
4. Remove dark-theme.css and builders-dark.css imports from HTML
5. Test all pages for visual consistency
6. Delete deprecated files

## Validation
- Visual comparison: Before/after screenshots of all pages
- Build passes with no CSS errors
- No horizontal scroll or layout breaks
- Color contrast meets WCAG AA

## Notes
Recent work added `dark-theme.css` and `builders-dark.css` which improved UI but increased code complexity. This requirement consolidates that work into a maintainable architecture.
