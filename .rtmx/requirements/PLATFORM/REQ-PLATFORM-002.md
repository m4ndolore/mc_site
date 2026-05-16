# REQ-PLATFORM-002 — Weekly Site & Product Trust Review

**Category:** PLATFORM / PROCESS  
**Priority:** HIGH  
**Phase:** 12  
**Status:** BACKLOG  

## Problem

No recurring process to critically assess the site and products from an external trust perspective. Issues accumulate (off-brand pages, broken links, hedging copy, missing social proof) until they're caught ad-hoc.

## Acceptance Criteria

1. Weekly scheduled review using Stephens/Blank critical lens
2. Review covers: trust signals, copy authority, design consistency, broken links, funnel clarity, social proof freshness
3. Findings documented in RTMX as actionable requirements
4. Review cadence: every Friday or Monday (owner's preference)
5. Automated trigger (cron/scheduled agent) runs the review checklist

## Scope

- mc_site (public marketing, /access flow)
- guild.mergecombinator.com (authenticated experience)
- api.mergecombinator.com (uptime, error rates)
- Key pages: homepage, about, programs, /access, /launch

## Implementation Options

- Claude Code scheduled agent (cron) that runs the review weekly
- Manual checklist with RTMX tracking
- Hybrid: automated checks (broken links, CORS, build) + manual content review

## Notes

First review completed 2026-05-16 and surfaced 10 trust issues (REQ-CONTENT-008 through REQ-CONTENT-014, REQ-C2UX-010, REQ-UX-016, REQ-UX-017).
