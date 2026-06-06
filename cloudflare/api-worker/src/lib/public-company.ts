import type { Company } from '@prisma/client'

export const PUBLIC_COMPANY_FIELDS = [
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
  'synopsisRaw',
  'synopsisSections',
] as const

export const CONTROLLED_PUBLIC_COMPANY_FIELDS = [
  'tulsaAttended',
  'pipelineStage',
  'synopsisRaw',
  'synopsisSections',
] as const

export const RESTRICTED_COMPANY_FIELDS = [
  'legacyAirtableId',
  'logoUrl',
  'fundingStage',
  'competitionScores',
  'podRanking',
  'combineStandout',
  'badgeJudges',
  'upvoteCount',
  'createdAt',
  'updatedAt',
] as const

type PublicCompanyField = (typeof PUBLIC_COMPANY_FIELDS)[number]

export type PublicCompanyDto = Pick<Company, PublicCompanyField>

export function isPublicCompany(company: Pick<Company, 'pipelineStage' | 'tulsaAttended'>): boolean {
  return company.pipelineStage === 'alumni' || company.tulsaAttended === 'Attended'
}

export function companyToPublicDto(company: Company): PublicCompanyDto {
  const dto = {} as PublicCompanyDto

  for (const field of PUBLIC_COMPANY_FIELDS) {
    dto[field] = company[field] as never
  }

  return dto
}

export function companiesToPublicDtos(companies: Company[]): PublicCompanyDto[] {
  return companies
    .filter(isPublicCompany)
    .map(companyToPublicDto)
}
