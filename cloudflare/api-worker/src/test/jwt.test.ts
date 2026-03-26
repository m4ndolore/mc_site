import { describe, it, expect } from 'vitest'
import { validateClaims } from '../lib/jwt'

describe('validateClaims', () => {
  const now = Math.floor(Date.now() / 1000)
  const validPayload = {
    iss: 'https://via.mergecombinator.com/application/o/defense-builders/',
    aud: 'guild-oidc',
    exp: now + 300,
    iat: now - 10,
    sub: 'user123',
  }
  const allowlist = ['https://via.mergecombinator.com/application/o/defense-builders/']
  const audiences = ['guild-oidc']

  it('accepts valid claims', () => {
    expect(validateClaims(validPayload, allowlist, audiences)).toBeNull()
  })

  it('rejects unknown issuer', () => {
    expect(validateClaims({ ...validPayload, iss: 'https://evil.com' }, allowlist, audiences))
      .toBe('Invalid issuer')
  })

  it('rejects wrong audience', () => {
    expect(validateClaims({ ...validPayload, aud: 'wrong-audience' }, allowlist, audiences))
      .toBe('Invalid audience')
  })

  it('rejects expired token', () => {
    expect(validateClaims({ ...validPayload, exp: now - 60 }, allowlist, audiences))
      .toBe('Token expired')
  })

  it('allows clock skew on exp (within 30s)', () => {
    expect(validateClaims({ ...validPayload, exp: now - 20 }, allowlist, audiences))
      .toBeNull()
  })

  it('rejects future iat beyond skew', () => {
    expect(validateClaims({ ...validPayload, iat: now + 60 }, allowlist, audiences))
      .toBe('Token issued in the future')
  })

  it('allows clock skew on iat (within 30s)', () => {
    expect(validateClaims({ ...validPayload, iat: now + 20 }, allowlist, audiences))
      .toBeNull()
  })

  it('rejects nbf in the future beyond skew', () => {
    expect(validateClaims({ ...validPayload, nbf: now + 60 }, allowlist, audiences))
      .toBe('Token not yet valid')
  })

  it('accepts aud as array containing allowed audience', () => {
    expect(validateClaims({ ...validPayload, aud: ['other', 'guild-oidc'] }, allowlist, audiences))
      .toBeNull()
  })

  it('rejects aud array with no matching audience', () => {
    expect(validateClaims({ ...validPayload, aud: ['other', 'nope'] }, allowlist, audiences))
      .toBe('Invalid audience')
  })
})
