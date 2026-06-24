# ⚠️ AI crawlers are blocked at the Cloudflare edge (action required)

**Found:** 2026-06-23, during AI-traffic-analytics deploy.
**Severity:** High — this defeats the entire knowledge-section AEO effort.
**Owner action required:** Cloudflare dashboard setting (cannot be fixed in code).

## The problem

Cloudflare is returning **HTTP 403** to AI crawlers across the **entire site**, while our `robots.txt` explicitly invites them.

| Client | Response |
|--------|----------|
| GPTBot (OpenAI) | **403 blocked** |
| ClaudeBot (Anthropic) | **403 blocked** |
| PerplexityBot | **403 blocked** |
| Googlebot | 200 OK |
| Normal browser / curl | 200 OK |

The 403 comes from Cloudflare's edge (`server: cloudflare`, 25-byte body, fires before the worker/Pages). It is **not** from our worker or app code — confirmed by grep (no 403 in `merge-router.js`) and by the response signature.

## Why it matters

We spent the last week optimizing the knowledge section for AI search — `robots.txt` allows GPTBot/ClaudeBot/PerplexityBot/Google-Extended, we added Article/HowTo/FAQPage schema, made JS-only pages crawlable, built a topic cluster. **None of that reaches OpenAI/Anthropic/Perplexity if their crawlers get a 403 at the door.** They cannot index or cite content they can't fetch.

The new AI-traffic analytics (`mc_ai_traffic`) will now record these as blocked crawl *attempts* — useful confirmation, but the crawls aren't succeeding.

## The cause

This is one of Cloudflare's AI-bot controls, almost certainly one of:
- **Security → Bots → "Block AI bots / AI Scrapers and Crawlers"** toggle (one-click managed rule), or
- A **WAF managed rule** / Bot Fight Mode targeting verified AI bot UAs, or
- A **robots.txt / managed "AI Audit"** block.

## The fix (Cloudflare dashboard — owner)

Decide intent, then set it to match `robots.txt`:

1. Cloudflare dashboard → select `mergecombinator.com` zone.
2. **Security → Bots** → if "Block AI bots" is on, switch it **off** (or to "Allow") for the crawlers we want citing us. Cloudflare lets you allow *search/citation* bots while still blocking *training-only* scrapers if you prefer that nuance.
3. Also check **Security → WAF → Managed rules** and **Bot Fight Mode** for any rule matching AI user-agents.
4. Re-test:
   ```
   curl -s -o /dev/null -w "%{http_code}" \
     -A "Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)" \
     https://mergecombinator.com/knowledge/sbir
   # want: 200
   ```

## Decision to confirm

If the **intent** is actually to block AI crawlers (some sites do, to protect content), then the opposite fix applies: **update `robots.txt`** to disallow them so we're not sending mixed signals — and we should stop investing in AEO. But given the whole strategy is to *be cited* by AI search, the right move is almost certainly to **unblock the citation crawlers**.
