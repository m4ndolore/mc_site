# AI Traffic Analytics

Edge-level measurement of AI-driven traffic, so we can see whether the knowledge/AEO work is getting cited and clicked — and adapt.

## What it captures

The edge router (`cloudflare/merge-router.js`) classifies every request to the canonical host and logs two AI signals (and nothing else) to a Cloudflare Analytics Engine dataset. No cookies, no JS, no consent banner.

| Signal | How it's detected | Why GA4 can't see it |
|--------|-------------------|----------------------|
| **AI crawler hits** (`kind=crawl`) | `User-Agent` matches GPTBot, PerplexityBot, ClaudeBot, Google-Extended, etc. | Bots don't run JavaScript |
| **AI referrals** (`kind=referral`) | `Referer` host is chatgpt.com, perplexity.ai, claude.ai, gemini, copilot, etc. | Often stripped / undercounted client-side |

Ordinary human/search traffic is **not** logged here (normal Google search and classic Googlebot are deliberately excluded).

## Dataset

- Binding: `AI_TRAFFIC` → dataset `mc_ai_traffic` (`_staging` / `_dev` per env), in `wrangler.toml`.
- Schema per event:
  - `blob1` = kind (`crawl` | `referral`)
  - `blob2` = vendor (`openai` | `perplexity` | `anthropic` | `google` | `microsoft` | …)
  - `blob3` = matched source needle (e.g. `gptbot`, `perplexity.ai`)
  - `blob4` = request path (which page)
  - `blob5` = user-agent (truncated 256)
  - `index1` = vendor (for fast grouping)
  - `double1` = 1 (count)

## How to query it

Analytics Engine is queried via the CF SQL API (or the dashboard → Workers & Pages → your worker → Analytics Engine). Example queries:

```sql
-- AI events in the last 7 days, by vendor and kind
SELECT blob2 AS vendor, blob1 AS kind, SUM(_sample_interval) AS events
FROM mc_ai_traffic
WHERE timestamp > NOW() - INTERVAL '7' DAY
GROUP BY vendor, kind
ORDER BY events DESC;

-- Which pages are AI engines crawling / citing most?
SELECT blob4 AS path, SUM(_sample_interval) AS events
FROM mc_ai_traffic
WHERE timestamp > NOW() - INTERVAL '30' DAY
GROUP BY path
ORDER BY events DESC
LIMIT 25;

-- Human click-throughs FROM AI answers (the conversion signal that matters)
SELECT blob2 AS vendor, blob4 AS path, SUM(_sample_interval) AS referrals
FROM mc_ai_traffic
WHERE kind = 'referral' AND timestamp > NOW() - INTERVAL '30' DAY
GROUP BY vendor, path
ORDER BY referrals DESC;
```

Run via:
```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/analytics_engine/sql" \
  -H "Authorization: Bearer <CF_API_TOKEN>" \
  --data "SELECT blob2, blob1, SUM(_sample_interval) FROM mc_ai_traffic WHERE timestamp > NOW() - INTERVAL '7' DAY GROUP BY blob2, blob1"
```

## Reading the signal (what to adapt on)

- **Rising `crawl` on a page** = AI engines are indexing it. Necessary but not sufficient.
- **`referral` events** = a human clicked through from an AI answer — the page is being *cited*, not just crawled. This is the real AEO win; the pages generating referrals are working, the ones only getting crawled may need stronger answer blocks / schema.
- **Vendor mix** tells you which engines favor the content, and where to focus.

## Maintenance

The bot/referrer lists are simple arrays at the top of `merge-router.js` (`AI_BOT_UAS`, `AI_REFERRER_HOSTS`) — add new AI engines there as they appear.
