# Presenting mc-content within the mc_site brand — exploration + options

**Date:** 2026-06-23 · Read-only exploration of `../mc-content`. No code written.

## What mc-content actually is

A **local, AI-driven content pipeline** that generates **social posts** (LinkedIn / X / Signal-app) from RSS feeds, the company dataset, and testimonials. Key facts:

- **Hard firewall:** mc-content's `CLAUDE.md` forbids it from writing to, building for, or deploying mc_site. Data flows **mc_site → mc-content** (sources sync in). So any presentation integration must live **here in mc_site**, pulling from mc-content — never the reverse.
- **Output format:** `content/drafts/draft-NNN.md` — YAML frontmatter (`id`, `seed`, `source`, `category`, `channels`, `status`) + channel-sectioned markdown (`## LinkedIn`, `## X`, `## Signal`).
- **Channels are social only:** linkedin (30), x (26), signal (25). "Signal" = the Signal **messaging app** community channel, **not** mc_site's `/signals` web section. No draft targets a web/blog/article channel.
- **Status:** ~33 in `review`, 0 `approved`/`published`. The `approved/` dir is empty. The approval gate isn't producing web-ready artifacts today.
- **Categories:** analysis (19), reaction (14) — matches the shared voice taxonomy.

## What mc_site's web content system is

- **`/signals`** is the long-form web surface. Source of truth: **`public/data/signals.json`** (12 articles: id, title, excerpt, url, date, category, author, tags, image, featured).
- `signals.json` drives the **feed listing, RSS, and sitemap** (via `optimize-static.mjs`).
- But each **article page** (`signals/*.html`) is **hand-authored, committed, richly designed** (custom OG image, byline, bespoke layout) and individually registered in `vite.config.js`. The A-10 piece is a crafted long-form essay, not a templated render.

## The core finding: a format + intent gap

mc-content produces **short social posts in `review`**. mc_site's web surface wants **long-form, hand-designed articles** in `signals.json` + bespoke HTML. The A-10 topic exists in *both* repos — as social drafts in mc-content AND as a separate hand-built web article here. **They were authored independently.** There is no draft that is "ready to drop onto the site" today.

So "present mc-content coherently within the brand" is **not** a simple copy job. The pieces don't line up 1:1. There are three honest ways to close the gap:

---

## Option A — Manual curation (lowest build, highest quality) ✅ recommended to start

When a social draft is strong enough to become a web piece, a human (or an assisted session) **promotes** it: expand the post into a long-form article, hand-build the `signals/<slug>.html` page from the existing template, add the `signals.json` entry, register it in vite. This is exactly how the current 12 signals were made.

- **Pros:** Preserves the bespoke quality bar of the existing articles. Zero new infra. On-brand by construction.
- **Cons:** Manual each time. Doesn't "scale the content multiplier" onto the web.
- **What I'd build:** nothing structural — instead, a repeatable **"promote a draft to a signal" assisted workflow** (template + checklist) so each promotion is fast and consistent.

## Option B — Semi-automated promotion pipeline (medium build)

A script in **mc_site** reads selected, approved drafts from `../mc-content`, and scaffolds a signal article: generates the `signals.json` entry + a templated `signals/<slug>.html` from the markdown body + frontmatter, leaving final polish/design to a human before commit.

- **Pros:** Big speed-up while keeping a human gate. Reuses signals.json/template.
- **Cons:** Needs a clean "approved + web-intended" signal in mc-content that doesn't exist yet (no web channel, empty `approved/`). Templated articles may feel less bespoke than current ones.
- **Prereq:** mc-content needs to mark which drafts are **web-destined** and move them to `approved/` — a small change in *that* repo (which is their job, not ours).

## Option C — Fully data-driven signals (largest build, biggest change)

Convert `/signals` so article *bodies* live in data (markdown/JSON) and pages are **generated** at build (like the knowledge category pages now are), instead of hand-authored HTML. Then an approved mc-content article flows straight through.

- **Pros:** True content multiplier → web. Scales.
- **Cons:** Re-architects the existing signals system; risks flattening the bespoke design that makes the current articles strong. Largest, riskiest change.

---

## Recommendation

**Start with Option A, design toward B.** Concretely:

1. **Now (this repo):** build a lightweight **"promote draft → signal" workflow** — a template + a small scaffolder that takes a chosen markdown draft and stamps out the `signals.json` entry + a starter `signals/<slug>.html` + vite registration, for a human to finish. This makes promotion fast without sacrificing the design bar.
2. **Coordinate (their repo, their job):** mc-content should add a **web/`signal` (the web kind) channel** or an `approved/` convention that marks a draft as *web-destined*, so there's a clean handoff point. We only consume from `approved/`.
3. **Defer Option C** until volume justifies re-architecting signals — premature now.

This respects the firewall (integration lives here, read-only from mc-content), preserves brand quality, and gives a real speed-up without a risky rebuild.

## Open question for the owner

Which web surface should mc-content feed first — **`/signals`** (analysis/reaction essays, the obvious fit), or do you also want a distinct **`/blog` or newsletter archive** on the site? That changes whether we extend the signals system or stand up a new one.
