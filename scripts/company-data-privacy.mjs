/**
 * Privacy helpers for company data artifacts.
 *
 * The public site can only ship catalog-level fields. Evaluation details,
 * application summaries, internal IDs, rankings, scores, notes, and direct
 * contact/resource fields must stay out of public/data/companies.json.
 */

const PUBLIC_COMPANY_FIELDS = [
  'id',
  'name',
  'productName',
  'website',
  'location',
  'missionArea',
  'warfareDomain',
  'trlLevel',
  'technicalMaturity',
  'fundingStage',
  'teamSize',
  'productType',
  'technologyArea',
  'cohort',
  'cohortId',
  'cohortLabel',
  'tulsaAttended',
  'pipelineStage',
];

export const RESTRICTED_COMPANY_FIELDS = [
  'airtableId',
  'legacyAirtableId',
  'logoUrl',
  'cfImageId',
  'storedLogoId',
  'description',
  'problemStatement',
  'synopsisRaw',
  'synopsisSections',
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

function compact(parts) {
  return parts.filter(Boolean).join(' ');
}

export function buildPublicDescription(company) {
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

  return compact([
    lead,
    domain ? `Its work is relevant to the ${domain} domain.` : null,
    'Detailed evaluation notes, rankings, competition scores, and application materials require authorized access.',
  ]);
}

export function sanitizeCompanyForPublic(company) {
  const publicCompany = {};

  for (const field of PUBLIC_COMPANY_FIELDS) {
    if (company[field] !== undefined) {
      publicCompany[field] = company[field];
    }
  }

  publicCompany.description = buildPublicDescription(company);

  return publicCompany;
}

export function sanitizeCompaniesPayloadForPublic(payload) {
  const companies = Array.isArray(payload.companies)
    ? payload.companies.map(sanitizeCompanyForPublic)
    : [];

  return {
    companies,
    pagination: {
      ...(payload.pagination || {}),
      total: companies.length,
    },
    filters: payload.filters || null,
    metadata: {
      ...(payload.metadata || {}),
      publicSanitizedAt: new Date().toISOString(),
      publicPrivacyModel: 'catalog-only',
      restrictedFieldCount: RESTRICTED_COMPANY_FIELDS.length,
    },
  };
}
