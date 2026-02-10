# REQ-UX-004: Mobile Navigation Polish

## Metadata
- **Status**: PENDING
- **Priority**: MEDIUM
- **Phase**: 4
- **Effort**: 0.25 weeks
- **Dependencies**: REQ-UX-002
- **Blocks**: None

## Requirement
Polish mobile navigation experience with smooth animations, proper dropdown handling, and responsive breakpoint behavior.

## Current State
- Hamburger menu toggle exists (`.nav__mobile-toggle`)
- Basic mobile menu functionality implemented
- Animation between hamburger and X states partially working
- Dropdown menus may not work correctly on mobile
- Breakpoint for menu collapse: 768px

## Acceptance Criteria
- [ ] Hamburger icon animates smoothly to X on open
- [ ] Mobile menu slides in from right (or full overlay)
- [ ] All nav links accessible with 44x44px touch targets
- [ ] Dropdown menus work on touch devices
- [ ] Menu closes on link click or outside tap
- [ ] Escape key closes menu
- [ ] No layout shift when menu opens/closes
- [ ] Menu state persists correctly during scroll

## Implementation Notes
- Use CSS transitions for hamburger animation
- Consider backdrop blur for overlay
- Ensure z-index hierarchy is correct
- Test on iOS Safari (scroll locking quirks)

## Validation
- Test on iPhone SE (375px)
- Test on iPhone 14 (428px)
- Test on iPad (768px boundary)
- All touch interactions responsive
