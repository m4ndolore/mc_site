# REQ-DOCS-004: Review Docs and Archive Completed Tasks

## Metadata
- **Status**: PENDING
- **Priority**: MEDIUM
- **Phase**: 5
- **Effort**: 0.25 weeks
- **Dependencies**: None
- **Blocks**: None

## Requirement
Review all project documentation (sitreps, requirement files, RTMX database) and archive completed tasks. Ensure docs reflect current state, remove stale references, and consolidate completed work into summary records.

## Scope
1. Review sitrep files in `docs/` for accuracy against current state
2. Archive completed requirements — mark COMPLETE with dates in database.csv
3. Close out stale PARTIAL items that are resolved
4. Remove or update outdated notes and references
5. Verify requirement files match database.csv status

## Acceptance Criteria
- [ ] All COMPLETE requirements have `completed_date` set in database.csv
- [ ] Sitrep files reflect actual delivered state
- [ ] No stale "pending commit" or "in progress" notes for finished work
- [ ] RTMX `status` output is clean and accurate
- [ ] Archived items have summary notes documenting what was delivered

## Validation
- `rtmx status` shows accurate counts
- `rtmx health` passes with no warnings
