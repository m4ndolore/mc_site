# REQ-DOCS-005: Docs Directory Cleanup and Migration

## Status: COMPLETE

## Requirement
Audit the /docs/ directory. Migrate completed plan/design documents to /docs/completed/. Archive old sitreps to /docs/archive/. Keep active reference docs and in-progress plans in place.

## Acceptance Criteria
1. [x] /docs/completed/ contains all fully-implemented plan and design documents
2. [x] /docs/archive/ contains all historical sitreps
3. [x] Active/reference docs remain in their current locations
4. [x] No broken internal references after migration
5. [x] Directory structure is clean and navigable

## Migration Rules
- **Completed plans** (fully implemented) → /docs/completed/
- **Old sitreps** (session reports) → /docs/archive/
- **Active reference docs** (DEPLOYMENT.md, typography.md, RULES.md) → stay in place
- **In-progress plans** → stay in place
- **Design guides** (VIDEO_BACKGROUNDS, AI_VIDEO, DIGITAL_INCUBATOR) → /docs/completed/ if implemented, else stay

## What Was Done

### Moved to /docs/archive/ (18 files)
- 13 sitrep files (sitrep-2026-01-19 through sitrep-2026-02-12)
- workspace-audit-2026-02-05.md
- backlog-ralph.md
- export.md
- 2026-02-12-opportunity-endpoint-investigation.md (from investigations/)
- via-auth-agent-2026-02-08.md (from prompts/)

### Moved to /docs/completed/ (8 files)
- 4 completed plan documents (opportunities integration, IA restructure, opportunities phase1a, unified navbar)
- VIDEO_BACKGROUNDS_DESIGN.md
- PROJECT_PLAN.md
- DIGITAL_INCUBATOR.md
- restructure.md (from refactor/)

### Kept in Place (active)
- DEPLOYMENT.md, typography.md, AI_VIDEO_GENERATION_GUIDE.md
- plans/2026-02-09-knowledge-page-design.md (in-progress)
- plans/2026-02-12-opportunities-expansion-design.md (in-progress)
- plans/merge.md (active reference)
- ai/, cloudflare/, via/, merch/, screenshots/, requirements/ subdirectories

### Cleanup
- Removed empty directories: investigations/, prompts/, refactor/
- Updated 6 path references in RTMX requirement files to reflect new locations

## Effort
~0.25 weeks
