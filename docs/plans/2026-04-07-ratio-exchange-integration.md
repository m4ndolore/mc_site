# Ratio Exchange Source Integration

**Date:** 2026-04-07
**Status:** Approved
**Scope:** `cloudflare/opportunities-api/src/index.ts` (single file)

## Problem

The Opportunities section aggregates defense/national security opportunities from SBIR, DARPA, DIU, GoColosseum, and SAM.gov. Ratio Exchange (ratio.exchange/challenges/) is an additional high-quality source with 261+ challenges from defense innovation hubs (DEFENSEWERX, SOFWERX, ERDCWERX, Tradewind, Doolittle Institute, HSWERX, Cyber Fusion Innovation Center, FLEETWERX, etc.) — squarely in MC's audience.

## Decisions

### Fetching strategy: Direct CFC POST (not CF Browser Rendering)

Ratio's page is JavaScript-rendered (jQuery AJAX to ColdFusion backend). We considered:

- **Option A (chosen):** POST directly to `/controller/challenge.cfc` with `method=DisplayChallenges`, `Type=1` (open only), `To=100`. Returns HTML fragment. No browser rendering cost.
- **Option B (future):** CF Browser Rendering `/content` endpoint to render full page. Useful if Ratio blocks direct CFC calls.
- **Option C (future):** CF Browser Rendering `/scrape` endpoint with CSS selectors. Cleaner extraction but different pattern from other sources.

Direct CFC POST is cheapest, fastest, and consistent with how DIU/GoColosseum work (fetch HTML, parse it).

### Parsing: Regex-based HTML parser

Same pattern as `parseDiuHtml()` and `parseColosseumHtml()`. Extracts from challenge cards:
- topicCode (ChallengeID UUID from href)
- topicTitle (h3 tag)
- description (p tag)
- component (hub name from h4)
- status ("Open" — we only fetch open)
- url (full ratio.exchange link)

### Cache TTL: 60 minutes

Consistent with DARPA, DIU, SAM.gov. Ratio challenges are longer-lived (CSOs last months), so hourly refresh is more than sufficient.

### Dedup priority: After Colosseum, before SAM.gov

SBIR → DARPA → DIU → Colosseum → **Ratio** → SAM.gov

Ratio has richer metadata than SAM.gov (hub, tracking number, keywords, POC), so Ratio wins on title collisions with SAM.

## Implementation

Single file change: `cloudflare/opportunities-api/src/index.ts`

1. Add `ratio` to TTL map (3600s)
2. Add `parseRatioHtml()` parser function
3. Extend `cachedFetch` or add POST variant for the CFC call
4. Insert Ratio fetch block between Colosseum and SAM.gov in `/api/opportunities`
5. Add `ratioTotal` to per-source totals
6. Add `"ratio"` to default sources list

No frontend changes needed — Ratio challenges flow through as `source: "ratio"` and render in the existing UI.
