# Knowledge Page Design

**Date:** 2026-02-09
**Status:** Approved
**Objective:** Build out /knowledge as the "business of defense tech" resource hub

---

## 1. Context

The `/knowledge` page is currently a "Coming Soon" stub. This design transforms it into a curated resource hub for defense builders, complementing Irregularpedia (which covers operator tradecraft).

### Audience
- **Founders** — Need acquisition, compliance, go-to-market knowledge
- **Operators** — Transitioning to industry or working with startups
- Both equally served

### Relationship to Irregularpedia
- **Complementary** — MC covers B2B/founder topics, Irregularpedia covers tradecraft
- Cross-link between them
- Possible unified SSO in future

---

## 2. Content Strategy

### Priority Categories (in order)
1. **Go-to-Market** — Finding champions, pilot programs, OTA vs traditional, pricing for gov
2. **Acquisition 101** — How DoD buys, contract types, FAR basics, program office anatomy
3. **SBIR/STTR** — Finding topics, proposal writing, Phase I→II→III pathway
4. **Compliance** — CMMC, ITAR, CUI handling, security clearances

### Content Sourcing (in order)
1. Curated external links (DAU, SAM.gov, SBIR.gov, quality blog posts)
2. Community contributions (Defense Builders submit, MC curates)
3. Original writing (fill gaps as they emerge)

### Access Model
- **Public** — Basic resources, quick links (SEO, trust-building)
- **Members** — Premium/curated content, deep dives, templates

---

## 3. Information Architecture

### Hub Page (`/knowledge`)

```
Hero: "Knowledge Base" + tagline
↓
Category Grid (4 cards):
├── Go-to-Market        → /knowledge/go-to-market
├── Acquisition 101     → /knowledge/acquisition
├── SBIR/STTR           → /knowledge/sbir
└── Compliance          → /knowledge/compliance
↓
Cross-link callout: "For operator tradecraft → Irregularpedia"
↓
Contribute CTA: "Submit a resource"
```

### Category Pages

```
Hero: Category title + description
↓
Quick Links (public): 3-5 curated external resources
↓
Deep Dives (gated): Member-submitted or original articles
↓
Related: Links to other categories + Irregularpedia crossover
```

---

## 4. Content Model

### Resource Types

| Type | Description | Access | Example |
|------|-------------|--------|---------|
| **Quick Link** | External resource with 1-line description | Public | "DAU Contracting Cone → dau.edu/..." |
| **Guide** | Curated collection of links on a topic | Public | "Finding Your First Champion: 5 resources" |
| **Deep Dive** | Original or contributed article | Members | "How We Closed a $2M OTA in 90 Days" |
| **Template** | Downloadable doc/spreadsheet | Members | "Capability Statement Template" |

### Data Structure

```yaml
# Example resource
title: "Defense Acquisition University - Contracting Cone"
type: quick-link
category: acquisition
access: public
url: "https://dau.edu/..."
description: "Visual guide to contract types and thresholds"
tags: [contracts, FAR, basics]
submitted_by: null  # or member ID for community contributions
```

---

## 5. File Structure

```
/knowledge.html              ← Hub page (replaces current stub)
/knowledge/
  ├── go-to-market.html      ← Category page
  ├── acquisition.html
  ├── sbir.html
  └── compliance.html
/public/data/
  └── knowledge.json         ← Resource data
```

---

## 6. Visual Design

### Hub Page

```
┌─────────────────────────────────────────────────────────────┐
│ [Nav]                                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  KNOWLEDGE BASE                                             │
│  ───────────────                                            │
│  Resources for building and selling to defense.             │
│  Operator tradecraft → Irregularpedia                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ GO-TO-MARKET    │  │ ACQUISITION 101 │                   │
│  │                 │  │                 │                   │
│  │ Find champions, │  │ How DoD buys,   │                   │
│  │ pilot programs, │  │ contract types, │                   │
│  │ pricing for gov │  │ FAR basics      │                   │
│  │                 │  │                 │                   │
│  │ 12 resources    │  │ 8 resources     │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ SBIR / STTR     │  │ COMPLIANCE      │                   │
│  │                 │  │                 │                   │
│  │ Find topics,    │  │ CMMC, ITAR,     │                   │
│  │ proposals,      │  │ CUI, clearances │                   │
│  │ Phase pathway   │  │                 │                   │
│  │                 │  │                 │                   │
│  │ 6 resources     │  │ 5 resources     │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ CONTRIBUTE                                            │  │
│  │ Know a resource that helped you? Submit it.           │  │
│  │ [Submit Resource]                                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Category Page

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Knowledge                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GO-TO-MARKET                                               │
│  ─────────────                                              │
│  Find champions, land pilots, price for government.         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  QUICK LINKS                              [PUBLIC]          │
│  ───────────────────────────────────────────────────        │
│  → Finding Problem Sponsors — dau.edu                       │
│  → OTA vs FAR Contracts — aaf.mil                           │
│  → Pricing for Government — acquisition.gov                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  DEEP DIVES                               [MEMBERS]         │
│  ───────────────────────────────────────────────────        │
│  🔒 How We Closed a $2M OTA in 90 Days                      │
│  🔒 The Champion Playbook: 6 Patterns That Work             │
│  🔒 Pilot Program Template + Checklist                      │
│                                                             │
│  [Sign in to access]                                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  RELATED                                                    │
│  → Acquisition 101 · SBIR/STTR                              │
│  → Operator tradecraft → Irregularpedia                     │
└─────────────────────────────────────────────────────────────┘
```

### Styling
- Follow existing MC dark theme
- Category accent colors (similar to Wingman green, Guild purple)
- Card-based layout matching other hub pages

---

## 7. Launch Scope

### V1 (Ship Now)

| Deliverable | Notes |
|-------------|-------|
| Hub page (`/knowledge.html`) | 4 category cards, Irregularpedia callout, contribute CTA |
| Category pages (4) | Static HTML, render from JSON |
| `knowledge.json` | Seed with 3-5 curated links per category |
| Auth gating | Reuse existing `auth-nav.js` pattern for member content |

### Deferred (V2+)

| Feature | Why Later |
|---------|-----------|
| Learning paths | Needs more content depth first |
| Search | Not needed until 50+ resources |
| Submission form | Manual curation via JSON for now |
| Irregularpedia SSO | Separate infrastructure work |
| Original articles | Curated links first, write when gaps emerge |

---

## 8. Seed Content

### Go-to-Market
- DAU: Finding Problem Sponsors
- AFWERX Pathway Guide
- OTA vs Traditional Contracts comparison
- Defense Innovation Unit (DIU) engagement guide
- Pricing strategies for government contracts

### Acquisition 101
- DAU Contracting Cone
- FAR overview for startups
- Program Office anatomy
- Understanding PPBE cycle
- Contract types explainer (FFP, T&M, CPFF)

### SBIR/STTR
- SBIR.gov topic search tutorial
- Phase I proposal best practices
- Phase II commercialization planning
- Phase III transition strategies
- SBIR success stories / case studies

### Compliance
- CMMC 2.0 requirements overview
- ITAR basics for startups
- CUI marking and handling guide
- Security clearance process
- FedRAMP for SaaS companies

---

## 9. Implementation Notes

- Data-driven: Resources in `knowledge.json`, pages render dynamically
- Same pattern as `companies.json` → builders page
- Future CMS migration trivial with this structure
- Vite config needs updates for new `/knowledge/` routes

---

## 10. Success Criteria

1. No more dead end from nav → /knowledge
2. Visitors can discover 3-5 useful resources per category
3. Members see value in gated content (drives sign-ups)
4. Clear path to Irregularpedia for tradecraft content
5. Easy to add resources without touching HTML
