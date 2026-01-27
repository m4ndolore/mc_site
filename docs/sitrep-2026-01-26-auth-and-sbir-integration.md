# Sitrep: Auth Fix & SBIR Integration

**Date:** 2026-01-26
**Status:** Complete

## Completed This Session

### 1. OAuth Cookie Fix (Critical)

**Problem:** Auth flow failed with "Missing auth state cookie" after VIA redirect. Cookies set before OAuth redirect were lost due to cross-site SameSite restrictions.

**Solution:** Implemented signed state token pattern (borrowed from SigmaBlox VIA integration):
- State data (PKCE verifier, returnTo, nonce, expiry) encrypted into OAuth `state` URL parameter
- No longer relies on cookies surviving cross-site redirects
- File: `cloudflare/auth.js`

**Deployed:** `wrangler deploy` - live on mergecombinator.com

### 2. Auth URL Migration

Changed OAuth issuer from `auth.sigmablox.com` to `via.mergecombinator.com`:
- Updated `wrangler.toml` `[vars]` for production
- Logout URL also updated

### 3. Quick Fixes

- **VIA logo:** Copied to `public/assets/logos/` so it renders in /access page
- **CTA buttons:** "Build with us" links now point to `/access` (was `#engage`)
- **CF Pages sync:** Pushed unpushed commits to trigger redeploy

### 4. SBIR Integration (Phase 1)

Added MC branding to `misfits_scraper` (sbir.mergecombinator.com):

**New files in `misfits_scraper/frontend`:**
```
src/components/MCHeader.tsx    - Slim header with MC logo + "Opportunities" title
src/components/MCFooter.tsx    - Footer with MC branding + nav links
src/styles/mc-branding.css     - MC design tokens (colors, fonts)
```

**Modified:**
- `index.html` - Google Fonts, MC favicon, updated title
- `src/main.tsx` - Import mc-branding.css
- `src/App.tsx` - Wrapped with MCHeader + MCFooter

**Deployed:** Pushed to GitHub, Railway auto-deploying.

### 5. Skills & Standards

**Command Center UI Enforcer** - Made global:
```
~/.claude/skills/command-center-ui-enforcer/skill.md
```
Enforces mission-critical operational UI standard for all MC properties.

**Design doc written:**
```
docs/plans/2026-01-26-opportunities-integration-design.md
```

---

## Architecture Notes

### Current Auth Flow
```
User → /auth/login → VIA (via.mergecombinator.com) → /auth/callback → Session cookie
```

State stored in encrypted URL parameter, not cookie. Session cookie only set after successful auth.

### Current Routing
```
mergecombinator.com
├── /                    → CF Pages (mc-site)
├── /access              → CF Pages (mc-site)
├── /auth/*              → CF Worker (auth.js)
├── /api/*               → Proxy to api.sigmablox.com
├── /opportunities       → Proxy to sbir.mergecombinator.com (Railway)
├── /combine             → Proxy to sigmablox.com
└── /builders, etc.      → CF Pages (mc-site)
```

---

## Backlog (Priority Order)

### Phase 2: Opportunities Frontend in mc-site
- Replace SBIR-only tool with comprehensive Opportunities platform
- Data sources: SBIR/STTR, SAM.gov, Grants.gov, DIU, AFWERX
- Hybrid auth: public browse, authenticated save/track/alerts
- Use Command Center UI Enforcer skill

### Phase 3: Builders Hybrid Auth
- Same pattern as Opportunities
- Public: browse directory, basic profiles
- Authenticated: watchlist, request intros, contact details

### Other Backlog
- Review docs.mergecombinator.com for internal/external sharing
- Find containerized Playwright alternative (Chrome resource issues)
- MC-console + Signal Sorted readiness

---

## Test URLs

| Endpoint | URL |
|----------|-----|
| MC Home | https://www.mergecombinator.com |
| Access/Auth | https://www.mergecombinator.com/access |
| Auth Login | https://www.mergecombinator.com/auth/login |
| Opportunities (SBIR) | https://www.mergecombinator.com/opportunities |
| SBIR Direct | https://sbir.mergecombinator.com |

---

## Files Changed (mc_site)

| File | Change |
|------|--------|
| `cloudflare/auth.js` | Signed state token pattern |
| `wrangler.toml` | via.mergecombinator.com URLs |
| `index.html` | CTA links → /access |
| `blog.html`, `blog/*.html` | CTA links → /access |
| `public/assets/logos/via2_rect_backed.jpg` | Added for /access page |
| `docs/plans/2026-01-26-opportunities-integration-design.md` | Design doc |

## Files Changed (misfits_scraper)

| File | Change |
|------|--------|
| `frontend/src/components/MCHeader.tsx` | New |
| `frontend/src/components/MCFooter.tsx` | New |
| `frontend/src/styles/mc-branding.css` | New |
| `frontend/index.html` | Fonts, favicon, title |
| `frontend/src/main.tsx` | Import branding CSS |
| `frontend/src/App.tsx` | Wrap with header/footer |

---

## Next Session Starting Point

1. Verify SBIR Railway deployment shows MC branding
2. Test full auth flow on production (via.mergecombinator.com)
3. Start Phase 2 planning if ready, or tackle other backlog items
