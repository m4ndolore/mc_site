# Ralph Building Mode - mc_site (RTMX Integration)

0a. Run `cat .rtmx/database.csv` to see all requirements and their status.
0b. Study `.rtmx/database.csv` to understand current status of all requirements.
0c. Study @AGENTS.md for build/test commands and validation procedures.
0d. Update @.rtmx/STATUS.md at START: set current task, list next 5 from plan.
0e. Study `docs/theme/ux.md` for C2UX design doctrine.
0f. Study `docs/` for domain knowledge and past implementations.
0g. For VIA/Authentik work, study `~/.claude/skills/via-configuration/SKILL.md` for API patterns and debugging.

1. Select work from RTMX database:
   - Pick the highest priority PENDING or PARTIAL requirement in the lowest phase
   - Read the detailed spec from `.rtmx/requirements/[CATEGORY]/[REQ-ID].md`
   - Update `.rtmx/database.csv`: set `status=PARTIAL`, `assignee=claude-session`, `started_date=today`
   - Before making changes, search the codebase (don't assume not implemented) using Sonnet subagents

2. Implement the requirement:
   - You may use up to 500 parallel Sonnet subagents for searches/reads
   - Use only 1 Sonnet subagent for build/validation (backpressure control)
   - Use Opus subagents when complex reasoning is needed (debugging, architectural decisions)

3. Validate your work:
   - Run `npm run build` to verify no build errors
   - Visual verification: Deploy to staging (wrangler pages deploy) and manually verify, or use Cloudflare Browser Rendering if automated screenshots needed
   - If functionality is missing then it's your job to add it per the specifications. Ultrathink.

4. Update RTMX on completion:
   - Update `.rtmx/database.csv`: set `status=COMPLETE`, `completed_date=today`
   - Update the requirement file with implementation notes/sitrep
   - If tests were added, note them in the requirement file

5. Commit and push:
   - `git add -A`
   - `git commit -m "feat(REQ-XXX-NNN): <description>"`
   - `git push`

## LLM-as-Judge Visual Verification

For subjective criteria (design quality, C2UX compliance, aesthetics), use this pattern:

```
VISUAL VERIFICATION CHECKLIST:
[ ] Layout matches spec (panels, not cards)
[ ] Typography hierarchy correct (Orders > Status > Commentary)
[ ] Color palette correct (Near Black, Signal Blue, etc.)
[ ] No marketing/CMS language ("draft", "welcome", etc.)
[ ] Responsive behavior correct
[ ] No broken images or links
```

## Invariants (higher number = more critical)

1. PROHIBITED: Do NOT install, download, or use Chrome, Chromium, Puppeteer, or Playwright. Use Cloudflare Browser Rendering + Stagehand for any browser automation needs.
99999. Important: When authoring documentation, capture the why.
999999. Important: Single sources of truth, no migrations/adapters. If issues unrelated to your work appear, resolve them.
9999999. As soon as there are no build errors, create a git tag. If there are no git tags start at 0.0.0 and increment patch.
99999999. You may add extra logging if required to debug issues.
999999999. Keep `.rtmx/database.csv` current — future work depends on accurate status tracking.
9999999999. When you learn something new about how to run the site, update @AGENTS.md but keep it brief.
99999999999. For any bugs you notice, add them to `.rtmx/database.csv` as new REQ-BUG-* requirements.
999999999999. Implement functionality completely. Placeholders and stubs waste time.
9999999999999. When completing a requirement, update ALL fields in database.csv: status, completed_date, notes.
99999999999999. IMPORTANT: Keep @AGENTS.md operational only — progress notes belong in RTMX requirement files.
999999999999999. Commit messages MUST reference the REQ-ID: `feat(REQ-AUTH-001): configure VIA OAuth`
9999999999999999. IMPORTANT: Follow C2UX design doctrine from `docs/theme/ux.md`. No friendly/marketing UI patterns.
99999999999999999. IMPORTANT: Maintain @.rtmx/STATUS.md for human visibility.
    At loop START: set "Started" timestamp, "Task" to current REQ, update "Queue".
    At loop END: move completed to "Recently Completed" (keep 5), update timestamp.
    If blocked, add reason to "Blocked / Needs Human".

## RTMX Sitrep Template

When completing significant work, add a sitrep to the requirement file:

```markdown
## Sitrep - YYYY-MM-DD

**Session**: claude-YYYY-MM-DD
**Status**: COMPLETE | PARTIAL | BLOCKED

### Completed
- Item 1
- Item 2

### Remaining
- Item 1

### Blockers
- None | Description

### Next Steps
- Recommendation for next session
```
