import { describe, it, expect } from 'vitest'
import { computeRoleLevel, extractRolesFromClaims } from '../lib/roles'

describe('computeRoleLevel', () => {
  it('returns 0 for empty roles', () => {
    expect(computeRoleLevel([])).toBe(0)
  })

  it('returns highest role level', () => {
    expect(computeRoleLevel(['member', 'admin'])).toBe(4)
  })

  it('handles case insensitivity', () => {
    expect(computeRoleLevel(['Admin'])).toBe(4)
  })

  it('ignores unknown roles', () => {
    expect(computeRoleLevel(['unknown', 'member'])).toBe(2)
  })
})

describe('extractRolesFromClaims', () => {
  it('extracts flat array from top-level claim', () => {
    expect(extractRolesFromClaims({ groups: ['admin', 'member'] }, 'groups'))
      .toEqual(['admin', 'member'])
  })

  it('extracts from nested claim path', () => {
    const payload = { realm_access: { roles: ['admin'] } }
    expect(extractRolesFromClaims(payload, 'realm_access.roles'))
      .toEqual(['admin'])
  })

  it('returns empty array for missing claim', () => {
    expect(extractRolesFromClaims({}, 'groups')).toEqual([])
  })

  it('filters non-string values', () => {
    expect(extractRolesFromClaims({ groups: ['admin', 42, null] }, 'groups'))
      .toEqual(['admin'])
  })
})
