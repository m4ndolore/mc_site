# REQ-UX-007: Loading States and Page Transitions

## Metadata
- **Status**: COMPLETE
- **Priority**: LOW
- **Phase**: 4
- **Effort**: 0.5 weeks
- **Dependencies**: REQ-UX-002, REQ-UX-006
- **Blocks**: None
- **Completed**: 2026-02-13

## Requirement
Add polish through loading states, skeleton screens, and smooth page transitions to create a cohesive, app-like experience.

## Implementation

### View Transitions API (styles.css)
- `@view-transition { navigation: auto; }` for MPA cross-document transitions
- 0.15s fade-out, 0.2s fade-in for smooth page navigation
- Progressive enhancement — browsers without support get normal navigation

### Skeleton Loaders (styles.css + HTML)
- Reusable skeleton CSS classes: `.skeleton`, `.skeleton-text`, `.skeleton-heading`, `.skeleton-card`, `.skeleton-metric`, `.skeleton-row`, `.skeleton-avatar`
- Shimmer animation via `skeleton-pulse` keyframes (1.5s)
- **builders.html**: 6 skeleton cards in grid as placeholder during data fetch
- **dashboard.html**: Skeleton metrics replacing `--` placeholders, skeleton activity rows, skeleton coverage rows
- All skeletons use `aria-hidden="true"` for accessibility

### Link Prefetch (js/scroll-reveal.js)
- Prefetches internal links on `pointerenter` (hover/touch)
- Deduplicates via Set to prevent redundant requests
- Only prefetches same-origin links

### Reduced Motion (styles.css)
- Expanded `prefers-reduced-motion: reduce` to cover:
  - Scroll reveal animations (instant display)
  - Skeleton animations (static)
  - View transitions (instant)
  - Hero canvas (dimmed)
  - Badge/node/scroll-line pulsing (disabled)

## Acceptance Criteria
- [x] Skeleton loaders on builders page during fetch
- [x] Skeleton loaders on dashboard during data load
- [x] Smooth fade transition between pages (if supported)
- [x] All sections use consistent reveal animations
- [x] No layout shift from loading to loaded state
- [x] Graceful degradation without JS
- [x] prefers-reduced-motion respected

## Validation
- Build passes clean
- Skeleton cards match builder-card dimensions (24px padding, 2px radius)
- View Transitions degrade gracefully in unsupported browsers
- Reduced motion users see static content immediately
