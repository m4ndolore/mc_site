import { err } from './envelope'

export interface Pagination {
  limit: number
  offset: number
}

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

export function parsePagination(
  query: Record<string, string>
): { pagination: Pagination } | { error: ReturnType<typeof err>; status: number } {
  const rawLimit = query.limit
  const rawOffset = query.offset

  let limit = DEFAULT_LIMIT
  let offset = 0

  if (rawLimit !== undefined) {
    limit = parseInt(rawLimit, 10)
    if (isNaN(limit) || limit < 0) {
      return { error: err('BAD_REQUEST', 'Invalid limit: must be a non-negative integer'), status: 400 }
    }
    if (limit > MAX_LIMIT) limit = MAX_LIMIT
  }

  if (rawOffset !== undefined) {
    offset = parseInt(rawOffset, 10)
    if (isNaN(offset) || offset < 0) {
      return { error: err('BAD_REQUEST', 'Invalid offset: must be a non-negative integer'), status: 400 }
    }
  }

  return { pagination: { limit, offset } }
}
