# REQ-CONTENT-006: De-risk Factual Speed and Validation Claims

## Metadata
- **Status**: PENDING
- **Priority**: HIGH
- **Phase**: 8
- **Effort**: 0.75 weeks
- **Dependencies**: REQ-CONTENT-004

## Requirement
Reduce or substantiate remaining high-risk factual wording related to speed, validation, ROI, traction, or deployment outcomes on the homepage and Combine page.

## Acceptance Criteria
- [ ] Residual high-risk claims on `index.html` are either sourced or softened
- [ ] Residual high-risk claims on `programs/the-combine.html` are either sourced or softened
- [ ] Updated wording preserves intent while avoiding unsupported quantification
- [ ] Claim inventory/classification/source-map artifacts are regenerated after edits
- [ ] Build passes

## Validation
- Review current claim review queue and source map for unresolved high-risk rows
- Manual copy review on `/` and `/programs/the-combine`
- `npm run build` exits 0

## Notes
- Prefer precise numbers with traceable evidence over broad performance language.
- If proof is not available, scope the statement to process/value rather than outcome certainty.
