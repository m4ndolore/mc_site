/**
 * Privacy helpers for company data artifacts.
 *
 * Public company profiles should keep rich narrative and technical metadata
 * while withholding direct contact details, fundraising/financial fields, and
 * evaluation outcomes such as scores, rankings, and badges.
 */

const PUBLIC_COMPANY_FIELDS = [
  'id',
  'name',
  'productName',
  'website',
  'cfImageId',
  'location',
  'missionArea',
  'warfareDomain',
  'trlLevel',
  'technicalMaturity',
  'teamSize',
  'productType',
  'technologyArea',
  'cohort',
  'cohortId',
  'cohortLabel',
  'tulsaAttended',
  'pipelineStage',
  'description',
  'problemStatement',
  'synopsisRaw',
  'synopsisSections',
];

export const RESTRICTED_COMPANY_FIELDS = [
  'airtableId',
  'legacyAirtableId',
  'logoUrl',
  'storedLogoId',
  'fundingStage',
  'competitionScores',
  'podRanking',
  'combineStandout',
  'badgeJudges',
  'upvoteCount',
  'founders',
  'contactName',
  'contactEmail',
  'contactPhone',
  'email',
  'videoUrl',
  'videoLink',
  'pitchUrl',
  'pitchLink',
];

const NARRATIVE_KEYS = [
  'description',
  'problemStatement',
  'synopsisRaw',
];

function hasMeaningfulText(value) {
  return typeof value === 'string' && value.trim().length >= 40;
}

function buildPublicFallbackDescription(company) {
  const name = company.name || company.companyName || 'This company';
  const product = company.productName ? `${company.productName}` : null;
  const mission = company.missionArea ? `${company.missionArea}` : 'national security';
  const domain = company.warfareDomain ? `${company.warfareDomain}` : null;
  const productType = company.productType === 'Both'
    ? 'hardware and software'
    : company.productType
      ? `${company.productType}`.toLowerCase()
      : 'technology';
  const lead = product
    ? `${name} builds ${product}, a ${productType} capability for ${mission} missions.`
    : `${name} builds ${productType} capabilities for ${mission} missions.`;

  if (domain) {
    return `${lead} Its work is relevant to the ${domain} domain.`;
  }

  return lead;
}

function getPublicDescription(company) {
  for (const key of NARRATIVE_KEYS) {
    if (hasMeaningfulText(company[key])) {
      return company[key].trim();
    }
  }

  const sections = company.synopsisSections;
  if (sections && typeof sections === 'object') {
    const firstSection = Object.values(sections).find(hasMeaningfulText);
    if (firstSection) {
      return firstSection.trim();
    }
  }

  return buildPublicFallbackDescription(company);
}

function getPublicProblemStatement(company) {
  if (hasMeaningfulText(company.problemStatement)) {
    return company.problemStatement.trim();
  }

  const sections = company.synopsisSections;
  if (sections && typeof sections === 'object' && hasMeaningfulText(sections.problem)) {
    return sections.problem.trim();
  }

  return null;
}

/**
 * Select the records that may be published.
 *
 * The legacy api.sigmablox.com feed returned every company it held — applicants,
 * declined, alumni — so this file had to pick the public subset itself, and it
 * did so on two markers the legacy feed stamped on every record:
 * `pipelineStage: "alumni"` and `tulsaAttended: "Attended"`.
 *
 * The emdash feed carries neither. `pipelineStage` maps to emdash's
 * `company_status` ("active"), and `tulsaAttended` does not exist there at all —
 * so after the repoint this predicate rejected all 80 companies and the public
 * feed silently became an empty array. Publication is the editorial gate now:
 * the companies invited who did not attend were unpublished upstream rather than
 * filtered here.
 *
 * `tulsaAttended` is the discriminator because the legacy feed set it on every
 * record. Its absence means the record came from emdash and upstream already
 * gated it; its presence means a legacy-shaped feed, which keeps the old rule.
 */
function isPublicCompany(company) {
  if (company.tulsaAttended === undefined) return true;
  return company.pipelineStage === 'alumni' || company.tulsaAttended === 'Attended';
}

function sanitizeFilters(filters) {
  if (!filters || typeof filters !== 'object') {
    return null;
  }

  return {
    missionAreas: Array.isArray(filters.missionAreas) ? filters.missionAreas : [],
    warfareDomains: Array.isArray(filters.warfareDomains) ? filters.warfareDomains : [],
    cohorts: Array.isArray(filters.cohorts) ? filters.cohorts : [],
  };
}

export function sanitizeCompanyForPublic(company) {
  const publicCompany = {};

  for (const field of PUBLIC_COMPANY_FIELDS) {
    if (company[field] !== undefined) {
      publicCompany[field] = company[field];
    }
  }

  publicCompany.description = getPublicDescription(company);

  const problemStatement = getPublicProblemStatement(company);
  if (problemStatement) {
    publicCompany.problemStatement = problemStatement;
  }

  return publicCompany;
}

export function sanitizeCompaniesPayloadForPublic(payload) {
  const input = Array.isArray(payload.companies) ? payload.companies : [];
  const companies = input.filter(isPublicCompany).map(sanitizeCompanyForPublic);

  // A filter that removes every record is never a correct answer — it is a
  // predicate that no longer matches the feed. That is precisely what happened
  // when the seed was repointed at emdash: the directory, sitemap and llms.txt
  // were rebuilt from an empty array and the build stayed green, because nothing
  // downstream distinguishes "no companies" from "no companies yet".
  if (input.length > 0 && companies.length === 0) {
    throw new Error(
      `[privacy] isPublicCompany rejected all ${input.length} companies. The feed shape has ` +
        'changed and the predicate no longer matches it. Refusing to publish an empty directory.',
    );
  }

  return {
    companies,
    pagination: {
      ...(payload.pagination || {}),
      total: companies.length,
    },
    filters: sanitizeFilters(payload.filters),
    metadata: {
      ...(payload.metadata || {}),
      publicSanitizedAt: new Date().toISOString(),
      publicPrivacyModel: 'rich-public-profile',
      restrictedFieldCount: RESTRICTED_COMPANY_FIELDS.length,
      publicAudience: 'cohort-competitors',
    },
  };
}
