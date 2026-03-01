const ROLE_HIERARCHY: Record<string, number> = {
  admin: 4,
  trusted: 3,
  industry: 2.5,
  member: 2,
  restricted: 0.5,
}

// VIA emits groups as "mc-admins", "mc-trusted" etc.
// Strip the "mc-" prefix and trailing "s" to get canonical role names.
function normalizeRole(raw: string): string {
  let r = raw.toLowerCase()
  if (r.startsWith('mc-')) r = r.slice(3)
  if (r.endsWith('s') && r !== 'industry') r = r.slice(0, -1)
  return r
}

export function computeRoleLevel(roles: string[]): number {
  let max = 0
  for (const role of roles) {
    const level = ROLE_HIERARCHY[normalizeRole(role)]
    if (level !== undefined && level > max) max = level
  }
  return max
}

export function extractRolesFromClaims(
  payload: Record<string, unknown>,
  claimPath: string
): string[] {
  const parts = claimPath.split('.')
  let current: unknown = payload
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return []
    current = (current as Record<string, unknown>)[part]
  }
  if (Array.isArray(current)) {
    return current.filter((v): v is string => typeof v === 'string')
  }
  return []
}
