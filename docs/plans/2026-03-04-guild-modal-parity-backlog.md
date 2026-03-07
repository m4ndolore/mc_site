# Guild Modal Parity Backlog (Company + Coach)

Date: 2026-03-04
Owner: Merge Combinator platform
Status: Draft backlog for implementation sequencing

## Scope
Port high-value modal/context-panel features from SigmaBlox into Guild (`guild.mergecombinator.com`) without dragging legacy complexity.

## Source Implementations Reviewed
- `apps/ghost-theme/ease/assets/js/company-modal-global.js`
- `apps/ghost-theme/ease/custom-coaches-secure.hbs`
- `apps/ghost-theme/ease/assets/js/unified-search.js`
- `apps/via-dashboard/src/components/companies/company-context-panel.tsx`
- `apps/via-dashboard/src/components/coaches/coach-context-panel.tsx`
- `apps/via-dashboard/src/components/companies/share-dialog.tsx`

## Immediate Stability
1. `P0` Builder/Coach detail route resilience
- Problem: list pages load, detail route can return `NOT_FOUND` during mixed native/legacy data states.
- Fix shipped in API worker: fallback to legacy on missing native row for `/builders/companies/:id` and `/builders/coaches/:id`.
- Validate:
  - `/builders/{id}` renders content for IDs returned by list
  - `/coaches/{id}` renders content for IDs returned by list

## Port Backlog
1. `P0` Context-panel parity for company and coach
- Add structured sectioning like SigmaBlox modal:
  - Header identity block (logo/photo, affiliation chips)
  - Focus/expertise blocks
  - Contact block with role-aware visibility
- Acceptance:
  - Trusted/internal users see contact actions
  - Restricted users see locked state with explanatory copy

2. `P0` Notes inside company/coach detail
- Add embedded notes surface equivalent to `NotesManager` behavior.
- Include quick-add and inline edit/delete in panel.
- Acceptance:
  - Create/edit/delete note persists and refreshes without page reload
  - Notes scoped by entity type + id

3. `P0` Save + Interest actions parity
- Company: Save/Favorite + Interested actions
- Coach: Save + Interested actions
- Acceptance:
  - Action state persists and reflects in UI on reopen
  - Duplicate clicks idempotent

4. `P1` Company media/actions strip
- Add CTA row for pitch deck + video section when available.
- Respect visibility policies (public/trusted/internal).
- Acceptance:
  - If media exists, CTA row renders; if not, section omitted cleanly

5. `P1` Share links workflow (admin)
- Port time-limited share link creation from `share-dialog.tsx`.
- Controls: expiry window, optional max views, copy UX.
- Acceptance:
  - Admin can create link and copy URL
  - Expiry/usage limits enforced server-side

6. `P1` Coach detail richness
- Port fields from secure coaches modal:
  - onMind
  - problem focus
  - wish list
  - topic specifics
- Acceptance:
  - Fields render only when present
  - Empty states do not create visual gaps

7. `P2` Company advanced modules
- System-layer stack visualization
- Badge-judge chips linking to coach profiles
- SAM verification module (admin/trusted workflows)
- Acceptance:
  - Modules independently togglable by flag
  - No blocking dependency for base modal launch

## Delivery Sequence
1. Stabilize detail-route behavior in production (done in API worker).
2. Implement P0 parity in Guild UI (context structure + notes + actions).
3. Add P1 media/share/coach-richness.
4. Add P2 advanced modules behind feature flags.

## Risks
- Data model mismatch between legacy payloads and Guild DTOs.
- Role semantics drift (`trusted/internal/restricted`) across services.
- UI regressions if modal behavior is copied directly instead of normalized into Guild component patterns.

## Definition of Done (Program Level)
- Company and coach detail views provide equivalent operational value to SigmaBlox modals.
- No `NOT_FOUND` for IDs sourced from current list responses.
- Notes and save/interest workflows fully operational in Guild.
- Role-aware contact gating enforced consistently in API + UI.
