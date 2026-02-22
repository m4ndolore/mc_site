# REQ-DOCS-007: RTMX Database and Requirement File Sync Hygiene

## Metadata
- **Status**: PENDING
- **Priority**: LOW
- **Phase**: 8
- **Effort**: 0.25 weeks
- **Dependencies**: None

## Requirement
Add a lightweight RTMX hygiene workflow to keep `.rtmx/database.csv` and `.rtmx/requirements/**/*.md` synchronized and reduce orphan rows/files and local drift confusion.

## Acceptance Criteria
- [ ] Defined reconciliation procedure (manual checklist or script) for DB rows vs files
- [ ] Orphan row/file detection is documented
- [ ] Team workflow notes specify when to update DB and requirement markdown together
- [ ] At least one hygiene pass is completed after documenting the process

## Validation
- Spot-check categories for row/file parity
- Confirm new requirements added in the same session exist in both DB and files

## Notes
- Trigger for this requirement: repeated sessions with DB entries created before matching files.
