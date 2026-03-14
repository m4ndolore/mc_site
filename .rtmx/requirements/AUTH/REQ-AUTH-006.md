# REQ-AUTH-006: Research Reducing Authentik Dependency

## Metadata
- **Status**: BACKLOG
- **Priority**: MEDIUM
- **Phase**: 10
- **Effort**: 2.0 weeks
- **Dependencies**: REQ-AUTH-001, REQ-PLATFORM-001

## Description
Evaluate alternatives that reduce operational dependence on self-hosted Authentik while preserving security and developer velocity.

## Target
Produce a recommendation memo with migration risk, cost, and rollout sequence for at least three options.

## Candidate Options
- Cloudflare Access for selected authenticated surfaces
- Workers-native JWT verification without full Authentik coupling
- Passkey-first auth and simplified enrollment
- Turnstile invisible mode vs Cloudflare Bot Management

## Acceptance Criteria
- [ ] Option comparison matrix (security, ops burden, cost, migration complexity)
- [ ] Recommended target architecture
- [ ] Rollout and rollback plan
