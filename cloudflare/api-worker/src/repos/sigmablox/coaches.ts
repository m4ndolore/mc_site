import type pg from 'pg'
import type { Pagination } from '../../lib/pagination'

export interface CoachRow {
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
  createdAt: Date
  updatedAt: Date
}

export interface CoachFilters {
  search?: string
  domain?: string
}

const UUID_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i
const CUID_RE = /^c[a-z0-9]{24}$/

const COACH_COLUMNS = `
  id, name, email, "linkedIn", "photoUrl", affiliation, company,
  "combineRole", domain, "smeArea", bio, cohort, status,
  "createdAt", "updatedAt"
`.trim()

const MAX_SEARCH_LENGTH = 100

function buildWhereClause(
  filters: CoachFilters
): { where: string; params: unknown[]; paramIndex: number } {
  const conditions: string[] = ['status = $1']
  const params: unknown[] = ['active']
  let idx = 2

  if (filters.search) {
    const term = `%${filters.search.trim().slice(0, MAX_SEARCH_LENGTH)}%`
    conditions.push(`(name ILIKE $${idx} OR bio ILIKE $${idx} OR company ILIKE $${idx})`)
    params.push(term)
    idx++
  }

  if (filters.domain) {
    conditions.push(`domain = $${idx}`)
    params.push(filters.domain)
    idx++
  }

  return { where: conditions.join(' AND '), params, paramIndex: idx }
}

export async function listCoaches(
  pool: InstanceType<typeof pg.Pool>,
  filters: CoachFilters,
  pagination: Pagination
): Promise<{ rows: CoachRow[]; total: number }> {
  const { where, params, paramIndex } = buildWhereClause(filters)

  const countResult = await pool.query(
    `SELECT COUNT(*) AS count FROM "Coach" WHERE ${where}`,
    params
  )
  const total = parseInt(countResult.rows[0].count, 10)

  const dataParams = [...params, pagination.limit, pagination.offset]
  const dataResult = await pool.query(
    `SELECT ${COACH_COLUMNS} FROM "Coach"
     WHERE ${where}
     ORDER BY "updatedAt" DESC, id ASC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    dataParams
  )

  return { rows: dataResult.rows as CoachRow[], total }
}

export async function getCoach(
  pool: InstanceType<typeof pg.Pool>,
  id: string
): Promise<CoachRow | null> {
  const isUuidOrCuid = UUID_RE.test(id) || CUID_RE.test(id)
  const column = isUuidOrCuid ? 'id' : '"legacyAirtableId"'

  const result = await pool.query(
    `SELECT ${COACH_COLUMNS} FROM "Coach" WHERE ${column} = $1`,
    [id]
  )

  return (result.rows[0] as CoachRow) ?? null
}
