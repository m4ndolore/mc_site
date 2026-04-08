# REQ-SEC-003: Split Public and Restricted Company Data

## Status: PARTIAL | Priority: CRITICAL | Phase: 11

## Requirement

Public company data artifacts must not expose role-gated evaluation, ranking, application, contact, resource, or internal identifier fields.

## Target

`public/data/companies.json` and generated public company pages contain only catalog-level fields. Restricted company data is stored outside `public/` and served only by authenticated role-aware APIs.

## Acceptance Criteria

- [x] Public JSON omits internal evaluation fields: `competitionScores`, rankings, badge judges, raw synopsis, structured synopsis, internal Airtable IDs, logo CDN source fields, direct contact fields, demo links, and pitch links.
- [x] Public JSON descriptions are generated catalog summaries, not application summaries or internal synopsis text.
- [x] Public client code avoids live unauthenticated company-list fetches that can return rich role-gated fields.
- [x] Static company pages are regenerated from the catalog-only public payload.
- [x] Build path writes rich source data only to `.private/data/companies.json`, which is gitignored.
- [x] Local Git history is rewritten to remove previously committed rich `public/data/companies.json` blobs and the tracked Airtable CSV source files under `assets/data/`.
- [ ] Remote GitHub history is force-updated after credentialed operator confirmation.

## Public Catalog Fields

`public/data/companies.json` currently retains only:

- `id`
- `name`
- `productName`
- `website`
- `location`
- `missionArea`
- `warfareDomain`
- `trlLevel`
- `technicalMaturity`
- `fundingStage`
- `teamSize`
- `productType`
- `technologyArea`
- `cohort`
- `cohortId`
- `cohortLabel`
- `tulsaAttended`
- `pipelineStage`
- generated `description`

`pipelineStage`, `cohort*`, `trlLevel`, `technicalMaturity`, `fundingStage`, and `teamSize` are currently treated as public catalog-level attributes. If these should be role-gated, they are the next fields to remove from the public sanitizer.

## Withheld Rich Fields

The sanitizer withholds:

- Internal/source identifiers: `airtableId`, `legacyAirtableId`
- Logo/source media fields: `logoUrl`, `cfImageId`, `storedLogoId`
- Raw application and evaluation narrative: source `description`, `problemStatement`, `synopsisRaw`, `synopsisSections`
- Ranking and evaluation fields: `competitionScores`, `podRanking`, `combineStandout`, `badgeJudges`, `upvoteCount`
- Contact and resource fields: `founders`, `contactName`, `contactEmail`, `contactPhone`, `email`, `videoUrl`, `videoLink`, `pitchUrl`, `pitchLink`

## Validation

- `npm run build`
- Field scan over `public/data/companies.json`, generated `companies/*.html`, `builders.html`, `dashboard.html`, `faq.html`, and `public/llms.txt` for restricted keys and known raw-detail snippets.
- `git rev-list --all --objects` scan for `public/data/companies.json` and the two purged `assets/data` CSV paths.

## Notes

This fix mitigates the current public site payload and local reachable Git history. Remote remediation remains pending until a credentialed force-push updates GitHub refs.
