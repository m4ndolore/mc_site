# Testing Ghost Staff SSO - Quick Start Guide

## Prerequisites Checklist

Before testing, verify you have:

- [ ] Docker Desktop running
- [ ] Authentik dev application configured at `auth.sigmablox.com`
- [ ] Client ID and Client Secret in `.env.dev.yaml`
- [ ] Redirect URI configured in Authentik: `http://localhost:2000/ghost/sso/callback`
- [ ] Test user account in Authentik with appropriate groups

## Environment Configuration Verification

git commit -m "Temporarily disable Authentik, restore Ghost login flow
- Re-enable Ghost Portal in default.hbs
- Restore Ghost Portal signin in auth-wrapper.hbs
- Update nav login button to use Ghost Portal
- Authentik integration temporarily disabled until fully configured"in auth-wrapper.hbs
- Update nav login button to use Ghost Portal
- Authentik integrationtemporarily disabled until fully configured"


Check your `webhook/.env.dev.yaml` has these values:

```yaml
GHOST_URL: "http://localhost:2368"
GHOST_ADMIN_API_KEY: ""
AUTHENTIK_OIDC_ISSUER: "https://auth.sigmablox.com/application/o/sigmablox-ghost-dev/"
AUTHENTIK_ADMIN_CLIENT_ID: ""
AUTHENTIK_ADMIN_CLIENT_SECRET: ""
AUTHENTIK_REDIRECT_URI: "http://localhost:2000/ghost/sso/callback"
GHOST_AUTHOR_DEFAULT_ROLE: "Contributor"
```

## Step-by-Step Testing

### 1. Start Local Environment

```bash
# From project root
./start-local.sh
```

Wait for:
- ✅ Ghost running at `http://localhost:2368`
- ✅ Webhook service running at `http://localhost:2000`

### 2. Verify Webhook Service is Running

```bash
# Check webhook logs
tail -f webhook/logs/webhook.log
```

You should see:
```
🚀 SigmaBlox Webhook Service (Development)
Server listening on port 2000
MongoDB connected successfully
✅ Authentik Admin Client initialized
```

### 3. Test SSO Flow - First Time User

**Open your browser** (incognito/private mode recommended):

```
http://localhost:2000/ghost/sso/login
```

**Expected Flow:**

1. **Redirect to Authentik** ✅
   - URL should be `https://auth.sigmablox.com/application/o/authorize/...`
   - Should see Authentik login page

2. **Login to Authentik** ✅
   - Enter your Authentik credentials
   - Authenticate

3. **Redirect back to localhost** ✅
   - Should redirect to `http://localhost:2000/ghost/sso/callback?code=...`

4. **Welcome page** ✅
   - Should see "Welcome to SigmaBlox!" page
   - Shows your assigned role (e.g., "Contributor")
   - Auto-redirects after 2 seconds

5. **Ghost signup page** ✅
   - URL: `http://localhost:2368/ghost/#/signup/[token]`
   - Your email should be pre-filled
   - Enter your name
   - Create a password
   - Click "Create Account"

6. **Ghost dashboard** ✅
   - Should be logged into Ghost automatically
   - Can access contributor features

### 4. Test SSO Flow - Returning User

**Close browser and reopen** (or use different incognito window):

```
http://localhost:2000/ghost/sso/login
```

**Expected Flow:**

1. **Redirect to Authentik** ✅
   - May auto-login if session exists
   - Or enter credentials

2. **Redirect to Ghost dashboard** ✅
   - URL: `http://localhost:2368/ghost/#/dashboard`
   - **Should be already logged in** (if Ghost session still valid)
   - No password prompt!

### 5. Test Session Expiry Handling

**Clear Ghost cookies only** (not all cookies):

1. Open browser DevTools → Application → Cookies
2. Delete cookies for `http://localhost:2368`
3. Keep cookies for `http://localhost:2000` and `https://auth.sigmablox.com`

**Then visit:**
```
http://localhost:2000/ghost/sso/login
```

**Expected:**
- Authentik: Auto-login (session exists)
- Ghost: Shows login page (session expired)
- User can: Click "Sign in with Authentik" button OR enter password

## Troubleshooting

### Issue: "Missing SSO state cookie"

**Cause:** Cookie not set or expired

**Fix:**
- Clear all cookies
- Retry SSO flow
- Check webhook logs for errors
- Verify `cookieParser()` middleware is loaded

### Issue: "Token exchange failed: 400"

**Cause:** Invalid client credentials or redirect URI mismatch

**Fix:**
```bash
# Check Authentik configuration
# 1. Verify client ID/secret in .env.dev.yaml match Authentik
# 2. Verify redirect URI exactly matches: http://localhost:2000/ghost/sso/callback
# 3. Check Authentik application is enabled
```

### Issue: "Could not retrieve user email"

**Cause:** Authentik application not configured with email scope

**Fix:**
1. Go to Authentik → Applications → [Your App] → Provider
2. Check Scopes include: `openid`, `email`, `profile`, `groups`
3. Save and retry

### Issue: User created but wrong role assigned

**Cause:** User not in any recognized Authentik groups

**Fix:**
1. Go to Authentik → Directory → Groups
2. Create groups: `sigmablox-contributors`, `sigmablox-authors`, etc.
3. Add user to appropriate group
4. Delete user from Ghost (if needed)
5. Retry SSO flow

### Issue: Redirects to Ghost but shows login page

**Cause:** Ghost session expired (normal behavior after 6 months)

**Fix:** This is expected! User has two options:
- Click "Sign in with Authentik" button (if added to Ghost theme)
- Enter their Ghost password manually

## Checking Logs

### Webhook Service Logs
```bash
tail -f webhook/logs/webhook.log
```

Look for:
```
🔐 [Ghost Staff SSO] Redirecting to Authentik: https://...
🔄 [Ghost Staff SSO] Exchanging authorization code for tokens...
✅ [Ghost Staff SSO] Tokens received
📋 [Ghost Staff SSO] User: test@example.com, Groups: sigmablox-contributors
👤 [Ghost Staff SSO] Mapped role: Contributor
🆕 [Ghost Staff SSO] Creating new staff user: test@example.com with role Contributor
```

### Ghost Logs
```bash
docker-compose -f ghost-cloudrun/docker-compose.local.yml logs -f ghost
```

### Authentik Logs
1. Go to `https://auth.sigmablox.com/if/admin/`
2. System → System Tasks → Logs
3. Filter by your application name

## Success Criteria

✅ **First-time user:**
- Authenticates via Authentik
- Sees welcome page with correct role
- Sets Ghost password once
- Lands in Ghost dashboard

✅ **Returning user:**
- Authenticates via Authentik
- Immediately lands in Ghost dashboard
- No password prompt (if session valid)

✅ **Session expiry:**
- User can re-authenticate via Authentik
- OR use Ghost password as fallback

✅ **Role mapping:**
- Authentik groups correctly map to Ghost roles
- User has appropriate permissions in Ghost

## Next Steps

Once local testing succeeds:

1. **Add "Sign in with Authentik" button to Ghost theme**
   - Edit Ghost login template
   - Add button that links to `/ghost/sso/login`

2. **Deploy to production**
   - Update `.env.prod.yaml` with production credentials
   - Create production Authentik application
   - Update redirect URI to production webhook service
   - Deploy and test

3. **Monitor and iterate**
   - Track SSO usage
   - Gather user feedback
   - Optimize flow based on feedback

## Questions or Issues?

Check:
- Main implementation doc: `_docs/GHOST_STAFF_SSO_IMPLEMENTATION.md`
- Contributor SSO plan: `_docs/contributor_sso.md`
- Webhook logs: `webhook/logs/webhook.log`
- Ghost logs: `docker-compose logs`
