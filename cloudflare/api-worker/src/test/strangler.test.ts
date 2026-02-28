import { describe, it, expect } from 'vitest'
import { resolveRoute } from '../lib/strangler'

describe('resolveRoute', () => {
  // Native routes
  it('GET /health → native', () => {
    expect(resolveRoute('GET', '/health')).toBe('native')
  })

  it('GET /guild/me → native', () => {
    expect(resolveRoute('GET', '/guild/me')).toBe('native')
  })

  it('GET /builders/companies → native', () => {
    expect(resolveRoute('GET', '/builders/companies')).toBe('native')
  })

  it('GET /builders/companies/abc123 → native', () => {
    expect(resolveRoute('GET', '/builders/companies/abc123')).toBe('native')
  })

  it('GET /builders/coaches → native', () => {
    expect(resolveRoute('GET', '/builders/coaches')).toBe('native')
  })

  it('GET /builders/coaches/abc123 → native', () => {
    expect(resolveRoute('GET', '/builders/coaches/abc123')).toBe('native')
  })

  // Proxy legacy routes
  it('POST /guild/me → proxy_legacy (wrong method)', () => {
    expect(resolveRoute('POST', '/guild/me')).toBe('proxy_legacy')
  })

  it('GET /builders/claims → proxy_legacy', () => {
    expect(resolveRoute('GET', '/builders/claims')).toBe('proxy_legacy')
  })

  it('GET /guild/notifications → proxy_legacy', () => {
    expect(resolveRoute('GET', '/guild/notifications')).toBe('proxy_legacy')
  })

  it('POST /builders/companies → proxy_legacy (write)', () => {
    expect(resolveRoute('POST', '/builders/companies')).toBe('proxy_legacy')
  })

  it('GET /unknown → proxy_legacy', () => {
    expect(resolveRoute('GET', '/unknown')).toBe('proxy_legacy')
  })

  // Edge cases
  it('GET /builders/companies/abc/nested → proxy_legacy (too many segments)', () => {
    expect(resolveRoute('GET', '/builders/companies/abc/nested')).toBe('proxy_legacy')
  })

  it('GET /health/ (trailing slash) → proxy_legacy', () => {
    expect(resolveRoute('GET', '/health/')).toBe('proxy_legacy')
  })
})
