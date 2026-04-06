# Outbound Click Redirect Worker — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Route all outbound company website links through `/go/:slug` for click analytics, referral attribution, and UTM tracking.

**Architecture:** New `/go/:slug` route in mc-router (merge-router.js) handles redirect + fires async writes to CF Analytics Engine (raw events) and mc-api Postgres (daily aggregates). Frontend updated across 3 files to generate `/go/` URLs instead of direct links.

**Tech Stack:** Cloudflare Workers (mc-router), Analytics Engine binding, Hono (mc-api), Postgres via Hyperdrive, vanilla JS frontend.

---

## Task 1: Postgres Schema — outbound_click_aggregates table

**Files:**
- Create: `cloudflare/api-worker/src/repos/guild/outbound-clicks.ts`
- Reference: `cloudflare/api-worker/src/repos/guild/access-analytics.ts` (pattern to follow)

**Step 1: Create the SQL migration**

Run this against Supabase SQL editor (cannot be done in code — production schema is provisioned via explicit DB migration/GUI per existing pattern in access-analytics.ts):

```sql
CREATE TABLE IF NOT EXISTS outbound_click_aggregates (
    company_slug    TEXT NOT NULL,
    source_page     TEXT NOT NULL,
    click_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    click_count     INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (company_slug, source_page, click_date)
);

CREATE INDEX IF NOT EXISTS idx_outbound_clicks_date
    ON outbound_click_aggregates (click_date);

CREATE INDEX IF NOT EXISTS idx_outbound_clicks_slug
    ON outbound_click_aggregates (company_slug);
```

**Step 2: Create the outbound-clicks repo module**

Create `cloudflare/api-worker/src/repos/guild/outbound-clicks.ts`:

```typescript
import type pg from 'pg'

function pickString(input: unknown, max = 120): string | null {
  if (typeof input !== 'string') return null
  const v = input.trim()
  if (!v) return null
  return v.slice(0, max)
}

export async function writeOutboundClick(
  pool: InstanceType<typeof pg.Pool>,
  companySlug: string,
  sourcePage: string
) {
  const slug = pickString(companySlug, 200)
  const source = pickString(sourcePage, 40)
  if (!slug) return

  await pool.query(
    `
      INSERT INTO outbound_click_aggregates (company_slug, source_page, click_date, click_count)
      VALUES ($1, $2, CURRENT_DATE, 1)
      ON CONFLICT (company_slug, source_page, click_date)
      DO UPDATE SET click_count = outbound_click_aggregates.click_count + 1
    `,
    [slug, source || 'unknown']
  )
}

export async function fetchOutboundSummary(
  pool: InstanceType<typeof pg.Pool>,
  lookbackDays = 30
) {
  const days = Math.max(1, Math.min(lookbackDays, 90))

  const byCompany = await pool.query(
    `
      SELECT company_slug, SUM(click_count)::int AS total_clicks
      FROM outbound_click_aggregates
      WHERE click_date >= CURRENT_DATE - ($1::int * INTERVAL '1 day')
      GROUP BY company_slug
      ORDER BY total_clicks DESC
      LIMIT 50
    `,
    [days]
  )

  const bySource = await pool.query(
    `
      SELECT source_page, SUM(click_count)::int AS total_clicks
      FROM outbound_click_aggregates
      WHERE click_date >= CURRENT_DATE - ($1::int * INTERVAL '1 day')
      GROUP BY source_page
      ORDER BY total_clicks DESC
    `,
    [days]
  )

  const byCompanyAndSource = await pool.query(
    `
      SELECT company_slug, source_page, SUM(click_count)::int AS total_clicks
      FROM outbound_click_aggregates
      WHERE click_date >= CURRENT_DATE - ($1::int * INTERVAL '1 day')
      GROUP BY company_slug, source_page
      ORDER BY total_clicks DESC
      LIMIT 100
    `,
    [days]
  )

  const totalResult = await pool.query(
    `
      SELECT SUM(click_count)::int AS total
      FROM outbound_click_aggregates
      WHERE click_date >= CURRENT_DATE - ($1::int * INTERVAL '1 day')
    `,
    [days]
  )

  return {
    lookback_days: days,
    total_clicks: totalResult.rows[0]?.total ?? 0,
    by_company: byCompany.rows,
    by_source: bySource.rows,
    by_company_and_source: byCompanyAndSource.rows,
  }
}
```

**Step 3: Commit**

```bash
git add cloudflare/api-worker/src/repos/guild/outbound-clicks.ts
git commit -m "feat(analytics): add outbound click aggregates repo"
```

---

## Task 2: API Endpoints — ingest + summary

**Files:**
- Modify: `cloudflare/api-worker/src/routes/analytics.ts`
- Reference: existing `access/events` and `access/summary` patterns in same file

**Step 1: Add outbound event ingest endpoint**

In `cloudflare/api-worker/src/routes/analytics.ts`, add after the `access/summary` route (after line 103):

```typescript
import { writeOutboundClick, fetchOutboundSummary } from '../repos/guild/outbound-clicks'
```

Add at top with existing imports. Then add the routes:

```typescript
// ── Outbound click tracking ─────────────────────────────────────────────

analytics.post('/outbound/event', async (c) => {
  const requestId = c.get('requestId')
  const origin = c.req.header('Origin') || null

  // Accept from mc-router (no Origin header on server-to-server) and from browser
  if (origin && !INGEST_ALLOWED_ORIGINS.has(origin)) {
    return c.json(err('FORBIDDEN', 'Origin not allowed', { request_id: requestId }), 403)
  }

  let body: { company_slug?: string; source_page?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json(err('INVALID_INPUT', 'Invalid JSON body', { request_id: requestId }), 400)
  }

  const companySlug = typeof body.company_slug === 'string' ? body.company_slug.trim() : ''
  if (!companySlug) {
    return c.json(err('INVALID_INPUT', 'Missing company_slug', { request_id: requestId }), 400)
  }

  const sourcePage = typeof body.source_page === 'string' ? body.source_page.trim() : 'unknown'

  try {
    const { pool } = getDb(c.env.HYPERDRIVE)
    await writeOutboundClick(pool, companySlug, sourcePage)
    return c.json(ok({ accepted: true, stored: true }, { request_id: requestId }), 202)
  } catch (error) {
    console.error('outbound click ingest failed', error)
    return c.json(ok({ accepted: true, stored: false }, {
      request_id: requestId,
      warning: 'analytics_storage_unavailable',
    }), 202)
  }
})

analytics.use('/outbound/summary', verifyOidc)

analytics.get('/outbound/summary', async (c) => {
  const requestId = c.get('requestId')
  if (!requireOpsRole(c)) {
    return c.json(err('FORBIDDEN', 'Access restricted', { request_id: requestId }), 403)
  }

  const daysRaw = c.req.query('days')
  const days = daysRaw ? Number(daysRaw) : 30
  const lookback = Number.isFinite(days) ? Math.floor(days) : 30

  const { pool } = getDb(c.env.HYPERDRIVE)
  try {
    const summary = await fetchOutboundSummary(pool, lookback)
    return c.json(ok(summary, {
      request_id: requestId,
      issued_at: new Date().toISOString(),
    }))
  } catch (error) {
    console.error('outbound click summary failed', error)
    return c.json(err('ANALYTICS_UNAVAILABLE', 'Outbound click analytics not initialized', {
      request_id: requestId,
    }), 503)
  }
})
```

**Step 2: Build to verify**

```bash
cd cloudflare/api-worker && npm run build
```

Expected: no type errors.

**Step 3: Commit**

```bash
git add cloudflare/api-worker/src/routes/analytics.ts
git commit -m "feat(analytics): add outbound click ingest and summary endpoints"
```

---

## Task 3: Analytics Engine Binding

**Files:**
- Modify: `wrangler.toml` (mc-router config)

**Step 1: Add Analytics Engine binding to mc-router wrangler.toml**

After the `[vars]` section (around line 49), add:

```toml
# Outbound click analytics (raw event stream)
[[analytics_engine_datasets]]
binding = "OUTBOUND_CLICKS"
dataset = "mc_outbound_clicks"
```

Also add to `[env.staging]` and `[env.dev]` sections:

```toml
[[env.staging.analytics_engine_datasets]]
binding = "OUTBOUND_CLICKS"
dataset = "mc_outbound_clicks_staging"

[[env.dev.analytics_engine_datasets]]
binding = "OUTBOUND_CLICKS"
dataset = "mc_outbound_clicks_dev"
```

**Step 2: Create the Analytics Engine dataset in Cloudflare dashboard**

Navigate to Cloudflare Dashboard → Analytics & Logs → Analytics Engine → Create dataset: `mc_outbound_clicks`

This is a manual step — Analytics Engine datasets are auto-created on first write, but creating explicitly avoids surprise.

**Step 3: Commit**

```bash
git add wrangler.toml
git commit -m "chore: add OUTBOUND_CLICKS analytics engine binding to mc-router"
```

---

## Task 4: /go/:slug Route in mc-router

**Files:**
- Modify: `cloudflare/merge-router.js:220-350` (main fetch handler)

**Step 1: Add the /go/ handler**

In `cloudflare/merge-router.js`, add a new handler block between step 1.5 (platform convergence redirects, ends ~line 297) and the `const origins = getOrigins(env)` line (line 299).

Insert this block:

```javascript
    // 1.7) Outbound click redirect: /go/:slug?url=<target>&src=<source_page>
    if (url.pathname.startsWith('/go/')) {
      const slug = decodeURIComponent(url.pathname.slice(4).replace(/\/$/, ''));
      const targetRaw = url.searchParams.get('url');
      const sourcePage = url.searchParams.get('src') || 'unknown';

      if (!targetRaw || !slug) {
        // Bad request — redirect to builders directory
        return Response.redirect(`https://${CANONICAL_HOST}/builders`, 302);
      }

      // Ensure target has protocol
      let targetUrl = targetRaw.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = `https://${targetUrl}`;
      }

      // Append UTM parameters
      try {
        const target = new URL(targetUrl);
        if (!target.searchParams.has('utm_source')) {
          target.searchParams.set('utm_source', 'mergecombinator');
          target.searchParams.set('utm_medium', sourcePage);
          target.searchParams.set('utm_campaign', 'builders_directory');
        }
        targetUrl = target.toString();
      } catch {
        // Malformed URL — redirect to builders
        return Response.redirect(`https://${CANONICAL_HOST}/builders`, 302);
      }

      // Fire-and-forget: Analytics Engine write (raw event)
      if (env.OUTBOUND_CLICKS) {
        try {
          env.OUTBOUND_CLICKS.writeDataPoint({
            blobs: [
              slug,
              sourcePage,
              targetUrl,
              request.headers.get('referer') || '',
              (request.headers.get('user-agent') || '').slice(0, 256),
            ],
            doubles: [Date.now()],
          });
        } catch (e) {
          console.error('[mc-router] analytics engine write failed', e);
        }
      }

      // Fire-and-forget: Postgres aggregate via API worker
      const apiOrigin = `https://${API_HOST}`;
      try {
        const analyticsPromise = fetch(`${apiOrigin}/analytics/outbound/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_slug: slug, source_page: sourcePage }),
        }).catch((e) => console.error('[mc-router] outbound analytics post failed', e));

        // Use waitUntil so the fetch completes even after we return the redirect
        // ctx not available in the simple export default { fetch } pattern,
        // so we rely on the promise being non-blocking
        // NOTE: If we need waitUntil, convert to ES module with ctx parameter
      } catch (e) {
        console.error('[mc-router] outbound analytics post failed', e);
      }

      return Response.redirect(targetUrl, 302);
    }
```

**Step 2: Add `ctx` parameter for waitUntil**

The current handler signature is `async fetch(request, env)`. Update to `async fetch(request, env, ctx)` so we can use `ctx.waitUntil()` for the non-blocking API call:

Change line 224 from:
```javascript
  async fetch(request, env) {
```
To:
```javascript
  async fetch(request, env, ctx) {
```

Then in the /go/ handler, replace the analytics fetch block with:

```javascript
      // Fire-and-forget: Postgres aggregate via API worker
      ctx.waitUntil(
        fetch(`https://${API_HOST}/analytics/outbound/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_slug: slug, source_page: sourcePage }),
        }).catch((e) => console.error('[mc-router] outbound analytics post failed', e))
      );
```

**Step 3: Build mc-router to verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add cloudflare/merge-router.js
git commit -m "feat: add /go/:slug outbound click redirect with analytics"
```

---

## Task 5: Router Unit Tests for /go/

**Files:**
- Modify: `cloudflare/test-router.mjs`

**Step 1: Add /go/ test function**

Add this test function after the existing test functions (before the main runner):

```javascript
// Test outbound redirect route (/go/:slug)
function testOutboundRedirect() {
  console.log("Testing outbound redirect (/go/:slug)...");

  // These paths should NOT be caught by convergence redirects
  // (they don't start with /app, /wingman, or /api)
  const goPathCases = [
    ["/go/zeromark", "", null, null],  // no convergence redirect
    ["/go/kinard-technologies", "", null, null],
    ["/go/nooks", "?url=https://nooks.works&src=builders", null, null],
  ];

  let passed = 0;
  let failed = 0;

  for (const [pathname, search, expectedStatus, expectedLocation] of goPathCases) {
    const result = convergenceRedirect(pathname, search);
    if (result === null) {
      console.log(`  ✓ ${pathname}${search} → (no convergence redirect, proceeds to /go/ handler)`);
      passed++;
    } else {
      console.log(`  ✗ ${pathname}${search} → ${result.status} ${result.location} (expected: no redirect)`);
      failed++;
    }
  }

  console.log(`\nOutbound redirect: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}
```

Add `testOutboundRedirect()` to the unit test runner (find where other test functions are called).

**Step 2: Run tests**

```bash
node cloudflare/test-router.mjs --unit
```

Expected: all tests pass.

**Step 3: Commit**

```bash
git add cloudflare/test-router.mjs
git commit -m "test: add /go/ outbound redirect route tests"
```

---

## Task 6: Frontend — Shared outboundUrl utility

**Files:**
- Create: `js/lib/outbound.js`

**Step 1: Create shared utility**

Create `js/lib/outbound.js`:

```javascript
/**
 * Build a /go/ redirect URL for outbound company links.
 * @param {string} websiteUrl - The normalized target URL (must already have protocol)
 * @param {string} companySlug - URL-safe slug for the company
 * @param {string} sourcePage - Which page the link appears on (builders|portfolio|cohort)
 * @returns {string} The /go/ redirect URL, or empty string if no websiteUrl
 */
export function outboundUrl(websiteUrl, companySlug, sourcePage) {
    if (!websiteUrl) return '';
    return `/go/${encodeURIComponent(companySlug)}?url=${encodeURIComponent(websiteUrl)}&src=${encodeURIComponent(sourcePage)}`;
}

/**
 * Generate a URL-safe slug from a company name.
 * Strips common suffixes (Inc, LLC, Corp, etc).
 */
export function toCompanySlug(name) {
    return name
        .replace(/,?\s*(Inc\.?|LLC\.?|Corporation|Corp\.?|Technologies|Technology)\s*/gi, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();
}
```

**Step 2: Commit**

```bash
git add js/lib/outbound.js
git commit -m "feat: add shared outbound URL utility"
```

---

## Task 7: Frontend — Update builders modal

**Files:**
- Modify: `js/builders/components.js:88-99, 232-236, 255-259`

**Step 1: Add import**

At top of `js/builders/components.js` (line 1), add:

```javascript
import { outboundUrl } from '../lib/outbound.js';
```

**Step 2: Update websiteUrl to use /go/ redirect**

Around line 88 where `websiteUrl` is defined, add the outbound URL. The `toSlug` function already exists at line 467. Change the link construction:

After line 88 (`const websiteUrl = normalizeUrl(company.website || '');`), add:

```javascript
    const companySlug = toSlug(company.name);
    const websiteGoUrl = outboundUrl(websiteUrl, companySlug, 'builders');
```

Then replace all `href="${escapeHtml(websiteUrl)}"` in the modal with `href="${escapeHtml(websiteGoUrl)}"` in three places:

1. Line ~91 (modal header website link): change `websiteUrl` to `websiteGoUrl` in href
2. Line ~233 (authenticated CTA "External Site"): change `websiteUrl` to `websiteGoUrl` in href
3. Line ~256 (unauthenticated CTA "External Site"): change `websiteUrl` to `websiteGoUrl` in href

Keep the `websiteUrl` conditional checks as-is (they check if website exists). Only change the `href` values.

Also keep the `websiteDisplay` using `websiteUrl` (for display text, not for linking).

**Step 3: Build and verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add js/builders/components.js
git commit -m "feat(builders): route outbound website links through /go/ redirect"
```

---

## Task 8: Frontend — Update portfolio cards

**Files:**
- Modify: `js/portfolio/index.js:109-116`

**Step 1: Add import and slug function**

At top of `js/portfolio/index.js`, add:

```javascript
import { outboundUrl, toCompanySlug } from '../lib/outbound.js';
```

**Step 2: Update portfolio card link**

In `renderPortfolioCard()` (line ~109), change:

```javascript
<a href="${escapeHtml(normalizeUrl(company.website))}" class="portfolio-card__link" target="_blank" rel="noopener">
```

To:

```javascript
<a href="${escapeHtml(outboundUrl(normalizeUrl(company.website), toCompanySlug(company.name || company.companyName || 'unknown'), 'portfolio'))}" class="portfolio-card__link" target="_blank" rel="noopener">
```

**Step 3: Build and verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add js/portfolio/index.js
git commit -m "feat(portfolio): route outbound website links through /go/ redirect"
```

---

## Task 9: Frontend — Update cohort cards

**Files:**
- Modify: `js/combine/cohort.js:121-128`

**Step 1: Add import**

At top of `js/combine/cohort.js`, add:

```javascript
import { outboundUrl, toCompanySlug } from '../lib/outbound.js';
```

**Step 2: Update cohort card link**

In `renderCard()` (line ~122), change:

```javascript
<a href="${escapeHtml(normalizeUrl(company.website))}" class="portfolio-card__link" target="_blank" rel="noopener">
```

To:

```javascript
<a href="${escapeHtml(outboundUrl(normalizeUrl(company.website), toCompanySlug(company.name || company.companyName || 'unknown'), 'cohort'))}" class="portfolio-card__link" target="_blank" rel="noopener">
```

**Step 3: Build and verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add js/combine/cohort.js
git commit -m "feat(cohort): route outbound website links through /go/ redirect"
```

---

## Task 10: Full Build + Test + Deploy

**Step 1: Full build**

```bash
npm run build
```

Expected: clean build, no errors.

**Step 2: Run router tests**

```bash
node cloudflare/test-router.mjs --unit
```

Expected: all tests pass including new /go/ tests.

**Step 3: Run lint**

```bash
npm run lint
```

Expected: no lint errors.

**Step 4: Local smoke test**

```bash
npm run dev
```

Open `http://localhost:5173/builders`, click a company, verify:
- Website link href is `/go/company-slug?url=https://...&src=builders`
- Clicking it redirects to the company's actual site
- URL bar shows UTM params on the target site

**Step 5: Deploy mc-router**

```bash
wrangler deploy
```

**Step 6: Deploy mc-api**

```bash
cd cloudflare/api-worker && npx wrangler deploy
```

**Step 7: Run SQL migration on Supabase**

Run the SQL from Task 1 Step 1 in Supabase SQL editor.

**Step 8: Verify in production**

Visit `https://mergecombinator.com/builders`, click a company's website link, confirm:
- Redirects correctly to external site
- UTM params present in target URL
- `https://mergecombinator.com` shows as referrer in target site analytics

**Step 9: Verify analytics endpoint**

```bash
curl -s https://api.mergecombinator.com/analytics/outbound/summary?days=1 \
  -H "Authorization: Bearer <token>" | jq .
```

Expected: shows click data.

**Step 10: Final commit**

```bash
git add -A
git commit -m "feat: outbound click redirect with analytics engine + postgres tracking"
```
