# Opportunities Integration Design

**Date:** 2026-01-26
**Status:** Approved

## Overview

Integrate SBIR opportunities tool into Merge Combinator ecosystem, then evolve toward a comprehensive Opportunities platform.

## Phasing

### Phase 1: SBIR Quick Polish (Now)

**Goal:** Make sbir.mergecombinator.com look like part of MC without touching internals.

**Changes to `misfits_scraper/frontend`:**

```
frontend/
├── src/
│   ├── components/
│   │   ├── MCHeader.tsx    (new)
│   │   └── MCFooter.tsx    (new)
│   ├── styles/
│   │   └── mc-branding.css (new)
│   ├── App.tsx             (wrap with header/footer)
│   └── main.tsx            (import mc-branding.css)
└── index.html              (add Google Fonts)
```

**MCHeader design:**
- Height: ~48px, scrolls with content
- Left: "Merge Combinator" text + arrows logo, links to mergecombinator.com
- Right: "Opportunities" page identifier
- Background: `#0b1116`, border-bottom: `rgba(255,255,255,0.1)`

**MCFooter design:**
- Minimal: logo, tagline, key links row, copyright
- Background: `#0b1116`, border-top: `rgba(255,255,255,0.1)`
- Links: Defense Builders, Combine, Knowledge, Access

**CSS variables:**
```css
:root {
  --mc-bg: #0b1116;
  --mc-border: rgba(255,255,255,0.1);
  --mc-text: #e5e7eb;
  --mc-text-muted: rgba(229,231,235,0.6);
  --mc-accent: #0ea5e9;
}
```

**Deployment:** Stays on Railway, proxy via mc-router unchanged.

---

### Phase 2: Opportunities Frontend in mc-site (Future)

**Goal:** Replace SBIR-only tool with comprehensive Opportunities platform.

**Data sources to aggregate:**
- SBIR/STTR (existing scraper)
- SAM.gov contracts
- Grants.gov
- DIU CSO
- AFWERX challenges
- Other DoD opportunities

**Auth model (hybrid):**

| Feature | Public | Authenticated |
|---------|--------|---------------|
| Browse opportunities | ✓ | ✓ |
| Search & filter | ✓ | ✓ |
| View details | ✓ | ✓ |
| Save searches | | ✓ |
| Track opportunities | | ✓ |
| Set alerts | | ✓ |
| Add notes | | ✓ |

**UI standard:** Command Center UI Enforcer (now global skill)

**Architecture:**
- Frontend: mc-site (Vite + vanilla JS or migrate to React)
- API: `api.sigmablox.com/opportunities`
- Scrapers: Microservices feeding unified data store

---

### Phase 3: Builders Hybrid Auth (Future)

Same hybrid pattern applied to `/builders`:

| Feature | Public | Authenticated |
|---------|--------|---------------|
| Browse directory | ✓ | ✓ |
| View basic profiles | ✓ | ✓ |
| Watchlist | | ✓ |
| Request intros | | ✓ |
| Contact details | | ✓ |
| Detailed profiles | | ✓ |

---

## Skills & Standards

- **Command Center UI Enforcer** - Now global at `~/.claude/skills/command-center-ui-enforcer/`
- **VIA Configuration** - Auth integration patterns
- **Design Principles** - Visual consistency

## Backend Evolution

```
┌─────────────────────────────────────────────────┐
│              Opportunities API                   │
│         (api.sigmablox.com/opportunities)        │
└─────────────────────────────────────────────────┘
         ▲           ▲           ▲
         │           │           │
    ┌────┴───┐  ┌────┴───┐  ┌────┴───┐
    │  SBIR  │  │ SAM.gov│  │  DIU   │  ...
    │Scraper │  │Scraper │  │Scraper │
    └────────┘  └────────┘  └────────┘
```

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Phase 1: Branding only | Low risk, quick win |
| Keep SBIR colors | Already dark theme, avoid breaking UI |
| Minimal header (not full nav) | Honest about sub-app relationship |
| Hybrid auth pattern | Public discovery, authenticated engagement |
| Command Center UI | Mission-critical operational standard |
