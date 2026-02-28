import { describe, it, expect } from 'vitest'
import { validateClaims } from '../lib/jwt'

describe('validateClaims', () => {
  const now = Math.floor(Date.now() / 1000)
  const validPayload = {
    iss: 'https://via.mergecombinator.com/application/o/defense-builders/',
    aud: 'defense-builders',
    exp: now + 300,
    iat: now - 10,
    sub: 'user123',
  }
  const allowlist = ['https://via.mergecombinator.com/application/o/defense-builders/']

  it('accepts valid claims', () => {
    expect(validateClaims(validPayload, allowlist, 'defense-builders')).toBeNull()
  })

  it('rejects unknown issuer', () => {
    expect(validateClaims({ ...validPayload, iss: 'https://evil.com' }, allowlist, 'defense-builders'))
      .toBe('Invalid issuer')
  })

  it('rejects wrong audience', () => {
    expect(validateClaims(validPayload, allowlist, 'wrong-audience'))
      .toBe('Invalid audience')
  })

  it('rejects expired token', () => {
    expect(validateClaims({ ...validPayload, exp: now - 60 }, allowlist, 'defense-builders'))
      .toBe('Token expired')
  })

  it('allows clock skew on exp (within 30s)', () => {
    expect(validateClaims({ ...validPayload, exp: now - 20 }, allowlist, 'defense-builders'))
      .toBeNull()
  })

  it('rejects future iat beyond skew', () => {
    expect(validateClaims({ ...validPayload, iat: now + 60 }, allowlist, 'defense-builders'))
      .toBe('Token issued in the future')
  })

  it('allows clock skew on iat (within 30s)', () => {
    expect(validateClaims({ ...validPayload, iat: now + 20 }, allowlist, 'defense-builders'))
      .toBeNull()
  })

  it('rejects nbf in the future beyond skew', () => {
    expect(validateClaims({ ...validPayload, nbf: now + 60 }, allowlist, 'defense-builders'))
      .toBe('Token not yet valid')
  })

  it('accepts aud as array', () => {
    expect(validateClaims({ ...validPayload, aud: ['other', 'defense-builders'] }, allowlist, 'defense-builders'))
      .toBeNull()
  })
})
