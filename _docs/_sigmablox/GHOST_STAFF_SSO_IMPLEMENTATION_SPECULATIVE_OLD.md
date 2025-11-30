# Ghost Staff SSO Implementation

## Overview

This implementation provides Single Sign-On (SSO) for Ghost staff users (Contributors, Authors, Editors, Administrators) using Authentik as the identity provider.

## The Problem We're Solving

Previously, users had to authenticate twice:
1. Once with Authentik to access custom site features
2. Again with Ghost credentials to access the staff/contributor interface

This implementation eliminates the repetitive login experience by:
- Using Authentik as the single authentication source
- Automatically provisioning Ghost staff accounts
- Leveraging Ghost's long-lived sessions (6 months) to minimize re-authentication

## Architecture

### Components

1. **GhostStaffSSO Module** (`webhook/ghost-staff-sso.js`)
   - Handles OAuth2/OIDC flow with Authentik
   - Maps Authentik groups to Ghost staff roles
   - Creates/updates Ghost staff users via Admin API

2. **SSO Routes** (in `webhook/local-server.js`)
   - `GET /ghost/sso/login` - Initiates SSO flow
   - `GET /ghost/sso/callback` - Handles Authentik callback

3. **Environment Configuration** (`.env.dev.yaml`, `.env.prod.yaml`)
   - Authentik OIDC settings
   - Ghost Admin API credentials
   - Default role mappings

### Flow Diagram

```
User Action                      System Response
-----------                      ---------------
Click "Sign in with Authentik"
       ↓
GET /ghost/sso/login            → Generate CSRF token
                                → Redirect to Authentik
       ↓
Authenticate at Authentik
       ↓
Authentik redirects back        → GET /ghost/sso/callback
       ↓
Exchange auth code for tokens   → Extract user email & groups
       ↓
Map groups to Ghost role        → Check if user exists in Ghost
       ↓
If user exists:                 → Redirect to /ghost/#/dashboard
                                → Ghost validates existing session
       ↓
If user is new:                 → Create Ghost staff invite
                                → Redirect to invite signup URL
                                → User sets password (one-time)
```

## User Experience

### First-Time Users
1. Click "Sign in with Authentik"
2. Authenticate with Authentik credentials
3. Welcomed to SigmaBlox with assigned role
4. Redirected to Ghost to set a password (one-time setup)
5. Logged into Ghost automatically

**Time: ~30-60 seconds**

### Returning Users
1. Click "Sign in with Authentik" (or already authenticated)
2. Authenticated by Authentik
3. Redirected to Ghost dashboard
4. **Already logged in** (if session still valid)

**Time: ~2-5 seconds** (no password entry needed!)

### Session Expiry Handling
- Ghost sessions last 6 months by default
- When a session expires:
  - User authenticates via Authentik
  - Redirected to Ghost login page
  - Can use "Sign in with Authentik" button again
  - OR enter their Ghost password

## Group to Role Mapping

Authentik groups are mapped to Ghost staff roles:

| Authentik Group          | Ghost Role      | Permissions |
|--------------------------|-----------------|-------------|
| `sigmablox-admins`       | Administrator   | Full access to Ghost admin |
| `sigmablox-editors`      | Editor          | Can publish any posts |
| `sigmablox-authors`      | Author          | Can publish own posts |
| `sigmablox-contributors` | Contributor     | Can create drafts |
| *(none)*                 | Contributor     | Default fallback role |

**Note:** These groups must be created in Authentik and assigned to users.

## Configuration

### Required Environment Variables

#### Development (`.env.dev.yaml`)
```yaml
# Ghost Configuration
GHOST_URL: "http://localhost:2368"
GHOST_ADMIN_API_KEY: "<your-ghost-admin-api-key>"

# Authentik SSO Configuration
AUTHENTIK_OIDC_ISSUER: "https://auth.sigmablox.com/application/o/sigmablox-ghost-dev/"
AUTHENTIK_ADMIN_CLIENT_ID: "<dev-client-id>"
AUTHENTIK_ADMIN_CLIENT_SECRET: "<dev-client-secret>"
AUTHENTIK_REDIRECT_URI: "http://localhost:2000/ghost/sso/callback"
GHOST_AUTHOR_DEFAULT_ROLE: "Contributor"
```

#### Production (`.env.prod.yaml`)
```yaml
# Ghost Configuration
GHOST_URL: "https://www.sigmablox.com"
GHOST_ADMIN_API_KEY: "<your-ghost-admin-api-key>"

# Authentik SSO Configuration
AUTHENTIK_OIDC_ISSUER: "https://auth.sigmablox.com/application/o/sigmablox-ghost-prod/"
AUTHENTIK_ADMIN_CLIENT_ID: "<prod-client-id>"
AUTHENTIK_ADMIN_CLIENT_SECRET: "<prod-client-secret>"
AUTHENTIK_REDIRECT_URI: "https://webhook-service.sigmablox.com/ghost/sso/callback"
GHOST_AUTHOR_DEFAULT_ROLE: "Contributor"
```

### Authentik Application Setup

1. **Create OAuth2/OIDC Application** in Authentik:
   - Name: `Ghost CMS Staff SSO (Dev)` or `(Prod)`
   - Provider type: OAuth2/OpenID Connect
   - Client type: Confidential
   - Authorization flow: `authorization-code`

2. **Configure Redirect URIs:**
   - Dev: `http://localhost:2000/ghost/sso/callback`
   - Prod: `https://webhook-service.sigmablox.com/ghost/sso/callback`

3. **Configure Scopes:**
   - `openid` (required)
   - `email` (required)
   - `profile` (required)
   - `groups` (required for role mapping)

4. **Copy Credentials:**
   - Client ID → `AUTHENTIK_ADMIN_CLIENT_ID`
   - Client Secret → `AUTHENTIK_ADMIN_CLIENT_SECRET`

## Testing Locally

### Prerequisites
1. Docker Desktop running
2. Ghost CMS running locally (`./start-local.sh`)
3. Webhook service running (`cd webhook && npm run dev`)
4. Production Authentik accessible at `auth.sigmablox.com`

### Test Steps

1. **Start services:**
   ```bash
   ./start-local.sh
   ```

2. **Verify configuration:**
   - Check `.env.dev.yaml` has correct Authentik credentials
   - Ensure `AUTHENTIK_REDIRECT_URI` points to `http://localhost:2000`

3. **Test SSO flow:**
   - Open browser to: `http://localhost:2000/ghost/sso/login`
   - Should redirect to Authentik
   - Log in with your Authentik credentials
   - Should redirect back to localhost

4. **Verify user creation:**
   - First time: Should see welcome page, then Ghost signup
   - Set password and complete profile
   - Should be logged into Ghost

5. **Test returning user:**
   - Close browser (or clear cookies for http://localhost:2368 only)
   - Visit: `http://localhost:2000/ghost/sso/login`
   - Should authenticate and redirect to Ghost dashboard
   - Should already be logged in (if session still valid)

### Troubleshooting

**Error: "Missing SSO state cookie"**
- Clear browser cookies
- Ensure webhook service is running
- Check that `sameSite: 'lax'` is compatible with your browser

**Error: "Token exchange failed"**
- Verify Authentik credentials in `.env.dev.yaml`
- Check that redirect URI matches exactly in Authentik app config
- Ensure Authentik dev application exists and is enabled

**Error: "Could not retrieve user email"**
- Check that Authentik application has `email` scope enabled
- Verify user has email address in Authentik profile
- Check ID token includes email claim

**User redirects to Ghost but not logged in:**
- Normal behavior if Ghost session expired
- User can click "Sign in with Authentik" button on Ghost login page
- OR enter their Ghost password manually

## Security Considerations

### CSRF Protection
- State parameter with cryptographic randomness
- State stored in HTTP-only cookie
- 10-minute state expiration

### Cookie Security
- HTTP-only cookies (not accessible via JavaScript)
- Secure flag in production (HTTPS only)
- SameSite: Lax (prevents CSRF attacks)

### Token Handling
- Client secret never exposed to browser
- Tokens exchanged server-side only
- No tokens stored in browser localStorage

### Session Management
- Ghost handles staff session security
- Webhook service doesn't store passwords
- One-way password creation via Ghost API

## Future Enhancements

### Potential Improvements

1. **True Passwordless SSO:**
   - Modify Ghost authentication middleware
   - Accept Authentik JWT tokens directly
   - Eliminate password requirement entirely

2. **Session Synchronization:**
   - Store Authentik tokens in Redis
   - Automatically refresh Ghost sessions
   - Implement single logout across systems

3. **Enhanced Role Mapping:**
   - Dynamic role assignment based on Authentik attributes
   - Support for multiple groups per user
   - Automatic role updates on group changes

4. **Admin Dashboard:**
   - View SSO usage statistics
   - Manage user role mappings
   - Audit authentication logs

## Deployment

### Development
Already configured! Just ensure:
- `.env.dev.yaml` has correct credentials
- Run `./start-local.sh`
- Test via `http://localhost:2000/ghost/sso/login`

### Production
1. Update `.env.prod.yaml` with production credentials
2. Deploy webhook service to Cloud Run
3. Configure production Authentik application
4. Update Ghost theme to include "Sign in with Authentik" button
5. Test via `https://www.sigmablox.com/ghost/sso/login`

## Support

For issues or questions:
- Check troubleshooting section above
- Review logs: `tail -f webhook/logs/webhook.log`
- Check Authentik logs in admin UI
- Verify Ghost logs: `docker-compose -f ghost-cloudrun/docker-compose.local.yml logs -f`

## References

- [Ghost Admin API Documentation](https://ghost.org/docs/admin-api/)
- [Authentik OAuth2 Provider Documentation](https://docs.goauthentik.io/docs/providers/oauth2/)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)
