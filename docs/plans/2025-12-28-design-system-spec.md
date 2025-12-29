# Defense Builders Design System Spec

Shared Design Language for MC & DB Properties

**Created**: 2025-12-28
**Status**: Approved for implementation

---

## Brand Hierarchy

Merge Combinator (parent) and Defense Builders (portfolio venture) are sibling brands that share visual DNA but serve different purposes:

- **Merge Combinator** (mergecombinator.com): Venture studio marketing. Polished, aspirational, converts visitors to applicants/partners.

- **Defense Builders** (defensebuilders.com): Operational marketplace. Dense, functional, serves active users solving problems.

### Design Relationship

The brands should feel like they come from the same family:
- Shared color foundation (MC blues)
- Compatible typography choices
- Similar spacing rhythm

But Defense Builders pushes further toward C2UX:
- Denser layouts
- More explicit status/state
- Operational language
- Minimal decoration

### Guiding Principle

> "Marketing site sells the vision. Product site serves the mission."

MC can have hero sections, testimonials, and polish.
DB strips away anything that doesn't help users accomplish tasks.

---

## Visual Principles

### Color Approach

**Shared Foundation**
- Dark backgrounds (what MC already uses)
- MC blue as primary accent (the blue from the current hero/buttons)
- Status colors used purposefully: green=active, yellow=pending, red=error

**Key Difference**
- MC: Can use gradients, glows, decorative color
- DB: Flat colors only, color = meaning

### Typography Approach

**MC Site**: Keep current fonts (Lora headlines, Inter body, Space Mono accents)

**Defense Builders**:
- Drop Lora (too editorial)
- Inter for everything except system labels
- Space Mono for IDs, timestamps, status text (UPPERCASE)

### Border Radius

- **MC Site**: Keep current (soft, ~12px)
- **Defense Builders**: Sharp (4px max, feels like software)

### Shadows

- **MC Site**: Keep current subtle shadows and glows
- **Defense Builders**: Minimal to none - use borders for definition

*Exact token values to be validated visually during implementation*

---

## Component Patterns

### Layout Architecture

**MC Site (Marketing)**
- Page-centric, scrolling sections
- Centered content, generous whitespace
- Nav: Top sticky header (current approach works)

**Defense Builders (Product)**
- Panel-based, persistent context
- Left sidebar: workspace/navigation context
- Center: primary working surface
- Right (optional): status rail, metadata, actions
- Compact, scannable density

### Card Patterns

**MC Site Cards** (keep current)
- Decorative, hover transforms allowed
- Can include gradients, shadows
- Information display focus

**Defense Builders Cards** (OSINT Network-inspired)
- Every card is a functional unit
- Structure: Icon/Logo + Title + Description + Tags + **Action Buttons**
- Actions explicit: "Run", "View", "Contact", "Request Access"
- No hover transforms, subtle border highlight only
- Status indicator if applicable (active/pending/closed)

Example structure:
```
┌─────────────────────────────────────────────────┐
│ [Logo]  Company Name                    [STATUS]│
│         Short description of what they do       │
│         ┌──────┐ ┌──────┐ ┌──────┐             │
│         │ Tag  │ │ Tag  │ │ Tag  │             │
│         └──────┘ └──────┘ └──────┘             │
│         ┌──────────┐ ┌──────────────┐          │
│         │  View    │ │ Request Info │          │
│         └──────────┘ └──────────────┘          │
└─────────────────────────────────────────────────┘
```

### Filter/Search Patterns

**MC Site**: Current horizontal filter bar is fine

**Defense Builders**:
- Horizontal filter bar above content (like OSINT Network)
- Dropdowns for categorical filters
- Search input with immediate filtering
- Results count always visible: "Showing 24 of 89 builders"
- Optional: saved filter presets for power users

### Status & State

**MC Site**: Minimal (site is mostly static content)

**Defense Builders** (C2UX requirement):
- Every entity has visible state
- States use consistent language: Active, Pending, Under Review, Closed
- Status shown via: colored dot + text label (not color alone)
- Timestamps visible: "Updated 2h ago", "Submitted Dec 15"

---

## Language & Terminology

### Voice & Tone

**MC Site (Marketing)**
- Aspirational, confident
- Can use phrases like "Build with us", "Join the mission"
- Storytelling is appropriate
- OK: "Get Started", "Learn More", "Apply Now"

**Defense Builders (Product)**
- Direct, instructional
- State what it is, state what to do next
- No reassurance, no cheerleading
- Every label answers: "What is this?" or "What happens if I click?"

### Vocabulary Mapping

Avoid CMS/consumer terms in Defense Builders:

| Instead of... | Use... |
|---------------|--------|
| Dashboard | Operations Console, Workspace |
| Create | Submit, Register |
| Edit | Modify, Update |
| Delete | Remove, Archive |
| Post/Story | Artifact, Brief, Listing |
| Draft | Working Copy, Unvalidated |
| Publish | Release, Submit for Review |
| Invite | Provision Access, Grant Access |
| Settings | Configuration, Preferences |
| Profile | Entity Record, Organization |
| Get Started | Quick Start (numbered steps) |
| Welcome! | [just show the workspace] |
| Success! | [state what happened]: "Request submitted" |

### Button Labels

**MC Site**: Can be softer
- "Learn More", "Get Started", "Apply Now", "Build With Us"

**Defense Builders**: Action-specific
- "Submit Request", "View Details", "Request Access", "Export Data"
- "Run" (for tools), "Launch" (for workflows)
- Avoid: "Click here", "Go", "Submit" (too vague)

### Status Language

Use explicit state, not vague progress:

| Instead of... | Use... |
|---------------|--------|
| In Progress | Under Review, Awaiting Response |
| Done | Completed, Closed, Resolved |
| New | Submitted, Pending Review |
| Error | Failed: [reason] |

### Empty States

**MC Site**: Can be friendly
- "No results found. Try adjusting your filters."

**Defense Builders**: Instructional
- "No matching builders. Modify filters or clear search."
- Always suggest the next action

---

## Implementation Phases

### Phase 1: MC Site Pre-Launch (Now)

Minimal changes - ship what you have with subtle tightening:

**builders.html only:**
- [ ] Reduce card border-radius: 12px → 6px
- [ ] Tighten filter bar padding slightly
- [ ] Update results text: "Showing X builders" → "X builders active"
- [ ] Ensure CTA links point to future defensebuilders.com (or placeholder)

**No changes to:**
- Homepage, About, Blog, Portfolio
- Navigation structure
- Color palette or typography

**Goal**: Ship mc_site, don't block on design evolution

---

### Phase 2: Defense Builders Foundation (Post MC-launch)

Rebuild db_studio frontend with C2UX principles:

**Layout:**
- [ ] Implement left sidebar navigation
- [ ] Create panel-based workspace layout
- [ ] Strip cyberpunk styling (gradients, glows, purple)

**Visual:**
- [ ] Apply MC blue as accent color
- [ ] Flatten to 4px border-radius max
- [ ] Remove decorative shadows
- [ ] Implement Space Mono for system labels

**Components:**
- [ ] Redesign cards with action buttons (OSINT Network pattern)
- [ ] Build status indicators (dot + label)
- [ ] Create filter bar component

**Language:**
- [ ] Audit all copy against vocabulary mapping
- [ ] Update button labels to be action-specific
- [ ] Add explicit state to all entities

---

### Phase 3: Brand Launch (When Ready)

- [ ] Acquire/confirm defensebuilders.com
- [ ] Deploy db_studio to production domain
- [ ] Update mc_site/builders.html to link to defensebuilders.com
- [ ] Create "Powered by Merge Combinator" footer badge for DB

---

### Phase 4: Convergence (Future)

- [ ] Extract shared design tokens to documented spec (revisit colors/spacing)
- [ ] Consider shared component library if both go React
- [ ] Backport successful DB patterns to mc_site/builders if appropriate

---

## References

- **C2UX Doctrine**: `docs/theme/ux.md`
- **OSINT Network**: Screenshots in `docs/screenshots/` - reference for operational UI patterns
- **Current MC Site**: `index.html`, `styles.css`
- **Current DB Studio**: `/Users/paulgarcia/Dev/db_studio/frontend/`
