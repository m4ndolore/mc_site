# REQ-CONTENT-004: Complete TRUTH-003 Source Mapping for P1 Claims

## Metadata
- **Status**: COMPLETE
- **Priority**: HIGH
- **Phase**: 8
- **Effort**: 0.5 weeks
- **Dependencies**: None

## Requirement
Complete source mapping for all source-required `P1` claims in the current claims source map. Each row must include a usable source reference or attestation path and a clear verification status/method.

## Acceptance Criteria
- [x] All `P1` rows with `source_requirement=required` in the current source map are reviewed
- [x] `source_reference` is populated for each reviewed row (URL, document path, or attestation owner)
- [x] `verification_status` is set (`verified`, `attested`, `needs_review`, or equivalent workflow value)
- [x] `verification_method` is populated (`document`, `live page`, `owner attestation`, etc.)
- [x] Any blocked claims have explicit rewrite recommendation in evidence notes

## Validation
- Review `docs/content/claims/claims-source-map-*-current.csv`
- Confirm no `P1 + required` rows remain blank for source/verification fields
- Spot-check corresponding page copy for claim text match

## Notes
- This extends completed `P0` mapping work and should feed directly into copy rewrites and approvals.
- Prioritize top-funnel pages first (`index.html`, `programs/the-combine.html`, `access.html`).

---

## Sitrep - 2026-03-01

**Session**: claude-2026-03-01
**Status**: COMPLETE

### Completed
- Reviewed all 13 P1 required claims in `claims-source-map-2026-02-21-current.csv`
- **10 claims attested**: program format (one week, in person, selection-based), eligibility criteria (funded teams, Indo-Pacific alignment), live platform features (Guild listings, Defense Builders portal), organizational self-description
- **3 claims de-risked via copy revision**: "Weeks to deployment" → "Compressed timelines", "fastest path" → "directly in front of operators", "compresses months into five days" → "concentrates discovery"
- **3 new metric claims discovered and added**: 150+ operators (CLAIM-home-034), 83 companies Cohort 01 (CLAIM-programs-the-combine-015), 21 matched Finalists Round (CLAIM-programs-the-combine-016) — all marked needs-source pending program records attestation
- Updated claim_text for 3 rewritten claims to match current page copy
- Updated testimonial claims (home-021/022/023) to reflect non-quoted rewrites

### Remaining
- 3 newly-added metric claims (150+, 83, 21) still need owner attestation from program records

### Next Steps
- Owner should attest metric claims from Combine program records when available
