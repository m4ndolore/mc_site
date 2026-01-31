# REQ-BUG-006: Portfolio case study links non-functional (href="#")

## Summary
Portfolio page had 7 "View Case Study" links that pointed to `href="#"`, providing no functionality and poor UX.

## Issue
- Featured case study button linked to `#`
- 6 portfolio card links linked to `#`
- Clicking links had no effect, confusing users

## Impact
- Poor user experience
- Non-functional navigation
- Users clicking expect action

## Fix Applied
Following C2UX doctrine of explicit state over hidden state:

1. Replaced `<a href="#">` links with `<span>` elements
2. Added `--pending` modifier classes for disabled state
3. Added "PENDING" badge with amber styling (matches access.html pattern)
4. Applied CSS: dashed border, 50% opacity, pointer-events: none

## CSS Added
```css
.btn--pending {
  opacity: 0.50;
  pointer-events: none;
  border-style: dashed;
}

.portfolio-card__link--pending {
  opacity: 0.50;
  pointer-events: none;
  color: var(--text-muted);
}
```

## Files Changed
- `styles.css` (added pending states for btn and portfolio-card__link)
- `portfolio.html` (lines 140, 218, 241, 264, 287, 310, 334)

## Validation
- Visual verification via Playwright - pending badges render correctly
- Build passes
- Links no longer clickable

## Status
- **Status**: COMPLETE
- **Completed**: 2026-01-30
