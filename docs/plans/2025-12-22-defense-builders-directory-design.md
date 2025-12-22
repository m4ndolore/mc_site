# Defense Builders Directory - Design Document

**Date:** 2025-12-22
**Status:** Approved for implementation

## Overview

A command-center style dashboard for discovering and connecting with defense tech companies. Transforms MC from a static marketing site into a live operational platform.

**Goal:** Drive B2B and G2B collaboration by making it easy to discover builders, their capabilities, and mission alignment.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenPass / Authentik                      │
│                    (SSO - future phase)                      │
└─────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│   mc_site     │  │  /builders      │  │      Outline        │
│  Landing Page │  │   Directory     │  │  Knowledge Base     │
│   (Vercel)    │  │  (same Vite app)│  │(apps.mergecombinator)│
└───────────────┘  └────────┬────────┘  └─────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Webhook Backend │
                   │  (Cloud Run)    │
                   │ (reuse SigmaBlox)│
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │    MongoDB      │
                   │ (shared data)   │
                   └─────────────────┘
```

**Key architectural decisions:**
- Frontend stays in mc_site Vite project (not separate Next.js app)
- Reuse existing SigmaBlox webhook backend on Cloud Run
- Shared MongoDB enables network effects between SigmaBlox and MC
- Auth deferred - public directory first, OpenPass SSO later

## Visual Design

### Color Palette (from typography.md)

| Token | Hex | Usage |
|-------|-----|-------|
| Near Black | `#0B0E11` | Page background |
| Charcoal Slate | `#1C232B` | Card backgrounds |
| Slate Gray | `#2C3036` | Borders, dividers |
| Off-White | `#F2F5F7` | Primary text |
| White | `#FFFFFF` | Headings, emphasis |
| Signal Blue | `#2A7FDB` | Primary accent, CTAs |
| Operator Green | `#5DA06F` | Success states, secondary accent |

### Typography (from typography.md)

| Style | Font | Size | Weight |
|-------|------|------|--------|
| H1 | Helvetica Neue (Inter fallback) | 64px | Bold (700) |
| H2 | Helvetica Neue | 48px | Bold |
| H3 | Helvetica Neue | 32px | Semibold (600) |
| Body Large | Helvetica Neue | 20px | Regular (400) |
| Body | Helvetica Neue | 18px | Regular |
| Mono Label | Space Mono | 12px | Regular, uppercase |

### OSINT-Style Enhancements (additive)

- **Glow effects:** Signal Blue or Operator Green on hover/focus
- **Mono Label usage:** Tags, metadata, status indicators
- **Card borders:** Subtle Charcoal Slate with accent glow on hover
- **Overall feel:** Conservative Palantir, not cyberpunk

## Component Structure

### Page Layout (`/builders`)

```
┌─────────────────────────────────────────────────────────┐
│  [MC Nav - existing]                                    │
├─────────────────────────────────────────────────────────┤
│  STATS BAR                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 47       │ │ 12       │ │ 8        │ │ 3        │   │
│  │ Builders │ │ Missions │ │ CTAs     │ │ Cohorts  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│  FILTERS                                                │
│  [Search............] [Mission Area ▼] [CTA ▼] [Sort ▼]│
├─────────────────────────────────────────────────────────┤
│  RESULTS: Showing 47 builders                           │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Card    │ │ Card    │ │ Card    │ │ Card    │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Components to Build

1. **StatsBar** - Summary metrics with glow accents
2. **FilterBar** - Search input + dropdown filters
3. **BuilderCard** - Grid item with logo, name, tagline, tags
4. **BuilderModal** - Detail view with full profile, video embed
5. **VideoEmbed** - Cloudflare Stream player (Phase 2)

### Builder Card Structure

```
┌─────────────────────────┐
│  [Logo]                 │
│  Company Name           │
│  Tagline text here...   │
│  ┌─────┐ ┌─────┐       │
│  │ Tag │ │ Tag │       │
│  └─────┘ └─────┘       │
└─────────────────────────┘
```

### Builder Modal Structure

- **Header:** Logo, name, cohort badge, website link
- **Sections:** Description, Mission Areas, CTAs, Team
- **Video:** Cloudflare Stream embed (if available)
- **Actions:** Visit Website, Connect (auth required - Phase 2)

## Data Flow

### API Endpoints (existing SigmaBlox webhook)

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `GET /getCohorts` | List cohorts with companies | Public |
| `GET /getCompany/:id` | Single company detail | Public |
| `GET /getFavorites` | User's saved companies | Auth |
| `POST /addFavorite` | Save a company | Auth |
| `GET /getNotes/:companyId` | User's notes | Auth |

### Data Shape (from /getCohorts)

```javascript
{
  cohorts: [
    {
      id: "cohort-25-1",
      name: "Cohort 25-1",
      companies: [
        {
          id: "company-123",
          name: "Acme Defense",
          logo: "https://...",
          tagline: "AI for logistics",
          missionAreas: ["Logistics", "AI/ML"],
          ctas: ["Autonomous Systems"],
          videoUrl: "https://cloudflarestream.com/...",
          website: "https://acme.com"
        }
      ]
    }
  ]
}
```

### Frontend Configuration

```javascript
window.MCPlatformConfig = {
  apiBase: "https://webhook.mergecombinator.com"
};
```

## File Structure

```
mc_site/
├── index.html              # existing landing
├── builders.html           # NEW: directory page
├── js/
│   ├── script.js           # existing
│   └── builders/           # NEW
│       ├── api.js          # fetch wrapper
│       ├── components.js   # render functions
│       └── filters.js      # search/filter logic
├── styles.css              # existing
└── styles/
    └── builders.css        # NEW: directory styles
```

## Implementation Phases

### Phase 1: Public Directory MVP
- `/builders` page with dark theme
- StatsBar, FilterBar, BuilderCard components
- BuilderModal with basic info
- Fetch from `/getCohorts` API
- No authentication required

### Phase 2: Enhanced Profiles
- Video embeds (Cloudflare Stream)
- Mission area detail pages
- Improved filtering (multi-select, saved filters)

### Phase 3: Authenticated Features
- OpenPass SSO integration
- Favorites system
- Notes per company
- "Connect" request flow

### Phase 4: Ecosystem Intelligence
- Interactive map visualization
- Capability matrix
- Funding/contract data integration

## Reference Materials

- **SigmaBlox templates:** `mc_site/reference_theme/`
  - `custom-combine.hbs` - Public directory pattern
  - `custom-cohorts.hbs` - Full dashboard with modals
  - `assets/css/company-modal.css` - Modal styles
- **OSINT Network:** https://dev.osintnetwork.com - Visual inspiration
- **Existing webhook:** SigmaBlox `/apps/webhook/` on Cloud Run

## Shared Benefits

- SigmaBlox and MC share MongoDB → user actions benefit both platforms
- Webhook backend serves both apps → single deployment
- Future SSO unifies experience across MC, SigmaBlox, Outline
