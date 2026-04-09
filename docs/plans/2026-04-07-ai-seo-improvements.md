# AI SEO Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scrub private data from public JSON, expose machine-readable data to AI systems, static-inject knowledge page content, deduplicate sitemap, and add missing schema markup.

**Architecture:** All changes are in the build-time optimization pipeline (`scripts/optimize-static.mjs`) and static assets (`public/`). No runtime/API changes. The optimize script already generates sitemap.xml, llms.txt, and entity pages at build time — we extend it to also handle knowledge pages, blog schema, and a sanitized companies JSON export.

**Tech Stack:** Node.js (built-in modules only), static HTML, JSON-LD schema markup

---

### Task 1: Scrub companies.json — Generate a Public-Safe Export

The existing `public/data/companies.json` is the source-of-truth used by the build pipeline AND served publicly. Rather than stripping fields from the source file (which would break the build), generate a sanitized copy at build time.

**Files:**
- Modify: `scripts/optimize-static.mjs` (after line 809, before "Done" log)

**Step 1: Add the sanitized export function to optimize-static.mjs**

Add this function after the `generateLlmsTxt` function (after line 743):

```javascript
// ── 7. Public data export ───────────────────────────────────────────

function generatePublicCompaniesJson(companies) {
  const publicCompanies = companies
    .filter(c => c.name && (c.description || '').trim().length >= MIN_DESCRIPTION_LENGTH)
    .map(c => {
      // Public-safe fields only — no IDs, scores, badges, contact, or financials
      const pub = {
        name: c.name,
        productName: c.productName || null,
        website: c.website || null,
        missionArea: c.missionArea || null,
        warfareDomain: c.warfareDomain || null,
        trlLevel: c.trlLevel || null,
        technicalMaturity: c.technicalMaturity || null,
        fundingStage: c.fundingStage || null,
        teamSize: c.teamSize || null,
        productType: c.productType || null,
        technologyArea: c.technologyArea || null,
        pipelineStage: c.pipelineStage || null,
        cohortLabel: c.cohortLabel || null,
        description: c.description || null,
      };
      return pub;
    });

  return JSON.stringify({
    _meta: {
      description: "Public directory of defense technology companies evaluated by Merge Combinator. Machine-readable export — see https://mergecombinator.com/builders for the full directory.",
      exported: BUILD_DATE,
      count: publicCompanies.length,
      fields: "Public classification data only. Contact information, financials, scores, badges, and internal IDs are excluded.",
      license: "This data is provided for informational purposes. See https://mergecombinator.com/terms for usage terms."
    },
    companies: publicCompanies
  }, null, 2);
}
```

**Step 2: Add the export call to the execution section**

After the llms.txt block (after line 809), add:

```javascript
// 7. Generate public companies export
console.log('[optimize] Generating public companies export...');
writeFileSync(join(ROOT, 'public', 'data', 'companies-public.json'), generatePublicCompaniesJson(companies));
console.log(`[optimize] companies-public.json: ${companies.filter(c => c.name && (c.description || '').trim().length >= MIN_DESCRIPTION_LENGTH).length} companies exported`);
```

**Step 3: Run the optimize script to verify**

Run: `node scripts/optimize-static.mjs`
Expected: New file at `public/data/companies-public.json` with no `id`, `cohortId`, `tulsaAttended`, `location`, `cfImageId`, or `logoUrl` fields.

**Step 4: Verify the output**

Run: `node -e "const d=JSON.parse(require('fs').readFileSync('public/data/companies-public.json','utf8')); console.log('Count:', d.companies.length); console.log('Sample keys:', Object.keys(d.companies[0])); console.log('Has id?', 'id' in d.companies[0]); console.log('Has cohortId?', 'cohortId' in d.companies[0])"`
Expected: Count matches non-thin companies, keys list shows only safe fields, no `id` or `cohortId`.

**Step 5: Commit**

```bash
git add scripts/optimize-static.mjs public/data/companies-public.json
git commit -m "feat: generate sanitized companies-public.json at build time

Strips internal IDs, scores, badges, contact info, and financials
from the public export. Source companies.json unchanged for build pipeline."
```

---

### Task 2: Update llms.txt to Reference Data Files

The `generateLlmsTxt` function in `optimize-static.mjs` generates `llms.txt` at build time. Add machine-readable data links and an opportunities section.

**Files:**
- Modify: `scripts/optimize-static.mjs:702-742` (the `generateLlmsTxt` function)

**Step 1: Update the generateLlmsTxt function**

Replace the entire function body (lines 702-742) with:

```javascript
function generateLlmsTxt(slugs) {
  return `# Merge Combinator

Official website for Merge Combinator.
Primary domain: https://mergecombinator.com

## Canonical Pages
- Home: https://mergecombinator.com/
- About: https://mergecombinator.com/about
- Defense Builders: https://mergecombinator.com/builders
- Dashboard: https://mergecombinator.com/dashboard
- Access: https://mergecombinator.com/access
- The Combine: https://mergecombinator.com/programs/the-combine
- FAQ: https://mergecombinator.com/faq
- Knowledge: https://mergecombinator.com/knowledge
- Opportunities: https://mergecombinator.com/opportunities
- SBIR Opportunities: https://mergecombinator.com/opportunities/sbir
- STTR Opportunities: https://mergecombinator.com/opportunities/sttr
- SBIR / STTR Guidance: https://mergecombinator.com/knowledge/sbir
- AI Overview: https://mergecombinator.com/ai/overview
- Company profiles: https://mergecombinator.com/companies/{slug} (${slugs.length} pages)

## Machine-Readable Data
- Company directory (public): https://mergecombinator.com/data/companies-public.json (${stats.total} companies, classification data only)
- Knowledge resources: https://mergecombinator.com/data/knowledge.json (curated defense acquisition, compliance, SBIR/STTR, and go-to-market resources)
- Defense events: https://mergecombinator.com/data/outlook.json (upcoming defense industry events)

## Content Guidance For AI Systems
- Prefer canonical page URLs without \`.html\` suffix where available.
- Use https://mergecombinator.com/about for organization and leadership context.
- Use https://mergecombinator.com/knowledge/sbir for SBIR and STTR guidance.
- Use https://mergecombinator.com/faq for definitions of mission areas, warfare domains, TRL, and program details.
- The Defense Builders Directory at /builders lists ${stats.total} companies (${stats.alumni} alumni, ${stats.applicants} applicants).
- Individual company pages at /companies/{slug} contain catalog-level descriptions and classification data only.
- The Opportunities section aggregates live SBIR, STTR, DARPA, DIU, SAM.gov, and Ratio Exchange solicitations for defense tech founders.
- Partner references may be category-based and intentionally broad.
- Portfolio and partnerships are announced only when approved for public release.
- For contact and engagement, use https://mergecombinator.com/access.
- Legacy hosts and stale paths may redirect to canonical pages on mergecombinator.com.

## Crawl Sources
- Sitemap: https://mergecombinator.com/sitemap.xml
- Robots: https://mergecombinator.com/robots.txt

## Last Updated
${BUILD_DATE}
`;
}
```

**Step 2: Run the optimize script**

Run: `node scripts/optimize-static.mjs`
Expected: `public/llms.txt` now contains "Machine-Readable Data" section with `companies-public.json` link and opportunities context.

**Step 3: Verify**

Run: `grep -c 'companies-public.json' public/llms.txt && grep -c 'Ratio Exchange' public/llms.txt`
Expected: Both return `1`.

**Step 4: Commit**

```bash
git add scripts/optimize-static.mjs public/llms.txt
git commit -m "feat: add machine-readable data links and opportunities context to llms.txt"
```

---

### Task 3: Update llms-full.txt

This file is hand-maintained (not generated by the optimize script). Update it to reflect current company count, add Opportunities section, add data file links, and update the date.

**Files:**
- Modify: `public/llms-full.txt`

**Step 1: Update company counts and add sections**

Make these edits to `public/llms-full.txt`:

1. Line 33: Change "140+" to match current count (use number from `companies.json`)
2. After the "### Knowledge Base" section (line 42), add:

```
### Opportunities
Aggregated defense and national security opportunities from SBIR, STTR, DARPA, DIU, SAM.gov, GoColosseum, and Ratio Exchange. Includes open solicitations, challenge problems, and CSOs from defense innovation hubs (DEFENSEWERX, SOFWERX, ERDCWERX, Tradewind, Doolittle Institute). Updated hourly. Available at https://mergecombinator.com/opportunities
```

3. Before the "## Canonical Pages" section (before line 72), add:

```
## Machine-Readable Data

Structured data files are available for programmatic access:
- Company directory (public): https://mergecombinator.com/data/companies-public.json
- Knowledge resources: https://mergecombinator.com/data/knowledge.json
- Defense events calendar: https://mergecombinator.com/data/outlook.json

Company data includes name, product, mission area, warfare domain, TRL level, funding stage, team size, and public description. Contact information, financials, scores, and badges are excluded.
```

4. Update line 122: Change `2026-03-29` to current date.

**Step 2: Verify the update**

Run: `grep 'Opportunities' public/llms-full.txt && grep 'companies-public.json' public/llms-full.txt && grep 'Last Updated' public/llms-full.txt`
Expected: All three return matches with correct content.

**Step 3: Commit**

```bash
git add public/llms-full.txt
git commit -m "docs: update llms-full.txt with opportunities, data links, current counts"
```

---

### Task 4: Static-Inject Knowledge Page Categories

The knowledge page (`knowledge.html`) renders category cards via JavaScript from `knowledge.json`. Inject static HTML at build time so crawlers see real content.

**Files:**
- Modify: `knowledge.html:80-82` (replace `<!-- Populated by JavaScript -->` placeholder)
- Modify: `scripts/optimize-static.mjs` (add knowledge injection function and call)

**Step 1: Add knowledge injection function to optimize-static.mjs**

Add this function after `generatePublicCompaniesJson` (before the Execute section):

```javascript
// ── 8. Knowledge page injection ─────────────────────────────────────

function injectKnowledge(html) {
  const knowledgeData = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'knowledge.json'), 'utf-8'));

  // Build static category cards
  let cardsHtml = '';
  for (const cat of knowledgeData.categories) {
    const resources = knowledgeData.resources.filter(r => r.category === cat.id);
    const publicResources = resources.filter(r => r.access === 'public');

    cardsHtml += `
        <a href="/knowledge/${escapeHtml(cat.id)}" class="category-card" style="--card-accent: ${escapeHtml(cat.color)}">
          <div class="category-card__icon"></div>
          <h2 class="category-card__title">${escapeHtml(cat.title)}</h2>
          <p class="category-card__description">${escapeHtml(cat.description)}</p>
          <div class="category-card__meta">
            <span class="category-card__count">${resources.length} resources</span>
            <span style="color: var(--gray-medium);">&bull;</span>
            <span>${publicResources.length} public</span>
          </div>
        </a>`;
  }

  // Build resource summary for crawlers (hidden from visual users, visible to crawlers)
  let resourceSummary = '\n      <!-- Static resource listing for crawlers -->\n';
  resourceSummary += '      <div class="sr-only">\n';
  for (const cat of knowledgeData.categories) {
    const publicResources = knowledgeData.resources.filter(r => r.category === cat.id && r.access === 'public');
    if (publicResources.length === 0) continue;
    resourceSummary += `        <h3>${escapeHtml(cat.title)} Resources</h3>\n        <ul>\n`;
    for (const r of publicResources) {
      resourceSummary += `          <li><a href="${escapeHtml(r.url)}">${escapeHtml(r.title)}</a> — ${escapeHtml(r.description)}</li>\n`;
    }
    resourceSummary += '        </ul>\n';
  }
  resourceSummary += '      </div>';

  // Replace placeholder
  html = html.replace(
    /(<div class="knowledge-categories__grid" id="categories-grid">)\s*<!--\s*Populated by JavaScript\s*-->/,
    `$1${cardsHtml}\n${resourceSummary}`
  );

  return html;
}
```

**Step 2: Add the injection call to the Execute section**

After the builders injection block (after line 752), add:

```javascript
// 1b. Process knowledge.html
console.log('[optimize] Injecting knowledge.html...');
let knowledgeHtml = readFileSync(join(ROOT, 'knowledge.html'), 'utf-8');
knowledgeHtml = injectKnowledge(knowledgeHtml);
writeFileSync(join(ROOT, 'knowledge.html'), knowledgeHtml);
console.log('[optimize] knowledge.html: category cards + resource summary injected');
```

**Step 3: Ensure sr-only CSS exists**

Check if `styles.css` or `styles/knowledge.css` already has an `.sr-only` class. If not, add to `styles/knowledge.css`:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

**Step 4: Run the optimize script**

Run: `node scripts/optimize-static.mjs`
Expected: knowledge.html now contains static category cards and resource summary inside the grid div.

**Step 5: Verify the injection**

Run: `grep 'category-card__title' knowledge.html | head -5`
Expected: Shows "Go-to-Market", "Acquisition 101", "SBIR / STTR", "Compliance" in static HTML.

**Step 6: Commit**

```bash
git add scripts/optimize-static.mjs knowledge.html styles/knowledge.css
git commit -m "feat: static-inject knowledge categories and resource summary for crawlers"
```

---

### Task 5: Add Blog Listing Schema

The `blog.html` page is missing JSON-LD schema markup. Add `Blog` + `BlogPosting` schema.

**Files:**
- Modify: `blog.html` (add JSON-LD in `<head>`, before `</head>`)

**Step 1: Add JSON-LD schema to blog.html**

Insert before the `</head>` tag (line 36):

```html
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Insights — Merge Combinator",
    "url": "https://mergecombinator.com/blog",
    "description": "Perspectives on defense innovation, operator-driven development, and the future of national security technology.",
    "publisher": {
      "@type": "Organization",
      "name": "Merge Combinator",
      "url": "https://mergecombinator.com"
    },
    "blogPost": [
      {
        "@type": "BlogPosting",
        "headline": "Inside JIATF 401: The Pentagon's New Counter-Drone Marketplace",
        "url": "https://mergecombinator.com/blog/counter-drone-jiatf-401",
        "datePublished": "2025-12-22",
        "description": "The Pentagon is building an app store for counter-drone solutions. JIATF 401 replaces the Joint Counter-small UAS Office with a streamlined approach.",
        "author": { "@type": "Organization", "name": "Merge Combinator" }
      },
      {
        "@type": "BlogPosting",
        "headline": "9 Months Under Fire: Combat Lessons from the USS Eisenhower",
        "url": "https://mergecombinator.com/blog/uss-eisenhower-lessons",
        "datePublished": "2025-12-22",
        "description": "770+ weapons expended, multiple combat firsts, and critical insights for defense tech companies from the most intense carrier deployment since WWII.",
        "author": { "@type": "Organization", "name": "Merge Combinator" }
      },
      {
        "@type": "BlogPosting",
        "headline": "FY26 NDAA Decoded: What the SPEED Act Means for Your Defense Startup",
        "url": "https://mergecombinator.com/blog/ndaa-speed-act",
        "datePublished": "2025-12-22",
        "description": "The SPEED Act promises faster procurement. Here is what is actually changing, implementation challenges ahead, and what defense tech companies should do now.",
        "author": { "@type": "Organization", "name": "Merge Combinator" }
      }
    ]
  }
  </script>
```

**Step 2: Verify**

Run: `grep 'BlogPosting' blog.html`
Expected: Returns matches for the three blog posts.

**Step 3: Commit**

```bash
git add blog.html
git commit -m "feat: add Blog + BlogPosting JSON-LD schema to blog listing page"
```

---

### Task 6: Deduplicate Sitemap Slugs

The committed `public/sitemap.xml` has 55 duplicate `-company` slug entries from a stale build. The optimize script already deduplicates slugs when generating entity pages, and regenerates `sitemap.xml` at build time. The fix is simply to rebuild.

However, there are also entity pages on disk from old builds that have `-company` suffixed slugs. These orphan HTML files should be cleaned up to avoid Cloudflare Pages serving them.

**Files:**
- Clean: `companies/*-company.html` (delete orphan files)
- Verify: `public/sitemap.xml` is clean after rebuild

**Step 1: Check for orphan entity pages**

Run: `ls companies/*-company.html 2>/dev/null | wc -l`
Expected: Shows count of orphan files.

**Step 2: Delete orphan entity pages**

Run: `rm -f companies/*-company.html`

Also delete any other orphan pages that don't correspond to current company slugs. Check a few specific ones from the sitemap that look like person names or duplicate patterns:

Run: `rm -f companies/aaron-margolis.html companies/kanayo-ogwu.html companies/richard-bishop.html companies/sean-chao.html companies/stacey-jones.html companies/merge-combinator.html companies/cra.html`

(These appear to be people or the org itself, not companies.)

**Step 3: Rebuild to regenerate sitemap**

Run: `node scripts/optimize-static.mjs`
Expected: Sitemap regenerated with only valid, deduplicated company slugs. No `-company` suffixed entries.

**Step 4: Verify the sitemap is clean**

Run: `grep -c 'company' public/sitemap.xml` — should return 0 or only match "Company" in non-URL contexts.
Run: `grep -c '<url>' public/sitemap.xml` — should show a clean count.

**Step 5: Commit**

```bash
git add -A companies/ public/sitemap.xml
git commit -m "fix: remove orphan entity pages and regenerate clean sitemap"
```

---

### Task 7: Final Build and Verification

Run the full build pipeline to ensure all changes work together.

**Step 1: Run full build**

Run: `npm run build`
Expected: No errors. All optimize steps complete successfully.

**Step 2: Verify all outputs**

Run these checks:

```bash
# Sanitized export exists and is clean
node -e "const d=JSON.parse(require('fs').readFileSync('public/data/companies-public.json','utf8')); console.log('Public export:', d.companies.length, 'companies'); console.log('Has id?', d.companies.some(c => 'id' in c)); console.log('Has meta?', '_meta' in d)"

# llms.txt has data links
grep 'companies-public.json' public/llms.txt

# llms-full.txt has opportunities and data links
grep 'Ratio Exchange' public/llms-full.txt

# Knowledge page has static content
grep 'category-card__title' knowledge.html | wc -l

# Blog has schema
grep 'BlogPosting' blog.html | wc -l

# Sitemap has no -company duplicates
grep '\-company' public/sitemap.xml | wc -l
```

Expected:
- Public export: ~100+ companies, `Has id? false`, `Has meta? true`
- llms.txt: 1 match
- llms-full.txt: 1 match
- knowledge.html: 4 matches (one per category)
- blog.html: 3+ matches
- sitemap.xml: 0 matches for `-company`

**Step 3: Commit all remaining changes**

```bash
git add -A
git commit -m "chore: rebuild all static assets after AI SEO improvements"
```
