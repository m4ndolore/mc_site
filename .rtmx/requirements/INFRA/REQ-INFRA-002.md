# REQ-INFRA-002: Internal Docs Admin Access Infrastructure

## Description
Create the minimum VIA and Outline configuration needed so a small allowlisted set of internal `@mergecombinator.com` users can access docs during the internal-development phase.

## Target
**Metric**: Approved internal users can access docs with the same canonical admin authorization model used by Guild `/admin`.

## Implementation

### 1. Canonical Auth Model

- Single source of truth: token-derived canonical `admin` role
- `/control` remains a legacy redirect alias to Guild `/admin`
- Docs should follow the same admin rule unless a narrower internal exception is explicitly introduced later

### 2. VIA Setup

Access: `https://via.mergecombinator.com/if/admin/`

- Ensure the small internal allowlist of `@mergecombinator.com` users is assigned the canonical admin role/group that resolves to `admin` in token claims
- Verify the docs OIDC provider includes `openid email profile groups`
- Confirm issued tokens expose the role/group data needed for downstream auth checks

### 3. Outline Setup

Access: `https://docs.mergecombinator.com`

- Configure docs access for the same approved internal users
- Keep docs intentionally internal during the current development phase
- Do not broaden access to general Guild users yet

### 4. Session Alignment

- Prefer shared session continuity so an already-authenticated internal admin does not need to log in again on docs
- If true SSO continuity is not yet achievable, document the exact gap and keep the access model narrow while docs remains internal

## Status
- **Status**: PENDING
- **Phase**: 3
- **Priority**: HIGH

## Validation
- Approved internal admin can access Guild `/admin`
- Same user can access `docs.mergecombinator.com`
- Non-approved user cannot access internal docs
- Token claims reflect canonical admin role/group data as expected

## Dependencies
- REQ-AUTH-001 (VIA configured)
- REQ-DOCS-001 (Outline reachable and using VIA)
- REQ-PLATFORM-001 (single-source admin auth direction)

## Notes
- This replaces the broader “contributors” framing for now.
- The immediate goal is narrow internal access for 3 approved `@mergecombinator.com` users, not a public or community contributor workflow.
