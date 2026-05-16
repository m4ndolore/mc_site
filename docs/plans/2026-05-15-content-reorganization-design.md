# Content Reorganization: Feed + Launch

**Date:** 2026-05-15  
**Status:** Design approved  
**Author:** Paul Garcia + Claude

## Problem

Content across Learn, Signals, and Knowledge is fragmented. The robust RSS-powered intel feed is buried at the bottom of the Knowledge page. Original Signals articles are static HTML with no dynamic loading. The Learn page is a single book on an island. Users have no clear progression path, and fresh content doesn't surface naturally.

## Goals

1. **Daily magnet** — make the site a daily habit via fresh, filterable intel
2. **Structured progression** — guide founders from "new to defense" to "ready to sell"
3. **Funnel to ecosystem** — content → triage → Guild (free) → Defense Builders (paid) → equity partnerships

### Business model context

MC is a venture studio. The primary business is taking equity (5-40%) in growth-stage national security companies in exchange for founder-grade expertise and partnerships. Guild/Defense Builders are the ecosystem that keeps everyone engaged, but the real target is identifying the right founders who want MC as a co-builder.

## Architecture: Two Pages

### Page 1: Feed (`/signals`)

Unified chronological stream combining original MC content and aggregated industry intel.

**Content types:**

| Type | Source | Behavior |
|------|--------|----------|
| MC Original | Current Signals articles (10 posts) | "MC Analysis" badge, links to full article page (`/signals/slug`) |
| Aggregated Intel | RSS via `api.mergecombinator.com/api/intel/feed` + `intel.json` curated | Source badge (Breaking Defense, ExecutiveGov, etc.), external link |
| Briefing | `api.mergecombinator.com/api/intel/briefing` | "Today in Washington" pinned card at top |

**UX:**

- Single chronological stream, newest first
- One featured/pinned MC Original article at top (latest)
- Filter bar: topic-based (AI & Autonomy, Drones, Policy, Acquisition, Space, Indo-Pacific)
- Secondary toggle: "MC Original" / "All Sources"
- Pagination or infinite scroll as feed grows
- Sidebar/banner CTA: "New to defense? Start your launch sequence →" linking to `/launch`

**Technical:**

- Reuse existing `intel.js` rendering and filtering logic (pull from Knowledge page)
- Add Signals article data to the feed (either via a `signals.json` manifest or inline data)
- Unified card component that handles both internal articles and external links
- Keep existing `/signals/slug` article pages intact for SEO

---

### Page 2: Launch (`/launch`)

Structured 0→1→N progression for defense tech founders. Themed around the aircraft carrier catapult launch sequence — precise, orchestrated, not overdone.

**Theming rules:**
- Stage titles are carrier-inspired but immediately clear to civilian founders
- Organization mirrors actual launch sequence logic
- Visual tone: flight deck status board precision, not Top Gun graphics
- Copy: one carrier reference per section max, rest is direct and practical

**Stage progression:**

#### 1. Pre-Flight
*Understand the landscape*

- How DoD buys (acquisition system overview)
- Key players and organizations
- Contract types (FFP, T&M, CPFF, OTAs)
- Current Knowledge base "Acquisition 101" resources migrate here

#### 2. Spot
*Find your position on the deck*

- Identify your wedge (problem sponsors, mission areas)
- Match to opportunity types (SBIR, CSO, OTA, direct)
- Current Knowledge base "Go-to-Market" resources migrate here
- Links to Opportunities page for active solicitations

#### 3. Hook Up
*Connect to the catapult*

- Land your first contract vehicle
- Compliance basics (CMMC, ITAR, CUI, clearances)
- Proposal writing fundamentals
- Pricing for government contracts
- Current Knowledge base "SBIR/STTR" and "Compliance" resources migrate here

#### 4. Tension
*Build to full power*

- Prototype → production transition
- Valley of Death navigation (book slots here naturally)
- Phase III transition strategies
- The book: "Valley of Death Survival Guide" by John Ferry (public, read online)
- MC-original guides on surviving the valley (gated: Guild/DB)

#### 5. Launch
*Go operational*

- Production contracts and scale
- Follow-on strategies, teaming, prime relationships
- "Going operational with a co-builder" → The Combine / `/access`
- MC-original advanced playbooks (gated: Defense Builders)

**Layout:**

- Hero: "Launch" + tagline ("From idea to contract. Everything you need to build in defense.")
- Triage shortcut: "Not sure which stage you're in? 60-second check →" links to `/start`
- Stage map: vertical progression, each stage expandable
- Each stage shows: public external links (visible), MC-original content (lock icon + "Available in Guild" or "Defense Builders")
- Bottom CTA: "Building something that matters? We go deeper than advice." → The Combine

---

## Cross-page connections

### Feed → Launch
- Persistent CTA: "New to defense? Start your launch sequence →"
- Contextual links on MC articles: "This topic is part of **Pre-Flight** in the Launch path"
- Intel articles with relevant tags show subtle stage breadcrumb

### Launch → Triage (`/start`)
- Top of page: "Not sure which stage you're in? 60-second check →"
- Triage results recommend a specific Launch stage + relevant Feed filters

### Launch → Guild/Access
- Gated resources: lock icon with "Available in Guild (free)" or "Defense Builders"
- Stages 3-5 progressively increase "Talk to MC" energy
- Stage 5 culminates in Combine application CTA

### Launch → Equity pipeline
- Page demonstrates depth that makes right founders self-select
- Never explicitly says "give us equity" — the value proposition speaks for itself
- Stage 5 links to The Combine as a natural next step for founders going operational

---

## Migration plan

### Knowledge page (`/knowledge`)
- **Industry Intel section** → moves to `/signals` feed
- **Category cards (Go-to-Market, Acquisition, SBIR, Compliance)** → resources redistribute into Launch stages
- **Knowledge page itself** → either redirect to `/launch` or keep as a minimal "see also" with links to both Feed and Launch
- **`intel.js`** → refactored to serve `/signals` instead

### Signals page (`/signals`)
- **Featured section** → becomes single pinned MC Original card
- **All Signals list** → merges into unified feed with intel articles
- **Article pages (`/signals/slug`)** → unchanged, keep all 10 articles
- **Sidebar** → simplified or removed (filters handle discovery)

### Learn page (`/learn`)
- **Valley of Death book** → moves into Launch Stage 4 ("Tension")
- **Learn page itself** → redirect to `/launch` or keep as reader-only entry point
- **PDF reader (`/learn/read`)** → unchanged, still accessible via direct link

### RSS feeds
- `signals.rss` → expand to include all MC Original articles (currently only 3 items)
- `api.mergecombinator.com/api/intel.rss` → unchanged (already referenced in Knowledge page head)

---

## What stays unchanged

- Opportunities page (`/opportunities`) — separate React SPA, working well
- Article pages (`/signals/slug`) — keep for SEO, linked from feed
- PDF reader (`/learn/read`) — still works, linked from Launch Stage 4
- Triage tool (`/start`) — linked from Launch, not absorbed into it
- Guild/Defense Builders — auth boundary remains on `guild.mergecombinator.com`

---

## Open questions

1. **`/launch` vs `/learn` URL** — `/launch` is stronger thematically; `/learn` has existing SEO. Redirect `/learn` to `/launch`?
2. **Knowledge page fate** — redirect entirely to `/launch`, or keep as a lightweight index?
3. **Feed data source** — build a `signals.json` manifest for MC articles, or render them server-side into the feed?
4. **Gating UX** — what does "Available in Guild" look like? Blurred content? Lock icon? Separate page?
5. **Triage integration** — does triage output link directly to a Launch stage, or to a personalized Guild onboarding?
