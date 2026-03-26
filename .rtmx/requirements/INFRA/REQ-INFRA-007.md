# REQ-INFRA-007: Deploy SAM_GOV_API_KEY and Verify SAM.gov Opportunities Pipeline

## Status: BACKLOG
## Priority: HIGH
## Phase: 10
## Category: INFRA / API

## Requirement

SAM.gov opportunities appear in `/api/opportunities` response with real data. Expand keyword coverage beyond drone/AI to cover broader defense technology sectors.

## Context

- **Code is complete**: `cloudflare/opportunities-api/src/index.ts` already has full SAM.gov integration (lines 241-326) — search, parse, dedup against DARPA/DIU/SBIR sources
- **Key is missing**: `SAM_GOV_API_KEY` wrangler secret not yet deployed
- **Sweetspot.so** wraps the same underlying SAM.gov/USAspending/FPDS data — direct SAM.gov API access is equivalent and free
- SAM.gov API: `api.sam.gov/opportunities/v2/search` — free tier is 10 req/day; registered key gets higher limits

## Acceptance Criteria

1. `SAM_GOV_API_KEY` set as wrangler secret on opportunities-api worker
2. `curl https://opportunities-api.defensebuilders.workers.dev/api/opportunities?sources=sam` returns real SAM.gov results
3. SAM.gov results deduplicate correctly against DARPA/DIU/SBIR entries
4. Keyword list expanded beyond `["drone", "artificial intelligence"]`
5. Response deadline dates parse correctly and filter out expired notices

## Implementation Steps

1. Recover SAM.gov API key from sam.gov/data-services (or existing account)
2. `cd cloudflare/opportunities-api && npx wrangler secret put SAM_GOV_API_KEY`
3. Test: `curl "https://opportunities-api.defensebuilders.workers.dev/api/opportunities?sources=sam"`
4. Expand `SAM_GOV_DEFAULT_SEARCHES` array in `src/index.ts`:
   - Current: `["drone", "artificial intelligence"]`
   - Add: `"cybersecurity"`, `"autonomous"`, `"electronic warfare"`, `"C4ISR"`, `"space systems"`, `"counter-UAS"`
5. Consider NAICS-based search as supplement (541330 Engineering, 541511/541512 Software, 541519 Other IT, 561210 Facilities Support)
6. Redeploy: `npx wrangler deploy`
7. Verify on live site: `/opportunities` page shows SAM.gov entries

## Dependencies

None — code is already merged on main.

## Notes

- SAM.gov "controlled" attachments require authenticated SAM.gov login — API cannot access them (see `.claude/skills/sam-gov-lookup/skill.md`)
- GovBase (govbase.com) blocked by Vercel bot detection — cannot scrape for briefing data
- Free API tier: 10 requests/day. With 6+ keyword searches per cache refresh (1hr TTL), may hit limits. Consider consolidating searches or requesting higher tier.
