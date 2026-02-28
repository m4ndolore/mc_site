# REQ-BUG-016: VIA "Terminate Session" returns "not found"

## Description
Clicking "Terminate Session" (logout) in the Guild SPA returns a "not found" error from VIA. The logout endpoint URL is likely misconfigured — either the end-session URL has changed or the redirect_uri parameter is invalid.

## Target
Terminate Session cleanly logs the user out and redirects to mergecombinator.com.

## Acceptance Criteria
- [ ] Clicking Terminate Session initiates VIA end-session flow
- [ ] VIA processes the logout without errors
- [ ] User is redirected to mergecombinator.com (or /access) after logout
- [ ] Auth tokens/cookies are cleared

## Implementation
- **Status**: COMPLETE
- **Phase**: 9 (Platform Convergence)
- **Priority**: HIGH
- **Effort**: 0.25w
- **Dependencies**: REQ-AUTH-001
- **Notes**: Root cause was wrong OIDC provider slug. `OAUTH_LOGOUT_URL` used `/application/o/mergecombinator/end-session/` but VIA provider is `defense-builders`. Also fixed `OAUTH_JWKS_URL` with same slug issue.

## Sitrep - 2026-02-27

**Session**: claude-2026-02-27-guild-spa-fixes
**Status**: COMPLETE

### Root Cause
`OAUTH_LOGOUT_URL` and `OAUTH_JWKS_URL` used provider slug `mergecombinator` but the VIA OIDC provider is configured as `defense-builders`. Confirmed by:
- `/application/o/mergecombinator/end-session/` → 404
- `/application/o/defense-builders/end-session/` → 200/302 (real logout flow)
- `OIDC_ISSUER_ALLOWLIST` in api-worker already uses `defense-builders`

### Fix Applied
- `wrangler.toml` (root): Fixed `OAUTH_LOGOUT_URL` in all 3 env sections (prod, staging, dev)
- `config/base.yaml`: Fixed `OAUTH_LOGOUT_URL` and `OAUTH_JWKS_URL`
- Deployed merge-router to production

### Verification
- `/auth/logout` → 302 to `via.mergecombinator.com/application/o/defense-builders/end-session/`
- VIA end-session → 302 to auth flow (processes session invalidation)
- Commit: `91e7473` (mc_site)
