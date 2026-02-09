# Console Routing Deployment Plan

**PR3: Mission Control + Console Switcher**
**Date:** 2026-02-05

---

## Architecture Overview

```
                    Cloudflare Worker (merge-router.js)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
  /app/*              /wingman/*             /control/*
     │                     │                     │
     ▼                     ▼                     ▼
app.mergecombinator   wingman.mergecombinator   control.mergecombinator
     │                     │                     │
     ▼                     ▼                     ▼
CF Pages / Workers    CF Pages / Workers    Cloud Run
(console app)         (dashboard app)       (via-dashboard)
```

## Pre-Deployment Checklist

- [ ] Console app builds successfully
- [ ] Wingman app builds successfully
- [ ] Via-dashboard builds successfully
- [ ] Worker routing tested locally with wrangler dev --env dev
- [ ] DNS records prepared for subdomains

---

## Deployment Phases

### Phase 1: Deploy Placeholder Apps

Deploy minimal 200 OK responses to subdomains before enabling worker routing.

**1a. Create placeholder workers**

\`\`\`bash
# Create placeholder for app.mergecombinator.com
echo 'export default { fetch: () => new Response("Console coming soon", { status: 200 }) }' > /tmp/placeholder.js
wrangler deploy /tmp/placeholder.js --name mc-app-placeholder

# Create placeholder for wingman.mergecombinator.com
wrangler deploy /tmp/placeholder.js --name mc-wingman-placeholder
\`\`\`

**1b. Configure DNS (Cloudflare)**

| Subdomain | Type | Target |
|-----------|------|--------|
| app | CNAME | mc-app-placeholder.workers.dev |
| wingman | CNAME | mc-wingman-placeholder.workers.dev |
| control | CNAME | control-layer-xxxxx.run.app (Cloud Run) |

**1c. Verify placeholders respond**

\`\`\`bash
curl -I https://app.mergecombinator.com
curl -I https://wingman.mergecombinator.com
curl -I https://control.mergecombinator.com
\`\`\`

Expected: HTTP/2 200 for all.

---

### Phase 2: Deploy Worker Routing

**2a. Verify wrangler.toml production origins**

\`\`\`toml
[vars]
APP_ORIGIN = "https://app.mergecombinator.com"
WINGMAN_ORIGIN = "https://wingman.mergecombinator.com"
CONTROL_ORIGIN = "https://control.mergecombinator.com"
\`\`\`

**2b. Deploy worker**

\`\`\`bash
cd /Users/paulgarcia/Dev/mc_site
wrangler deploy
\`\`\`

**2c. Verify routing**

\`\`\`bash
# Should redirect to /auth/login when not authenticated
curl -I https://www.mergecombinator.com/app
# Expected: 302 Location: /auth/login?returnTo=/app
\`\`\`

---

### Phase 3: Deploy Real Console Apps

**3a. Deploy Console (Defense Builders)**

\`\`\`bash
cd /Users/paulgarcia/Dev/signal-incubator/apps/console
npm run build
wrangler pages deploy dist --project-name mc-console
\`\`\`

Update DNS: app CNAME → mc-console.pages.dev

**3b. Deploy Wingman**

\`\`\`bash
cd /Users/paulgarcia/Dev/signal-incubator/apps/dashboard
npm run build
wrangler pages deploy dist --project-name mc-wingman
\`\`\`

Update DNS: wingman CNAME → mc-wingman.pages.dev

**3c. Verify Via-Dashboard (Admin Console)**

Already deployed to Cloud Run.

---

## Rollback Procedures

### Rollback Level 1: Disable Path Routing

Point paths back to MC Pages (marketing site):

\`\`\`toml
[vars]
APP_ORIGIN = "https://mc-site-dr4.pages.dev"
WINGMAN_ORIGIN = "https://mc-site-dr4.pages.dev"
CONTROL_ORIGIN = "https://mc-site-dr4.pages.dev"
\`\`\`

\`\`\`bash
wrangler deploy
\`\`\`

### Rollback Level 2: Restore Placeholders

Update DNS back to placeholder workers.

### Rollback Level 3: Remove Path Routing Entirely

Comment out console routing in merge-router.js.

---

## Verification Checklist

### 1. Auth Flow

| Test | Expected |
|------|----------|
| GET /app (unauthenticated) | 302 → /auth/login?returnTo=/app |
| POST /auth/login → callback | Set mc_session cookie |
| GET /app (authenticated) | 200, load console UI |
| mc_last_console cookie | Set to "app" |

### 2. Console Switching

| Test | Expected |
|------|----------|
| GET /app/wingman (authenticated) | 200, load Wingman |
| GET /wingman (marketing) | 200, Wingman marketing page |
| mc_last_console cookie | Updated to "wingman" |
| GET /control (non-admin) | 302 → /app |
| GET /control (admin) | 200, load via-dashboard |

### 3. Dashboard Redirect

| Test | Expected |
|------|----------|
| GET /dashboard (unauthenticated) | 200, teaser page |
| GET /dashboard (authenticated) | 302 → /app |

### 4. Deep Links

| Test | Expected |
|------|----------|
| GET /app/builders/123 | 200, builder detail |
| GET /app/wingman/... | 200, preserve path |
| GET /control/users | 200, users page |

---

## Environment Variables Reference

### Production (wrangler.toml [vars])

| Variable | Value |
|----------|-------|
| OIDC_ISSUER_URL | https://via.mergecombinator.com |
| COOKIE_DOMAIN | .mergecombinator.com |
| APP_ORIGIN | https://app.mergecombinator.com |
| WINGMAN_ORIGIN | https://wingman.mergecombinator.com |
| CONTROL_ORIGIN | https://control.mergecombinator.com |

### Secrets (wrangler secret)

| Secret | Description |
|--------|-------------|
| MC_OAUTH_CLIENT_ID | OAuth client ID |
| MC_OAUTH_CLIENT_SECRET | OAuth client secret |
| SESSION_SECRET | AES-GCM encryption key |
