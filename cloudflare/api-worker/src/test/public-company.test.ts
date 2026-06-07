import { describe, expect, it } from 'vitest'
import {
  companiesToPublicDtos,
  companyToPublicDto,
  CONTROLLED_PUBLIC_COMPANY_FIELDS,
  PUBLIC_COMPANY_FIELDS,
  RESTRICTED_COMPANY_FIELDS,
  type PublicCompanyDto,
} from '../lib/public-company'

type TestCompany = PublicCompanyDto & {
  legacyAirtableId: string
  logoUrl: string
  fundingStage: string
  ctas: string[]
  combineStandout: string
  badgeJudges: string
  podRanking: number
  upvoteCount: number
  competitionScores: Record<string, number>
  createdAt: Date
  updatedAt: Date
}

function buildCompany(overrides: Partial<TestCompany> = {}): TestCompany {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    legacyAirtableId: 'airtable-private-id',
    name: 'Public Test Company',
    productName: 'Public Product',
    website: 'https://example.com',
    logoUrl: 'https://signed.example.com/private-logo.png',
    cfImageId: 'cloudflare-image-id',
    location: 'Honolulu, HI',
    description: 'Public description that gives unauthenticated users useful context.',
    missionArea: 'Planning',
    warfareDomain: 'Air',
    technologyArea: 'AI',
    productType: 'Software',
    trlLevel: 7,
    technicalMaturity: 'Prototype demonstrated',
    fundingStage: 'Series Funding',
    teamSize: '10-25',
    pipelineStage: 'alumni',
    ctas: ['AI'],
    cohort: 'Combine',
    cohortId: 'cohort-25-1',
    cohortLabel: '25-1',
    tulsaAttended: 'Attended',
    combineStandout: 'internal standout note',
    badgeJudges: 'internal judge badge',
    podRanking: 1,
    upvoteCount: 99,
    synopsisSections: {
      problem: 'Public problem narrative.',
      solution: 'Public solution narrative.',
    },
    synopsisRaw: 'Public raw synopsis narrative.',
    competitionScores: {
      mission: 5,
    },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  }
}

describe('public company DTO policy', () => {
  it('keeps only explicit public fields', () => {
    const dto = companyToPublicDto(buildCompany())
    const keys = Object.keys(dto).sort()

    expect(keys).toEqual([...PUBLIC_COMPANY_FIELDS].sort())
    for (const field of RESTRICTED_COMPANY_FIELDS) {
      expect(dto).not.toHaveProperty(field)
    }
  })

  it('keeps controlled public narrative fields intentionally', () => {
    const dto = companyToPublicDto(buildCompany())

    for (const field of CONTROLLED_PUBLIC_COMPANY_FIELDS) {
      expect(dto).toHaveProperty(field)
    }
    expect(dto.synopsisSections).toEqual({
      problem: 'Public problem narrative.',
      solution: 'Public solution narrative.',
    })
  })

  it('publishes alumni and attended companies only', () => {
    const publicCompanies = companiesToPublicDtos([
      buildCompany({ id: '11111111-1111-4111-8111-111111111111', pipelineStage: 'alumni', tulsaAttended: null }),
      buildCompany({ id: '22222222-2222-4222-8222-222222222222', pipelineStage: 'applicant', tulsaAttended: 'Attended' }),
      buildCompany({ id: '33333333-3333-4333-8333-333333333333', pipelineStage: 'applicant', tulsaAttended: null }),
    ])

    expect(publicCompanies.map(company => company.id)).toEqual([
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    ])
  })
})
