# REQ-C2UX-001: Evolve Site Toward Command Center UX

## Description
Transform mc-site from a marketing site to an operational command center interface following C2UX design doctrine.

## Target
**Metric**: Operational interface replacing marketing patterns

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
- **Status**: PENDING
- **Phase**: 4
- **Priority**: MEDIUM

## Validation
- **Method**: Visual Test + LLM-as-Judge
- Screenshot each page
- Evaluate against C2UX checklist
- No marketing language detected

## Dependencies
- REQ-CONTENT-002 (auth UI should be in place first)
