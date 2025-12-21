# Merge Combinator Platform Design

**Date:** 2025-12-20
**Status:** Approved
**Author:** Claude Code + Paul Garcia

---

## Executive Summary

This document defines the design for the Merge Combinator Platform — a hybrid web application combining a public marketing site with an authenticated member portal featuring the Defense Builders marketplace, Intel Feed, and Knowledge Base.

**Timeline:** Live in 3 days (soft launch to sigmablox community)

---

## 1. Platform Overview

### Merge Combinator

*The builder-led venture studio for national security.*

**Tagline:** "Build What Warfighters Need."

**Mission:** If you're building for the Indo-Pacific mission, build with us.

### Platform Products

| Product | Description | Priority |
|---------|-------------|----------|
| **Defense Builders** | Marketplace connecting problem solvers with critical national security challenges and mission owners championing them | Primary |
| **Intel Feed** | Aggregated intelligence from Signal + curated sources | High |
| **Knowledge Base** | Program materials, playbooks, guides for builders | Secondary |
| **The Combine** | Link to SigmaBlox (separate product) | External |

### Target Users

- **Builders** — Defense tech companies/startups seeking validated problems and contracts
- **Mission Owners** — Government champions (PACAF, SOCOM, DIU) with problems to solve
- **Admins** — Merge Combinator team managing the ecosystem

### Success Metrics (MVP)

- 20+ builders onboarded in first 3 months
- 10+ problems posted by mission owners
- 5+ successful builder-problem matches
- Signal community members engaging with Intel Feed

---

## 2. Architecture & Tech Stack

### Strategy

Evolve existing assets (mc_site landing, db_studio app) with gradual improvements. Inspiration over inheritance — learn from db_studio and sigmablox patterns, but rebuild better when it makes sense.

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MERGE COMBINATOR PLATFORM                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PUBLIC                              AUTHENTICATED                       │
│  ┌────────────────────┐             ┌─────────────────────────────────┐ │
│  │ mc_site (landing)  │             │         App (db_studio base)    │ │
│  │ • Splash video     │  ──Login──▶ │ • Defense Builders marketplace  │ │
│  │ • Scroll reveal    │             │ • Intel Feed                    │ │
│  │ • Platform story   │             │ • Knowledge Base                │ │
│  │ • CTAs → Auth      │             │ • Dashboard                     │ │
│  └────────────────────┘             └─────────────────────────────────┘ │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                              SHARED SERVICES                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ OpenPass │  │ MongoDB  │  │  Redis   │  │ AI/LLM   │               │
│  │  (SSO)   │  │   (DB)   │  │ (Queue)  │  │ (Signal) │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                            EXTERNAL LINKS                                │
│  ┌──────────────┐                                                       │
│  │  SigmaBlox   │ ◀── SSO via OpenPass                                 │
│  │ (The Combine)│                                                       │
│  └──────────────┘                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Landing (public)** | Vite + HTML/CSS/JS | mc_site, enhance with video + scroll effects |
| **App (authenticated)** | React 18 + Vite + TypeScript | db_studio foundation |
| **API** | Express + TypeScript | db_studio backend |
| **Database** | MongoDB | Existing schemas + sigmablox migration |
| **Auth** | Keycloak (MVP) → OpenPass (future) | SSO across products |
| **Real-time** | Socket.io | Already in db_studio |
| **AI** | OpenAI/Claude API | Signal processing |
| **Cache/Queue** | Redis / Upstash | Background jobs |

### Hosting (MVP — ~$0/month)

- Vercel (landing) — free tier
- Google Cloud Run (API + app) — existing db_studio setup
- MongoDB Atlas — free tier
- Upstash Redis — free tier

---

## 3. Landing Page Design

### Foundation

mc_site's index.html with enhancements inspired by OSINT Network.

### Hero Section (Full Viewport)

```
┌─────────────────────────────────────────────────────────────────────┐
│  [NAV: Logo | About | Services | Projects | Blog | Login | CTA]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│              🎬 LOOPING VIDEO BACKGROUND                            │
│         (operators in field, tech demos, tactical ops)              │
│                                                                      │
│                    ┌─────────────┐                                  │
│                    │  ANIMATED   │                                  │
│                    │    LOGO     │                                  │
│                    │   + GLOW    │                                  │
│                    └─────────────┘                                  │
│                                                                      │
│                  MERGE COMBINATOR                                   │
│           Build What Warfighters Need.                              │
│                                                                      │
│                  ↓ SCROLL TO EXPLORE                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Video Content Strategy

1. **Primary:** Stock footage (tactical, Indo-Pacific, tech demos)
2. **Supplemental:** sigmablox.com footage
3. **Showcase:** Cohort company footage — exposure for them, better content for MC
4. **Fallback:** Abstract motion graphics with particle overlay

### Scroll-Reveal Sections

As user scrolls, content fades/slides in progressively:

1. **Mission Statement** — "The builder-led venture studio for national security"
2. **The Problem** — "Threats are accelerating. Acquisition isn't keeping up."
3. **Our Approach** — 3-phase model (Discover → Build → Deploy)
4. **Defense Builders Preview** — "The marketplace for mission-critical problems"
5. **Stats** — "80+ Builders | 150+ Operators | 20+ Problem Sets"
6. **CTA** — "Enter the Platform" → login

### Design System

| Element | Value |
|---------|-------|
| **Primary BG** | Near Black (#0B0E11) |
| **Accent 1** | Signal Blue (#2A7FDB) |
| **Accent 2** | Operator Green (#5DA06F) |
| **Text** | Off-White (#F2F5F7) |
| **Glow effects** | Blue/green radial gradients |
| **Typography** | Inter (body), Space Mono (labels), Lora (accents) |
| **Animations** | Intersection Observer scroll triggers, 300ms ease transitions |

---

## 4. Defense Builders Marketplace

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│ (MC)BUILDERS    (MC)PROBLEMS    (MC)INTEL    (MC)KNOWLEDGE    Profile ▾│
├────────────────┬────────────────────────────────────────────────────────┤
│                │                                                         │
│   SIDEBAR      │              MAIN CONTENT AREA                         │
│                │                                                         │
│  ┌──────────┐  │  ┌─────────────────────────────────────────────────┐  │
│  │ FILTERS  │  │  │  Search: [________________________] [🔍]        │  │
│  │          │  │  └─────────────────────────────────────────────────┘  │
│  │ Mission  │  │                                                        │
│  │ Area     │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ □ C2     │  │  │ PROBLEM  │ │ PROBLEM  │ │ PROBLEM  │              │
│  │ □ ISR    │  │  │ CARD     │ │ CARD     │ │ CARD     │              │
│  │ □ Fires  │  │  └──────────┘ └──────────┘ └──────────┘              │
│  │ □ Cyber  │  │                                                        │
│  │          │  │                                                        │
│  │ Budget   │  │                                                        │
│  │ Timeline │  │                                                        │
│  └──────────┘  │                                                        │
└────────────────┴────────────────────────────────────────────────────────┘
```

### Problem Card Design

```
┌─────────────────────────────────────────┐
│ 🔥 URGENT                    ISR • C2   │  ← Tags
├─────────────────────────────────────────┤
│                                         │
│  Multi-Domain Sensor Fusion             │  ← Title
│  for Maritime Awareness                 │
│                                         │
│  Real-time integration of satellite,    │  ← Description
│  AIS, and SIGINT data for Indo-Pacific  │
│  maritime domain awareness...           │
│                                         │
├─────────────────────────────────────────┤
│  💰 $100K - $250K    ⏱️ 90 days         │  ← Budget & Timeline
│  🏛️ PACAF            📍 Hawaii          │  ← Sponsor & Location
├─────────────────────────────────────────┤
│  [View Details]         [Submit Bid]    │  ← Actions
└─────────────────────────────────────────┘
```

### Problem Detail Modal

Tabbed interface: Overview | Requirements | Evaluation | Q&A

Content includes:
- The Problem
- Desired Outcome
- Success Criteria
- Budget, Timeline, Clearance, Location
- Actions: Submit Proposal, Save for Later

### Builder Card Design

```
┌─────────────────────────────────────────┐
│  [COMPANY LOGO]                         │
│                                         │
│  Acme Defense Tech                      │
│  "AI-powered ISR analytics"             │
│                                         │
│  🎯 ISR • AI/ML • Analytics             │
│  📊 TRL 6 • 🔒 TS/SCI                   │
│                                         │
│  [View Profile]      [Connect]          │
└─────────────────────────────────────────┘
```

### MVP Feature Scope

**Phase 1 (Launch):**
- Problem listings (view, filter, search)
- Builder profiles (view, filter, search)
- Simple proposal submission (text + attachments)
- Admin approval workflow
- Email notifications

**Phase 2 (After Validation):**
- Bidding with pricing
- Milestone tracking
- Stripe Connect payments
- Reviews & reputation
- GPC integration

---

## 5. Intel Feed & Knowledge Base

### Intel Feed — (MC)INTEL

**Purpose:** Aggregated intelligence from Signal group + curated sources.

**Content Types:**
1. **Announcements & Intel** — Contract opps, policy updates, insider info
2. **Discussions & Q&A** — Problem-solving threads, advice
3. **Links & Resources** — Articles, tools, opportunities
4. **Networking/Intros** → Job board format

**Card Types:**

- 🔔 CONTRACT OPPORTUNITY — with deadline, amount, agency
- 💡 DISCUSSION — with reply count, key insights
- 📰 POLICY UPDATE — with source link
- 🔗 RESOURCE — with tags

**Filters:** Type | Topic | Timeframe

### Knowledge Base — (MC)KNOWLEDGE

**Purpose:** Static/curated program materials for builders.

**Structure:**
```
├── Getting Started
├── Playbooks (Contracts, SBIR, GPC, Security)
├── Technical Resources (Compliance, APIs)
└── Program Materials (Combine, Studio, FAQ)
```

**Features:**
- Markdown-based content
- Category sidebar navigation
- Search across all docs
- Reading time estimates

---

## 6. Signal Aggregator

### Pipeline Architecture

```
Signal Group
    │
    ▼
Signal Bridge (extraction)
    │
    ▼
Message Queue (Redis)
    │
    ▼
AI Processor (Claude/GPT)
  - Categorize
  - Extract entities
  - Summarize
  - Deduplicate
    │
    ▼
MongoDB (intel_items)
    │
    ▼
Intel Feed UI
```

### Extraction Methods

| Method | Description | When |
|--------|-------------|------|
| **Manual Export** | Upload Signal chat export | MVP |
| **signal-cli API** | Automated real-time ingestion | Phase 2 |

### Content Type Schemas

**Opportunity:**
```json
{
  "type": "opportunity",
  "title": "SBIR Phase II: Autonomous Maritime Systems",
  "summary": "Navy seeking proposals for...",
  "links": ["https://sam.gov/..."],
  "deadline": "2025-01-15",
  "amount": "$1.5M",
  "agency": "Navy",
  "tags": ["SBIR", "Maritime", "Autonomy"]
}
```

**Discussion:**
```json
{
  "type": "discussion",
  "title": "CMMC Level 2 certification best practices",
  "summary": "Thread about certification process...",
  "threadLength": 12,
  "keyInsights": ["Start gap assessment early", "Budget 6 months"],
  "tags": ["Compliance", "CMMC"]
}
```

---

## 7. Authentication & Roles

### Role Hierarchy

| Role | Level | Access |
|------|-------|--------|
| **Admin** | 5 | Full access |
| **Mission Owner** | 4 | Post problems, view builders, manage listings |
| **Verified Builder** | 3 | Submit proposals, view problems, full Intel Feed |
| **Member** | 2 | Limited problem view, read-only Intel Feed |
| **Guest** | 1 | Public landing page only |

### Permission Matrix

| Feature | Admin | Mission Owner | Verified Builder | Member | Guest |
|---------|-------|---------------|------------------|--------|-------|
| View landing page | ✅ | ✅ | ✅ | ✅ | ✅ |
| View problem listings | ✅ | ✅ | ✅ | Limited | ❌ |
| View problem details | ✅ | ✅ | ✅ | ❌ | ❌ |
| Submit proposals | ✅ | ❌ | ✅ | ❌ | ❌ |
| Post problems | ✅ | ✅ | ❌ | ❌ | ❌ |
| View builder directory | ✅ | ✅ | ✅ | Limited | ❌ |
| View builder contact info | ✅ | ✅ | ❌ | ❌ | ❌ |
| Intel Feed (full) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Knowledge Base | ✅ | ✅ | ✅ | ✅ | ❌ |
| Admin dashboard | ✅ | ❌ | ❌ | ❌ | ❌ |

### Application Flow

```
Guest → Apply → Member → Admin Review → Verified Builder
                              ↓
                         (or Rejected)
```

### Auth Implementation (MVP)

- Keycloak for initial launch (already configured in db_studio)
- OpenPass integration when ready
- JWT tokens with role claims
- Middleware-based permission checks

---

## 8. Data Model

### Core Collections

**users** — User accounts synced from auth provider
- openpassId, email, name, role
- profile (company, capabilities, clearances, etc.)
- application (status, reviewedBy, notes)

**problems** — Marketplace listings
- title, description, requirements
- missionArea, techDomains, clearanceRequired
- budget (min, max, type), timeline
- postedBy, organization, status

**proposals** — Builder submissions
- problemId, builderId
- approach, timeline, price, attachments
- status, reviewNotes

**intel_items** — Signal aggregated content
- type, title, summary, originalContent
- metadata (deadline, amount, agency)
- tags, source, aiConfidence

**articles** — Knowledge base content
- title, slug, content (markdown)
- category, order, author, readingTime

### Migration Strategy

- Import sigmablox users (opt-in)
- Import builder profiles from Airtable
- Leverage existing sigmablox data model patterns

---

## 9. Implementation Phases

### Day 1: Go Live (Minimal)

| Task | Owner |
|------|-------|
| Deploy mc_site landing to Vercel | Subagent |
| Deploy db_studio to Cloud Run | Subagent |
| Keep Keycloak for auth (MVP) | — |
| DNS setup | Manual |

**Deliverable:** Landing page live, marketplace app accessible.

### Day 2: Data & Users

| Task | Owner |
|------|-------|
| Sigmablox user import script | Subagent |
| Seed 3-5 real problem listings | Manual (content) |
| Builder profile import from Airtable | Subagent |
| Email notifications (SMTP) | Subagent |

**Deliverable:** Real users, real problems, functional marketplace.

### Day 3: Polish & Soft Launch

| Task | Owner |
|------|-------|
| Landing page copy updates | Subagent |
| UI consistency pass | Subagent |
| Test critical flows | Manual |
| Soft launch to sigmablox community | Manual |

**Deliverable:** Soft launch to existing community.

### Days 4-7: Rapid Iteration

- Fix bugs based on feedback
- Add Intel Feed (manual upload MVP)
- Knowledge Base shell with key docs
- OpenPass integration (when ready)

### Deferred Features

| Feature | Deferred To |
|---------|-------------|
| Splash video | Week 2+ |
| Automated Signal ingestion | Week 2+ |
| Full OSINT-style dark theme | Week 2+ |
| Payments/Stripe | When needed |
| Mission Sandbox | Future |

---

## 10. Subagent Execution Strategy

### Day 1 Parallel Execution

```
Agent 1: Deploy mc_site       Agent 2: Deploy db_studio
• Vercel setup                • Cloud Run setup
• DNS config                  • MongoDB Atlas
• SSL                         • Keycloak config

Agent 3: User Migration       Agent 4: Content Prep
• Sigmablox export script     • Problem listing templates
• Profile mapping             • Email templates
• Import validation           • Landing page copy updates
```

### Critical Path

```
Day 1 AM: Landing + App deployed
Day 1 PM: Verify auth works, basic flows
Day 2 AM: Import users + seed problems
Day 2 PM: Email notifications working
Day 3 AM: Final polish + testing
Day 3 PM: Soft launch announcement
```

---

## 11. Design Inspirations

### OSINT Network

- Full-viewport splash with animated logo
- Dark tactical theme (black + neon accents)
- Card-based tool/content grids
- Sidebar category navigation
- Gamified training (Mission Sandbox)
- Scroll-reveal text animations

### sigmablox

- Company modal system
- Role-based access control
- Filter and search patterns
- Admin dashboard
- Notes and collaboration
- Airtable sync patterns

### mc_site (current)

- Strong mission-driven messaging
- Platform overview (Discover → Build → Deploy)
- Stats and social proof
- Canvas particle animations

---

## 12. Open Questions

1. **OpenPass timeline** — When will it be ready for integration?
2. **Video content** — Source stock footage or create custom?
3. **Mission Owner onboarding** — How do we recruit government champions?
4. **Signal group consent** — Process for opt-in to content aggregation?

---

## Appendix: Reference Projects

| Project | Location | Purpose |
|---------|----------|---------|
| mc_site | ~/Dev/mc_site | Landing page, this design doc |
| db_studio | ~/Dev/db_studio | Marketplace app foundation |
| sigmablox | ~/Dev/sigmablox | User data, UI patterns, auth patterns |
| OSINT Network | dev.osintnetwork.com | Design inspiration |

---

*Document approved 2025-12-20. Ready for implementation.*
