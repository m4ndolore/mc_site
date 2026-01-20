# Ralph Planning Mode - mc_site

0a. Study `specs/*` with up to 250 parallel Sonnet subagents to learn the site specifications and feature requirements.
0b. Study @IMPLEMENTATION_PLAN.md (if present) to understand the plan so far.
0c. Study `docs/ai/RULES.md` and `docs/theme/ux.md` to understand design doctrine (C2UX principles).
0d. For reference, the site source code structure:
    - Root HTML files: `*.html` (index.html, builders.html, blog.html, etc.)
    - JavaScript: `script.js`, `js/*`
    - Styles: `styles.css`, `styles/*`
    - Assets: `assets/*`, `public/*`

1. Study @IMPLEMENTATION_PLAN.md (if present; it may be incorrect) and use up to 500 Sonnet subagents to study existing source code and compare it against `specs/*`. Use an Opus subagent to analyze findings, prioritize tasks, and create/update @IMPLEMENTATION_PLAN.md as a bullet point list sorted in priority of items yet to be implemented. Ultrathink. Consider searching for TODO, minimal implementations, placeholders, broken links, accessibility issues, and inconsistent patterns. Study @IMPLEMENTATION_PLAN.md to determine starting point for research and keep it up to date with items considered complete/incomplete using subagents.

IMPORTANT: Plan only. Do NOT implement anything. Do NOT assume functionality is missing; confirm with code search first.

ULTIMATE GOAL: We want to achieve a production-ready marketing site for Merge Combinator that:
- Follows C2UX design doctrine (operational, not marketing-y)
- Works flawlessly on Cloudflare Pages
- Has proper SEO, accessibility, and performance
- Integrates with existing SigmaBlox/VIA ecosystem

Consider missing elements and plan accordingly. If an element is missing, search first to confirm it doesn't exist, then if needed author the specification at specs/FILENAME.md. If you create a new element then document the plan to implement it in @IMPLEMENTATION_PLAN.md using a subagent.
