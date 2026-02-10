# MC Router Deployment Guide

## Environments

| Environment | Worker Name        | URL                                                    |
|-------------|-------------------|--------------------------------------------------------|
| Production  | mc-router          | https://mergecombinator.com                            |
| Staging     | mc-router-staging  | https://mc-router-staging.defensebuilders.workers.dev  |
| Development | mc-router-dev      | localhost via `wrangler dev --env dev`                 |

## Deployment Commands

```bash
# Deploy to staging (test changes here first)
wrangler deploy --env staging

# Deploy to production (after staging is verified)
wrangler deploy --env=""

# Local development
wrangler dev --env dev
```

## Pre-Deployment Checklist

Before deploying to production, verify all routes work on staging:

```bash
# Run automated tests
node cloudflare/test-router.mjs staging

# Manual verification
curl -sI https://mc-router-staging.defensebuilders.workers.dev/        # 200
curl -sI https://mc-router-staging.defensebuilders.workers.dev/wingman # 200
curl -sI https://mc-router-staging.defensebuilders.workers.dev/app     # 302
curl -sI https://mc-router-staging.defensebuilders.workers.dev/control # 302
curl -sI https://mc-router-staging.defensebuilders.workers.dev/combine # 200
```

## Promotion Plan: Staging → Production

1. **Verify staging passes all tests**
   ```bash
   node cloudflare/test-router.mjs staging
   ```

2. **Create a PR for review**
   ```bash
   git checkout staging/modular-worker
   gh pr create --title "feat: modular worker refactor" --body "..."
   ```

3. **Merge and deploy to production**
   ```bash
   git checkout main
   git merge staging/modular-worker
   wrangler deploy --env=""
   ```

4. **Verify production**
   ```bash
   node cloudflare/test-router.mjs prod
   ```

## Rollback Procedure

If production breaks after deployment:

### Option 1: Revert via Git (Recommended)

```bash
# Find the last working commit
git log --oneline -10

# Revert to the last known good commit
git revert HEAD

# Deploy the reverted code
wrangler deploy --env=""
```

### Option 2: Revert via Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Workers & Pages → mc-router
2. Click "Deployments" tab
3. Find the previous working deployment
4. Click "Rollback to this deployment"

### Option 3: Emergency Bundled Worker

If the modular imports are the problem, you can deploy the bundled version:

```bash
# The bundled version is on main branch
git checkout main -- cloudflare/merge-router.js
wrangler deploy --env=""
```

## Secrets Management

Secrets are managed separately from code and must be set for each environment:

```bash
# List secrets
wrangler secret list
wrangler secret list --env staging

# Set a secret
wrangler secret put SECRET_NAME
wrangler secret put SECRET_NAME --env staging

# Copy secrets from local .env.local to staging
source .env.local
echo "$MC_OAUTH_CLIENT_ID" | wrangler secret put MC_OAUTH_CLIENT_ID --env staging
echo "$MC_OAUTH_CLIENT_SECRET" | wrangler secret put MC_OAUTH_CLIENT_SECRET --env staging
echo "$SESSION_SECRET" | wrangler secret put SESSION_SECRET --env staging
```

## Architecture Notes

### Modular vs Bundled

- **Modular** (`staging/modular-worker` branch): Clean separation with `import` from `auth.js`
- **Bundled** (`main` branch): Single file with all code inlined

Wrangler automatically bundles ES modules when deploying, so the modular version works correctly.

### Route Priority

Routes are matched in order of specificity:
1. `/app/wingman` (most specific)
2. `/app`
3. `/control`
4. `/api`
5. `/combine`
6. `/opportunities`
7. Fall-through to MC Pages

### Auth Flow

1. Protected routes (`/app`, `/control`) check for session
2. No session → redirect to `/auth/login?returnTo=...`
3. Login → VIA OAuth → callback → session cookie set
4. Redirect back to original URL

## Monitoring

Check worker logs for errors:

```bash
wrangler tail              # Production
wrangler tail --env staging
```
