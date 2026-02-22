# REQ-DOCS-006: Visual Artifact Storage Policy

## Metadata
- **Status**: PENDING
- **Priority**: MEDIUM
- **Phase**: 8
- **Effort**: 0.25 weeks
- **Dependencies**: None

## Requirement
Document and enforce a single storage policy for Playwright screenshots and ad-hoc visual verification captures so visual evidence is preserved without creating repo noise.

## Acceptance Criteria
- [ ] Policy defines what stays in git vs CI artifacts only
- [ ] Policy covers Playwright snapshots, ad-hoc screenshots, and retention expectations
- [ ] `.gitignore` aligns with policy
- [ ] Contributing/testing docs reference the policy

## Validation
- Review `.gitignore` and visual testing docs for consistency
- Confirm no new screenshot churn paths remain ambiguous

## Notes
- Current repo history shows mixed practices (committed captures and artifact-only snapshots).
