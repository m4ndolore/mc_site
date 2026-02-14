# REQ-BUG-010: portfolio.html Case Study Links Non-functional

## Description
All 7 "View Case Study" links on portfolio.html point to `href="#"`. REQ-BUG-006 addressed this pattern on other pages by replacing with disabled spans and PENDING badges, but portfolio.html was missed.

## Target
Case study links clearly show PENDING state per C2UX explicit state doctrine.

## Acceptance Criteria
- [ ] Featured case study "View Case Study" button shows PENDING state
- [ ] All 6 portfolio grid "View Case Study" links show PENDING state
- [ ] No href="#" links remain on the page

## Implementation
- **Status**: PARTIAL
- **Phase**: 5
- **Priority**: LOW
