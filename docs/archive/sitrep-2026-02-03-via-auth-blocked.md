# Sitrep: VIA Auth Integration - Blocked Pending Lift & Shift

**Date**: 2026-02-03
**Status**: BLOCKED
**Blocker**: VIA infrastructure lift-and-shift from `/sigmablox/authentik` to `/via/authentik`

## Summary

Attempted to test VIA OAuth login flow from mc-site. Discovered multiple configuration issues stemming from the VIA directory move. Work paused pending infrastructure stabilization.

## Environment

- **mc-site worker**: `npm run dev:worker` on port 8787
- **Authentik**: localhost:9000 (via/authentik stack)
- **Test path**: `localhost:8787/access` → "Login for Access"

## Issues Identified

### 1. MFA Stage Deny Actions (FIXED)
**Problem**: `via-passkey` and `via-totp` authenticator validation stages had `not_configured_action: deny`. Users without MFA configured received "No (allowed) MFA authenticator configured" error.

**Fix Applied**:
```bash
# via-passkey: deny → configure with via-setup-passkey stage
# via-totp: deny → configure (already had config stage)
```

### 2. Application Policy Blocking Access (FIXED)
**Problem**: `mc-site-access` policy on the `defensebuilders` application required user to be in `mc-*` group.

**Fix Applied**: Disabled policy binding `4ecb2bc5-438d-4eac-a2ce-c7413e17f5c5` for local testing.

### 3. Branding Reverted (NOT FIXED)
**Problem**: "Powered by authentik" footer showing despite custom CSS rules to hide it.

**Possible causes**:
- Domain matching not working for localhost brand
- Authentik version change altered DOM structure
- CSS selectors don't match shadow DOM

### 4. via-auth-helper Worker Not Running (NOT FIXED)
**Problem**: Error recovery popup (from `via-auth-helper.js`) not injecting on localhost.

**Location**: `/Users/paulgarcia/Dev/via/cloudflare/workers/via-auth-helper.js`

**Reason**: Worker only deployed to production routes (`auth.sigmablox.com`, `via.mergecombinator.com`). Local dev requires proxying localhost:9000 through wrangler.

## Files Changed (Authentik API - Not Persisted)

These fixes were made via Authentik API and will be lost if the database is reset:

| Resource | Change |
|----------|--------|
| `via-passkey` stage | `not_configured_action: configure` |
| `via-totp` stage | `not_configured_action: configure` |
| Policy binding `4ecb2bc5...` | `enabled: false` |

## Files Reference

| File | Purpose |
|------|---------|
| `cloudflare/auth.js` | MC OAuth PKCE flow |
| `cloudflare/merge-router.js` | Routes `/auth/*` to auth handler |
| `wrangler.toml` | Worker config, OIDC URLs |
| `/via/cloudflare/workers/via-auth-helper.js` | Error popup injection |

## Resume Checklist

When VIA lift-and-shift is complete:

- [ ] Verify Authentik running at expected URL
- [ ] Re-apply MFA stage fixes (or persist in blueprints)
- [ ] Re-evaluate `mc-site-access` policy (add test user to mc-* group or adjust policy)
- [ ] Debug branding/footer CSS
- [ ] Test via-auth-helper worker locally or deploy to via.mergecombinator.com
- [ ] Complete full login flow test (passkey, TOTP, password options)

## Related Requirements

- REQ-AUTH-001: VIA OAuth provider config
- REQ-AUTH-004: Passkey setup prompt (blocked on this)
- REQ-BUG-001: Passkey error UX (via-auth-helper worker)

## Notes

The user opened the JS popup code at `/via/cloudflare/workers/via-auth-helper.js` - this is the recovery banner that detects auth errors and offers recovery options. It works in production but needs local dev setup.
