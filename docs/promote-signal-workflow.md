# Promote an mc-content draft → a /signals article

How to turn a strong piece of mc-content (or any markdown draft) into an on-brand
`/signals` article. The scaffolder does the skeleton; a human finishes the craft.

This respects the firewall: integration lives **here in mc_site**, reading the
draft as plain input. mc-content is never written to or deployed from.

## TL;DR

```bash
# 1. Prepare a promotion-ready markdown draft (see "Input" below)
# 2. Dry-run to preview
node scripts/promote-signal.mjs --in <draft.md> --date 2026-06-23 --dry-run
# 3. Run for real (writes the HTML + signals.json entry)
node scripts/promote-signal.mjs --in <draft.md> --date 2026-06-23
# 4. Finish by hand (checklist below), then:
npm run build && npm run lint
```

## Why a draft isn't auto-publishable

mc-content drafts are **short social posts** (LinkedIn/X/Signal-app) in `review`
status — they lack a web title/subtitle/excerpt and long-form prose. Promotion is
a deliberate editorial step: expand the social angle into a full essay on MC voice.
The scaffolder removes the boilerplate toil; it does **not** write the article for you.

## Input: a promotion-ready draft

Take the mc-content draft's substance and add web frontmatter:

```markdown
---
title: The Sustainment Trap
subtitle: GAO says the F-35 is mission-capable less than half the time. The fix isn't more jets.
category: analysis            # Analysis | Reaction | …
author: Paul Garcia, Founder
date: 2026-06-23
tags: [f-35, sustainment, readiness, gao]
image: /assets/signals/f35-sustainment.jpg
featured: false
---

Long-form prose here. One idea per paragraph. This is the web article, not the
LinkedIn post — expand accordingly.
```

`title` is required. `slug` derives from the title unless you pass `--slug`.
`date` must be explicit (frontmatter or `--date`) — the script is deterministic
and does not read the clock.

## What the scaffolder produces

1. `signals/<slug>.html` — full article from the live template (head/meta/OG/JSON-LD/footer), body paragraphs from your markdown.
2. A `public/data/signals.json` entry, prepended (newest first) — drives the feed, RSS, and sitemap.
3. The exact `vite.config.js` input line to paste (printed).

## Finish by hand (the craft the scaffolder can't do)

1. **Register in vite** — paste the printed line into `rollupOptions.input`.
2. **Hero image** — drop a file in `/assets/signals/`, set the path in the HTML `<img>` + OG tags + signals.json `image`, and write real `alt` text.
3. **Expand the prose** — social drafts are short; the web wants the full case. Match the depth of existing signals.
4. **Lede-note + Related Articles** — add the source-attribution lede note (if it ran elsewhere first) and 2 related-article links, like sibling articles.
5. **Voice check** — against `assets/branding/voice-profile.md`: thesis-driven, named programs, no "innovation" as virtue, no pilot-celebration without transition, YC framed model-vs-model.
6. **Build + lint** — `npm run build && npm run lint`, then review the page locally.

## Notes

- The scaffolder refuses to overwrite an existing `signals/<slug>.html` and won't duplicate a signals.json id.
- Read time is auto-estimated (~220 wpm) from the body.
- See `docs/mc-content-integration-options.md` for the full integration analysis and why we chose this (manual-first, semi-automated-later) approach.
