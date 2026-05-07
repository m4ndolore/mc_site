# Opportunities Page Personalization Redesign

**Date:** 2026-04-25
**Status:** Design approved, ready for implementation

## Problem

The Opportunities page is directionally right but tries to be a comprehensive aggregator — a crowded space where "here's a huge list" is low-value. It needs to become a personalized discovery tool that delivers value with zero commitment, earns trust, then funnels users toward signup. Data quality gaps (missing deadlines, inconsistent status) undermine trust. Unfocused features (Events, Radar tabs) dilute the experience.

## Design

### 1. Entry Experience — Guided Intake Flow

When a user lands on `/opportunities` with no localStorage profile (`mc-opportunity-profile-v1`), they see a full-page guided intake instead of the list. Three steps, one screen each, with a progress indicator (3 dots):

**Step 1: "What technology areas are you working in?"**
- Chip-select grid from the opportunity data's `technologyAreas` values (AI/ML, Autonomous Systems, Cybersecurity, Space, etc.)
- Multi-select

**Step 2: "What problem areas are you focused on?"**
- Chip-select from Builders mission areas: Administration, Command and Control, Comm, Cyber, Force Protection, Information, Intel and Battlespace Awareness, Joint Fires, Logistics, Maintenance, Planning
- Can abbreviate or group if 11 feels like too many
- Multi-select

**Step 3: "How do you want to explore?"**
- Three cards, pick one:
  - **By Opportunity** — "Show me open solicitations I can apply to now"
  - **By Stakeholder** — "Show me which agencies are buying what I build"
  - **By Mission Area** — "Show me what problems need solving in my space"
- Sets default view mode (switchable later)

**Skip flow:** "Skip — show me everything" link on every step goes to the current unfiltered list view (fallback). Profile saved to localStorage. Return visits skip intake and go straight to personalized feed. "Edit preferences" link to re-enter the flow.

### 2. Personalized Feed

After intake (or on return visits), user lands on their personalized feed.

**Common elements across all views:**
- **Top bar:** Active profile as small chips ("AI/ML . Cyber . By Opportunity"). Click any chip to quick-edit. "Clear profile" resets to full list.
- **Every card shows four critical signals prominently:**
  - Status badge — Open (green), Pre-Release (blue), Closing Soon (orange), Closed (gray)
  - Deadline — Days remaining in large text if < 30 days, date otherwise. "No deadline listed" if missing.
  - Source badge — SBIR, DARPA, DIU, SAM.gov, etc.
  - Estimated value — Dollar range if available, omitted if not
- **Default sort: relevance** (profile match), with toggles to deadline-soonest or newest

**"By Opportunity" view (default):**
- Ranked feed of matching solicitations
- Taller cards: title, 2-line description, four signals above the fold
- Infinite scroll or "Load more" replaces pagination

**"By Stakeholder" view:**
- Grouped by agency/component
- Group header: agency name, count of matching open opportunities, collapse toggle
- Within group: sorted by deadline

**"By Mission Area" view:**
- Grouped by mission area from Step 2 selections
- Similar group headers with counts
- Useful for exploring adjacencies

### 3. Action Layer — Free Value to Auth Gate

**Free actions (no auth, localStorage-backed):**
- **Save** — Bookmark icon on every card. Accessible via "Saved" link in top bar (not a tab).
- **Share** — Copy link or mailto with pre-filled subject/body
- **View details** — Modal or dedicated page

**Soft gate (email capture, not full auth):**
- **"Email me my matches"** — Appears after scrolling past ~10 results or saving 2+ items. Just email field + submit. Weekly digest of matching opportunities.

**Hard gate (Guild auth):**
- **"Get alerts for this opportunity"** — Real-time status/deadline notifications
- **"Get matched with a coach"** — MC network access
- **"See who else is pursuing this"** — Community feature

**Removed from UI (archived in codebase):**
- Events tab — `EventsPanel.tsx` moved to `opportunities/src/_archived/`
- Radar tab — `RadarPanel.tsx` moved to `opportunities/src/_archived/`
- Tab imports removed from `App.tsx` and `TabBar.tsx`
- Files preserved as-is for future revival

### 4. API Data Enrichment

**Close dates / deadlines:**
- SBIR: `closeDate` from sbir.gov API — ensure consistent mapping
- SAM.gov: `responseDeadLine` field — verify mapping
- DARPA: Parse response dates from RSS description where possible; "See solicitation" when not
- DIU / GoColosseum / Ratio: Best-effort deadline extraction; honest "No deadline listed" when absent

**Status normalization (canonical enum at API layer):**
- `open` — Accepting submissions now
- `closing-soon` — Open, deadline within 14 days (derived)
- `pre-release` — Announced but not yet open
- `closed` — Past deadline
- Derived from close date when source doesn't provide explicit status

**Estimated value:**
- SBIR Phase I/II: Infer standard funding ranges ($50K-$275K / $750K-$1.75M) from program + phase
- SAM.gov: Map award amounts from API response

**De-duplication:** Current title-matching works. Low priority improvement — note but don't block.

### 5. Detail View Redesign

Modal for quick scanning, dedicated page (`/opportunities/:id`) for sharing.

**Layout top to bottom:**
1. **Header:** Title (large), source badge + topic code, component/agency
2. **Status strip** (horizontal bar): Status badge, deadline (urgency color if < 14 days), posted date, estimated value
3. **Description:** Full text with paragraph breaks, objective block if available
4. **Phase breakdown** (SBIR/STTR only): Collapsible sections, collapsed by default
5. **Tags:** Tech areas, focus areas, keywords as chips. Matching tags (overlap with user profile) get subtle highlight
6. **Footer actions:** "View on [source]", Save, Email this, Get alerts (gated), Get matched (gated)

**Changes from current:** Status strip moves to top (was buried in 2x2 grid), phases collapse, matching tags highlighted, "Open detail page" redundancy removed.

### 6. Technical Approach

**Architecture:** Opportunities sub-app stays React + Vite. No framework change.

**Routing:**
- `/opportunities` — Intake (first visit) or personalized feed (return visit)
- `/opportunities/:id` — Detail page
- `/opportunities/sbir`, `/opportunities/sttr` — Pre-set profile with program filter, skip to feed

**Static `opportunities.html`:** 301 redirect to `/opportunities`

**localStorage schema:**
```json
{
  "key": "mc-opportunity-profile-v1",
  "schema": {
    "techAreas": "string[]",
    "problemAreas": "string[]",
    "viewMode": "opportunity | stakeholder | mission",
    "savedIds": "string[] (migrated from mc-saved-opportunities-v1)",
    "createdAt": "ISO string",
    "updatedAt": "ISO string"
  }
}
```

Migration: on first load, if old saved key exists, merge into new schema and delete old key.

**Archived components:** `EventsPanel.tsx` and `RadarPanel.tsx` to `opportunities/src/_archived/`. Imports removed. No refactoring of archived files.

**Build/deploy:** No changes to Vite build or Cloudflare Pages deploy.

## Scope Summary

1. Intake flow — 3-step guided onboarding with skip-to-list fallback
2. Personalized feed — 3 view modes (opportunity/stakeholder/mission), profile-aware ranking
3. Action progression — Free save/share -> email capture -> auth-gated alerts/matching
4. API enrichment — Close dates, status normalization, value inference across all sources
5. Detail view — Status strip at top, collapsible phases, matching tag highlights
6. Cleanup — Archive Events/Radar, redirect static page, consolidate localStorage
