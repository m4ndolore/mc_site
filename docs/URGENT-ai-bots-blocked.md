# ✅ RESOLVED: AI crawlers were blocked at the Cloudflare edge

**Found:** 2026-06-23 (during AI-traffic-analytics deploy).
**Resolved:** 2026-06-23 — owner turned off Cloudflare "Block AI Bots".
**Verified fixed:** GPTBot / ClaudeBot / PerplexityBot now return **200** and receive clean, complete content.

## What was wrong

Cloudflare's **"Block AI Bots"** control was returning **HTTP 403** to AI crawlers across the entire site, while our `robots.txt` explicitly invited them — so the knowledge-section AEO work (schema, crawlable content, topic cluster) couldn't reach the AI engines we want citing us.

## Resolution

Owner disabled "Block AI Bots" in the Cloudflare dashboard. Verified:

| Client | Before | After |
|--------|--------|-------|
| GPTBot (OpenAI) | 403 | **200, clean content** |
| ClaudeBot (Anthropic) | 403 | **200, clean content** |
| PerplexityBot | 403 | **200, clean content** |

Each now receives the full page: 4 FAQ questions, FAQPage schema, all resource links — no truncation, no honeypot bait.

```
curl -s -o /dev/null -w "%{http_code}" \
  -A "Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)" \
  https://mergecombinator.com/knowledge/sbir
# -> 200
```

## AI Labyrinth — assessed, safe to leave ON

Cloudflare's **AI Labyrinth** (injects hidden `nofollow` honeypot links to trap misbehaving scrapers) remains enabled. Verified empirically that this does **NOT** interfere with the citation crawlers:

- The honeypot `<a href="/cdn-cgi/content?id=…" rel="nofollow noopener" style="display:none">` link is injected only into responses to **unverified** clients (it appeared on a plain-browser fetch, not on the bot fetches).
- **GPTBot / ClaudeBot / PerplexityBot all receive ZERO labyrinth bait** — Cloudflare treats them as verified crawlers and serves clean pages.
- The bait link is `nofollow` + `aria-hidden` + `display:none` — invisible to users, assistive tech, and respected by search engines.

**Verdict:** Labyrinth defends against scrapers without harming AEO. No action required. (If maximum certainty is preferred it can be turned off, but the evidence shows it isn't hurting.)

## Net result

The AEO pipeline is now functional end-to-end: AI crawlers are invited (`robots.txt`), allowed in (block removed), served clean structured content (schema + FAQs + static resources), and measured (`mc_ai_traffic` analytics). Watch the analytics for rising `crawl` then `referral` events to confirm citations.
