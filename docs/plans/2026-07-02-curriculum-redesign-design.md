# Curriculum Redesign — Design

**Date:** 2026-07-02
**Status:** Validated with owner

## Why

The curriculum shipped as a React SPA bolted onto a vanilla multi-page Vite site. Every deployment failure (black screen, 404 assets, base-path conflicts, invisible text, missing data files, phantom API calls) traced back to that architecture mismatch — not the content. The working fallback (`public/curriculum.html`) was a debugging artifact with no design intent.

This redesign rebuilds the curriculum as a first-class page on the site's own architecture and design system, styled as Act II of the `/start` Founder Path triage.

## Decisions (owner-validated)

1. **UX model:** Guided mission path — one stage in focus, segmented progress bar, sticky stage rail, resource cards. Continuation of the `/start` triage pattern.
2. **Progression:** Earned advance, free peek. Advance button unlocks at 2+ engaged resources; any stage is clickable to preview. Nothing hidden from users or crawlers.
3. **Triage handoff:** Read triage answers from localStorage, map diagnosed stage → starting curriculum stage, show dismissible "started you at X" banner. Fallback: Preflight.
4. **Engagement:** Opening a resource auto-marks it engaged (new tab); check control independently toggleable.
5. **Chrome:** Standard `mc-navbar` + site footer, loaded as on every other page.

## Layout

Two-column `signals-layout` (same as `/start`), founder-path design system (`styles/founder-path.css`: `fp-pill`, `fp-card`, `fp-progress`, `fp-btn`).

- **Header:** Founder Path pill + lede.
- **Main column:** 5-segment progress bar → stage number/title/subtitle/description → single-column resource list → action row (`3 of 7 explored` + `Advance to Ready →`).
- **Sidebar (sticky):** vertical stage rail — completed ✓ / current highlighted / upcoming dimmed-clickable. Triage-call CTA block below (same as `/start`).
- **Personalization banner:** slim dismissible strip above progress bar when triage data exists.

## Components

- **Resource card row:** check control (○→✓) | title, description, meta (`DAU · 15 min · External`) | `Open ↗`. Whole card opens resource in new tab + marks engaged. Engaged state: dimmed border, blue check. No reordering.
- **Advance flow:** button disabled with helper text until 2 engaged. On click: rail ✓, next stage renders, segment fills, scroll to top. No modal, no reason capture (cut — was API-dependent).
- **Peek mode:** clicking future stage shows its resources with `Previewing — return →` strip. Engagement while peeking counts toward that stage's gate.
- **Persistence:** localStorage key `mc.curriculum.v1` = `{ currentStage, engaged: [resourceIds], startedFrom }`. Resume notice on return ("Saved on this device", `/start` pattern).
- **Triage mapping:** `visionary-no-problem`/`curious` → Preflight; `operator-with-problem`/`builder-no-problem` → Spot; `team-with-prototype` → Ready; `scaling` → Tension.

## Architecture

- **One page:** `curriculum.html` at repo root, normal Vite MPA entry (like `start.html`). Served at `/curriculum` via Pages clean URLs. No sub-build, no base paths, no `_routes.json`, no copy hacks.
- **Build-time content injection:** build step reads `data/curriculum.json` and injects all 5 stages × 29 resources as real HTML into the page (same pattern as `optimize-static.mjs` AEO injection). Crawlers see every resource as static markup. JS is progressive enhancement over the pre-rendered DOM — no fetch, no loading state.
- **Schema:** `Course` + `ItemList` JSON-LD generated at build time from the JSON.
- **Metrics:** Plausible custom events (`curriculum:advance`, `curriculum:open-resource`, triage-mapped start). No custom API; drop all `/api/curriculum/*` calls.

## Cleanup (removes the failure surface)

- Delete `curriculum/` React app directory
- Delete `public/curriculum.html`
- Delete `_routes.json`
- Revert backup/copy hacks in `package.json` `build` script

## Verification

1. `npm run build` → `dist/curriculum.html` raw HTML contains all 29 resource links and Course JSON-LD.
2. `npm run preview` → `/curriculum` renders styled, no console errors, no 404s.
3. Walk the path: complete triage on `/start` → CTA → verify mapped starting stage → engage 2 resources → advance → peek future stage → reload → verify resume.
4. Verify Plausible events fire (network tab).
