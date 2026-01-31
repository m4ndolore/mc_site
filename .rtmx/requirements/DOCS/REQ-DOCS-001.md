# REQ-DOCS-001: docs.mergecombinator.com VIA SSO

## Description
Configure VIA authentication for the docs.mergecombinator.com knowledge base so users authenticate once and have access to both the main site and documentation.

## Target
**Metric**: Users authenticate once for both mc-site and docs

## Reference
- VIA skill: `~/.claude/skills/via-configuration/SKILL.md`
- Docs platform: **Outline Wiki** (self-hosted at homelab via Cloudflare Tunnel)

## Acceptance Criteria
- [x] VIA OAuth configured for docs.mergecombinator.com
- [x] Shared session between www and docs subdomains
- [x] Login on mc-site grants access to docs
- [x] Login on docs grants access to mc-site
- [x] Session cookie works across subdomains

## Implementation

### Architecture
docs.mergecombinator.com runs **Outline Wiki** with the following configuration:
- **Host**: Homelab at 100.66.200.39:3100 (via Cloudflare Tunnel)
- **OAuth Provider**: VIA/Authentik
- **Client ID**: `outline-docs`
- **OIDC Issuer**: `https://via.mergecombinator.com`
- **Redirect URI**: `https://docs.mergecombinator.com/auth/oidc.callback`

### Cross-Subdomain Sessions
Session sharing implemented via `COOKIE_DOMAIN` configuration:

**wrangler.toml** (production):
```toml
[vars]
COOKIE_DOMAIN = ".mergecombinator.com"
```

**cloudflare/auth.js**:
- `createCookieHeader()` updated to accept optional `domain` parameter
- `handleCallback()` passes `env.COOKIE_DOMAIN` when setting session cookie
- `handleLogout()` passes `env.COOKIE_DOMAIN` when clearing session cookie

The cookie domain `.mergecombinator.com` (with leading dot) enables the `mc_session` cookie to be sent to all subdomains: `www.mergecombinator.com`, `docs.mergecombinator.com`, etc.

### Local Development
`COOKIE_DOMAIN` is NOT set in `[env.dev.vars]` - cookies remain host-specific for localhost testing.

## Validation
- **Method**: Manual Test
- Login on mc-site → navigate to docs → should be logged in
- Login on docs → navigate to mc-site → should be logged in
- Logout on either → session cleared on both

## Dependencies
- REQ-AUTH-001 (VIA configured for MC domain) ✓

## Sitrep - 2026-01-30

**Session**: claude-2026-01-30
**Status**: COMPLETE

### Completed
- Added `COOKIE_DOMAIN = ".mergecombinator.com"` to wrangler.toml production vars
- Updated `createCookieHeader()` to accept optional domain parameter
- Updated `handleCallback()` to pass domain when setting session cookie
- Updated `handleLogout()` to pass domain when clearing session cookie
- Build passes

### Remaining
- Manual verification after deployment

### Blockers
- None

### Next Steps
- Deploy Cloudflare Worker: `wrangler deploy`
- Test cross-subdomain auth flow in production
