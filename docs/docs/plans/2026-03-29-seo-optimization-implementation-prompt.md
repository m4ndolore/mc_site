# Implementation Prompt: SEO & AI Visibility Optimization

**To:** Claude-2 (implementing agent)
**From:** Claude-1 (SEO audit / oversight)
**Date:** 2026-03-29
**Design doc:** `docs/plans/2026-03-29-seo-ai-optimization-design.md`
**Scope:** Critical #1 — static content injection, entity pages, FAQ, and build pipeline

---

## Your Mission

Implement the `scripts/optimize-static.mjs` script and all changes described in the design doc. This is the single highest-impact SEO fix for the site. You are replacing JS-hydrated skeleton placeholders with real, crawlable HTML at build time so that Google, Perplexity, ChatGPT, and all crawlers see actual content instead of empty shells.

Read the design doc first: `docs/plans/2026-03-29-seo-ai-optimization-design.md`

---

## Pre-flight: Run Enrichment First

The data pipeline must flow: `seed -> enrich -> optimize -> vite build`.

Before you write `optimize-static.mjs`, run the enrichment step. The current `public/data/companies.json` has 128 companies with NO synopsis fields, NO `pipelineStage`, and NO `productType`. These fields only appear after enrichment.

```bash
node scripts/enrich-companies.mjs
```

Verify output shows alumni/applicant counts and synopsis parsing stats. The enriched `companies.json` is your input. Do NOT write `optimize-static.mjs` against the un-enriched schema.

After enrichment, the company objects will have these additional fields:
- `pipelineStage`: `"alumni"` or `"applicant"`
- `cohortLabel`: `"Cohort 25-1"` or `null`
- `synopsisSections`: `{ problem, solution, fieldValidation, ... }` or `null`
- `synopsisRaw`: freeform string or `null`
- `productType`: `"Hardware"`, `"Software"`, `"Both"`, or `null`
- `technologyArea`: string or `null`
- `competitionScores`: object (DO NOT render on public pages)
- `podRanking`: number (DO NOT render on public pages)

---

## What to Build

### 1. `scripts/optimize-static.mjs`

Single Node.js script (ESM). Reads enriched `companies.json`, writes/modifies HTML files. No dependencies beyond Node built-ins.

It does six things:

#### 1a. Compute aggregate stats
From `companies.json`, compute:
- Total company count
- Alumni count (`pipelineStage === 'alumni'`)
- Applicant count (`pipelineStage === 'applicant'`)
- Unique mission areas (from `missionArea` field)
- Unique warfare domains (from `warfareDomain` field — note these are comma-separated multi-value strings like `"Air, Sea, Land"`, so unique domain count = unique individual values across all companies)
- Recent additions: companies added in last 30 days (use `metadata.enrichedAt` or fallback to 0)

#### 1b. Inject stats into `builders.html`
Target elements by ID:
- `#stat-builders` → total company count (currently shows `0`)
- `#stat-mission-areas` → unique mission area count (currently shows `0`)
- `#stat-tech-areas` → unique warfare domain count (currently shows `0`)
- `#stat-cohorts` → cohort count, currently `1` (currently shows `0`)

Replace the `0` text content inside each `<span>` with the real number. Leave the element IDs intact — JS will overwrite them on hydration if data changes.

#### 1c. Inject static company cards into `builders.html`
Replace the skeleton `<div>` elements inside `#builders-grid` with static HTML cards.

**Structure the grid in two sections:**

1. **Alumni section** — Full company cards wrapped in `<a href="/companies/{slug}">`:
```html
<a href="/companies/{slug}" class="builder-card" data-company-id="{id}">
  <div class="builder-card__header">
    <h3 class="builder-card__name">{name}</h3>
    {if productName: <span class="builder-card__product">{productName}</span>}
  </div>
  <div class="builder-card__meta">
    {if missionArea: <span class="builder-card__tag">{missionArea}</span>}
    {if warfareDomain: <span class="builder-card__tag">{first warfare domain}</span>}
    {if productType: <span class="builder-card__badge">{productType}</span>}
  </div>
  <p class="builder-card__desc">{description, truncated to ~150 chars}</p>
</a>
```

2. **Applicant section** — Compact list with heading separator:
```html
<div class="builders-grid__section-divider">
  <h2 class="builders-grid__section-title">Applicants</h2>
</div>
```
Then compact cards for each applicant (same structure, but description can be shorter).

**Important:** Match existing CSS class names from `styles/builders.css`. Read that file to confirm class names before generating markup. The card class is likely `builder-card` — verify.

#### 1d. Inject grounding text into `builders.html`
Insert a paragraph ABOVE the grid (after the filter bar, before `#builders-grid`) that provides crawlable context:

> "The Defense Builders Directory lists {N} companies evaluated for The Combine program by Merge Combinator. {alumni_count} alumni completed in-person operator validation in Cohort 25-1 (Tulsa, OK). {applicant_count} applicants are under review. Companies span {mission_count} mission areas including {top 3-4 mission areas} across {domain_count} warfare domains."

This text is what crawlers and LLMs will use to understand the page. Make it factual, specific, and keyword-rich without being spammy.

#### 1e. Inject into `dashboard.html`
Target elements by ID:
- `#metric-builders` → replace skeleton `<span>` content with total count
- `#metric-missions` → replace skeleton with mission area count
- `#metric-domains` → replace skeleton with warfare domain count
- `#metric-recent` → replace skeleton with recent additions count (or `0`)
- `#dashboard-last-updated` → replace `--:--:--` with `"Built {YYYY-MM-DD}"`

Add grounding paragraph after the `<p class="dashboard__subtitle">` element:

> "Operational view of {N} defense technology companies evaluated for The Combine program. {alumni_count} alumni completed in-person operator validation in Cohort 25-1. Data sourced from Merge Combinator's builder intake pipeline."

Add JSON-LD `<script type="application/ld+json">` to `<head>`:
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Ecosystem Status — Merge Combinator",
  "url": "https://mergecombinator.com/dashboard",
  "description": "Operational view of {N} defense technology companies evaluated for The Combine program by Merge Combinator.",
  "numberOfItems": {N},
  "about": ["defense technology", "The Combine", "Cohort 25-1", "Merge Combinator"]
}
```

#### 1f. Generate entity pages at `companies/{slug}.html`
One HTML file per company. Create the `companies/` directory at project root.

**Slug generation:** kebab-case from company name, strip Inc/LLC/Corp/Corporation/Technologies/Technology and punctuation. Example: `"ZeroMark, Inc."` -> `"zeromark"`, `"300 Below Inc."` -> `"300-below"`.

**Entity page template:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script>/* FOUC prevention — copy from index.html line 6-7 */</script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{name} — {description truncated to 155 chars}">
  <link rel="canonical" href="https://mergecombinator.com/companies/{slug}">
  <meta property="og:title" content="{name} — Merge Combinator">
  <meta property="og:description" content="{description truncated to 155 chars}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://mergecombinator.com/companies/{slug}">
  <meta property="og:image" content="https://imagedelivery.net/9Lsa8lkCUz_we5KeaTm7fw/logo-arrows-2/public">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="{name} — Merge Combinator">
  <meta name="twitter:description" content="{description truncated to 155 chars}">
  <title>{name} — Merge Combinator</title>

  <link rel="icon" type="image/png" sizes="32x32" href="https://imagedelivery.net/9Lsa8lkCUz_we5KeaTm7fw/logo-arrows-2/public">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/styles/company.css">
  <link rel="stylesheet" href="/styles/light-theme.css">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "{name}",
    "url": "https://mergecombinator.com/companies/{slug}",
    "description": "{full description}",
    "knowsAbout": ["{missionArea}"],
    "memberOf": {
      "@type": "Organization",
      "name": "Merge Combinator — The Combine {cohortLabel or 'Applicant Pool'}"
    }
  }
  </script>
</head>
<body>
  <div id="mc-navbar"></div>
  <main class="company-page">
    <nav class="company-page__breadcrumb">
      <a href="/builders">Builders</a> / {name}
    </nav>
    <header class="company-page__header">
      <h1 class="company-page__name">{name}</h1>
      {if productName: <div class="company-page__product">{productName}</div>}
      <div class="company-page__meta">
        {badges for: pipelineStage, missionArea, warfareDomain, productType, trlLevel, fundingStage, teamSize}
      </div>
    </header>
    <section class="company-page__body">
      <div class="company-page__description">
        <h2>Overview</h2>
        <p>{description}</p>
      </div>
      {if synopsisSections: render each section as its own <div> with <h2> heading}
      {if synopsisRaw: render as single <div> with <h2>Synopsis</h2>}
    </section>
    <nav class="company-page__footer">
      <a href="/builders">&larr; Back to Builders Directory</a>
    </nav>
  </main>
  <!-- Footer and scripts — copy pattern from builders.html -->
  <footer class="footer">...</footer>
  <script type="module" src="/js/navbar.js"></script>
  <script type="module" src="/js/theme.js"></script>
</body>
</html>
```

**Rendering rules for synopsis sections:**
- Map keys to display names: `problem` -> "Problem", `solution` -> "Solution", `fieldValidation` -> "Field Validation", `strategicAdvantage` -> "Strategic Advantage", `goToMarketAccess` -> "Go-to-Market Access", `dualUsePotential` -> "Dual-Use Potential", `team` -> "Team", `competitiveLandscape` -> "Competitive Landscape", `primaryUser` -> "Primary User", `userCriticalProblem` -> "User-Critical Problem", `technologyMaturity` -> "Technology Maturity"
- Render in the order listed above, not alphabetical
- Wrap each section in `<div class="company-page__section"><h2>{display name}</h2><p>{content}</p></div>`
- Paragraphs within content: split on double newlines, wrap each in `<p>`
- HTML-escape all company-provided text (prevent XSS from description/synopsis fields)

**DO NOT render on entity pages:** `competitionScores`, `podRanking`, `badgeJudges`, `combineStandout`, `upvoteCount`, `legacyAirtableId`, `cfImageId`, `logoUrl`.

#### 1g. Generate `faq.html`
New file at project root. Use the existing site layout pattern (navbar, footer, C2UX styling). Include `FAQPage` JSON-LD schema.

Pull actual values from `companies.json` for the FAQ answers:
- "What are Mission Areas?" — list all unique mission areas found in the data
- "What are Warfare Domains?" — list all unique warfare domains
- The company and alumni/applicant counts should be real numbers from the data

See the design doc for the full list of 9 questions.

### 2. `styles/company.css`

New stylesheet for entity pages. Keep it minimal using existing C2UX tokens:
- `--blue` (#3b82f6), `--offwhite`, `--gray-light`, `--gray-medium`
- Dark-native (dark bg default), Inter font, 2px border-radius
- Responsive — works on mobile
- Read `styles/builders.css` and the main `styles.css` for patterns to follow

### 3. Vite Config Changes (`vite.config.js`)

Add dynamic globbing for generated entity pages:

```js
import { readdirSync } from 'fs'

// In the build.rollupOptions.input object, add:

// Entity pages (generated by optimize-static.mjs)
...Object.fromEntries(
  readdirSync(resolve(__dirname, 'companies'))
    .filter(f => f.endsWith('.html'))
    .map(f => [`companies-${f.replace('.html', '')}`, resolve(__dirname, 'companies', f)])
),

// FAQ page
'faq': resolve(__dirname, 'faq.html'),
```

Wrap the `readdirSync` in a try/catch that returns `[]` if `companies/` doesn't exist yet (first build before optimize runs).

### 4. `_redirects` Updates

Add clean URL redirects for new pages:

```
/faq.html /faq 301
/companies/*.html /companies/* 301
```

### 5. `package.json` Build Pipeline

Update the `build` script:
```json
"enrich": "node scripts/enrich-companies.mjs",
"optimize": "node scripts/optimize-static.mjs",
"build": "npm run seed && npm run enrich && npm run optimize && vite build"
```

---

## Changes FROM the Design Doc (SEO Audit Amendments)

The SEO audit found issues the original design didn't account for. Incorporate these:

### A. Generate `sitemap.xml` in the optimize step

The design doc says "No sitemap.xml generation — separate concern, later." **Override this.** With 140+ new entity pages, Google won't find them without a sitemap. Add sitemap generation as step 7 of `optimize-static.mjs`.

Write to `public/sitemap.xml` (overwrites the existing static one). Include:
- All existing pages currently in the sitemap
- All generated `/companies/{slug}` pages
- `/faq`
- Pages currently MISSING from the sitemap: `/dashboard`, `/programs`, `/combine/cohort25-1`, `/knowledge/acquisition`, `/knowledge/compliance`, `/knowledge/go-to-market`, `/learn`, `/contribute`, `/wingman`, `/briefs`
- `<lastmod>` on every URL — use the build date for generated pages, file mtime for existing pages
- Do NOT include: `/status`, `/guild`, `/access-quick` (utility/auth pages)

### B. Update `llms.txt` in the optimize step

Regenerate `public/llms.txt` to include:
- A line about the entity pages: `- Company profiles: https://mergecombinator.com/companies/{slug} (140+ pages)`
- The FAQ page
- Updated date
- Keep all existing content guidance

### C. Builders page H1

The current H1 is "Builder Records" — internal jargon that means nothing to search engines. Change it to:

```html
<h1 class="builders-console__title">Defense Builders Directory</h1>
```

The subtitle/meta text can stay operational. Only the H1 matters for SEO.

### D. Add `robots` meta to entity pages

Every generated entity page should include:
```html
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
```

This allows rich snippets and full previews in Google results.

### E. Builders page: add JSON-LD

The builders page currently has NO structured data. Add a `CollectionPage` schema:
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Defense Builders Directory — Merge Combinator",
  "url": "https://mergecombinator.com/builders",
  "description": "Directory of {N} defense technology companies evaluated for The Combine program by Merge Combinator.",
  "numberOfItems": {N}
}
```

---

## Things NOT To Do

1. **Do NOT touch existing JS files** (`js/builders.js`, `js/dashboard.js`, etc.) — they handle hydration and interactivity. Your static content is the fallback.
2. **Do NOT render auth-gated data** — no competition scores, pod rankings, badges, contact info, internal notes, video links on public pages.
3. **Do NOT add SSR frameworks** (Astro, Next.js) — plain Node.js file generation.
4. **Do NOT modify `styles.css`** — only create `styles/company.css` for entity pages. Any grid/card styles for builders should use existing classes.
5. **Do NOT break the existing `npm run dev` flow** — the optimize step only matters for `npm run build`.
6. **Do NOT add node_modules dependencies** — use only Node built-ins (fs, path, url).

---

## Verification Checklist

After implementation, run these checks:

```bash
# 1. Full pipeline runs without errors
npm run build

# 2. Entity pages exist
ls companies/*.html | wc -l  # Should be ~140

# 3. Builders page has real content (not skeleton)
grep -c "skeleton-card" dist/builders.html  # Should be 0
grep -c "builder-card" dist/builders.html   # Should be >80
grep -c "data-company-id" dist/builders.html  # Should be >80

# 4. Dashboard has real numbers (not skeleton placeholders)
grep "skeleton skeleton-metric" dist/dashboard.html  # Should return nothing
grep "metric__value" dist/dashboard.html  # Should show real numbers

# 5. JSON-LD present on key pages
grep -l "application/ld+json" dist/builders.html dist/dashboard.html dist/faq.html dist/companies/*.html | wc -l

# 6. Sitemap includes entity pages
grep -c "companies/" dist/sitemap.xml  # Should be ~140

# 7. FAQ page exists and has schema
grep "FAQPage" dist/faq.html

# 8. Meta descriptions on entity pages
grep -c 'name="description"' dist/companies/*.html  # Should match entity count

# 9. No auth-gated data leaked
grep -r "competitionScores\|podRanking\|badgeJudges" dist/companies/ | wc -l  # Should be 0

# 10. Dev server still works
npm run dev  # Should start without errors even if companies/ doesn't exist yet
```

---

## File Summary

| File | Action |
|------|--------|
| `scripts/optimize-static.mjs` | **Create** — main build script |
| `styles/company.css` | **Create** — entity page styles |
| `faq.html` | **Create** — generated by optimize script |
| `companies/*.html` | **Create** — ~140 entity pages, generated |
| `builders.html` | **Modify** — inject stats, cards, grounding text, JSON-LD, fix H1 |
| `dashboard.html` | **Modify** — inject stats, grounding text, JSON-LD |
| `vite.config.js` | **Modify** — add entity page + FAQ inputs |
| `_redirects` | **Modify** — add FAQ + company redirects |
| `public/_redirects` | **Modify** — same |
| `package.json` | **Modify** — add enrich, optimize scripts, update build chain |
| `public/sitemap.xml` | **Overwrite** — generated with all pages + lastmod |
| `public/llms.txt` | **Overwrite** — updated with entity pages + date |

---

## Execution Order

1. Read the design doc
2. Read `scripts/enrich-companies.mjs` to understand enrichment output
3. Run `node scripts/enrich-companies.mjs` and verify output
4. Read `builders.html`, `dashboard.html`, `styles/builders.css`, `styles.css` — understand current markup and CSS classes
5. Write `scripts/optimize-static.mjs`
6. Write `styles/company.css`
7. Update `vite.config.js`
8. Update `_redirects` and `public/_redirects`
9. Update `package.json`
10. Run `npm run build` — fix any errors
11. Spot-check: open a few `dist/companies/*.html` files, `dist/builders.html`, `dist/dashboard.html`, `dist/faq.html`
12. Run the verification checklist above
