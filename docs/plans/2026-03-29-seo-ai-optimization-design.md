# SEO & AI Visibility Optimization — Design

## Context

ChatGPT scored sigmablox.com/dashboard as "weak." The mc_site dashboard and builders pages use JS hydration with skeleton placeholders — crawlers and LLM retrieval systems see empty shells instead of real content. Company data updates weeks/months apart, so the dynamic rendering cost is unjustified. Both Google search ranking and AI/LLM visibility (Perplexity, ChatGPT, etc.) need improvement. MC is the primary brand going forward; SigmaBlox is being sunset but both sites still generate leads.

## Data State

After scrub and enrichment (2026-03-29):
- 140 companies total: 83 alumni (Cohort 25-1, attended Tulsa), 57 applicants
- Alumni have parsed synopsis sections (problem, solution, field validation, TRL, strategic advantage, go-to-market, dual-use, team, competitive landscape, primary user, user-critical problem)
- Pipeline stages: Applicant → Accepted → Alumni
- Source: `companies.json` seeded from `api.sigmablox.com`, enriched from Airtable CSVs

## Build Pipeline

Current: `npm run seed && vite build`

New: `npm run seed → npm run enrich → npm run optimize → vite build`

The `prebuild` npm hook chains seed, enrich, and optimize so `npm run build` runs the full pipeline without CI/CD changes.

The `optimize` script (`scripts/optimize-static.mjs`) reads enriched `companies.json` and:
1. Computes aggregate stats (total companies, alumni/applicant counts, unique mission areas, warfare domains, recent additions)
2. Generates static company cards HTML for builders page
3. Generates entity pages at `companies/{slug}.html`
4. Injects stats into `dashboard.html` and `builders.html`, replacing skeleton placeholders
5. Injects static card grid into `builders.html`
6. Generates `/faq.html`

## Entity Pages (`/companies/{slug}`)

One HTML file per company, generated at build time. URL format: `/companies/zeromark` (kebab-case from company name, strip Inc/LLC/Corp/punctuation).

### Public fields only (no auth-gated data):
- Company name, product name, product type badge (Hardware/Software/Both)
- Mission area, warfare domain, TRL level, funding stage, team size
- Description (Summary from Application)
- Alumni with parsed synopsis: structured blocks for Problem, Solution, Field Validation, Strategic Advantage, Go-to-Market, Dual-Use, Team, Competitive Landscape, Primary User
- Alumni with freeform synopsis: single rich text block
- Applicants: description only
- Back link to `/builders`

### NOT on entity pages (Guild-only):
Competition scores, pod rankings, badges, contact info, internal notes, video links.

### JSON-LD per page:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ZeroMark, Inc.",
  "url": "https://mergecombinator.com/companies/zeromark",
  "description": "...",
  "knowsAbout": ["Joint Fires (Offense)"],
  "memberOf": {
    "@type": "Organization",
    "name": "Merge Combinator — The Combine Cohort 25-1"
  }
}
```

Styling uses existing C2UX design tokens. New `styles/company.css`.

## Builders Page Static Injection

### Build-time content:
- Stats bar: real numbers ("83 Alumni / 57 Applicants / 12 Mission Areas / 6 Warfare Domains")
- Alumni section: 83 full company cards as static HTML, each wrapped in `<a href="/companies/{slug}">`. Card markup uses existing CSS classes.
- Applicant section: visually separated heading ("Applicants"), compact linked list — name, mission area, one-line description
- Inline grounding: paragraph explaining Alumni vs Applicant, mission areas, warfare domains
- Static cards include `data-company-id` attributes for JS hydration targeting

### Progressive enhancement (JS, unchanged):
- Fetches fresh `companies.json` or live API on load
- Silently replaces static cards if data changed
- Enables filter sidebar, search, sort, modal detail views, upvotes
- If JS fails, page is fully functional — just not interactive

## Dashboard Page Static Injection

### Build-time content:
- Inventory panel: real numbers for Builder records, Mission areas, Warfare domains, Recent additions
- Timestamp: "Last build: {date}" instead of `--:--:--`
- Mission Coverage panel: top missions by record count as static bars
- Recent Builder Records: last 5-10 companies as static list items
- Inline grounding: "Operational view of 140 companies evaluated for The Combine program. 83 alumni completed in-person operator validation in Cohort 25-1."

### JS-only (unchanged):
- Auth state indicator, admin panel, access funnel
- Auto-refresh cycle (60s polling)
- Live timestamp updates

### JSON-LD added:
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Ecosystem Status — Merge Combinator",
  "description": "Operational view of 140 defense technology companies...",
  "numberOfItems": 140,
  "about": ["defense technology", "The Combine", "Cohort 25-1"]
}
```

## FAQ Page and Inline Grounding

### New `/faq.html`:
- Standard mc_site layout, C2UX styling
- `FAQPage` JSON-LD schema
- Content:
  - What is Merge Combinator?
  - What is The Combine?
  - What is the difference between Alumni and Applicants?
  - What are Mission Areas? (with actual values)
  - What are Warfare Domains?
  - What does TRL (Technology Readiness Level) mean?
  - What does "Ready Now" / "Fielded" mean?
  - How is company data collected and updated?
  - How do I apply to The Combine?

### Inline grounding on existing pages:
- `/builders` — Alumni vs Applicant, mission areas, warfare domains (2-3 sentences each, above grid)
- `/dashboard` — what the dashboard shows and update frequency
- `/programs/the-combine` — what the program is, what "in-person operator validation" means
- `/portfolio` — what cohorts are, link to FAQ

## Vite Configuration Changes

- Dynamically glob `companies/*.html` into the `input` map
- Add `faq` entry
- Add clean URL redirects to `_redirects`
- No changes to deployment, Cloudflare Pages, or existing Vite plugins

## Out of Scope (YAGNI)

- No SSR/SSG framework (Next.js, Astro) — plain HTML generation is sufficient
- No sitemap.xml generation — separate concern, later
- No SigmaBlox changes — different repo, separate effort
- No new CSS framework — existing C2UX tokens
- No database changes — enrichment at `companies.json` layer only
- No auth-gated content on mc_site
- No search on FAQ page
- No automated Airtable sync — CSV enrichment is one-time migration
