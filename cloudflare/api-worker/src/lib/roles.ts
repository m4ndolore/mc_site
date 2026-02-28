const ROLE_HIERARCHY: Record<string, number> = {
  admin: 4,
  trusted: 3,
  industry: 2.5,
  member: 2,
  guest: 1.5,
  restricted: 0.5,
}

export function computeRoleLevel(roles: string[]): number {
  let max = 0
  for (const role of roles) {
    const level = ROLE_HIERARCHY[role.toLowerCase()]
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
