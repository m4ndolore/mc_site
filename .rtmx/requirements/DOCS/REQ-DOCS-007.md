# REQ-DOCS-007: RTMX Database and Requirement File Sync Hygiene

## Metadata
- **Status**: COMPLETE
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
- [x] Add a lightweight recurring check in normal session workflow (to prevent re-drift)
- [x] Normalize malformed `database.csv` rows so validator passes cleanly

## Validation
- Spot-check categories for row/file parity
- Confirm new requirements added in the same session exist in both DB and files
- Run `python3 scripts/validate-rtmx.py`

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
- Structural follow-up started on 2026-03-31:
  - Added strict validator at `scripts/validate-rtmx.py`
  - Updated `.rtmx/config.yaml` to match active categories and phases
  - Re-ranked `STATUS.md` around the platform ship gate and human-blocked infra gate
  - Normalized malformed CSV rows in `.rtmx/database.csv`
  - `python3 scripts/validate-rtmx.py` passes cleanly
