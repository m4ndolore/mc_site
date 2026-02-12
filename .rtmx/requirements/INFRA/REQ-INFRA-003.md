# REQ-INFRA-003: Complete MC Router Restructuring

## Status: PARTIAL
## Priority: CRITICAL
## Phase: 1
## Category: INFRA

## Requirement

Complete the foundational restructuring work outlined in `docs/refactor/restructure.md` to stabilize the mergecombinator.com platform routing, authentication, and configuration.

## Background

The restructure.md document outlines 9 areas of work. Partial implementation has been done, but several critical items remain incomplete, creating potential stability and security risks.

## Acceptance Criteria

### 1. Turnstile Verification (Section 2) - HIGH
- [x] Verify TURNSTILE_SITE_KEY matches Cloudflare dashboard widget
- [x] Confirm mergecombinator.com in Turnstile hostname allowlist
- [x] Test /access page - no 400020 errors
- [x] Verify token generation and form submission works

### 2. Configuration Hardening (Section 3) - CRITICAL
- [x] Audit Worker for any remaining DEFAULT_ORIGINS fallbacks
- [x] Verify API_CORS_ORIGINS parsing warns on missing (not throws - graceful degradation)
- [x] Confirm no secrets logged or embedded in HTML responses
- [ ] Document secrets management in DEPLOYMENT.md

### 3. Integration Test Coverage (Section 6) - HIGH
- [x] Expand test-router.mjs to cover all routes:
  - /wingman returns 200 (no auth required)
  - /app/* without cookie redirects to /auth/login
  - /app/* with valid cookie proxies correctly (requires session mocking)
  - /control/* requires admin group (requires session mocking)
  - /api/* sets proper CORS headers
- [x] Auth redirect tests with returnTo validation
- [x] CORS credentials test
- [ ] Document test execution in CI/CD

### 4. Subdomain Origin Readiness (Section 8) - MEDIUM
- [ ] Verify app.mergecombinator.com responds (NO DNS)
- [ ] Verify wingman.mergecombinator.com responds (NO DNS)
- [ ] Verify control.mergecombinator.com responds (NO DNS)
- [x] Document origin status in wrangler.toml comments

### 5. Gradual Deployment (Section 6) - LOW
- [ ] Document gradual rollout procedure
- [ ] Test staging → production promotion workflow

## What's Already Done

| Section | Item | Status |
|---------|------|--------|
| 1 | Canonical host redirect | ✅ COMPLETE |
| 1 | Route ordering | ✅ COMPLETE |
| 2 | Turnstile verification | ✅ COMPLETE |
| 3 | Origins as env vars | ✅ COMPLETE |
| 3 | Staging/dev environments | ✅ COMPLETE |
| 3 | OAuth config validation | ✅ COMPLETE |
| 3 | CORS warning on empty | ✅ COMPLETE |
| 4 | /wingman public bypass | ✅ COMPLETE |
| 5 | Worker route binding | ✅ COMPLETE |
| 6 | test-router.mjs expanded | ✅ COMPLETE |
| 7 | Modular code structure | ✅ COMPLETE |
| 8 | Document subdomain status | ✅ COMPLETE |

## Risk if Not Completed

- **Subdomain readiness**: 522 errors for console users (app/wingman/control)
- **Documentation**: Missing deployment/rollout docs

## Dependencies

- REQ-AUTH-001 (VIA provider config)
- REQ-AUTH-002 (Client auth service)

## Blocks

- Console onboarding (needs DNS for app/wingman/control subdomains)

## Effort Estimate

2.0 weeks (remaining: ~0.5 weeks for DNS setup + docs)

## References

- docs/refactor/restructure.md
- cloudflare/merge-router.js
- cloudflare/test-router.mjs
- wrangler.toml

## Sitrep - 2026-02-11

**Session**: claude-2026-02-11
**Status**: PARTIAL

### Completed
- Turnstile verification: Production tests confirm site key injection working, explicit render configured
- Configuration hardening: Added `validateOAuthConfig()` in auth.js, CORS warning on empty origins
- Expanded test coverage: Added 6 new test functions (47 total assertions):
  - testPublicPaths (8 paths)
  - testAuthRedirects (returnTo validation)
  - testAuthMeEndpoint (JSON structure)
  - CORS credentials check
- Documented subdomain DNS status in wrangler.toml comments
- Identified REQ-BUG-007: /opportunities returns 500 from Railway origin

### Remaining
- DNS records for app/wingman/control subdomains
- DEPLOYMENT.md secrets management docs
- CI/CD test integration docs
- Gradual deployment procedure docs

### Blockers
- app.mergecombinator.com, wingman.mergecombinator.com, control.mergecombinator.com have no DNS records
- These subdomains need DNS + placeholder deployments before console routing works

### Next Steps
1. Create DNS records for console subdomains
2. Deploy placeholder pages to each subdomain
3. Write DEPLOYMENT.md for secrets management
4. Test staging → production workflow and document
