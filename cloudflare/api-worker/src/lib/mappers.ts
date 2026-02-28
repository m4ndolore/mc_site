import type { CompanyRow } from '../repos/sigmablox/companies'
import type { CoachRow } from '../repos/sigmablox/coaches'

export interface CompanyDto {
  id: string
  name: string
  companyName: string | null
  productName: string | null
  website: string | null
  linkedInUrl: string | null
  logoUrl: string | null
  cfImageId: string | null
  contactName: string | null
  location: string | null
  missionArea: string | null
  warfareDomain: string | null
  description: string | null
  problemStatement: string | null
  trlLevel: number | null
  fundingStage: string | null
  teamSize: string | null
  status: string
  cohort: { cohortId: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export function companyToDto(row: CompanyRow): CompanyDto {
  return {
    id: row.id,
    name: row.name,
    companyName: row.companyName,
    productName: row.productName,
    website: row.website,
    linkedInUrl: row.linkedInUrl,
    logoUrl: row.logoUrl,
    cfImageId: row.cfImageId,
    contactName: row.contactName,
    location: row.location,
    missionArea: row.missionArea,
    warfareDomain: row.warfareDomain,
    description: row.description,
    problemStatement: row.problemStatement,
    trlLevel: row.trlLevel,
    fundingStage: row.fundingStage,
    teamSize: row.teamSize,
    status: row.status,
    cohort: row.cohort_cohortId
      ? { cohortId: row.cohort_cohortId, name: row.cohort_name! }
      : null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  }
}

export interface CoachDto {
  id: string
  name: string
  email: string | null
  linkedIn: string | null
  photoUrl: string | null
  affiliation: string | null
  company: string | null
  combineRole: string | null
  domain: string | null
  smeArea: string | null
  bio: string | null
  cohort: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export function coachToDto(row: CoachRow): CoachDto {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    linkedIn: row.linkedIn,
    photoUrl: row.photoUrl,
    affiliation: row.affiliation,
    company: row.company,
    combineRole: row.combineRole,
    domain: row.domain,
    smeArea: row.smeArea,
    bio: row.bio,
    cohort: row.cohort,
    status: row.status,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  }
}
