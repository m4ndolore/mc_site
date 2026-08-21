# Cohort Recognition Promoter — mc-content → mc_site pipeline spec

**Date:** 2026-08-21
**Status:** Pipeline implemented · ledger intentionally empty · first candidate declined
**Sibling to:** `docs/promote-signal-workflow.md` · `scripts/promote-signal.mjs`

How a third-party award earned by a Combine company gets from mc-content's
research output onto this site — and, just as importantly, which awards never
make it.

---

## 1. Direction of travel (non-negotiable)

```
  mc-content                        mc_site
  ──────────                        ───────
  research + verify                 pull the artifact
  write handoff artifact    ──▶     validate it
  (published/*.json)                vet the awarder
                                    merge into the ledger
                                    render through its own deploy
```

**mc_site pulls. mc-content never pushes.** mc-content does not write to this
repo, does not open PRs here, does not trigger this deploy, and holds no
credential that would let it. This repo reads the artifact as plain input, the
same way `promote-signal.mjs` reads a markdown draft.

### Why not a GitHub Action that pushes across repos

This was considered and **explicitly refused**. Two independent reasons, either
one sufficient:

1. **mc-content's `CLAUDE.md` forbids it.** That firewall is the whole reason
   the two repos can move at different speeds without one breaking the other.
   A cross-repo push job is precisely the thing the rule names.
2. **We have already taken prod down this way.** A pipeline that writes into the
   site repo means content-side automation can ship to `mergecombinator.com`
   with no build gate and no human in the path. That is the failure mode, not a
   hypothetical one.

The cost of pulling instead is one deliberate command. That is the correct
price.

**Corollary for any agent working in this repo:** if a future task asks you to
add a workflow, bot, token, or webhook that lets mc-content write here, the
answer is no. Point at this section. The artifact contract below is the
supported integration surface.

---

## 2. Why a separate ledger and not `companies.json`

`npm run build` is `seed → enrich → curriculum:inject → optimize → vite build`.
The `seed` step **overwrites `public/data/companies.json` wholesale** from the
upstream SigmaBlox API (and writes an *empty* fallback if the API is
unreachable). Anything hand-written into that file is destroyed on the next
build — silently, and most likely mid-deploy.

So recognition lives in **`public/data/recognition.json`**, keyed by company id,
merged onto companies at render time. The ledger survives every re-seed.

Matching is by stable `id`, falling back to a normalized company name, so a
re-seed that reissues ids downgrades to a warning instead of silently dropping
a partner's award.

---

## 3. The publishing standard — what we will not publish

**This is the load-bearing section. Read it before adding a record.**

Verifying that an award *was really announced* is not the same as verifying the
awarder is *worth citing*. Those are two different checks, and the first one
passing tells you nothing about the second. The pipeline's first candidate
cleared fact-checking cleanly and was still declined.

A large commercial industry exists to sell recognition. The pattern is
consistent: one operator clones a program across verticals, opens a wide
lattice of "X of the Year" slots, solicits nominations, and hands each winner a
press-release asset and a badge image. Nothing about it is necessarily
fraudulent — the ceremony is real, the winners are real companies — but the
award is a **marketing product, not evidence**. Publishing one spends MC's
credibility inside someone else's funnel.

This also follows directly from `assets/branding/voice-profile.md`, which is
the site's own standard:

> **Grounded.** Every assertion ties to a deployment, program, exercise, budget
> line, or field signal.

> **Authority Markers** — Always prefer: named systems, named commands, named
> acquisition pathways, real appropriations, deployment evidence, combat or
> exercise outcomes.

> Let selectivity and momentum speak through **specifics, not claims**.

A vendor award is none of those things. When in doubt, the question is not
"did they win it?" but **"would an operator or a program office weigh this?"**

### The gate

Every record must carry an `awarderProfile` filled in by a human who looked at
the awarding body. None of it can be derived from the award itself, and
**"unknown" fails — silence is not a pass.**

| Field | Rule |
| --- | --- |
| `independent` | must be `true` — independent of the recipient and of paid placement |
| `selectionBasis` | must be `measured-performance`, `expert-panel`, or `peer-review`. `editorial`, `nomination-only`, and `unknown` are rejected |
| `entryFee` | must be `none`. `paid` and `unknown` are both rejected |
| `methodologyUrl` | https link to the **published** judging methodology — an unpublished methodology is not verifiable |
| `vettedBy` / `vettedOn` | who assessed the awarder, and when |

Plus a **declined-operator list** in `promote-recognition.mjs`, matched loosely
against the awarder name so sibling brands from the same shop are caught. When
you assess a new operator, add it there *and* record the reasoning here.

### Declined operators

**Tech Breakthrough** — assessed 2026-08-21. Runs AI Breakthrough, IoT
Breakthrough, FinTech Breakthrough, MedTech Breakthrough, BioTech Breakthrough,
and Data Breakthrough in parallel: the same program cloned per vertical, each a
wide lattice of "X of the Year" slots. The 2026 AI program claimed 5,000+
nominations from 20+ countries but publishes no winner count, no judging panel,
and no methodology.

To be fair to them: we found **no evidence** that they charge to enter or to
win, and **no documented allegations** against them. Real companies appear in
their winner lists — NVIDIA, Dell, AMD, Qualcomm, Snowflake, Intuit, Okta.
The decline is not an accusation of fraud. It is that the program cannot
satisfy the gate above — nomination-solicited, methodology unpublished — and
therefore is not something this site will cite as evidence.

### The declined worked example

`scripts/data/recognition-handoff.rejected-example.json` is the real Alitheon
submission as received, kept deliberately. It serves as the schema contract
*and* as the gate's regression case:

```bash
node scripts/promote-recognition.mjs --in scripts/data/recognition-handoff.rejected-example.json
# expect: non-zero exit, provenance failure
```

---

## 4. The handoff artifact contract

mc-content writes one JSON file per recognition.

```jsonc
{
  "id": "example-benchmark-2026",           // required · stable slug, the merge key
  "companyId": "cmk…",                      // strongly preferred · id from companies.json
  "companyName": "Example, Inc.",           // required · fallback match + display
  "kind": "award",                          // default "award"
  "product": "ExampleProduct",              // optional · what was recognized
  "category": "Top-scoring authentication system",  // required · exact award name
  "awarder": "Example Standards Body",      // required · who granted it
  "program": "2026 Authentication Benchmark", // optional
  "edition": "3rd annual",                  // optional
  "announcedDate": "2026-06-26",            // required · YYYY-MM-DD
  "badgeLabel": "Example Benchmark 2026",   // optional · short badge text
  "badgeTitle": "…",                        // optional · badge tooltip
  "summary": "…",                           // optional · one sentence, no superlatives
  "attribution": "independent",             // required to be "independent" if present
  "awarderProfile": {                       // REQUIRED — see §3
    "independent": true,
    "selectionBasis": "measured-performance",
    "entryFee": "none",
    "methodologyUrl": "https://example.org/benchmark/methodology",
    "vettedBy": "Paul Garcia",
    "vettedOn": "2026-08-21"
  },
  "sources": [                              // required · at least one, https only
    { "title": "…", "url": "https://…", "publisher": "…",
      "date": "2026-06-26", "primary": true }
  ],
  "verifiedOn": "2026-08-21",               // optional · when a human last checked the link
  "handoff": { "repo": "mc-content", "entry": "…", "brief": "…" }
}
```

A `{ "recognitions": [ … ] }` envelope is also accepted for batches.

### Validation gates (hard failures — nothing is written)

| Gate | Rule |
| --- | --- |
| Required fields | `id`, `companyName`, `category`, `awarder`, `announcedDate` |
| Date format | `YYYY-MM-DD`, on `announcedDate` and `vettedOn` |
| Sourcing | ≥1 source, every `url` **https** — an unsourced award is not publishable |
| Attribution | `attribution` must be `"independent"` if present |
| **Awarder provenance** | **full `awarderProfile`, passing every rule in §3** |
| **Declined operator** | **awarder must not match the declined list** |
| Company resolution | must match a company already in `companies.json` |
| Ambiguity | a name matching >1 company fails; disambiguate with `companyId` |
| Collision | an existing `id` fails unless `--force` |

Fields outside the contract are dropped on merge. `awarderProfile` is persisted
into the ledger so a later reader can re-audit why an awarder was accepted.

---

## 5. Runbook

```bash
# 1. Preview — validates, vets the awarder, prints the staged record, writes nothing
node scripts/promote-recognition.mjs --in ../mc-content/published/<entry>.json --dry-run

# 2. Merge into public/data/recognition.json
npm run recognition:promote -- --in ../mc-content/published/<entry>.json
#    (add --force only to intentionally replace an existing record)

# 3. Regenerate the company pages that carry the badge
node scripts/optimize-static.mjs

# 4. Check it
npm run lint
npx vite build && npx vite preview     # then look at the card and the page

# 5. Re-validate the whole ledger (CI, and after a re-seed or a gate change)
npm run recognition:verify
```

> **Do not run the full `npm run build` without live seed credentials.** The
> `seed` step will replace `companies.json` with an empty fallback and the
> recognition merge will silently match nothing.

`--verify` applies the current gate to every committed record, so tightening the
standard retroactively flags anything already published that no longer clears
it. Run it after any change to §3.

Commit the ledger and the regenerated `companies/*.html` **together**.

---

## 6. What renders, and where

| Surface | Rendered by | Output |
| --- | --- | --- |
| `/combine/cohort25-1` card | `js/combine/cohort.js` (runtime fetch) | amber award block under the product name |
| `/companies/<slug>` header | `optimize-static.mjs` → `buildMetaBadges` | award badge, **first** in the badge row |
| `/companies/<slug>` body | `optimize-static.mjs` → `renderRecognitionHtml` | "Recognition" section: award, subject, date, source link, disclaimer |
| `/companies/<slug>` JSON-LD | `optimize-static.mjs` → `buildAwardJsonLd` | `"award": ["<category>, <program>"]` on the Organization |

Both readers fail soft: a missing or empty `recognition.json` yields no badges
rather than a broken grid. With the ledger empty, every generated page is
byte-identical to its pre-pipeline output.

---

## 7. Editorial posture

- **MC takes no credit.** The company won it. Every surface names the granting
  body and links the source. The standing disclaimer:
  *"Awarded independently of Merge Combinator. We had no role in the nomination
  or selection — we are only noting a cohort company's work being recognized."*
- **Partner-first.** Tell the company the page is live **before** anything goes
  out on a channel. They lead their own news; we amplify.
- **Accurate over flattering.** Use the award's exact category name. No
  "prestigious", no "beat out thousands" unless the awarding body said it and
  the source says it. Numbers only with a link.
- **The badge is usually the weakest thing you could say about a company.**
  Alitheon's real substance was already in `companies.json` and hits every
  authority marker the voice profile names: 2 USAF and 1 Army SBIR Phase II,
  100% accuracy in DoD tests, 59 patents, TRL 7, Tradewinds. An award of
  uncertain provenance adds nothing to that and imports risk. Check whether the
  company's own record already says it better.
- **Recency is a real constraint.** A win that is two months old is fine for an
  evergreen site badge and wrong for a "just won" social post. A stale win needs
  a current news peg before it goes out.

**Site badge and social post are separate decisions with separate clocks.** The
promoter handles only the first. Nothing in this pipeline posts anywhere.

---

## 8. Current state

| Item | Status |
| --- | --- |
| `public/data/recognition.json` | live · **0 records** |
| `scripts/promote-recognition.mjs` | implemented · provenance gate tested against declined, honest-bad, and passing inputs |
| Alitheon — "Overall Authentication Solution of the Year", 2026 AI Breakthrough Awards | **declined** — see §3. Facts verified; awarder does not clear the gate. Retained as the rejected worked example |
| Rendered output | no badges anywhere; `companies/alitheon.html` byte-identical to pre-pipeline |
| LinkedIn draft (mc-content) | **do not post** — the underlying award was declined here |

The pipeline ships with an empty ledger on purpose. It is infrastructure plus a
standard, waiting for a recognition that earns publication.

---

## 9. Open items

1. **`recognition:verify` in CI.** Cheap guard against a re-seed reissuing ids
   and orphaning a record, and against a gate change invalidating a published
   one. Kept out of `npm run build` on purpose: a hard failure there would block
   a deploy over a content-data problem.
2. **A program-milestone ledger is probably the better instrument.** SBIR Phase
   II awards, contract vehicles, ATOs, and test results are the authority
   markers the voice profile actually names, and they are verifiable against
   government sources rather than a press release. The schema here would need a
   `kind: "program-milestone"` branch and different renderer copy. Worth doing
   before chasing more vendor awards.
3. **`/builders` directory cards** do not show award badges
   (`buildCompanyCard`). Deliberate — revisit only if the ledger ever carries
   more than a handful of records.
