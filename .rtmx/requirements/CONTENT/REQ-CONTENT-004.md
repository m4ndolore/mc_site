# REQ-CONTENT-004: Complete TRUTH-003 Source Mapping for P1 Claims

## Metadata
- **Status**: PENDING
- **Priority**: HIGH
- **Phase**: 8
- **Effort**: 0.5 weeks
- **Dependencies**: None

## Requirement
Complete source mapping for all source-required `P1` claims in the current claims source map. Each row must include a usable source reference or attestation path and a clear verification status/method.

## Acceptance Criteria
- [ ] All `P1` rows with `source_requirement=required` in the current source map are reviewed
- [ ] `source_reference` is populated for each reviewed row (URL, document path, or attestation owner)
- [ ] `verification_status` is set (`verified`, `attested`, `needs_review`, or equivalent workflow value)
- [ ] `verification_method` is populated (`document`, `live page`, `owner attestation`, etc.)
- [ ] Any blocked claims have explicit rewrite recommendation in evidence notes

## Validation
- Review `docs/content/claims/claims-source-map-*-current.csv`
- Confirm no `P1 + required` rows remain blank for source/verification fields
- Spot-check corresponding page copy for claim text match

## Notes
- This extends completed `P0` mapping work and should feed directly into copy rewrites and approvals.
- Prioritize top-funnel pages first (`index.html`, `programs/the-combine.html`, `access.html`).
