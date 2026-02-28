import type pg from 'pg'
import type { Pagination } from '../../lib/pagination'

export interface CompanyRow {
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
  cohortId: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  cohort_cohortId: string | null
  cohort_name: string | null
}

export interface CompanyFilters {
  search?: string
  missionArea?: string
  warfareDomain?: string
  fundingStage?: string
}

const UUID_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i
const CUID_RE = /^c[a-z0-9]{24}$/

const COMPANY_COLUMNS = `
  c.id, c.name, c."companyName", c."productName", c.website,
  c."linkedInUrl", c."logoUrl", c."cfImageId", c."contactName",
  c.location, c."missionArea", c."warfareDomain", c.description,
  c."problemStatement", c."trlLevel", c."fundingStage", c."teamSize",
  c."cohortId", c.status, c."createdAt", c."updatedAt",
  co."cohortId" AS "cohort_cohortId", co.name AS "cohort_name"
`.trim()

const COMPANY_FROM = `"Company" c LEFT JOIN "Cohort" co ON c."cohortId" = co.id`

const MAX_SEARCH_LENGTH = 100

function buildWhereClause(
  filters: CompanyFilters
): { where: string; params: unknown[]; paramIndex: number } {
  const conditions: string[] = ['c.status = $1']
  const params: unknown[] = ['active']
  let idx = 2

  if (filters.search) {
    const term = `%${filters.search.trim().slice(0, MAX_SEARCH_LENGTH)}%`
    conditions.push(`(c.name ILIKE $${idx} OR c."companyName" ILIKE $${idx} OR c.description ILIKE $${idx})`)
    params.push(term)
    idx++
  }

  if (filters.missionArea) {
    conditions.push(`c."missionArea" = $${idx}`)
    params.push(filters.missionArea)
    idx++
  }

  if (filters.warfareDomain) {
    conditions.push(`c."warfareDomain" = $${idx}`)
    params.push(filters.warfareDomain)
    idx++
  }

  if (filters.fundingStage) {
    conditions.push(`c."fundingStage" = $${idx}`)
    params.push(filters.fundingStage)
    idx++
  }

  return { where: conditions.join(' AND '), params, paramIndex: idx }
}

export async function listCompanies(
  pool: InstanceType<typeof pg.Pool>,
  filters: CompanyFilters,
  pagination: Pagination
): Promise<{ rows: CompanyRow[]; total: number }> {
  const { where, params, paramIndex } = buildWhereClause(filters)

  const countResult = await pool.query(
    `SELECT COUNT(*) AS count FROM ${COMPANY_FROM} WHERE ${where}`,
    params
  )
  const total = parseInt(countResult.rows[0].count, 10)

  const dataParams = [...params, pagination.limit, pagination.offset]
  const dataResult = await pool.query(
    `SELECT ${COMPANY_COLUMNS} FROM ${COMPANY_FROM}
     WHERE ${where}
     ORDER BY c."updatedAt" DESC, c.id ASC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    dataParams
  )

  return { rows: dataResult.rows as CompanyRow[], total }
}

export async function getCompany(
  pool: InstanceType<typeof pg.Pool>,
  id: string
): Promise<CompanyRow | null> {
  const isUuidOrCuid = UUID_RE.test(id) || CUID_RE.test(id)
  const column = isUuidOrCuid ? 'c.id' : 'c."legacyAirtableId"'

  const result = await pool.query(
    `SELECT ${COMPANY_COLUMNS} FROM ${COMPANY_FROM} WHERE ${column} = $1`,
    [id]
  )

  return (result.rows[0] as CompanyRow) ?? null
}
