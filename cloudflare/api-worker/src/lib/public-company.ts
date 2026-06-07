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

export interface PublicCompanyDto {
  id: string
  name: string
  productName: string | null
  website: string | null
  cfImageId: string | null
  location: string | null
  missionArea: string | null
  warfareDomain: string | null
  trlLevel: number | null
  technicalMaturity: string | null
  teamSize: string | null
  productType: string | null
  technologyArea: string | null
  cohort: string | null
  cohortId: string | null
  cohortLabel: string | null
  tulsaAttended: string | null
  pipelineStage: string
  description: string | null
  synopsisRaw: string | null
  synopsisSections: unknown
}

export function isPublicCompany(
  company: Pick<PublicCompanyDto, 'pipelineStage' | 'tulsaAttended'>,
): boolean {
  return company.pipelineStage === 'alumni' || company.tulsaAttended === 'Attended'
}

export function companyToPublicDto(company: PublicCompanyDto): PublicCompanyDto {
  const dto = {} as PublicCompanyDto

  for (const field of PUBLIC_COMPANY_FIELDS) {
    dto[field] = company[field] as never
  }

  return dto
}

export function companiesToPublicDtos(companies: PublicCompanyDto[]): PublicCompanyDto[] {
  return companies
    .filter(isPublicCompany)
    .map(companyToPublicDto)
}
