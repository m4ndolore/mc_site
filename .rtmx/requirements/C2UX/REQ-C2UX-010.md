# REQ-C2UX-010 — Redesign /start and /founder-path with C2UX Compliance

**Category:** C2UX / DESIGN  
**Priority:** MEDIUM  
**Phase:** 12  
**Status:** BACKLOG  

## Problem

`/start` (Founder Toolkit) and `/founder-path` (triage flow) use completely off-brand design:
- Gold accent color (`--gold`) not defined in C2UX tokens
- Serif font (Lora) for headings — MC uses Inter
- Loads Google Fonts for Lora + Space Mono unnecessarily
- start.css references undefined CSS variables
- Booking link at end of founder-path points to non-existent `book.mergecombinator.com/founder`

These pages look like a different company built them.

## Acceptance Criteria

1. Remove all `--gold` references, replace with `--blue` or appropriate C2UX token
2. Remove serif font usage from headings — use Inter (--font-primary)
3. Remove Lora/Space Mono Google Fonts imports from these pages
4. Fix booking link to use Google Calendar URL: `https://calendar.app.google/caYkEhTngEyUEgDn7`
5. Rename `/founder-path` to `/launch` with 301 redirect from old URL
6. Rewrite copy to match MC voice profile (thesis-driven, decisive, no hedging)
7. Both pages pass visual consistency check against homepage/about

## Dependencies

- Content direction for /launch triage (discussed: carrier catapult metaphor, preflight sequence)
- Rename/rebrand: "Founder Path" → TBD (current working name: "Launch")
- Relationship between /start (toolkit hub) and /launch (triage) — may consolidate

## Notes

founder-path.css actually uses correct C2UX tokens (--blue, --charcoal). Main issue is start.css and the HTML font imports on both pages.
