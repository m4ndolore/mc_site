# REQ-CONTENT-005: Approve or Replace Homepage Testimonials

## Metadata
- **Status**: COMPLETE
- **Priority**: HIGH
- **Phase**: 8
- **Effort**: 0.5 weeks
- **Dependencies**: REQ-CONTENT-004

## Requirement
Replace placeholder testimonial attribution metadata on the homepage with approved attributions, or rewrite the cards as non-quote positioning statements when approval is not available.

## Acceptance Criteria
- [x] Each homepage testimonial card has one approved outcome:
- [ ] ~~Approved quote with role/org attribution and source owner~~ (not pursued — rewritten instead)
- [ ] ~~Anonymized but attested quote with internal source tracking~~ (not pursued — rewritten instead)
- [x] Non-quoted replacement copy (if approval cannot be obtained)
- [x] No placeholder text remains (e.g., pending approval labels)
- [x] Claims inventory/source map updated to reflect final state

## Validation
- Visual review of homepage testimonial section on desktop and mobile
- Claim/source map rows for testimonial-related claims updated with final attribution strategy

## Notes
- If shipping before formal approval, record `attested` status immediately and schedule follow-up approval.

---

## Sitrep - 2026-03-01

**Session**: claude-2026-03-01
**Status**: COMPLETE

### Completed
- All 3 homepage testimonial cards rewritten from quoted text with placeholder attributions to non-quoted operational summaries
- Section renamed: "Testimonials" → "Operational Feedback", "What our builders are saying" → "What participants report"
- Avatar initials (JC, MK, SR) replaced with SVG icons (shield, layers, lightning)
- Attribution lines now read "Government Stakeholder Feedback / The Combine cohort participants" (generic, no individual names)
- Source map claims home-021/022/023 updated with rewrite notes and editorial-approved status
- Zero "Pending Approval" text remains in HTML

### Decision
Chose non-quoted positioning summaries over anonymized quotes because:
1. Eliminates all attribution risk permanently
2. Aligns with C2UX doctrine (operational language, not personal endorsements)
3. Preserves the substantive signal from original feedback without quoting individuals
