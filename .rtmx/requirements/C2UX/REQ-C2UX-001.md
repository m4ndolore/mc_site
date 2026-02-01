# REQ-C2UX-001: Evolve Site Toward Command Center UX

## Description
Apply C2UX design doctrine to **operational pages only** (dashboards, consoles, authenticated views). Marketing homepages retain glossy branding (Anduril/Palantir style).

## Scope Clarification (2026-01-31)

**C2UX applies to:**
- `/status` - Ecosystem operations console
- `/dashboard` - Data dashboard
- `/builders` - Builder records (authenticated view)
- Authenticated operator interfaces

**C2UX does NOT apply to:**
- `/` - Marketing homepage (glossy, branded, storytelling)
- `/combine` - Program marketing page
- `/portfolio` - Portfolio showcase
- Public-facing landing pages

**Rationale:** The front door is for marketing and branding. C2UX is for operators once they're inside.

## Target
**Metric**: Operational interfaces use C2UX; marketing pages use glossy branding

## Reference
- `docs/theme/ux.md` - C2UX doctrine
- `~/.claude/skills/command-center-ui-enforcer/SKILL.md`
- SigmaBlox via-dashboard as reference

## Acceptance Criteria
- [ ] Panels not pages (data-dense layouts)
- [ ] Sharp edges, minimal border radius
- [ ] Inter font throughout
- [ ] Operational language audit complete
- [ ] Status-focused rather than story-focused
- [ ] No marketing fluff ("Welcome!", "Discover!", etc.)
- [ ] Information hierarchy: Orders > Status > Commentary

## C2UX Language Transformation

### Before (Marketing)
- "Welcome to Merge Combinator!"
- "Discover the next generation of defense innovation"
- "Learn more about our amazing companies"
- "Get started today!"

### After (Operational)
- "Merge Combinator"
- "Defense Ecosystem Status"
- "Builder Records"
- "Authenticate"

## Visual Transformation

### Typography
- Headlines: Inter Bold, tracking tight
- Body: Inter Regular
- Data: Inter Mono (for numbers, IDs)

### Colors
- Background: Near Black (#0a0a0a)
- Text: Off-white (#e5e5e5)
- Accent: Signal Blue (#3b82f6)
- Status: Green/Yellow/Red for states

### Layout
- Grid-based panels
- Minimal whitespace (dense)
- Sharp corners (0-2px radius max)
- Thin borders (1px)

## Implementation
- **Status**: COMPLETE
- **Phase**: 4
- **Priority**: MEDIUM
- **Completed**: 2026-01-30

## Validation
- **Method**: Visual Test + LLM-as-Judge
- Screenshot each page
- Evaluate against C2UX checklist
- No marketing language detected

## Dependencies
- REQ-CONTENT-002 (auth UI should be in place first)

## Sitrep - 2026-01-30

**Session**: claude-2026-01-30
**Status**: COMPLETE

### Completed

1. **CSS Design Tokens Updated** (styles.css)
   - Colors: Near Black (#0a0a0a), Off-white (#e5e5e5), Signal Blue (#3b82f6)
   - Typography: Inter-only, restrained scale (H1 max 36px, H2 max 28px)
   - Border radius: 2px max (sharp edges)
   - Spacing: Compact (section-lg 80px, section-md 60px)
   - Shadows: Minimal

2. **index.html Transformed**
   - Removed hero section with animated particles and marketing CTAs
   - Added console header with OPERATIONAL status indicator
   - Added system status bar (Mission / Region / Mode)
   - Added stats grid with operational metrics
   - Added ecosystem modules panel (Phase 01/02/03)
   - Added operational pipeline panel with 4 stages
   - Added capabilities grid (compact, data-dense)
   - Added access protocols section (entity-type-driven)
   - Added status rail (System Status, Regional Coverage, Quick Access)
   - Removed testimonials section entirely
   - Removed bento card grid marketing layout

3. **Navigation Updated** (17 pages)
   - Logo consolidated: "Merge Combinator" (removed serif "Merge")
   - "Defense Builders" → "Builder Records"
   - Removed "Merch" from navigation

4. **Language Audit**
   - "Build What Warfighters Need" → "Merge Combinator" (just the name)
   - "National Security Innovation" → "OPERATIONAL" status
   - "Watch Overview" → removed
   - "Get Involved" → "Access Protocols"
   - "Testimonials" → removed entirely
   - All CTAs use operational language: "View Module", "Request Access", "View Records"

### C2UX Compliance Verification

| Criterion | Status |
|-----------|--------|
| Panels not pages | PASS |
| Sharp edges (0-2px radius) | PASS |
| Inter font throughout | PASS |
| Operational language | PASS |
| Status-focused layout | PASS |
| No marketing fluff | PASS |
| Typography hierarchy: Orders > Status > Commentary | PASS |
| Status rail present | PASS |

### Files Changed
- `styles.css` - Design tokens updated
- `index.html` - Complete rewrite to console layout
- 17 HTML pages - Navigation updated

### Remaining
- Builders page retains light theme for content area (acceptable for data density)
- Other pages may benefit from further C2UX refinement in future iterations

### Next Steps
- REQ-C2UX-002: Ecosystem dashboard with live data integration

---

## Sitrep - 2026-01-31

**Session**: claude-session
**Status**: SCOPE REVISED

### Changes

1. **Reverted marketing pages to pre-C2UX**
   - `index.html` - Restored original marketing homepage
   - `portfolio.html` - Restored glossy portfolio showcase
   - `archive.html` - Restored
   - `opportunities.html` - Restored

2. **Preserved C2UX for operational pages**
   - Created `/status` from C2UX homepage (console view for operators)
   - `/dashboard` retains C2UX data dashboard
   - `/builders` retains C2UX builder records

3. **Unified navigation**
   - Consistent navbar across all pages
   - Platform dropdown: Status, Opportunities, Knowledge, Docs
   - Single Access button (blue, compact)

### Design Philosophy Update

> "Parts of the website are for marketing and branding" - User feedback

**Two-tier approach:**
- **Marketing tier**: Glossy homepages like Anduril/Palantir for visitors
- **Operational tier**: C2UX for authenticated operators

This preserves brand identity while providing efficient operational interfaces.
