# Cohort Recognition Promoter — mc-content → mc_site pipeline spec

**Date:** 2026-08-21
**Status:** Implemented (Alitheon record live)
**Sibling to:** `docs/promote-signal-workflow.md` · `scripts/promote-signal.mjs`

How a third-party award earned by a Combine company gets from mc-content's
research output onto this site, accurately and without mc_site claiming credit
it did not earn.

---

## 1. Direction of travel (non-negotiable)

```
  mc-content                        mc_site
  ──────────                        ───────
  research + verify                 pull the artifact
  write handoff artifact    ──▶     validate it
  (published/*.json)                merge into the ledger
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

## 3. The handoff artifact contract

mc-content writes one JSON file per recognition. Reference copy of the shape
lives at **`scripts/data/recognition-handoff.example.json`** (the Alitheon
record as received).

```jsonc
{
  "id": "alitheon-ai-breakthrough-2026",   // required · stable slug, the merge key
  "companyId": "cmknqiij4001rs601wdwnh82m",// strongly preferred · id from companies.json
  "companyName": "Alitheon, Inc.",         // required · fallback match + display
  "kind": "award",                         // default "award"
  "product": "FeaturePrint",               // optional · what was recognized
  "category": "Overall Authentication Solution of the Year",  // required · exact award name
  "awarder": "AI Breakthrough Awards",     // required · who granted it
  "program": "2026 AI Breakthrough Awards",// optional · program as named in the release
  "edition": "9th annual",                 // optional
  "year": 2026,                            // optional · derived from announcedDate
  "announcedDate": "2026-06-26",           // required · YYYY-MM-DD
  "badgeLabel": "AI Breakthrough 2026",    // optional · short badge text
  "badgeTitle": "…",                       // optional · badge tooltip
  "summary": "…",                          // optional · one sentence, no superlatives
  "attribution": "independent",            // required to be "independent" if present
  "attributionNote": "…",                  // optional · overrides the default disclaimer
  "sources": [                             // required · at least one, https only
    { "title": "…", "url": "https://…", "publisher": "GlobeNewswire",
      "date": "2026-06-26", "primary": true }
  ],
  "verifiedOn": "2026-08-21",              // optional · when a human last checked the link
  "handoff": { "repo": "mc-content", "entry": "…", "brief": "…" }
}
```

A `{ "recognitions": [ … ] }` envelope is also accepted for batches.

### Validation gates (hard failures — nothing is written)

| Gate | Rule |
| --- | --- |
| Required fields | `id`, `companyName`, `category`, `awarder`, `announcedDate` |
| Date format | `YYYY-MM-DD`, on `announcedDate` and `verifiedOn` |
| Sourcing | ≥1 source, every `url` **https** — an unsourced award is not publishable |
| Attribution | `attribution` must be `"independent"` if present |
| Company resolution | must match a company already in `companies.json` — the promoter never invents a company |
| Ambiguity | a name matching >1 company fails; disambiguate with `companyId` |
| Collision | an existing `id` fails unless `--force` |

Fields outside the contract are dropped on merge — the artifact can carry
mc-content's own bookkeeping without it leaking onto the site.

---

## 4. Runbook

```bash
# 1. Preview — validates and prints the staged record, writes nothing
node scripts/promote-recognition.mjs --in ../mc-content/published/<entry>.json --dry-run

# 2. Merge into public/data/recognition.json
npm run recognition:promote -- --in ../mc-content/published/<entry>.json
#    (add --force only to intentionally replace an existing record)

# 3. Regenerate the company pages that carry the badge
node scripts/optimize-static.mjs

# 4. Check it
npm run lint
npx vite build && npx vite preview     # then look at the card and the page

# 5. Re-validate the whole ledger (also useful in CI / after a re-seed)
npm run recognition:verify
```

> **Do not run the full `npm run build` without live seed credentials.** The
> `seed` step will replace `companies.json` with an empty fallback and the
> recognition merge will silently match nothing.

Commit the ledger and the regenerated `companies/*.html` **together** — they
are one change.

---

## 5. What renders, and where

| Surface | Rendered by | Output |
| --- | --- | --- |
| `/combine/cohort25-1` card | `js/combine/cohort.js` (runtime fetch) | amber award block under the product name |
| `/companies/<slug>` header | `scripts/optimize-static.mjs` → `buildMetaBadges` | `AI Breakthrough 2026` badge, **first** in the badge row |
| `/companies/<slug>` body | `optimize-static.mjs` → `renderRecognitionHtml` | "Recognition" section: award, subject, date, source link, disclaimer |
| `/companies/<slug>` JSON-LD | `optimize-static.mjs` → `buildAwardJsonLd` | `"award": ["<category>, <program>"]` on the Organization |

Both readers fail soft: a missing or malformed `recognition.json` yields no
badges rather than a broken grid.

---

## 6. Editorial posture

This is the part that is not code, and it is the part that matters.

- **MC takes no credit.** The company won it. Every surface names the granting
  body and links the source. The standing disclaimer:
  *"Awarded independently of Merge Combinator. We had no role in the nomination
  or selection — we are only noting a cohort company's work being recognized."*
  The `attribution: "independent"` gate exists so this ledger can never quietly
  become a place where MC lists things it claims to have caused.
- **Partner-first.** Tell the company the page is live **before** anything goes
  out on a channel. They lead their own news; we amplify.
- **Accurate over flattering.** Use the award's exact category name. No
  "prestigious", no "beat out thousands" unless the awarding body said it and
  the source says it. Numbers only with a link.
- **Recency is a real constraint.** The Alitheon award was announced
  2026-06-26 — roughly eight weeks before this record was published. That is
  fine for an evergreen site badge and **wrong** for a "just won" social post.
  A stale win needs a current news peg before it goes out. The LinkedIn draft
  is parked in mc-content's `drafts/social/linkedin/` for exactly this reason;
  it should not ship on a "congrats, just announced" framing.

**Site badge and social post are separate decisions with separate clocks.** The
promoter deliberately handles only the first. Nothing in this pipeline posts
anywhere.

---

## 7. Current state

| Item | Status |
| --- | --- |
| `public/data/recognition.json` | live · 1 record |
| Alitheon — Overall Authentication Solution of the Year, 2026 AI Breakthrough Awards (announced 2026-06-26) | rendering on card + company page + JSON-LD |
| `scripts/promote-recognition.mjs` | implemented, validation gates tested |
| LinkedIn draft | parked in mc-content · **needs a news peg before posting** |

### Verification notes

The award facts were confirmed against the GlobeNewswire release and the AI
Breakthrough Awards winners listing. Direct page fetches were blocked by this
environment's egress proxy, so the wording was confirmed from search-result
summaries of those two sources plus the dated release URL. **Before the next
promotion, open the primary source link and re-read it** — that is what
`verifiedOn` is for.

---

## 8. Open items

1. **`recognition:verify` in CI.** Cheap guard against a re-seed reissuing ids
   and orphaning a record. Kept out of `npm run build` on purpose: a hard
   failure there would block a deploy over a content-data problem.
2. **`/builders` directory cards** do not show award badges yet
   (`buildCompanyCard` in `optimize-static.mjs`). Deliberate — the badge earns
   its place on the cohort page and the company page; the directory is a dense
   list. Revisit if more than a handful of companies carry recognition.
3. **A recognition index page** (`/recognition`) is not worth building at one
   record. Revisit at ~5.
