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

function isPublicCompany(company) {
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
  const companies = Array.isArray(payload.companies)
    ? payload.companies.filter(isPublicCompany).map(sanitizeCompanyForPublic)
    : [];

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
