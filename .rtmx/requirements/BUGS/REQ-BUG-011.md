# REQ-BUG-011: Stale Files Need Removal

## Description
Two stale files exist in the repository:
1. `public/js/scroll-reveal.js` - Duplicate of `js/scroll-reveal.js` (not imported anywhere, missing link prefetch section)
2. `programs/the-combine-old.html` - Old version of the-combine.html, replaced by current version

## Target
No dead code in repository.

## Acceptance Criteria
- [ ] public/js/scroll-reveal.js deleted
- [ ] programs/the-combine-old.html deleted
- [ ] Build still passes

## Implementation
- **Status**: PARTIAL
- **Phase**: 5
- **Priority**: LOW
