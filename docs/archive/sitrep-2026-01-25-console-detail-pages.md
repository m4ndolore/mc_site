# Sitrep: Console Detail Pages & Auth Setup

**Date:** 2026-01-25
**Status:** In Progress

  Key next step for local auth:                                                                                                                   
  The mc_site's cloudflare/auth.js needs to detect local dev and use MC_OAUTH_DEV_CLIENT_ID/secret instead of the prod credentials. Currently it  
  always uses env.MC_OAUTH_CLIENT_ID.                                                                                                             
                                                                                                                                                  
  Quick approach - in cloudflare/auth.js around the token exchange:                                                                               
  const clientId = env.MC_OAUTH_DEV_CLIENT_ID || env.MC_OAUTH_CLIENT_ID;                                                                          
  const clientSecret = env.MC_OAUTH_DEV_CLIENT_SECRET || env.MC_OAUTH_CLIENT_SECRET;                                                              
                                                                                                                                                  
  Or check url.hostname to switch between dev/prod credentials.  
  
## Completed

### Console App - Detail Pages
- **Builder Detail** (`/builders/:id`) - Full company info display
  - Name, product, logo, TRL, funding stage, cohort
  - "SigmaBlox Alumni" badge (replaces "Verified")
  - Description, mission area, warfare domain, location, team size
  - Website link, Interest count (🔥 emoji)
  - "Add to Watchlist" button with star icon

- **Champion Detail** (`/champions/:id`) - Full coach info display
  - Name, photo, organization, role badge (color-coded)
  - "SigmaBlox Alumni" badge (all coaches default to Cohort 25-1)
  - Domain, SME area, expertise tags
  - LinkedIn link
  - "Add to Watchlist" button

### Console App - Watchlist (Local Storage)
- Created `watchlist-local.ts` hook for localStorage persistence
- Watchlist page updated to show items without auth requirement
- Cards clickable → navigate to detail pages
- Filter by type (Builders/Champions)

### Console App - Infrastructure
- Added Vite proxy for `/api` and `/auth` → `mergecombinator.com`
- API URLs changed to relative paths (works with proxy)

### Auth Investigation
- **Production auth working**: Fixed client_secret mismatch in Authentik
- **Local dev auth blocked**: Cookie domain mismatch (mergecombinator.com vs localhost:3003)

## Files Changed (signal-incubator/apps/console)

| File | Change |
|------|--------|
| `src/pages/BuilderDetail.tsx` | Created - detail page with watchlist |
| `src/pages/ChampionDetail.tsx` | Created - detail page with watchlist |
| `src/pages/Builders.tsx` | Added navigation onClick |
| `src/pages/Champions.tsx` | Added navigation onClick |
| `src/pages/Watchlist.tsx` | Switched to local storage hook |
| `src/pages/index.ts` | Added exports |
| `src/lib/watchlist-local.ts` | Created - localStorage watchlist |
| `src/lib/auth.ts` | Changed AUTH_BASE to relative path |
| `src/App.tsx` | Added detail routes |
| `vite.config.ts` | Added /api and /auth proxy |

## Next Steps

### 1. Local Dev Auth Setup
The console app on localhost:3003 can't use mergecombinator.com's session cookies.

**Already done:**
- Created OAuth provider in local Authentik
- Added `MC_OAUTH_DEV_CLIENT_ID` and secret to mc_site `.env.local`

**Still needed:**
- Update mc_site's cloudflare/auth.js to use dev credentials when running locally
- OR create separate auth handlers in the console app for local dev
- Test the full OAuth flow locally

### 2. Console Deployment
- Console is live at `console.mergecombinator.com`
- Auth should work there (same parent domain for cookies)
- Verify production auth flow works

### 3. Backend Watchlist API (Future)
When SigmaBlox adds member endpoints:
- `/api/member/favorites` - list, add, remove
- Migrate from localStorage to API
- Sync existing localStorage items on first login

### 4. Additional Detail Page Features (Future)
- Contact info (member-only)
- Pitch deck links (member-only)
- Video links (member-only)
- "Request intro" button

## Environment Notes

**Local dev:**
- Console: `localhost:3003`
- mc_site wrangler: `wrangler dev --env dev`
- Local Authentik: `localhost:9000`

**Production:**
- Console: `console.mergecombinator.com`
- mc_site: `www.mergecombinator.com`
- Authentik: `via.mergecombinator.com`

**OAuth clients:**
- Production: `mc-web-prod` (client in `defense-builders` provider)
- Local dev: New client configured in local Authentik
