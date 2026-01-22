# REQ-AUTH-002: Client-side Auth Service for VIA Integration

## Description
Create a client-side authentication service that handles VIA OAuth PKCE flow, manages session state, and exposes APIs for checking authentication status.

## Target
**Metric**: Auth state managed in browser with isAuthenticated() and getUser() APIs

## Reference
- SigmaBlox `apps/ghost-theme/ease/assets/js/auth-service.js`
- Existing MC_Site `js/builders/auth.js` (partial implementation)
- `~/.claude/skills/via-configuration/SKILL.md`

## Acceptance Criteria
- [ ] `js/auth/via-service.js` created with VIA integration
- [ ] OAuth PKCE flow implemented (no server-side secret needed)
- [ ] Session stored in httpOnly cookie via Cloudflare Worker
- [ ] `isAuthenticated()` returns boolean
- [ ] `getUser()` returns user object or null
- [ ] `login()` initiates OAuth flow
- [ ] `logout()` clears session and redirects
- [ ] Auth state persists across page navigation

## Implementation

### File Structure
```
js/auth/
├── via-service.js      # Main auth service
├── oauth-pkce.js       # PKCE helper functions
└── session.js          # Session management
```

### Key Functions
```javascript
// via-service.js
export async function isAuthenticated() {
  const session = await getSession();
  return session?.authenticated === true;
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

export function login(returnUrl = window.location.href) {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: MC_OAUTH_CLIENT_ID,
    redirect_uri: `${window.location.origin}/auth/callback`,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    code_challenge: await generateCodeChallenge(codeVerifier),
    code_challenge_method: 'S256'
  });

  window.location.href = `${VIA_URL}/application/o/authorize/?${params}`;
}

export async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/';
}
```

### Cloudflare Worker for Token Exchange
The OAuth callback needs a Cloudflare Worker to:
1. Exchange auth code for tokens (requires client secret)
2. Set httpOnly session cookie
3. Redirect to original page

## Implementation
- **Status**: PENDING
- **Phase**: 1
- **Priority**: HIGH

## Validation
- **Method**: Manual Test
- Login flow completes successfully
- Session persists across page refresh
- Logout clears session

## Dependencies
- REQ-AUTH-001 (OAuth credentials needed)

## Blocks
- REQ-CONTENT-001 (needs auth state for gating)
- REQ-CONTENT-002 (needs auth state for UI)
