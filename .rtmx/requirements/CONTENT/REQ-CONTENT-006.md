# REQ-CONTENT-006: De-risk Factual Speed and Validation Claims

## Metadata
- **Status**: COMPLETE
- **Priority**: HIGH
- **Phase**: 8
- **Effort**: 0.75 weeks
- **Dependencies**: REQ-CONTENT-004

## Requirement
Reduce or substantiate remaining high-risk factual wording related to speed, validation, ROI, traction, or deployment outcomes on the homepage and Combine page.

## Acceptance Criteria
- [x] Residual high-risk claims on `index.html` are either sourced or softened
- [x] Residual high-risk claims on `programs/the-combine.html` are either sourced or softened
- [x] Updated wording preserves intent while avoiding unsupported quantification
- [x] Claim inventory/classification/source-map artifacts are regenerated after edits
- [x] Build passes

## Validation
- Review current claim review queue and source map for unresolved high-risk rows
- Manual copy review on `/` and `/programs/the-combine`
- `npm run build` exits 0

## Notes
- Prefer precise numbers with traceable evidence over broad performance language.
- If proof is not available, scope the statement to process/value rather than outcome certainty.

---

## Sitrep - 2026-03-01

**Session**: claude-2026-03-01
**Status**: COMPLETE

### Claims De-risked

| Original | Replacement | File | Reason |
|----------|-------------|------|--------|
| "18-24 months" / "6-8 weeks" / "75% faster to deployment" | "Years" / "Weeks" / "Compressed discovery-to-validation cycle" | index.html | Specific numbers unsupported; qualitative comparison preserves intent |
| "From problem to deployment in weeks, not years." | "From problem to deployment — compressed timelines, real feedback." | index.html | Removed timeline promise, retained process description |
| "Weeks to deployment, not months or years." | "Compressed timelines from validation to deployment decision." | index.html | Same pattern: process attribute, not timeline promise |
| "The Combine is the fastest path to operator validation and deployment." | "The Combine puts you directly in front of the operators who own the problem." | the-combine.html | Removed superlative speed claim; replaced with attestable process description |
| "compresses months of discovery into five days" | "concentrates discovery into focused validation sessions" | the-combine.html | Removed unsupported timeline quantification |

### Meta Description Updates
- the-combine.html: "Proven validation" → "Validation", removed "One week, in person" from meta (retained in body where attestable)

### Build Verification
- `npm run build` exits 0 (301ms)
