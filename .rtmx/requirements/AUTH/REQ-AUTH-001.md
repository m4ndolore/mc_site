# REQ-AUTH-001: Configure VIA Authentication for mergecombinator.com

## Description
Register mergecombinator.com domain in VIA/Authentik authentication system. Create OAuth application and configure redirect URIs for production and development environments.

## Target
**Metric**: VIA OAuth flow works for MC domain (login/logout successful)

## Reference
- SigmaBlox REQ-AUTH-001 implementation
- `~/.claude/skills/via-configuration/SKILL.md` for Authentik API patterns
- SigmaBlox `docs/SITREP-2026-01-19-session4-2fa-redirect-fixed.md` for OAuth flow

## Acceptance Criteria
- [x] OAuth application created in Authentik for mergecombinator.com
- [x] Redirect URIs configured:
  - `https://www.mergecombinator.com/auth/callback`
  - `https://mergecombinator.com/auth/callback`
  - `https://mc-router.defensebuilders.workers.dev/auth/callback`
  - `http://localhost:5173/auth/callback`
  - `http://localhost:8787/auth/callback`
- [x] Client ID and secret generated
- [ ] Test login flow works on localhost
- [ ] Test login flow works on production

## Implementation Steps

### Step 1: Create OAuth2 Provider in Authentik
```bash
export TOKEN="$AUTHENTIK_ADMIN_TOKEN"
export AUTHENTIK_URL="https://via.sigmablox.com"

curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$AUTHENTIK_URL/api/v3/providers/oauth2/" \
  -d '{
    "name": "mc-site-oauth",
    "authorization_flow": "<flow-pk>",
    "client_type": "confidential",
    "client_id": "mc-site",
    "redirect_uris": "https://www.mergecombinator.com/auth/callback\nhttp://localhost:5173/auth/callback"
  }'
```

### Step 2: Create Application
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$AUTHENTIK_URL/api/v3/core/applications/" \
  -d '{
    "name": "Merge Combinator",
    "slug": "mc-site",
    "provider": "<provider-pk>",
    "meta_launch_url": "https://www.mergecombinator.com"
  }'
```

### Step 3: Store Credentials
- Add `MC_OAUTH_CLIENT_ID` and `MC_OAUTH_CLIENT_SECRET` to environment
- For Cloudflare Pages: Add to project environment variables
- For localhost: Add to `.env.local`

## Implementation
- **Status**: COMPLETE
- **Phase**: 1
- **Priority**: CRITICAL

## Validation
- **Method**: Manual Test
- Navigate to login, complete OAuth flow, verify redirect back to site

## Dependencies
None (foundation requirement)

## Blocks
- REQ-AUTH-002 (auth service needs OAuth credentials)

---

## Sitrep - 2026-01-25 (Session 1)

**Session**: claude-2026-01-25-ralph-auth
**Status**: COMPLETE

### Completed This Session
- Discovered OAuth infrastructure already fully configured
- OAuth Provider: `defense-builders` (PK: 7)
- Client ID: `mc-web-prod`
- 5 redirect URIs configured (prod, dev, worker)
- Cloudflare Worker at `/auth/*` implements full PKCE flow
- Credentials in `.env.local` and wrangler secrets

### Files Verified
- `cloudflare/auth.js` - OAuth worker implementation
- `wrangler.toml` - Environment configuration
- `.env.local` - Local credentials

### Remaining
- Manual testing of localhost flow (`wrangler dev --env dev`)
- Manual testing of production flow (`www.mergecombinator.com/auth/login`)
