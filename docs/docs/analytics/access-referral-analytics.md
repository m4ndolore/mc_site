# Access Referral Analytics (Plausible)

## Purpose
Measure whether users entering via external referrals (especially Sigmablox) are routed to the correct post-login destination and convert through the access flow.

## Ontology Foundation (v1)
- Schema version: `access_ontology_v1`
- Required fields on every analytics event:
  - `schema_version`
  - `session_id`
  - `journey_id`
- Core objects:
  - `access_session`
  - `referral_source`
  - `entry_context`
  - `destination_bucket`
  - `conversion_outcome`

## Event Sink
- Provider 1: Plausible (`window.plausible`)
- Provider 2: MC API ingestion endpoint (`POST /analytics/access/events`)
- Source file: `js/onboarding/MCOnboarding.jsx`
- Trigger surface: `https://mergecombinator.com/access`

## Events Emitted
1. `access_entry`
- When: initial access page load
- Props:
  - `context` (`combine|builders|wingman|guild|none`)
  - `source` (`sigmablox|none|...`)
  - `referrer_host`
  - `return_bucket` (`combine|builders|wingman|guild|mc-page|other|unknown`)

2. `access_step_view`
- When: onboarding step view changes
- Props: `step`

3. `access_journey_select`
- When: journey stage selected
- Props: `stage`

4. `access_submit_success`
- When: successful submit/provisioning flow
- Props:
  - `verified` (`yes|no`)
  - `legacy` (`yes|no`)
  - `role` (non-PII role label)

5. `access_products_done`
- When: product selection step completed
- Props: `count`

## Privacy Guardrails
- No emails, names, or raw full URLs are sent to Plausible.
- Destination is bucketed as `return_bucket` to avoid high-cardinality URL capture.

## Who Needs This Data
- Product/Growth owner: validate referral conversion and drop-off.
- Platform/Auth owner: verify routing intent (`context/source`) reaches expected destination buckets.
- Partnerships/Program owner: measure Sigmablox -> Merge handoff quality.

## How To Review
- Plausible dashboard for `mergecombinator.com`
- Filter by event: `access_entry`
- Segment by `source=sigmablox` and inspect:
  - distribution of `return_bucket`
  - downstream conversion via `access_submit_success`

## Admin Landing Zone (Guild / Mission Control)
- API summary endpoint for admin-facing cards:
  - `GET https://api.mergecombinator.com/analytics/access/summary?days=7`
- Auth: Bearer token required (VIA OIDC), role level >= 3 (`trusted`/`admin`).
- Response includes:
  - totals (`access_entries`, `access_submit_success`, `conversion_rate_pct`)
  - top `by_source`
  - top `by_return_bucket`

### Suggested Mission Control Card
- Title: `Access Referral Funnel (7d)`
- KPIs:
  - entries
  - submit_success
  - conversion_rate_pct
- Breakdowns:
  - top referral sources
  - destination bucket mix

### Integration Example
```ts
const res = await fetch('https://api.mergecombinator.com/analytics/access/summary?days=7', {
  headers: { Authorization: `Bearer ${token}` }
})
const body = await res.json()
// body.data.totals / body.data.by_source / body.data.by_return_bucket
```

## Migration Guidance (GUI-safe)
If API runtime cannot create tables, run DDL once in DB admin GUI:

```sql
CREATE TABLE IF NOT EXISTS access_analytics_raw_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  session_id TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  context TEXT,
  source TEXT,
  referrer_host TEXT,
  return_bucket TEXT,
  step TEXT,
  stage TEXT,
  verified TEXT,
  legacy TEXT,
  role TEXT,
  product_count INTEGER,
  page_path TEXT,
  request_origin TEXT,
  user_agent TEXT,
  event_ts TIMESTAMPTZ NOT NULL,
  payload JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_analytics_sessions (
  session_id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  context TEXT,
  source TEXT,
  referrer_host TEXT,
  intended_destination_bucket TEXT,
  entry_count INTEGER NOT NULL DEFAULT 0,
  step_view_count INTEGER NOT NULL DEFAULT 0,
  journey_select_count INTEGER NOT NULL DEFAULT 0,
  submit_success_count INTEGER NOT NULL DEFAULT 0,
  provision_success_count INTEGER NOT NULL DEFAULT 0,
  products_done_count INTEGER NOT NULL DEFAULT 0,
  last_step TEXT,
  last_stage TEXT,
  last_role TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Operational Use
- Weekly referral QA:
  1. Compare `access_entry` count vs `access_submit_success`
  2. Validate `source=sigmablox` mostly maps to `return_bucket=combine` or intended target
  3. Investigate spikes in `return_bucket=other|unknown` as routing regressions
