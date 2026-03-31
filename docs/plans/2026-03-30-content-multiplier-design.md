# Content Multiplier Pipeline — Design

## Context

Merge Combinator has a strong content foundation (3 blog posts, 24 testimonials, 83 company profiles with parsed synopsis sections, 5 knowledge guides, 50k+ Signal Wingman messages) but near-zero social distribution. LinkedIn and X presence is minimal. The active community lives on Signal. Senior decision makers and capital are on LinkedIn. Goal is lead generation — applications to The Combine, builder signups, investor/partner inbound.

## System Overview

A standalone repo (`mc-content`) containing Node.js scripts that ingest seed content, generate channel-formatted drafts via Claude Code CLI, and publish approved posts to LinkedIn, X, and Signal. Runs on existing bot infrastructure. No SaaS dependencies.

**Primary AI runtime:** Claude Code CLI (leverages existing subscription, container via OpenClaw or similar).
**Fallback:** OpenRouter API key.

## Architecture

Three core scripts, one config directory, cron-driven automation, Signal bot for approval.

### Content Sources (priority order)

1. **Original takes** — voice memos, blog posts, hot takes, reactions (you initiate)
2. **Wingman community insights** — anonymized practitioner insights from 50k+ messages (you push exports)
3. **RSS/news reactions** — rss.irregulars.io and configured feeds (automated monitoring)
4. **Existing asset mining** — testimonials, company spotlights, knowledge base excerpts (automated rotation)

### Target Channels

- **LinkedIn** — long-form post (1200-1500 chars), professional but not corporate, insight-led, CTA at end, 2-3 hashtags max
- **X/Twitter** — thread of 2-4 tweets, punchy and opinionated, link in last tweet
- **Signal** — short insider-tone brief, link + 1-2 sentence take

## Content Config

```
content/
  voice-profile.md          # Tone, perspective, authority, anti-patterns
  channel-rules.md          # Per-channel constraints and format rules
  feeds.json                # RSS feed URLs and check intervals
  backlog/                  # Queued seed content (auto-generated + manual)
  drafts/                   # Generated drafts awaiting approval
  published/                # Archive of approved posts
  sources/                  # Wingman exports, RSS cache
```

### Voice Profile (`voice-profile.md`)

Persistent markdown file always included in generation prompts. Captures:
- Tone: direct, operator-informed, no buzzwords, evidence-based
- Perspective: venture studio operator, not VC, not analyst
- Authority: weapons school background, Indo-Pacific focus, hands-on with builders
- Anti-patterns: no hype, no "excited to announce", no empty thought leadership
- Patterns: cite specifics, reference real programs, connect policy to operator impact

Iterated over time — your edits to drafts feed back into the profile.

### Channel Rules (`channel-rules.md`)

Per-channel format, tone, and length constraints. Included in generation prompts alongside voice profile.

### Content Categories

Each draft is tagged:
- **Spotlight** — company profile, testimonial, Combine outcome
- **Analysis** — policy breakdown, acquisition insight, market read
- **Reaction** — news response, hot take on current event
- **Education** — SBIR guide, compliance tip, knowledge base excerpt

## Scripts

### Script 1: `content-ingest`

Adds seed content to the backlog.

```bash
# From a URL (blog, news, RSS item)
node scripts/content-ingest.mjs --url https://rss.irregulars.io/some-article

# From a file (notes, transcript, voice memo transcript)
node scripts/content-ingest.mjs --file notes/my-take-on-sbir.md

# Mine existing mc_site assets
node scripts/content-ingest.mjs --mine testimonials
node scripts/content-ingest.mjs --mine companies --limit 10

# From Wingman export (anonymized)
node scripts/content-ingest.mjs --wingman export.json
```

**Wingman anonymization:** Strips all names, unit identifiers, and specifics that could identify a person. Content surfaces as "A senior operator told us..." / "From our community..." Double-gated — anonymization at ingest, your review before publish.

### Script 2: `content-generate`

Takes backlog items, invokes Claude Code CLI, writes draft markdown files.

```bash
node scripts/content-generate.mjs           # Process next N backlog items
node scripts/content-generate.mjs --all     # Process entire backlog
```

**AI invocation:** Primary path is Claude Code CLI as subprocess. Falls back to OpenRouter API if CLI unavailable. Generation prompt includes voice profile + channel rules + seed content + category tag.

### Script 3: `content-publish`

Sends approved drafts to channels via LinkedIn and X APIs (free tier). Signal posts via existing bot infrastructure.

```bash
node scripts/content-publish.mjs --approve draft-001
node scripts/content-publish.mjs --approve draft-001 --channel linkedin
```

### Script 4: `content-refine`

Opens interactive Claude Code session with a draft loaded for back-and-forth iteration. Final version writes back to the draft file.

```bash
node scripts/content-refine.mjs draft-001
```

## Draft Format

Each draft is a markdown file with frontmatter. This is the single artifact that all interaction paths converge on.

```markdown
---
id: draft-001
seed: rss-irregulars-counter-drone-2026-03-30
category: reaction
channels: [linkedin, x, signal]
status: review
created: 2026-03-30T06:00:00Z
---

## LinkedIn
The Pentagon's counter-drone marketplace just got real...

## X Thread
1/ JIATF 401 is doing something nobody's talking about...
2/ ...

## Signal
New JIATF 401 piece worth reading. The procurement model is...
```

**Three interaction paths, one file:**

1. **Signal quick flow** — bot sends draft summary, you reply "go" / "shorter" / "add the SBIR angle" / direct edits. Multiple rounds until approval. Best for mobile.
2. **File-based editing** — open the markdown file, edit directly, save. System picks up changes.
3. **CLI conversation** — `content-refine draft-001` for interactive Claude Code session. Writes back to file.

## Automation

### RSS Monitoring (cron)

Configured feeds checked on schedule (e.g., every 2 hours). New items ingested to backlog, drafts generated, sent to Signal for review. You wake up to ready-to-approve posts.

### Backlog Mining (cron)

Rotates through existing assets — testimonials, company spotlights, knowledge excerpts. Generates a configurable number of drafts daily (e.g., 2-3) without you selecting what to spotlight.

### Daily Target

System targets N drafts per day (configurable, default 5), drawn from:
- RSS reactions (automated)
- Backlog rotation (automated)
- Your manual seed content (when you add it)

You spend 15-20 minutes/day reviewing and approving.

## Content Backlog Estimate (existing assets)

| Source | Items | Estimated Posts |
|--------|-------|-----------------|
| Testimonials | 24 files | 30-40 |
| Company spotlights (alumni) | 83 profiles | 40-50 |
| Blog posts | 3 published | 10-15 |
| Knowledge guides | 5 guides | 15-20 |
| **Total** | | **95-125 posts** |

Weeks of content before writing anything new. Wingman archive adds significantly more.

## Integration Points

- **mc_site:** reads `companies.json` and `docs/testimonials/` (symlink, copy, or fetch from public URL). No write access to mc_site.
- **Wingman:** accepts JSON exports of anonymized messages. Simple input format: `[{timestamp, text}]`.
- **Signal bot:** existing infrastructure. Calls `content-publish` or hits a local HTTP endpoint on approval.
- **LinkedIn API:** free tier, API key in `.env`.
- **X API:** free tier, API key in `.env`.

## Cost

- Claude Code: covered by existing subscription
- OpenRouter: fallback only, minimal usage
- LinkedIn/X APIs: free tier
- Infrastructure: runs on existing machines
- **Total incremental cost: ~$0/month**

## Out of Scope (v1)

- Web dashboard / GUI
- Image or video generation
- Podcast production pipeline
- Multi-user support
- Engagement analytics / performance tracking
- Automatic Wingman monitoring (push, not pull)
- Content calendar UI

## Future Scope (v2)

- **Autonomous publishing** — auto-approve rules for trusted content categories once voice profile is dialed in. System runs for hours/days without review.
- **Engagement feedback loop** — track which posts perform, adjust voice profile and content mix automatically.
- **Visual content** — image generation for posts, quote cards from testimonials.
- **Podcast pipeline** — transcript → content multiplier.
- **Wingman live monitoring** — instead of manual exports, watch for high-signal messages in real-time.

## Daily Operations Flow

**6:00 AM — Cron runs:**
- RSS checks feeds. 3 new articles overnight.
- Backlog miner selects next 2 items (testimonial + company spotlight).
- Claude Code generates 5 drafts.
- Signal bot sends summary: "5 new drafts ready."

**7:00 AM — Review on Signal:**
- "1" → RSS reaction. "Go." Published.
- "2" → Company spotlight. "Focus on field validation." Revised. "Go."
- "3" → Testimonial. "Skip" — posted one recently.
- 4 and 5 for later.

**11:00 AM — You see something worth sharing:**
- Drop a note in `backlog/` or message the bot.
- Draft generated, sent back for review.

**2:00 PM — Refine a draft that needs work:**
- Open `drafts/draft-004.md` and edit directly.
- Or run `content-refine draft-004` for interactive session.

**End of day:** 3-4 posts published. 15-20 minutes total.
