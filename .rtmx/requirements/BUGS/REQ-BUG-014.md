# REQ-BUG-014: Guild SPA returns 404 on /guild/me and /builders after login

## Description
After logging in via VIA on the Guild SPA (`guild.mergecombinator.com`), navigating to /guild/me, /builders/companies, or /builders/coaches returns 404. The Guild SPA is not correctly routing API calls to `api.mergecombinator.com` with the Bearer token, or the SPA routes themselves are not mounted.

## Target
Authenticated users see their profile at /guild/me and builder listings at /builders/*.

## Acceptance Criteria
- [x] Guild SPA sends access token as `Authorization: Bearer <token>` to api.mergecombinator.com
- [x] /guild/me returns 200 with user profile and guild_user_id
- [x] /builders/companies returns 200 with paginated company list
- [x] /builders/coaches returns 200 with paginated coach list

## Implementation
- **Status**: COMPLETE
- **Phase**: 9 (Platform Convergence)
- **Priority**: HIGH
- **Effort**: 1.0w
- **Dependencies**: REQ-PLATFORM-001
- **Notes**: 2026-04-07 live verification complete. VIA redirect URI registered, Guild SPA deployed, and authenticated users access profile and builder listings.

## Sitrep - 2026-02-27

**Session**: claude-2026-02-27-guild-spa-fixes
**Status**: PARTIAL (SPA deployed, API integration needs E2E verification)

### Root Cause
Guild SPA (`signal-incubator/apps/console`) was built but NOT deployed. No Cloudflare Pages project existed. The `mc-app-placeholder` project already had `guild.mergecombinator.com` custom domain bound, serving a placeholder page.

### Fix Applied
- Added `public/_redirects` with `/* /index.html 200` for SPA client-side routing
- Built Guild SPA: `tsc && vite build` → 304KB JS + 11KB CSS
- Deployed `dist/` to CF Pages project `mc-app-placeholder` (replacing placeholder)
- `CONSOLE_ROLLOUT_MODE` already set to `"on"` in api-worker (no change needed)

### Verification
- `guild.mergecombinator.com/` → serves React SPA (MC Console)
- `guild.mergecombinator.com/builders` → SPA fallback works (deep link returns index.html)
- Commit: `0b3b7c9` (signal-incubator)

### Remaining
- VIA: Register redirect URIs (`guild.mergecombinator.com/login/callback`, `mergecombinator.com/access`)
- VIA: Configure canonical roles in groups claim
- Deploy updated Guild SPA to CF Pages
- E2E verification with authenticated user (VIA → Guild → API calls with Bearer token)

## Sitrep - 2026-02-27 (Phase 1 Last Mile)

**Session**: claude-2026-02-27-phase1-last-mile
**Status**: PARTIAL (code complete, awaiting VIA config + deploy + E2E)

### Implementation Complete
- `oidc-client-ts` PKCE client configured for VIA (oidc.ts)
- `apiFetch()` wrapper with Bearer token + envelope unwrap + 401 retry (api-client.ts)
- Response shape adapters: CompanyDto/CoachDto → CompanyAPI/CoachAPI (adapters.ts)
- Auth hook rewritten: cookie auth → OIDC PKCE (auth.ts)
- Admin detection: org groups → canonical VIA roles (consoles.ts)
- Login callback page + route outside PanelLayout (LoginCallback.tsx, App.tsx)
- All 4 page components wired to api.mergecombinator.com (Builders, BuilderDetail, Champions, ChampionDetail)
- Vite dev proxy removed
- Build verification: `tsc --noEmit` and `pnpm build` both pass clean
- API worker: CONSOLE_ROLLOUT_MODE = "on", CORS tightened to guild/wingman only

### Guardrails Verified
- G1: Refresh token optional (warning logged, no crash)
- G2: Pinned authority + client_id (const literals)
- G3: Role claim assertion (console.error + guest default)
- G4: Logout local-clear first, signoutRedirect best-effort
- G5: CORS origins = guild.*/wingman.* only

### Commits (signal-incubator)
- a76d251: deps(console): add oidc-client-ts for PKCE auth
- 1c383a4: feat(console): add OIDC PKCE client config for VIA
- 899c858: feat(console): add API client wrapper with Bearer token + envelope unwrap
- e454c35: feat(console): add API response shape adapters for builders/coaches
- abb40c0: feat(console): rewrite auth hook for OIDC PKCE (replaces cookie auth)
- 2917067: feat(console): use canonical VIA roles for admin detection
- fbb5146: feat(console): add OIDC login callback route
- 06c0f20: feat(console): wire Builders page to api.mergecombinator.com
- 634f583: feat(console): wire BuilderDetail page to api.mergecombinator.com
- ef304fb: feat(console): wire Champions page to api.mergecombinator.com
- e85a2bf: feat(console): wire ChampionDetail to /builders/coaches/:id endpoint
- 164c5a5: chore(console): remove SigmaBlox dev proxy — API calls go direct

### Commit (mc_site)
- 830b3e1: feat(api): ungate console rollout + tighten CORS to guild/wingman only
