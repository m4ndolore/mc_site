# REQ-SEC-002: Secure Outbound Click Ingest Endpoint

## Status: BACKLOG | Priority: LOW | Phase: 11

## Requirement

`POST /analytics/outbound/event` has no authentication. It skips Origin checks for server-to-server calls from mc-router. Any client can POST arbitrary click data.

## Target

The ingest endpoint validates caller identity or enforces rate limits.

## Context

The endpoint follows the same pattern as `POST /analytics/access/events`. Click count inflation is non-critical data — it doesn't affect user-facing functionality.

## Options

1. **Shared secret header** — mc-router sends `X-Internal-Secret: <value>`, mc-api validates. Simple, effective.
2. **CF rate limiting** — Apply per-IP rate limit via CF WAF rule. No code change needed.
3. **Accept risk** — Inflated counts are non-critical at current scale.

## Effort

~0.5 weeks for option 1.
