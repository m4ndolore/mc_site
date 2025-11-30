Build SSO for contributors

I want to assign role of contributor to specific users so they can access the Ghost contributor UI for submitting draft posts for the site content. Right now, that would require authorizing a seperate account inside the Ghost admin console. More importantly, that requires the users to login twice, once for contributor access and once for access to the custom portions of the site. 

The desire is to leverage the current custom login integration that forwards to authentik, then with authenticaiton allow authentik to skip the manual login process of the Ghost UI.

Here were prior suggestions for implementation. 

1. Where it lives
Add a new route (or small service) alongside your existing 
webhook
 app—it already has Ghost Admin API access and environment management. Example structure:

webhook/
  src/
    server.js
    routes/
      ghost-sso.js    ← new shim route
  .env.dev.yaml       ← add Authentik client + Ghost Admin key
2. Environment variables (already in .env.dev.yaml, just confirm names)
yaml
AUTHENTIK_OIDC_ISSUER: "https://auth.prod-sigmablox.com/application/o/sigmablox-ghost-dev/"
AUTHENTIK_CLIENT_ID: "ghost-dev-client-id"
AUTHENTIK_CLIENT_SECRET: "ghost-dev-client-secret"
AUTHENTIK_REDIRECT_URI: "https://ghost-dev.sigmablox.com/ghost/sso/callback"
GHOST_ADMIN_API_KEY: "admin-id:hex-secret"          # existing key
GHOST_ADMIN_URL: "https://ghost-dev.sigmablox.com"  # base URL
GHOST_AUTHOR_DEFAULT_ROLE: "contributor"            # fallback
(Use the prod Authentik issuer—even for dev—just make sure it has a “Ghost Dev” application inside Authentik.)

3. Shim flow (Express example)
javascript
const express = require('express');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.get('/ghost/sso/login', (req, res) => {
  const authUrl = new URL('/authorize', process.env.AUTHENTIK_OIDC_ISSUER);
  authUrl.searchParams.set('client_id', process.env.AUTHENTIK_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', process.env.AUTHENTIK_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', req.query.redirect || '/ghost/#/dashboard');
  res.redirect(authUrl.toString());
});

router.get('/ghost/sso/callback', async (req, res) => {
  const { code, state = '/ghost/#/dashboard' } = req.query;
  if (!code) return res.status(400).send('Missing code');

  // 1. Exchange code for tokens
  const tokenResponse = await fetch(process.env.AUTHENTIK_OIDC_ISSUER + '/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.AUTHENTIK_REDIRECT_URI,
      client_id: process.env.AUTHENTIK_CLIENT_ID,
      client_secret: process.env.AUTHENTIK_CLIENT_SECRET
    })
  }).then(r => r.json());

  const idToken = tokenResponse.id_token;
  const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
  const userEmail = payload.email?.toLowerCase();
  const ghostRole = payload.ghost_role || process.env.GHOST_AUTHOR_DEFAULT_ROLE;

  if (!userEmail) return res.status(400).send('No email in token');

  // 2. Ensure Ghost staff exists (invite if missing)
  await ensureGhostUserExists(userEmail, ghostRole);

  // 3. Create session via Ghost Admin API
  const sessionCookie = await createGhostSession(userEmail);

  // 4. Drop cookie + redirect
  res.cookie('ghost-admin-api-session', sessionCookie.value, {
    domain: '.sigmablox.com',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires: new Date(sessionCookie.expires)
  });
  res.redirect(state);
});

async function ensureGhostUserExists(email, role) {
  // GET /ghost/api/admin/users/?search=email
  // If not found, POST /ghost/api/admin/users/ to invite with role
}

async function createGhostSession(email) {
  const [id, secret] = process.env.GHOST_ADMIN_API_KEY.split(':');
  const token = jwt.sign(
    { iat: Math.floor(Date.now() / 1000) },
    Buffer.from(secret, 'hex'),
    { keyid: id, algorithm: 'HS256' }
  );
  const response = await fetch(`${process.env.GHOST_ADMIN_URL}/ghost/api/admin/session`, {
    method: 'POST',
    headers: {
      'Authorization': `Ghost ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });
  if (!response.ok) throw new Error('Session creation failed');
  return response.json(); // { value: 'session_id', expires: '...' }
}

module.exports = router;
Mount this router in your main Express app: app.use('/', require('./routes/ghost-sso'));
Ensure cookie-parser is installed to set cookies, or issue Set-Cookie manually.
4. Update Ghost Dev theme/admin
Replace any “Staff login” links with /ghost/sso/login?redirect=/ghost/#/dashboard.
Optionally hide the default Ghost login form by injecting a script on /ghost/#/signin that redirects to the SSO route (or update your Nginx to rewrite).
5. Next steps
Add the code above (or similar) to your webhook service inside the sso-authentik worktree.
Configure Authentik with the new “Ghost Dev” OIDC app (client ID/secret, redirect URI).
Test: open the SSO login route, authenticate via Authentik (prod instance), verify Ghost Dev opens without another password.
Once dev is solid, clone the application in Authentik for prod Ghost and reuse the same shim (just point env vars at prod ghost URL/key).