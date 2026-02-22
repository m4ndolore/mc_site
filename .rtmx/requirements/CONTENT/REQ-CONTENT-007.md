# REQ-CONTENT-007: About Us Page (Founders, Partners, Who We Work With)

## Metadata
- **Status**: PENDING
- **Priority**: CRITICAL
- **Phase**: 8
- **Effort**: 1.0 weeks
- **Dependencies**: REQ-CONTENT-004, REQ-UX-008

## Requirement
Create a first-class "About Us" page that explains who Merge Combinator is, who the founders are, partners/collaborators, and who we work with. Content must use approved language and attribution-safe claims.

## Acceptance Criteria
- [ ] New page exists and is linked from primary navigation or an equivalent discoverable path
- [ ] Includes sections for founders, partners, and who-we-work-with collaboration model
- [ ] Uses approved claims/quotes or clearly non-testimonial positioning language
- [ ] Visual design is consistent with current site system (desktop + mobile)
- [ ] No placeholder cohort/location facts or unapproved specifics
- [ ] Claim inventory/source map updated for new page claims
- [ ] Build passes

## Validation
- Visual review at desktop and mobile breakpoints
- Link check from navigation to page
- `npm run build` exits 0
- Manual review for attribution and factual accuracy

## Notes
- This is the next priority-0 execution item after branch cleanup.
- Start with information architecture and approved content matrix before visual polish.
