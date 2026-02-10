# REQ-UX-007: Loading States and Page Transitions

## Metadata
- **Status**: PENDING
- **Priority**: LOW
- **Phase**: 4
- **Effort**: 0.5 weeks
- **Dependencies**: REQ-UX-002, REQ-UX-006
- **Blocks**: None

## Requirement
Add polish through loading states, skeleton screens, and smooth page transitions to create a cohesive, app-like experience.

## Current State
- No page transitions (hard navigation)
- Builders page has loading spinner
- Dashboard has "Retrieving records..." text
- No skeleton loaders for data-driven content
- Scroll reveal animations exist but inconsistent

## Opportunities

### Loading States
- Skeleton loaders for builder cards
- Skeleton loaders for dashboard metrics
- Pulse animation for loading elements

### Page Transitions
- Fade out/in on navigation
- View Transitions API (progressive enhancement)
- Smooth scroll to sections

### Scroll Animations
- Consistent `reveal` class usage
- Staggered children animations
- Intersection Observer based triggering

## Acceptance Criteria
- [ ] Skeleton loaders on builders page during fetch
- [ ] Skeleton loaders on dashboard during data load
- [ ] Smooth fade transition between pages (if supported)
- [ ] All sections use consistent reveal animations
- [ ] No layout shift from loading to loaded state
- [ ] Graceful degradation without JS

## Technical Specifications

### Skeleton Loader CSS
```css
.skeleton {
  background: linear-gradient(90deg,
    rgba(255,255,255,0.03) 25%,
    rgba(255,255,255,0.06) 50%,
    rgba(255,255,255,0.03) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### View Transitions (Progressive)
```css
@view-transition {
  navigation: auto;
}

::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.25s;
}
```

## Validation
- Page loads feel snappy, not jarring
- Loading states visible during slow network (3G simulation)
- Animations smooth at 60fps
- No accessibility regressions (prefers-reduced-motion respected)
