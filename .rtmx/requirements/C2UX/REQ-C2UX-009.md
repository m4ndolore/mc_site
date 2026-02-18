# REQ-C2UX-009: SigmaBlox Modal Refactor (Builders + Access)

## Status: COMPLETE

## Requirement
Apply the SigmaBlox "command plane" modal treatment to builder modals and access page drawers. Sharp edges, framed rows, operational typography hierarchy. Unify modal controls and buttons to command semantics.

## Acceptance Criteria
1. [x] Builder detail modals use C2UX modal treatment (sharp edges, framed data rows)
2. [x] Access page request drawer uses same modal pattern
3. [x] Modal controls use operational language (consistent with nav: "Terminate", "Execute")
4. [x] Typography hierarchy follows C2UX doctrine (Inter, restrained scale)
5. [x] No rounded corners > 2px on modal elements
6. [x] Responsive — modals work on mobile

## Changes Made
- **`styles/access.css`**: Fixed 6x `border-radius: 4px` → `2px` (access-member, access-card, access-callout, request-drawer error, error-icon). Added framed row pattern to `.request-drawer__field` (bordered container, focus-within highlight). Inputs changed to transparent bg with bottom-border-only inside frames.
- **`styles/builders.css`**: Converted `.modal-details` from flex-wrap to 2-column grid layout (framed rows with internal borders). `strong` labels now uppercase block-level (9px, letter-spacing 0.1em). Mobile stacks to 1 column at 640px.
- **`js/builders/components.js`**: "Watch Video" → "View Demo" (operational language).

## Note
Other pages (briefs, knowledge, wingman, guild, programs) have `border-radius: 4-8px` violations but are outside scope of this requirement. A site-wide border-radius audit could be a follow-up.

## Target Files
- `styles/builders.css` — modal styling
- `js/builders/components.js` — modal rendering
- `styles/access.css` — request drawer styling

## Dependencies
- REQ-C2UX-001 (C2UX design applied) — COMPLETE

## Source
- `docs/archive/backlog-ralph.md`

## Effort
~1 week
