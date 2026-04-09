# REQ-SEC-003: Public Company Data Privacy Boundary

## Status: PARTIAL | Priority: CRITICAL | Phase: 11

## Requirement

Public company data artifacts must preserve rich company profile signal while withholding direct contact information, fundraising/financial fields, and evaluation outcomes such as scores, rankings, and badges.

## Target

`public/data/companies.json`, `public/data/companies-public.json`, and generated public company pages contain curated high-signal cohort competitors with rich descriptive and technical metadata. Restricted contact, fundraising, and evaluation-outcome fields remain outside the public contract.

## Acceptance Criteria

- [x] Public JSON omits evaluation-outcome fields: `competitionScores`, rankings, badges, and similar results data.
- [x] Public JSON omits direct contact and coordination fields.
- [x] Public JSON omits fundraising / financial fields from the public contract.
- [x] Public JSON retains rich company narrative and technical metadata, including source descriptions and profile sections where available.
- [x] Public client code avoids live unauthenticated company-list fetches that can return rich role-gated fields.
- [x] Static company pages are regenerated from the curated public payload.
- [x] Build path writes rich source data only to `.private/data/companies.json`, which is gitignored.
- [x] Local Git history is rewritten to remove previously committed rich `public/data/companies.json` blobs and the tracked Airtable CSV source files under `assets/data/`.
- [ ] Remote GitHub history is force-updated after credentialed operator confirmation.

## Public Fields

`public/data/companies.json` currently retains curated cohort competitors with:

- `id`
- `name`
- `productName`
- `website`
- `cfImageId`
- `location`
- `missionArea`
- `warfareDomain`
- `trlLevel`
- `technicalMaturity`
- `teamSize`
- `productType`
- `technologyArea`
- `cohort`
- `cohortId`
- `cohortLabel`
- `tulsaAttended`
- `pipelineStage`
- `description`
- `problemStatement`
- `synopsisRaw`
- `synopsisSections`

The public contract is also intentionally curated to public cohort competitors rather than the full internal intake set.

## Withheld Rich Fields

The sanitizer withholds:

- Internal/source identifiers: `airtableId`, `legacyAirtableId`, `storedLogoId`
- Non-public asset source fields: `logoUrl`
- Fundraising / financial fields: `fundingStage`
- Ranking and evaluation fields: `competitionScores`, `podRanking`, `combineStandout`, `badgeJudges`, `upvoteCount`
- Contact and coordination fields: `founders`, `contactName`, `contactEmail`, `contactPhone`, `email`, `videoUrl`, `videoLink`, `pitchUrl`, `pitchLink`

## Validation

- `npm run build`
- Field scan over `public/data/companies.json`, `public/data/companies-public.json`, generated `companies/*.html`, `builders.html`, `dashboard.html`, `faq.html`, and `public/llms.txt` for restricted keys and unintended contact / fundraising / results fields.
- `git rev-list --all --objects` scan for `public/data/companies.json` and the two purged `assets/data` CSV paths.

## Notes

The public/privacy boundary is now "rich public profiles, restricted outcomes/contact/financials" rather than "catalog-only metadata."
