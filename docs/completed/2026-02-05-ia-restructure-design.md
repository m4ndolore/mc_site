# MergeCombinator IA Restructure Design

**Date:** 2026-02-05
**Status:** Approved
**Objective:** Ship Wingman-first homepage, unified nav, and canonical routes for PR/SEO/conversion

---

## 1. Information Architecture

### Marketing/SEO Pages (mc_site / Cloudflare Pages)

```
mergecombinator.com/
├── index.html              ← Homepage (Wingman-first CTAs)
├── wingman.html            ← NEW: Wingman marketing landing
├── briefs.html             ← NEW: SEO content index
├── guild.html              ← NEW: Guild (beta) landing
├── builders.html           ← EXISTS: Defense Builders directory
├── programs/
│   ├── index.html          ← NEW: Programs overview
│   └── the-combine.html    ← NEW: Canonical Combine page
├── access.html             ← EDIT: Multi-path onboarding panel
├── combine.html            ← REDIRECT: 301 → /programs/the-combine
└── marketplace.html        ← REDIRECT: 301 → /guild
```

### Proxied Consoles (Cloudflare Worker → internal subdomains)

```
/app/*          → app.mergecombinator.com/*      (Defense Builders Mission Control)
/app/wingman/*  → wingman.mergecombinator.com/*  (Wingman console - future)
/control/*      → control.mergecombinator.com/*  (Admin Console, role-gated)
```

### Auth

```
via.mergecombinator.com     ← OIDC issuer (not marketed)
/auth/login                 ← User entry point
/auth/callback              ← Return path
```

---

## 2. Redirects

**Source of truth:** Cloudflare Worker (host-level redirects secondary)

| From | To | Type | Notes |
|------|----|------|-------|
| `/combine` | `/programs/the-combine` | 301 | Legacy route |
| `/marketplace` | `/guild` | 301 | Renamed to Guild |

### Cloudflare Worker Config (primary)

```javascript
// Add to worker redirect logic
const redirects = {
  '/combine': '/programs/the-combine',
  '/marketplace': '/guild',
};
```

### Vercel/Pages Config (secondary fallback)

```json
{
  "redirects": [
    { "source": "/combine", "destination": "/programs/the-combine", "permanent": true },
    { "source": "/marketplace", "destination": "/guild", "permanent": true }
  ]
}
```

---

## 3. Navigation

### New Structure

```
Defense Builders | Wingman | Guild | The Combine | Platform ▾ | [Sign in] [Join]
```

| Item | Route | Notes |
|------|-------|-------|
| Defense Builders | `/builders` | Existing public directory |
| Wingman | `/wingman` | NEW marketing landing |
| Guild | `/guild` | NEW beta landing |
| The Combine | `/programs/the-combine` | NEW canonical program page |
| Platform ▾ | Dropdown | See below |
| Sign in | `/auth/login` | Replaces "Access" button |
| Join | `/access` | Multi-path onboarding |

### Platform Dropdown

```
├── Status    → /status
├── Briefs    → /briefs
├── Knowledge → /knowledge
├── Docs      → docs.mergecombinator.com
```

### Footer

- Move **Merch** from nav to footer
- Keep existing footer links

---

## 4. Page Copy

### 4A. Homepage Hero (index.html)

**Keep:**
- H1: "Build What Warfighters Need."
- Subhead: "Merge Combinator is the builder-led venture studio for national security. If you're building for the Indo-Pacific mission, build with us."
- Stats, animations, everything below the fold

**Change CTAs:**

```
Primary CTA:   "Open Wingman"           → /wingman
Secondary CTA: "Join Defense Builders"  → /builders
Tertiary:      "Apply to The Combine"   → /programs/the-combine (text link)
```

---

### 4B. /wingman.html (NEW - Marketing Landing)

```html
[Badge above H1]: Turn your device into your superpower.

H1: Operationalize your conversations.

Subhead: Extract takeaways and decisions from your own data.
         Keep raw information private, surface only the brief.

Support line (smaller): Your data. Your device. Your Wingman.

---

[Section: Value Props]

• Stop drowning in notifications. Wingman surfaces what matters for your objectives.
• Wingman tracks your objectives and pulls the highest-value takeaways from your trusted sources.
• Wingman organizes your conversations around objectives, decisions, and next actions.

---

[CTA Panel]

Primary CTA:   "Request Wingman Access"        → /access
Secondary CTA: "Request a pilot for my team"   → /access
Tertiary:      "See sample briefs"             → /briefs (text link)
```

---

### 4C. /briefs.html (NEW - SEO Index)

```html
H1: Briefs

Subhead: De-attributed takeaways from trusted defense tech channels.
         Sources stay private. Insights go public.

Note (small): Summaries are non-attribution and aggregations of multiple distribution channels.

---

[Filter bar]: Mission Area ▾ | Domain ▾ | Date ▾

[Grid of brief cards]
┌─────────────────────────────────────────┐
│ INDO-PACIFIC • MARITIME                 │
│ ─────────────────────────────────────── │
│ Counter-UAS Detection Gaps in Littoral  │
│ Environments                            │
│                                         │
│ Operators report persistent blind spots │
│ in low-altitude tracking during joint   │
│ exercises. Current systems optimized    │
│ for fixed-wing threats.                 │
│                                         │
│ 3 takeaways • 2 decisions noted         │
│ Jan 2026                                │
└─────────────────────────────────────────┘

[Repeat 2-3 starter briefs]

---

[CTA Panel]

H2: Want the full brief?

Body: Join Defense Builders to access complete takeaways,
      decision context, and operator contact paths.

Primary CTA:   "Join Defense Builders"          → /access
Secondary CTA: "Submit a channel for briefing"  → /access
```

---

### 4D. /guild.html (NEW - Beta Landing)

```html
[Badge]: BETA

H1: Guild

Subhead: Where validated solutions meet funded requirements.

Body: Combine draft picks and vetted builders are listed for mission owners
      and industry partners with active needs.

---

[Status panel]
┌─────────────────────────────────────────┐
│ STATUS: Private Beta                    │
│ ─────────────────────────────────────── │
│ Currently serving Combine alumni and    │
│ select government partners.             │
│                                         │
│ Builders listed: 40+                    │
│ Active requirements: 12                 │
│ Matches made: --                        │
└─────────────────────────────────────────┘

---

[CTA Panel]

H2: Request Early Access

Primary CTA:   "Join Defense Builders"    → /access
Secondary CTA: "Apply to The Combine"     → /programs/the-combine
```

---

### 4E. /programs/index.html (NEW - Programs Overview)

```html
H1: Programs

Subhead: Structured paths from idea to deployment.

---

[Two-card grid]

┌─────────────────────────────────────────┐
│ OPEN ACCESS                             │
│ ─────────────────────────────────────── │
│ Defense Builders                        │
│                                         │
│ The platform for defense tech founders, │
│ operators, and mission owners.          │
│ Directory, briefs, and execution        │
│ workflows.                              │
│                                         │
│ [Join Defense Builders →] /access       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ SELECTION-BASED                         │
│ ─────────────────────────────────────── │
│ The Combine                             │
│                                         │
│ One week. In person. Operators validate │
│ your solution against real requirements.│
│ Funded startups and emerging tech only. │
│                                         │
│ [Apply to The Combine →]                │
│       /programs/the-combine             │
└─────────────────────────────────────────┘

---

[Bottom text]
Not sure which path? Start with Defense Builders—it's open to all.
```

---

### 4F. /programs/the-combine.html (NEW - Canonical Combine Page)

```html
[Badge]: SELECTION-BASED

H1: The Combine

Subhead: Proven validation of funded and emerging technology with the
         operators and mission owners close to the requirement.

Body: We match funded defense tech to champion problem owners.
      One week, in person. Data-backed results validated by operators.

---

[Rule box]
┌─────────────────────────────────────────┐
│ OPEN ACCESS      │ SELECTION-BASED      │
│ Defense Builders │ The Combine          │
└─────────────────────────────────────────┘

---

[Decision aid - under hero]

• Looking for partners, a team, or problems to solve? → Join Defense Builders
• Funded and need validation? → Apply to The Combine

---

Primary CTA:   "Apply to The Combine"     → [apply flow]
Secondary CTA: "Join Defense Builders"    → /access
Microcopy:     "Already participating? Sign in" → /auth/login

---

[Section: What Happens]

H2: One Week. Real Operators. Real Decisions.

Day 1-2: Problem immersion with mission owners
Day 3-4: Solution demos and operator feedback sessions
Day 5: Final presentations, match decisions, next-step commitments

---

[Section: Eligibility]

H2: Who Should Apply

• Funded or revenue-backed teams with a working product
• Emerging tech solving validated Indo-Pacific problems
• Founders who can commit to one week in person
• Teams ready for direct operator feedback

Not funded yet? Join Defense Builders first.

---

[Section: Outcomes]

H2: What You Get

• Direct validation from operators close to the requirement
• Warm intros to relevant program offices and partners (when there's fit)
• Guild listing as a Combine draft pick
• Alumni network of validated defense builders

---

[Section: Cohort History]

H2: Past Cohorts

[Grid of cohort cards - pull from existing combine.html]
Cohort 01 • Cohort 02 • Cohort 03

---

[Section: Next Session]

┌─────────────────────────────────────────┐
│ COHORT 04                               │
│ Q1 2026 • San Francisco                 │
│                                         │
│ Applications open                       │
│ [Apply Now →]                           │
└─────────────────────────────────────────┘
```

---

### 4G. /access.html (EDIT - Multi-Path Onboarding)

```html
H1: Join the Network

Subhead: Choose your path into Defense Builders.

---

[Three-path grid]

┌─────────────────────────────────────────┐
│ OPEN ACCESS                             │
│ ─────────────────────────────────────── │
│ Join Defense Builders                   │
│                                         │
│ Directory access, briefs, and execution │
│ workflows. Open to founders, operators, │
│ and mission owners.                     │
│                                         │
│ [Request Access →]                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ TEAM PILOT                              │
│ ─────────────────────────────────────── │
│ Request Wingman Access                  │
│                                         │
│ Operationalize your team's conversations│
│ Extract takeaways and decisions from    │
│ your own data. Your data. Your device.  │
│                                         │
│ [Request Pilot →]                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ CONTRIBUTE                              │
│ ─────────────────────────────────────── │
│ Submit a Channel for Briefing           │
│                                         │
│ Submit a channel for briefing           │
│ (de-attributed). Summaries are          │
│ non-attribution and aggregations of     │
│ multiple channels.                      │
│                                         │
│ [Submit Channel →]                      │
└─────────────────────────────────────────┘

---

[Below grid - selection-based callout]

┌─────────────────────────────────────────┐
│ SELECTION-BASED                         │
│ ─────────────────────────────────────── │
│ Looking for The Combine?                │
│                                         │
│ One week, in person, with operators.    │
│ For funded teams ready for validation.  │
│                                         │
│ [Apply to The Combine →]                │
│       /programs/the-combine             │
└─────────────────────────────────────────┘

---

[Footer microcopy]
Already a member? [Sign in →] /auth/login
```

---

## 5. PR Boilerplate

> **Merge Combinator** is the builder-led platform for national security technology. **Wingman** gives defense teams a way to operationalize their conversations—extracting takeaways and decisions while keeping raw data private. **Defense Builders** is the platform where founders, operators, and mission owners find each other and execute together. **The Combine** is a selection-based program that matches funded startups with the operators and mission owners close to the requirement—one week, in person, with data-backed validation.

---

## 6. Implementation Checklist

| # | Task | Type | File/Route |
|---|------|------|------------|
| 1 | Update nav on all pages | Edit | All HTML files |
| 2 | Update homepage hero CTAs | Edit | index.html |
| 3 | Create Wingman marketing page | New | /wingman.html |
| 4 | Create Briefs page | New | /briefs.html |
| 5 | Create Guild page | New | /guild.html |
| 6 | Create Programs index | New | /programs/index.html |
| 7 | Create The Combine page | New | /programs/the-combine.html |
| 8 | Restructure Access page | Edit | /access.html |
| 9 | Add redirects to worker | Config | Cloudflare Worker |
| 10 | Add fallback redirects | Config | vercel.json / _redirects |
| 11 | Move Merch to footer | Edit | All HTML files |
| 12 | Update "Access" button → "Sign in" | Edit | All HTML files |

---

## 7. Acceptance Tests

A new visitor can, in <10 seconds:

1. Understand what Wingman is and request access
2. Join Defense Builders without thinking it's the cohort
3. Find The Combine and understand it's selective
4. All PR links point to mergecombinator.com routes (no domain split)

---

## 8. Out of Scope

- VIA promotion (infrastructure, not headline product)
- New brands/domains
- Long manifesto copy on conversion pages
- Wingman console UI (lives at /app/wingman/* later)
- sigmablox.com changes (separate repo)
