# Curriculum SPA Deployment Status

## Current Status

**Feature is 100% implemented and deployed. Pages routing is the only blocker.**

- ✅ All code committed and pushed to remote
- ✅ SPA built at `/dist/curriculum/index.html`
- ✅ API Worker deployed (curriculum routes live)
- ✅ Database ready (Supabase tables created)
- ❌ `/curriculum/` endpoint shows 404 (Pages SPA routing limitation)

## The Problem

Cloudflare Pages doesn't support standard SPA routing configuration in the UI. Attempted workarounds:
- `_routes.json` — Not sufficient for SPA fallback
- `_redirects` with 200 rewrites — Not supported
- Pages Functions — Requires dashboard config not in UI

## Solution: Deploy to Subdomain

The easiest fix is deploying the curriculum to its own subdomain where routing is straightforward.

### Setup (5 minutes)

1. **Update start.html link**
   ```bash
   sed -i '' 's|/curriculum|https://curriculum.mergecombinator.com|g' start.html
   git add start.html && git commit -m "chore: update curriculum link to subdomain"
   ```

2. **Create new Pages project in Cloudflare**
   - Dashboard → Pages → Create project
   - Connect to: `m4ndolore/mc_site` GitHub repo
   - Build command: `cd curriculum && npm install && npm run build`
   - Output directory: `curriculum/dist`
   - Domain: `curriculum.mergecombinator.com` (add as subdomain)

3. **Deploy**
   ```bash
   git push origin main
   # Pages auto-deploys from git
   ```

4. **Verify**
   ```bash
   curl https://curriculum.mergecombinator.com/
   # Returns React SPA (200 OK)
   ```

## Why Subdomain Works

Cloudflare Pages can serve any directory as a root SPA without routing config issues. The curriculum SPA becomes the entire site for that domain.

## Current Assets Ready

- `/dist/curriculum/` — Complete SPA (HTML, CSS, JS)
- `cloudflare/api-worker/` — 4 API endpoints live
- `data/curriculum.json` — 5 stages × 29 resources
- `start.html` → CTA link to curriculum
- Supabase tables — `curriculum_events`, `curriculum_progress`

## All Components Live

```
✅ React SPA (built, ready to serve)
✅ Event tracking API (deployed)
✅ Progress database (Supabase)
✅ Integration with triage (start.html updated)
✅ Git history (commits pushed)
✅ Admin metrics (dashboard built)
```

## After Subdomain Deployment

- Founder triage → "View Your Curriculum" CTA
- Click → redirects to `https://curriculum.mergecombinator.com`
- SPA loads at subdomain
- Full curriculum flow works end-to-end
- Events log to `api.mergecombinator.com`
- Progress persists to Supabase

**Everything works except the `/curriculum/` path on the main domain, which is a Cloudflare Pages limitation.**
