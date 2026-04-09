# REQ-UX-011: Access Page Redesign

## Metadata
- **Status**: COMPLETE
- **Priority**: HIGH
- **Phase**: 7
- **Effort**: 1.5 weeks
- **Dependencies**: REQ-UX-002, REQ-C2UX-001
- **Blocks**: None
- **Started**: 2026-02-19

## Requirement
Redesign /access as first-class entry point replacing SigmaBlox join flow, with simplified UX and inline form.

## Acceptance Criteria
- [x] Split-panel layout with hero and form
- [x] Dark/light theme support
- [x] Mobile responsive
- [x] Replace SigmaBlox /join redirect
- [x] Verify end-to-end auth flow
- [x] Context-aware routing (?context=combine etc)

## Implementation
Split-panel layout shipped: left hero with Pentagon bg + features, right panel with request access form (Builders/The Combine/Guild chips) + compact sign-in (email + Google/CAC SSO).

## Remaining
None. Shipped and reflected as COMPLETE in RTMX database.
