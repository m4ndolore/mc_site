# Situation Report: 2026-01-25

**Status:** Production Ready
**Primary Focus:** Auth Improvements & Access Page Redesign

---

## Completed This Session

### 1. Knowledge Link Fix
- Removed `/knowledge` route from Cloudflare Worker (was proxying to irregularpedia.org)
- Now serves local `knowledge.html` from MC Pages

### 2. SSO Logout Fix
- **Problem:** Sign out only cleared local `mc_session` cookie, didn't end Authentik SSO session
- **Fix:** Logout now redirects to Authentik's `end-session` endpoint with `post_logout_redirect_uri`
- Added `OAUTH_LOGOUT_URL` to wrangler.toml (prod + dev)

### 3. Navigation: Apply → Access
- Renamed `/apply` to `/access` throughout codebase
- Changed nav from dropdown to direct "Access" link
- Updated all 11 HTML files + vite.config.js

### 4. Cloudflare Worker Configuration Consolidation
- **Problem:** Config duplicated between `config/*.yaml` and hardcoded in `cloudflare/auth.js`
- **Solution:** 
  - `wrangler.toml [vars]` for prod (aligns with `config/base.yaml`)
  - `wrangler.toml [env.dev.vars]` for local dev (aligns with `config/dev.local.yaml`)
  - Worker reads `env.OIDC_ISSUER_URL` dynamically
  - Secrets via symlink: `.dev.vars → .env.local`
- **Documented:** Added "Static Sites & Cloudflare Workers" section to `docs/ai/RULES.md` with tripwires

### 5. Deployment Streamlined
- Added npm scripts: `deploy`, `deploy:worker`, `deploy:status`, `dev:worker`
- Created `docs/DEPLOYMENT.md` with full deployment guide
- Pages auto-deploys on git push; Worker requires `npm run deploy`

### 6. Access Page Redesign
- **Styling:** Matches sigmablox via-dashboard dark mode (`#0b0f14` bg, square corners)
- **Logo:** Matches navbar (Merge Combinator + arrows)
- **Features list:**
  - Browse and track defense tech opportunities
  - Connect with operators, founders, and advisors
  - Match with champions and mission owners and get to work
  - Access exclusive resources and events
  - SigmaBlox alumni: 1 year free access included
- **Sign-in card:** 
  - Primary: "Continue with Email" (matches via-login method selector)
  - "Secured by VIA" badge with `/assets/logos/vi-icon.jpg`
  - SSO: Google + CAC/PIV (pending)

---

## Configuration Files Updated

| Location | File | Changes |
|----------|------|---------|
| mc_site | `wrangler.toml` | Added `OIDC_ISSUER_URL`, `OAUTH_LOGOUT_URL`, `[env.dev]` section |
| mc_site | `cloudflare/auth.js` | Dynamic OAuth URLs from env, SSO logout redirect |
| mc_site | `cloudflare/merge-router.js` | Removed `/knowledge` proxy route |
| mc_site | `config/base.yaml` | Added note about wrangler.toml sync |
| mc_site | `config/dev.local.yaml` | Added `OIDC_ISSUER_URL: http://localhost:9000` |
| mc_site | `docs/ai/RULES.md` | Added CF Worker config pattern + tripwires |
| mc_site | `docs/DEPLOYMENT.md` | New deployment guide |
| mc_site | `package.json` | Added deploy scripts |
| mc_site | `access.html` | Complete redesign matching sigmablox styling |
| mc_site | `vite.config.js` | `apply` → `access` entry |
| mc_site | `*.html` (11 files) | Nav: Apply dropdown → Access link |
| mc_site | `js/auth-nav.js` | Simplified logged-out state |

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE WORKER (mc-router)               │
├─────────────────────────────────────────────────────────────────┤
│  Config: wrangler.toml                                          │
│  ├── [vars] OIDC_ISSUER_URL = auth.sigmablox.com (prod)        │
│  ├── [env.dev.vars] OIDC_ISSUER_URL = localhost:9000 (local)   │
│  └── Secrets: .dev.vars → .env.local (symlink)                  │
│                                                                  │
│  Routes:                                                         │
│  ├── /auth/* → VIA OAuth flow (cloudflare/auth.js)             │
│  ├── /api/* → api.sigmablox.com (with auth passthrough)        │
│  ├── /combine/* → www.sigmablox.com                             │
│  ├── /opportunities/* → sbir.mergecombinator.com               │
│  ├── /merch/* → fourthwall                                      │
│  └── /* → mc-site-dr4.pages.dev (static site)                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│  Static Site (Pages):                                            │
│  └── git push main → auto-deploys to mc-site-dr4.pages.dev     │
│                                                                  │
│  Worker (mc-router):                                             │
│  └── npm run deploy → wrangler deploy                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Commits This Session

| Commit | Description |
|--------|-------------|
| `432a6ad` | feat(auth): SSO logout + rename Apply to Access |
| `b4c4cb2` | fix(build): update vite config for apply.html → access.html rename |
| `327947a` | docs: add deployment guide and npm deploy scripts |

---

## Next Steps

### Immediate
1. **Test full auth flow** with local VIA (localhost:9000)
2. **Commit access page redesign** and deploy
3. **Verify logout** properly ends SSO session in production

### Short-term
4. **User dropdown styling** - Fix avatar/name display issue reported earlier
5. **Dashboard page** - Create `/dashboard` for logged-in users
6. **Mobile responsiveness** - Test access page on mobile devices

### Future
7. **Unify nav component** - Extract to shared partial across all pages
8. **CAC/PIV authentication** - When VIA supports it
9. **Onboarding flow** - After sign-in, collect user profile info
