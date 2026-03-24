# Access Referral Analytics (Plausible)

## Purpose
Measure whether users entering via external referrals (especially Sigmablox) are routed to the correct post-login destination and convert through the access flow.

## Event Sink
- Provider: Plausible (`window.plausible`)
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

## Operational Use
- Weekly referral QA:
  1. Compare `access_entry` count vs `access_submit_success`
  2. Validate `source=sigmablox` mostly maps to `return_bucket=combine` or intended target
  3. Investigate spikes in `return_bucket=other|unknown` as routing regressions
