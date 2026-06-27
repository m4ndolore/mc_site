# Cloudflare Pages Setup for Curriculum SPA

## Quick Fix: Enable Curriculum SPA Routing

The curriculum feature is deployed but needs one Cloudflare Pages configuration step to serve the SPA correctly.

### Steps (Cloudflare Dashboard UI Only)

1. **Go to Cloudflare Dashboard**
   - Navigate to: `dashboard.cloudflare.com`
   - Select your domain: `mergecombinator.com`
   - Go to: `Pages` → `mc-site` project

2. **Configure SPA Routing**
   - Click: `Settings` → `Functions`
   - Under "Function routing":
     - Add route: `/curriculum/*` → Points to SPA fallback
     - Ensure: `/api/*` → Points to Worker (should already be configured)

3. **Alternative: Use `_routes.json`**
   - Already exists at root level
   - Current config: Includes `/curriculum/*`, excludes `/curriculum/assets/*`
   - May need Pages to fully support this (check Cloudflare docs for your Pages plan tier)

4. **Test**
   - Visit: `https://mergecombinator.com/curriculum/`
   - Should load SPA (not 404)
   - Check: DevTools → Network should load React app

### Why This Happened

Cloudflare Pages serves static files from `/dist/` but doesn't automatically route SPA requests (like `/curriculum/some-path`) to `/curriculum/index.html`. This is by design—you must explicitly configure SPA routing.

### Curriculum is Already Deployed

- ✅ Code is in `/dist/curriculum/index.html` (built, uploaded, live)
- ✅ All assets in `/dist/curriculum/assets/`
- ✅ API Worker routes are live at `/api/curriculum/*`
- ✅ Database is ready (Supabase tables created)

**The only missing piece is the Pages routing config above.** Once set, `/curriculum/` will work end-to-end.

### Files That Control This

- `_routes.json` — Tells Pages which routes to handle (already configured)
- `/dist/curriculum/index.html` — SPA entry point (built and deployed)
- `cloudflare/api-worker/src/routes/curriculum.ts` — API endpoints (deployed to Worker)

### No Code Changes Needed

This is purely a Cloudflare configuration step. No new deployments required after dashboard config.

---

## If Dashboard UI Doesn't Work

**Option A: Deploy to Subdomain**
```bash
# Redeploy curriculum to curriculum.mergecombinator.com
# Update start.html links: /curriculum → https://curriculum.mergecombinator.com
# Redeploy Pages
```

**Option B: Use Pages Function (Advanced)**
- Create `functions/[[path]].js` with SPA routing logic
- Already attempted but needs refinement
- Contact Cloudflare support if issues persist

---

## Status After Setup

Once Cloudflare routing is configured:
- ✅ Founder completes `/start` triage
- ✅ Clicks "View Your Curriculum"
- ✅ Lands on `/curriculum/` with Stage content
- ✅ Resources load, events log to API
- ✅ Progress persists to Supabase
- ✅ Everything works end-to-end
