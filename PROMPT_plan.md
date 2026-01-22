# Ralph Planning Mode - mc_site (RTMX Integration)

0a. Study the RTMX requirements database at `.rtmx/database.csv` to understand all tracked requirements.
0b. Study `.rtmx/requirements/` with parallel subagents to understand detailed specs for each requirement.
0c. Study `docs/theme/ux.md` and `docs/ai/RULES.md` to understand design doctrine (C2UX principles).
0d. Study `docs/` for domain knowledge and past implementations.
0e. For VIA/Authentik work, study `~/.claude/skills/via-configuration/SKILL.md` for API patterns.
0f. For reference, the site source code structure:
    - Root HTML files: `*.html` (index.html, builders.html, blog.html, etc.)
    - JavaScript: `script.js`, `js/*`
    - Styles: `styles.css`, `styles/*`
    - Assets: `assets/*`, `public/*`

1. Analyze the current state of the codebase against RTMX requirements:
   - Use up to 500 Sonnet subagents to study existing source code
   - Compare implementation against `.rtmx/requirements/` specs
   - Identify gaps between requirements and current implementation
   - Use an Opus subagent to analyze findings and update `.rtmx/database.csv`:
     - Update `status` field (PENDING → PARTIAL → COMPLETE)
     - Add `notes` for discovered issues
     - Set `started_date` for work in progress
   - Ultrathink.

2. For any NEW requirements discovered:
   - Create requirement file in `.rtmx/requirements/[CATEGORY]/REQ-XXX-NNN.md`
   - Add row to `.rtmx/database.csv` with appropriate priority and phase
   - Document dependencies and blockers

IMPORTANT: Plan only. Do NOT implement anything. Do NOT assume functionality is missing; confirm with code search first.

## RTMX Database Schema

When updating `.rtmx/database.csv`, use these fields:
- `status`: PENDING | PARTIAL | COMPLETE | BLOCKED
- `priority`: CRITICAL | HIGH | MEDIUM | LOW
- `phase`: 1 | 2 | 3 | 4 (lower = sooner)
- `assignee`: claude-YYYY-MM-DD (for claimed work)
- `started_date`: YYYY-MM-DD
- `completed_date`: YYYY-MM-DD

## Current Focus Areas

Based on `.rtmx/database.csv`:
1. Phase 1: AUTH - VIA integration (REQ-AUTH-*)
2. Phase 2: CONTENT - Protected builder content (REQ-CONTENT-*)
3. Phase 3: DOCS - Knowledge base integration (REQ-DOCS-*)
4. Phase 4: C2UX - Command center evolution (REQ-C2UX-*)

Prioritize CRITICAL and HIGH items in Phase 1 first.

## ULTIMATE GOAL

We want to evolve mc_site from a marketing site to a defense ecosystem command center that:
- Uses VIA authentication (shared with SigmaBlox)
- Has protected content for authenticated users
- Integrates with docs.mergecombinator.com knowledge base
- Follows C2UX design doctrine (operational, not marketing-y)
- Works flawlessly on Cloudflare Pages
