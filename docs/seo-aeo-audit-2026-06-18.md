# Knowledge Section — AI Search (AEO) + SEO Audit

**Date:** 2026-06-18
**Scope:** `knowledge.html` (index) + all `knowledge/*` pages
**Method:** Static-content inspection of every page, grounded in actual file content. Findings marked helps / hurts / neutral for SEO + AI-search citability.

---

## Bottom line

**Net direction: helping.** The foundation is strong and the work shipped tonight moves you forward. But the audit found the knowledge section splits into two tiers, and the weaker tier has real, fixable problems.

**Strong tier (AEO-ready):** `defense-venture-studio` and `first-principles-engineering` — static prose, schema (Article + FAQPage/HowTo), comparison tables, visible dates. These are the model to replicate.

**Weak tier (needs work):** the four category pages — `acquisition`, `compliance`, `go-to-market`, `sbir` — render their actual content **client-side via JS** (`loadResources()` → `knowledge.json`). An AI crawler or no-JS fetch sees only a hero line and empty section headers. **They extract almost nothing.**

Baseline that's already right: `robots.txt` allows every major AI crawler (GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, anthropic-ai, Google-Extended); titles/meta/canonical/OG tags are clean across all pages.

---

## Shipped tonight (PRs awaiting your review)

| PR | What |
|----|------|
| #39 | Surfaced First Principles page (index card, redirect, sitemap) |
| #40 | Surfaced Defense Venture Studio page (index card) |
| #41 | **AEO schema:** HowTo on first-principles; Article on acquisition/compliance/go-to-market; fixed card label |
| #42 | **Bug fix:** SBIR page hero showed "Go-to-Market" in static HTML |

---

## Remaining findings (prioritized — NOT yet done)

### HIGH

1. **Category pages are JS-only shells (extractability).**
   `acquisition`, `compliance`, `go-to-market`, `sbir` inject all resource content client-side. AI engines and non-rendering crawlers get nothing substantive.
   **Fix:** Build-inject a static 40–60 word category definition + the public resource list into the HTML (mirror the `sr-only` crawler block already on the index). Treat JS as progressive enhancement. This is the single biggest AEO lever remaining.

2. **Broken / stale internal linking (topic cluster).**
   Every category page's "Related" block is identical and stale — `acquisition` links to *itself*; none cross-link `compliance`, `go-to-market`, or the two new guides. The guides are reachable only from the index.
   **Fix:** Make Related blocks page-specific; remove self-links; cross-link siblings + the two guides. Builds the entity cluster AI engines use to associate topics.

### MEDIUM

3. **No FAQ sections on category pages.** `defense-venture-studio` has an FAQ with FAQPage schema and is the most AEO-ready page as a result. Replicate: 3–4 question H3s + concise standalone answers + FAQPage schema on each category page.

4. **SBIR has the weakest schema** (`WebPage`, no date/author). Upgrade to `Article` to match siblings and emit a freshness signal.

### LOW

5. **No human-visible "last updated" on category pages** (schema has `datePublished` but page shows nothing). Add a visible date + `dateModified`.
6. **defense-venture-studio** minor meta gaps: missing favicon sizes / `twitter:image`; `og:image` uses a root-relative path — use an absolute URL.
7. **Knowledge index** lacks a one-paragraph definition lead + omits the two long-form guides from its `sr-only` crawler block.

---

## Recommended sequencing (next session)

1. Category-page static content injection (#1) — biggest lever, touches the build script (`optimize-static.mjs`).
2. Internal-linking repair (#2) — high impact, low risk.
3. FAQ + FAQPage schema on category pages (#3) — replicate the DVS pattern.
4. SBIR schema upgrade + visible dates (#4, #5) — quick wins.

All of the above are additive and reversible. None require external publishing.

---

## How to measure (your recurring question: "is this helping?")

No tooling wired up yet. Cheapest signal: monthly manual check — run your top ~20 queries (e.g., "what is a defense venture studio", "SBIR phase I proposal", "DoD acquisition for startups") through ChatGPT / Perplexity / Google, log whether mergecombinator.com is cited and who else is. Track month-over-month. If you want, a future task can add GA4 referral tracking for AI-source traffic.
