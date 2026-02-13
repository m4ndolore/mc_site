# Opportunities Platform Expansion Design

**Date:** 2026-02-12
**Status:** Draft
**Supersedes:** 2026-01-26-opportunities-integration-design.md (Phase 2+)

## Overview

Expand the SBIR opportunities tool into a comprehensive defense contractor lead generation and market intelligence platform.

**Core Value Prop**: "Find relevant opportunities before your competitors. Understand where DoD is investing."

## Priority Stack

1. **Lead generation** - Find relevant opportunities fast via AI matching
2. **Market intelligence** - Understand congressional spending direction
3. **Portfolio management** - Track pipeline (future phase)

## Target Users

- BD/Capture leads at small defense startups (< 50 people)
- Proposal teams at mid-size contractors (50-500 people)
- Start with solo BD UX, scale to team features

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MC Opportunities                      │
│              (mergecombinator.com/opportunities)         │
├─────────────────────────────────────────────────────────┤
│  Frontend (CF Pages)  │  Matching Engine  │  Alerts     │
├───────────────────────┴───────────────────┴─────────────┤
│                   Opportunities API                      │
│              (api.mergecombinator.com/opps)              │
├─────────────────────────────────────────────────────────┤
│                   Unified Data Store                     │
│         (opportunities, profiles, matches, intel)        │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│  SBIR    │Beta.SAM  │ SAM.gov  │One Nation│  Intel      │
│ Scraper  │ Scraper  │ Scraper  │   API    │  Curator    │
└──────────┴──────────┴──────────┴──────────┴─────────────┘
```

**Hosting Strategy**:
- Frontend: Cloudflare Pages (eliminates proxy issues)
- API: Cloudflare Workers or dedicated service
- Scrapers: Railway (keep existing infra, add new scrapers)
- Data: PostgreSQL (Neon or Supabase for serverless)

---

## Data Sources

### Phase 1 (Launch)
| Source | Type | Method | Refresh |
|--------|------|--------|---------|
| SBIR/STTR | Grants | Existing scraper | Daily |
| Beta.SAM Forecasts | Pre-solicitations | New scraper | Every 6 hours |

### Phase 2 (Expand)
| Source | Type | Method | Refresh |
|--------|------|--------|---------|
| SAM.gov Active | Contracts | Scraper | Every 6 hours |
| One Nation | Marketplace | Partnership/API | Real-time webhook |
| Vulcan | Marketplace | Partnership/API | TBD |
| DIU CSO | Innovation | Scraper | Daily |
| AFWERX | Challenges | Scraper | Daily |

**Strategy**: Scrape public sources, pursue partnerships for private marketplaces.

### Unified Opportunity Schema

```
Opportunity {
  id, source, source_id
  title, description, full_text
  agency, sub_agency
  naics_codes[], psc_codes[]
  set_asides[]
  posted_date, response_deadline
  contract_type            // FFP, T&M, Cost-Plus
  estimated_value          // Range or specific
  place_of_performance
  solicitation_number
  status                   // Forecast, Open, Closed
  embedding                // Vector for matching
  raw_data                 // Original JSON for debugging
}
```

### Ingestion Pipeline

1. Scraper fetches → writes to queue
2. Normalizer maps source-specific fields → unified schema
3. Enricher generates embedding + extracts keywords
4. Matcher scores against all active profiles
5. Alerter pushes notifications for high-score matches

---

## User Profiles & AI Matching

### Profile Data Model

```
CompanyProfile {
  // From SAM.gov import (via UEI/CAGE)
  uei, cage, name, duns
  naics_codes[]
  set_asides[]            // SBIR, 8(a), HUBZone, SDVOSB, WOSB
  psc_codes[]             // Product/Service codes
  sam_capabilities        // SAM registration text

  // From capability statement upload
  parsed_capabilities     // AI-extracted tech areas, past performance
  capability_embedding    // Vector for semantic matching

  // User-refined
  tech_keywords[]         // "counter-UAS", "autonomy", "SIGINT"
  target_agencies[]       // Army, Navy, DIU, etc.
  contract_ceiling        // Max contract value they pursue
  exclude_keywords[]      // Filter out irrelevant areas

  // Matching preferences (user-configurable JSON)
  match_config: {
    weights: {
      semantic_similarity: 0.50,
      structured_match: 0.30,
      recency: 0.10,
      preference_boost: 0.10
    },
    thresholds: {
      min_score: 0.4,
      alert_score: 0.75
    },
    filters: {
      agencies: ["Army", "DIU"],
      exclude_keywords: ["shipbuilding"],
      max_contract_value: 5000000,
      set_aside_only: true
    }
  }
}
```

### Profile Building Flow

1. **SAM.gov import** via UEI/CAGE → instant structured data
2. **Capability statement upload** → AI extracts tech depth
3. **Structured form** → refine/override as needed

### Match Scoring

- Semantic similarity (capability ↔ opportunity): configurable weight
- Structured match (NAICS, PSC, set-aside): configurable weight
- Recency bonus: configurable weight
- User preference boost: configurable weight

### Match Explanation UI

Each opportunity card shows breakdown:
```
Match Score: 82%
├─ Capability match: 45/50  "counter-UAS" in your profile
├─ NAICS match: 25/30       541715 exact match
├─ Recency: 8/10            Posted 3 days ago
└─ Agency boost: 4/10       Army (in your targets)
```

Users can "Tune Matching" to adjust weights via sliders or edit JSON directly.

---

## Market Intelligence

### Intel Data Model

```
IntelItem {
  id, type                 // "ndaa", "approps", "budget", "trend"
  title, summary           // Curated headline + analysis
  full_text                // Original source text
  source_url
  fiscal_year
  agencies[]               // Affected agencies
  tech_areas[]             // AI, autonomy, cyber, space, etc.
  funding_amount           // If applicable
  implications             // "Likely RFPs in 6-12 months"
  published_date
  author                   // Curator attribution
}
```

### Content Phases

**Phase 1 - Curated** (launch):
- Weekly digest: Key NDAA provisions, appropriations updates
- Manual tagging of tech areas and agencies
- "What this means for contractors" analysis

**Phase 2 - Semi-automated**:
- Parse bill text, surface sections by keyword
- Auto-extract funding line items from RDT&E tables
- Human review before publishing

**Phase 3 - AI-assisted**:
- LLM summarizes committee reports
- Generate implications and likely opportunity timelines
- Link budget lines to historical solicitation patterns

### User Experience

- Intel feed on dashboard (filterable by agency/tech area)
- "Related Intel" shown on opportunity detail pages
- Weekly email digest option

---

## Access Tiers & Delivery

### Access Tiers

| Feature | Public | Free Account | Pro |
|---------|--------|--------------|-----|
| Browse all opportunities | ✓ | ✓ | ✓ |
| Search & filter | ✓ | ✓ | ✓ |
| View intel feed | ✓ | ✓ | ✓ |
| Create profile | | ✓ | ✓ |
| AI match scoring | | ✓ | ✓ |
| Save searches | | ✓ | ✓ |
| Email digest (weekly) | | ✓ | ✓ |
| Real-time alerts | | | ✓ |
| Custom match weights | | | ✓ |
| API access | | | ✓ |
| Team workspaces | | | ✓ |

### Alert Channels

- Email digest: Daily or weekly rollup
- Real-time email: Immediate for high-score matches
- Slack/Teams webhook: Configure channel, set threshold
- (Future) SMS for critical deadlines

### Saved Searches

```
SavedSearch {
  name: "Army counter-UAS contracts"
  query: { agencies: ["Army"], keywords: ["counter-UAS", "cUAS"] }
  alert_enabled: true
  alert_channel: "slack"
  alert_threshold: 0.7
}
```

---

## Implementation Phases

### Phase 1: Foundation (MVP)
- Migrate SBIR frontend to CF Pages (fixes proxy issue)
- Add Beta.SAM forecast scraper
- Build unified opportunity schema + API
- Basic search/filter UI (no auth required)
- Profile creation via SAM import (UEI lookup)

### Phase 2: Matching
- Capability statement upload + parsing
- Embedding generation for opportunities
- AI matching engine with scoring
- Match explanation UI
- Email digest delivery

### Phase 3: Intelligence
- Curated intel feed (manual publishing)
- Intel linked to opportunities
- Weekly digest emails

### Phase 4: Expansion
- Add SAM.gov active contracts scraper
- Partner integrations (One Nation, Vulcan)
- Real-time alerts (Slack, email)
- Configurable match weights
- Saved searches

### Phase 5: Scale
- Team workspaces
- Pro tier + billing
- API access
- AI-assisted intel curation

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| AI-driven matching | Differentiator vs. simple keyword search |
| SAM import for profiles | Reduces friction, data already exists |
| Configurable weights | Power users want control, builds trust |
| Curated intel first | Build credibility before automating |
| Hybrid source strategy | Scrape public, partner with private |
| CF Pages for frontend | Eliminates proxy issues, consolidates on CF |
| Tiered access | Monetization path, public browse for growth |
