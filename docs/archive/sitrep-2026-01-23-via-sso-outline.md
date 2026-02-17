# Situation Report: 2026-01-23

**Status:** Production Ready
**Primary Focus:** VIA SSO Integration & UI Improvements

**Branding note:** VIA defaults to Merge Combinator. SigmaBlox references here are product-specific or historical.

---

## Completed This Session

### 1. DNS Cutover Verified
- `www.mergecombinator.com` confirmed live on Cloudflare Pages
- All auth endpoints operational (`/auth/login`, `/auth/me`, `/auth/callback`)

### 2. Navigation Redesign
- **Reordered nav links:** Defense Builders → Combine → Merch → Opportunities → Knowledge
- **Removed redundant buttons:** "Join Combine" and "Apply" (both pointed to same URL)
- **New "Apply" dropdown** with hover menu:
  - "Learn More" → `/apply` page
  - "Login" → `/auth/login` (VIA OAuth flow)
- **Logged-in state:** Shows user avatar + name with dropdown (Dashboard, Sign Out)

### 3. New `/apply` CTA Page
- Split layout: Hero content left, login card right
- VIA branding with "Continue with VIA" button
- Google SSO option
- Similar design to the legacy SigmaBlox `/join` page

### 4. SBIR Service Fix (Railway)
- **Root cause:** Server bound to `localhost` instead of `0.0.0.0`
- **Fix:** Changed `app.listen(PORT, 'localhost')` → `app.listen(PORT, '0.0.0.0')`
- **Repo:** `misfits_scraper` → pushed to GitHub → Railway auto-deployed
- Service now healthy at `sbir.mergecombinator.com`

### 5. Outline Wiki SSO Integration
- **VIA OAuth2 Provider created** in Authentik dashboard:
  - Client ID: `outline-docs`
  - Redirect URI: `https://docs.mergecombinator.com/auth/oidc.callback`
- **Outline config updated** on homelab (`100.66.200.39`):
  - OIDC endpoints pointing to `via.mergecombinator.com`
  - Display name: "VIA" (shows as "Continue with VIA")
  - Slack auth removed, Google retained
- **SSO flow working:** docs.mergecombinator.com → VIA login → authenticated

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION                            │
├─────────────────────────────────────────────────────────────────┤
│  VIA (via.mergecombinator.com)                                  │
│  └── Authentik-based SSO                                        │
│      ├── OAuth2 Provider: merge-combinator (mc_site)            │
│      ├── OAuth2 Provider: outline-docs (Outline wiki)           │
│      └── OAuth2 Provider: via-dashboard                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         PROPERTIES                               │
├─────────────────────────────────────────────────────────────────┤
│  www.mergecombinator.com (Cloudflare Pages)                     │
│  ├── /auth/* → VIA OAuth flow                                   │
│  ├── /apply → CTA page with login                               │
│  ├── /builders → Defense Builders directory                     │
│  └── /opportunities → SBIR scraper (Railway)                    │
│                                                                  │
│  docs.mergecombinator.com (Homelab via CF Tunnel)               │
│  ├── Outline Wiki                                               │
│  └── SSO via VIA                                                │
│                                                                  │
│  api.sigmablox.com (Cloud Run)                                  │
│  └── Companies API, upvotes, etc.                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuration Files Updated

| Location | File | Changes |
|----------|------|---------|
| mc_site | `index.html`, `builders.html`, etc. | Nav redesign, Apply dropdown |
| mc_site | `styles.css` | Dropdown styles, auth nav styles |
| mc_site | `js/auth-nav.js` | Dynamic auth state UI |
| mc_site | `apply.html` | New CTA page |
| misfits_scraper | `server.js` | Bind to 0.0.0.0 |
| outline (homelab) | `config/base.yaml` | OIDC URIs, display name |
| outline (homelab) | `.env.local` | OIDC_CLIENT_SECRET |
| sigmablox/authentik | `outline-app.yaml` | Blueprint (not applied via API) |

---

## Next Steps

### Immediate

1. **Unified Navigation Component**
   - Extract nav HTML into a shared partial/component
   - Ensure consistent nav across all MC properties
   - Consider server-side includes or build-time templating

2. **Outline Branding Alignment**
   - Custom CSS for Outline to match MC visual identity
   - Explore Outline's custom CSS injection capability
   - Add MC logo/branding to Outline header

3. **Dashboard Page**
   - Create `/dashboard` for logged-in users
   - Link from user dropdown menu
   - Show user's activity, saved items, etc.

### Integration Improvements

4. **Cross-Property Session Awareness**
   - When logged into MC, show logged-in state on Outline (via shared VIA session)
   - Consider embedding Outline content in MC pages
   - Unified "My Account" across properties

5. **Outline ↔ MC Deep Linking**
   - Link from MC pages to relevant Outline docs
   - Embed Outline search in MC Knowledge section
   - Consider Outline API integration for dynamic content

6. **Apply Flow Enhancement**
   - After VIA login on `/apply`, redirect to onboarding flow
   - Collect additional user info (role, company, interests)
   - Auto-create user profile in SigmaBlox API

### Future Work

7. **SSO for Additional Properties**
   - SigmaBlox main site (`sigmablox.com`)
   - VIA Dashboard (`via.mergecombinator.com`)
   - Any new MC properties

8. **Custom Outline Login Page**
   - If needed, use Authentik's branded login flow
   - Redirect Outline login to VIA-hosted page with MC branding

9. **Analytics & Tracking**
   - Unified user journey tracking across MC + Outline
   - Login funnel metrics
   - Content engagement in Outline

---

## Environment Notes

- **Homelab Tailscale IP:** `100.66.200.39`
- **Outline path:** `~/dev/outline`
- **Outline git remote:** `100.66.200.39:repos/outline-tools.git`
- **Docker on homelab:** `/usr/local/bin/docker`
- **Config regeneration:** `node scripts/render-env.js dev.local`

---

## Commits This Session

| Repo | Description |
|------|-------------|
| mc_site | Nav redesign, Apply dropdown, auth-nav.js |
| mc_site | New /apply CTA page |
| misfits_scraper | fix: bind server to 0.0.0.0 for Railway healthcheck |
| outline (homelab) | VIA SSO configuration |
