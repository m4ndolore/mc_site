# REQ-DOCS-007: RTMX Database and Requirement File Sync Hygiene

## Metadata
- **Status**: PARTIAL
- **Priority**: LOW
- **Phase**: 8
- **Effort**: 0.25 weeks
- **Dependencies**: None

## Requirement
Add a lightweight RTMX hygiene workflow to keep `.rtmx/database.csv` and `.rtmx/requirements/**/*.md` synchronized and reduce orphan rows/files and local drift confusion.

## Acceptance Criteria
- [x] Defined reconciliation procedure (manual checklist or script) for DB rows vs files
- [x] Orphan row/file detection is documented
- [x] Team workflow notes specify when to update DB and requirement markdown together
- [x] At least one hygiene pass is completed after documenting the process
- [ ] Add a lightweight recurring check in normal session workflow (to prevent re-drift)

## Validation
- Spot-check categories for row/file parity
- Confirm new requirements added in the same session exist in both DB and files

## Notes
- Trigger for this requirement: repeated sessions with DB entries created before matching files.
- Hygiene pass completed on 2026-03-13:
  - Created missing requirement files referenced by DB rows:
    - `REQ-BUG-017`
    - `REQ-AUTH-006`
    - `REQ-UX-012`
    - `REQ-UX-013`
    - `REQ-UX-014`
    - `REQ-UX-015`
