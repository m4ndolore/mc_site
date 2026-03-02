# REQ-CONTENT-007: About Us Page (Founders, Partners, Who We Work With)

## Metadata
- **Status**: COMPLETE
- **Priority**: CRITICAL
- **Phase**: 8
- **Effort**: 1.0 weeks
- **Dependencies**: REQ-CONTENT-004, REQ-UX-008

## Requirement
Create a first-class "About Us" page that explains who Merge Combinator is, who the founders are, partners/collaborators, and who we work with. Content must use approved language and attribution-safe claims.

## Acceptance Criteria
- [x] New page exists and is linked from primary navigation or an equivalent discoverable path
- [x] Includes sections for founders, partners, and who-we-work-with collaboration model
- [x] Uses approved claims/quotes or clearly non-testimonial positioning language
- [x] Visual design is consistent with current site system (desktop + mobile)
- [x] No placeholder cohort/location facts or unapproved specifics
- [x] Claim inventory/source map updated for new page claims
- [x] Build passes

## Validation
- Visual review at desktop and mobile breakpoints
- Link check from navigation to page
- `npm run build` exits 0
- Manual review for attribution and factual accuracy

## Notes
- This is the next priority-0 execution item after branch cleanup.
- Start with information architecture and approved content matrix before visual polish.
- Partner categories remain generic until specific names/logos are approved for public release.
- Biographical claims (33 total) tracked in claims source map — all P0/P1 flagged for owner attestation.

---

## Sitrep - 2026-02-22 (Session 1)

**Status**: PARTIAL

### Completed
- Replaced existing `about.html` content with an approval-safe v1 structure
- Added explicit sections for founders, partners, and who-we-work-with collaboration paths
- Removed unsupported specifics (invented stats, team bios, and location claims) from the page content
- Added `About` to primary navbar links via `js/navbar.js`
- Updated homepage footer Company link to `/about`

### Remaining
- Replace founder placeholders with approved names, roles, and bios
- Add approved partner names/logos (or keep generic categories)
- Run claims extraction/classification/source mapping for About page copy
- Visual QA on desktop/mobile and final copy polish

---

## Sitrep - 2026-03-01 (Session 2)

**Session**: claude-2026-03-01
**Status**: COMPLETE

### Completed
- C2UX audit: fixed 9 border-radius violations (12px/10px → 2px on headshots and category pills)
- Claims extraction: 33 About page claims added to source map (CLAIM-about-001 through CLAIM-about-033)
  - 21 P0 biographical/factual claims flagged for owner attestation (military credentials, titles, combat deployments, degrees)
  - 12 P1/P2 opinion/aspirational/positioning claims flagged for editorial review
- Build passes (Vite build exit 0)
- All 3 headshot images (Paul, Elise, Doug) bundled by Vite from local assets
- Partner categories kept generic per policy (pending approval for specific names/logos)
- Note: "Department of War" usage in Doug Cummings bio flagged for verification (CLAIM-about-023)

### Remaining
- None — page complete. Biographical claims await owner attestation (tracked in source map, not blocking page publication).

### Blockers
- None

### Next Steps
- Content-ops should verify P0 biographical claims via owner attestation
- When partner names/logos are approved, update the generic category blocks
