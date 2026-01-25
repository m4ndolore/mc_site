# Deployment Guide

This site has two deployment components:
1. **Cloudflare Pages** - Static site (HTML, CSS, JS, assets)
2. **Cloudflare Worker** - Router with auth (mc-router)

## Quick Reference

```bash
# Deploy worker (auth changes, routing changes)
npm run deploy

# Check Pages deployment status
npm run deploy:status

# Local development
npm run dev              # Static site only (port 3000)
npm run dev:worker       # Worker with local VIA (port 8787)
```

## Deployment Flow

### Static Site (Cloudflare Pages)
- **Auto-deploys on git push to `main`**
- Source: GitHub repo → Cloudflare Pages
- Build command: `npm run build`
- Output directory: `dist/`

To check status:
```bash
npm run deploy:status
# or
wrangler pages deployment list --project-name mc-site
```

### Worker (mc-router)
- **Manual deploy required** for auth/routing changes
- Deploys to: `mc-router.defensebuilders.workers.dev`

```bash
npm run deploy
# or
wrangler deploy
```

## What Triggers Each Deployment?

| Change Type | Pages (auto) | Worker (manual) |
|-------------|--------------|-----------------|
| HTML/CSS/JS changes | ✓ | - |
| New pages (*.html) | ✓ | - |
| vite.config.js | ✓ | - |
| cloudflare/auth.js | - | ✓ |
| cloudflare/merge-router.js | - | ✓ |
| wrangler.toml | - | ✓ |

## Local Development

### Static site only
```bash
npm run dev
# Visit http://localhost:3000
```

### Full stack with auth (requires local VIA at localhost:9000)
```bash
# Terminal 1: Ensure VIA is running on port 9000

# Terminal 2: Start worker
npm run dev:worker
# Visit http://localhost:8787
```

Note: `wrangler dev --env dev` uses local VIA (`OIDC_ISSUER_URL=http://localhost:9000`).

## Configuration

### Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| OIDC_ISSUER_URL | wrangler.toml | Auth provider URL |
| OAUTH_LOGOUT_URL | wrangler.toml | SSO logout endpoint |
| MC_OAUTH_CLIENT_ID | .dev.vars / secrets | OAuth client ID |
| MC_OAUTH_CLIENT_SECRET | .dev.vars / secrets | OAuth client secret |
| SESSION_SECRET | .dev.vars / secrets | Session encryption key |

### Secrets Setup

**Local development:**
```bash
# .dev.vars is a symlink to .env.local
ln -s .env.local .dev.vars
# Add secrets to .env.local (see .env.example)
```

**Production:**
```bash
wrangler secret put MC_OAUTH_CLIENT_ID
wrangler secret put MC_OAUTH_CLIENT_SECRET
wrangler secret put SESSION_SECRET
```

## Troubleshooting

### Pages deployment failed
1. Check build locally: `npm run build`
2. Common issue: entry files in vite.config.js don't match actual files

### Worker not picking up changes
1. Ensure you ran `npm run deploy` (Pages auto-deploy doesn't update worker)
2. Check deployment: `wrangler deployments list`

### Auth not working locally
1. Ensure VIA is running at localhost:9000
2. Ensure .dev.vars symlink exists: `ls -la .dev.vars`
3. Run with dev env: `npm run dev:worker` (not just `wrangler dev`)
