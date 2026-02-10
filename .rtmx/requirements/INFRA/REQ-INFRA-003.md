# REQ-INFRA-003: Complete MC Router Restructuring

## Status: PENDING
## Priority: CRITICAL
## Phase: 1
## Category: INFRA

## Requirement

Complete the foundational restructuring work outlined in `docs/refactor/restructure.md` to stabilize the mergecombinator.com platform routing, authentication, and configuration.

## Background

The restructure.md document outlines 9 areas of work. Partial implementation has been done, but several critical items remain incomplete, creating potential stability and security risks.

## Acceptance Criteria

### 1. Turnstile Verification (Section 2) - HIGH
- [ ] Verify TURNSTILE_SITE_KEY matches Cloudflare dashboard widget
- [ ] Confirm mergecombinator.com in Turnstile hostname allowlist
- [ ] Test /access page - no 400020 errors
- [ ] Verify token generation and form submission works

### 2. Configuration Hardening (Section 3) - CRITICAL
- [ ] Audit Worker for any remaining DEFAULT_ORIGINS fallbacks
- [ ] Verify API_CORS_ORIGINS parsing throws on missing/malformed
- [ ] Confirm no secrets logged or embedded in HTML responses
- [ ] Document secrets management in DEPLOYMENT.md

### 3. Integration Test Coverage (Section 6) - HIGH
- [ ] Expand test-router.mjs to cover all routes:
  - /wingman returns 200 (no auth required)
  - /app/* without cookie redirects to /auth/login
  - /app/* with valid cookie proxies correctly
  - /control/* requires admin group
  - /api/* sets proper CORS headers
- [ ] Add Turnstile token validation test
- [ ] Document test execution in CI/CD

### 4. Subdomain Origin Readiness (Section 8) - MEDIUM
- [ ] Verify app.mergecombinator.com responds (or create placeholder)
- [ ] Verify wingman.mergecombinator.com responds (or placeholder)
- [ ] Verify control.mergecombinator.com responds
- [ ] Document origin status in wrangler.toml comments

### 5. Gradual Deployment (Section 6) - LOW
- [ ] Document gradual rollout procedure
- [ ] Test staging → production promotion workflow

## What's Already Done

| Section | Item | Status |
|---------|------|--------|
| 1 | Canonical host redirect | ✅ COMPLETE |
| 1 | Route ordering | ✅ COMPLETE |
| 3 | Origins as env vars | ✅ COMPLETE |
| 3 | Staging/dev environments | ✅ COMPLETE |
| 4 | /wingman public bypass | ✅ COMPLETE |
| 5 | Worker route binding | ✅ COMPLETE |
| 6 | test-router.mjs exists | ✅ COMPLETE |
| 7 | Modular code structure | ✅ COMPLETE |

## Risk if Not Completed

- **Turnstile**: Users cannot submit access requests
- **Config hardening**: Silent failures, potential security leaks
- **Test coverage**: Regressions go undetected
- **Subdomain readiness**: 502/503 errors for console users

## Dependencies

- REQ-AUTH-001 (VIA provider config)
- REQ-AUTH-002 (Client auth service)

## Blocks

- Production deployment confidence
- Console onboarding

## Effort Estimate

2.0 weeks

## References

- docs/refactor/restructure.md
- cloudflare/merge-router.js
- cloudflare/test-router.mjs
- wrangler.toml
