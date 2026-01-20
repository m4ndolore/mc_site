# Ralph Building Mode - mc_site

0a. Study `specs/*` with up to 500 parallel Sonnet subagents to learn the site specifications.
0b. Study @IMPLEMENTATION_PLAN.md.
0c. Study @AGENTS.md for build commands and validation procedures.
0d. For reference, the site source code structure:
    - Root HTML files: `*.html` (index.html, builders.html, blog.html, etc.)
    - JavaScript: `script.js`, `js/*`
    - Styles: `styles.css`, `styles/*`
    - Assets: `assets/*`, `public/*`

1. Your task is to implement functionality per the specifications using parallel subagents. Follow @IMPLEMENTATION_PLAN.md and choose the most important item to address. Before making changes, search the codebase (don't assume not implemented) using Sonnet subagents. You may use up to 500 parallel Sonnet subagents for searches/reads and only 1 Sonnet subagent for build/validation. Use Opus subagents when complex reasoning is needed (debugging, architectural decisions).

2. After implementing functionality or resolving problems, run validation:
   - Run `npm run build` to verify no build errors
   - Use Playwright MCP (Chromium) to visually verify your changes:
     a. Start dev server: `npm run dev` (runs on localhost:5173)
     b. Use `mcp__playwright__browser_navigate` to load the page
     c. Use `mcp__playwright__browser_take_screenshot` to capture the result
     d. Save screenshots to `.playwright-mcp/` for audit trail
     e. Apply LLM-as-judge: Does the visual output match the spec? Binary pass/fail.
   - If functionality is missing then it's your job to add it per the specifications. Ultrathink.

3. When you discover issues, immediately update @IMPLEMENTATION_PLAN.md with your findings using a subagent. When resolved, update and remove the item.

4. When validation passes (build succeeds + visual verification passes), update @IMPLEMENTATION_PLAN.md, then `git add -A` then `git commit` with a message describing the changes. After the commit, `git push`.

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

If any check fails, fix before committing. Document failures in @IMPLEMENTATION_PLAN.md.

## Invariants (higher number = more critical)

99999. Important: When authoring documentation, capture the why.
999999. Important: Single sources of truth, no migrations/adapters. If issues unrelated to your work appear, resolve them as part of the increment.
9999999. As soon as there are no build errors, create a git tag. If there are no git tags start at 0.0.0 and increment patch by 1.
99999999. You may add extra logging if required to debug issues.
999999999. Keep @IMPLEMENTATION_PLAN.md current with learnings using a subagent — future work depends on this to avoid duplicating efforts. Update especially after finishing your turn.
9999999999. When you learn something new about how to run the site, update @AGENTS.md using a subagent but keep it brief.
99999999999. For any bugs you notice, resolve them or document them in @IMPLEMENTATION_PLAN.md using a subagent even if unrelated to current work.
999999999999. Implement functionality completely. Placeholders and stubs waste time.
9999999999999. When @IMPLEMENTATION_PLAN.md becomes large, periodically clean out completed items using a subagent.
99999999999999. If you find inconsistencies in the specs/* then use an Opus 4.5 subagent with 'ultrathink' to update the specs.
999999999999999. IMPORTANT: Keep @AGENTS.md operational only — status updates and progress notes belong in `IMPLEMENTATION_PLAN.md`. A bloated AGENTS.md pollutes every future loop's context.
9999999999999999. IMPORTANT: Follow C2UX design doctrine from `docs/theme/ux.md`. No friendly/marketing UI patterns.
