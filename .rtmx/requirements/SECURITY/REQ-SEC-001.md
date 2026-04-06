# REQ-SEC-001: Mitigate Open Redirect on /go/:slug

## Status: BACKLOG | Priority: LOW | Phase: 11

## Requirement

The `/go/:slug` outbound redirect endpoint accepts any `url` query parameter and issues a 302 redirect. This is an open redirect that could be abused for phishing.

## Target

`/go/` rejects target URLs not matching known company domains.

## Context

Standard redirect-service risk (same as bit.ly, t.co). No abuse observed at current traffic volume.

## Options

1. **Allowlist known company domains** — Check target hostname against company data (KV lookup or in-memory set from companies.json). Adds ~1ms latency per redirect.
2. **Lightweight hostname guard** — Reject obvious bad patterns (IP addresses, known phishing TLDs). Low cost but easy to bypass.
3. **Accept risk** — Document as known limitation. Revisit if abuse appears.

## Effort

~1 week if implementing option 1.
