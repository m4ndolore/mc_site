# REQ-DOCS-003: Internal Docs Access Workflow

## Description
Implement the smallest viable workflow for granting and maintaining internal docs access for a narrow allowlist of approved `@mergecombinator.com` users while docs remains an internal tool in development.

## Target
**Metric**: Approved internal users can access and edit docs without opening docs to broader Guild membership.

## Acceptance Criteria
- [ ] Approved internal users are explicitly identified and allowlisted
- [ ] Internal docs access uses the same canonical admin authorization rule as Guild `/admin`
- [ ] Approved internal user can access and edit docs
- [ ] Non-approved user cannot access internal docs
- [ ] Expected behavior is documented:
  - docs remains internal-only for now
  - Guild does not need a broad docs entry point yet
  - second-login behavior is either removed or explicitly documented as a temporary gap

## Implementation

### Phase 1: Access Model

- Treat docs as an internal tool, not a general contributor surface
- Use the same single source of truth as Guild admin:
  - token-derived canonical `admin` role preferred
- Avoid building a broad request/approval funnel unless the product need returns later

### Phase 2: Allowlist

- Start with the current 3 approved `@mergecombinator.com` users
- Confirm they resolve to the expected admin role/group in VIA
- Confirm the same users can be recognized in Outline/docs access control

### Phase 3: Session / SSO

- Best outcome: internal admin authenticates once and can move from MC to docs without a second login
- Temporary acceptable outcome while docs is still internal:
  - access is correct and narrow
  - remaining double-login behavior is documented as a known gap under `REQ-BUG-015`

## Status
- **Status**: PARTIAL
- **Phase**: 3
- **Priority**: MEDIUM

## Validation
- **Method**: Manual Test
1. Authenticate as approved internal admin on MC
2. Access Guild `/admin`
3. Access `docs.mergecombinator.com`
4. Verify edit access in docs
5. Verify non-approved user is denied
6. Verify whether a second login is still required

## Dependencies
- REQ-DOCS-001 (docs host reachable)
- REQ-INFRA-002 (internal docs admin access infrastructure)
- REQ-BUG-015 (session continuity / docs auth alignment)

## Technical Notes
- This supersedes the earlier “docs contributors” framing for the current phase.
- If docs later becomes a broader contributor surface, a new requirement should define that workflow explicitly instead of overloading this one.

## Sitrep - 2026-04-06

**Session**: codex-2026-04-06
**Status**: PARTIAL

### Reframe
- Docs is not yet ready for broad Guild exposure.
- The immediate need is narrow internal access for approved `@mergecombinator.com` users.
- Best simplification path is one canonical admin rule shared with Guild `/admin`.
- Remaining product/auth gap is session continuity between MC and docs.
