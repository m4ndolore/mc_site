import { describe, it, expect } from 'vitest'
import {
  applyLegacyQueryDefaults,
  mapLegacyPath,
  normalizeLegacyBodyForPath,
  normalizeLegacyCompanyRecord,
  resolveRoute,
} from '../lib/strangler'

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

  it('GET /builders/companies/abc123/details → native', () => {
    expect(resolveRoute('GET', '/builders/companies/abc123/details')).toBe('native')
  })

  it('GET /builders/companies/abc123/share-links → native', () => {
    expect(resolveRoute('GET', '/builders/companies/abc123/share-links')).toBe('native')
  })

  it('POST /builders/companies/abc123/share-links → native', () => {
    expect(resolveRoute('POST', '/builders/companies/abc123/share-links')).toBe('native')
  })

  it('POST /builders/companies/abc123/interest → native', () => {
    expect(resolveRoute('POST', '/builders/companies/abc123/interest')).toBe('native')
  })

  it('GET /builders/coaches → native', () => {
    expect(resolveRoute('GET', '/builders/coaches')).toBe('native')
  })

  it('GET /builders/coaches/abc123 → native', () => {
    expect(resolveRoute('GET', '/builders/coaches/abc123')).toBe('native')
  })

  it('POST /builders/share-links/abc123/revoke → native', () => {
    expect(resolveRoute('POST', '/builders/share-links/abc123/revoke')).toBe('native')
  })

  it('POST /access/provision → native', () => {
    expect(resolveRoute('POST', '/access/provision')).toBe('native')
  })

  // Proxy legacy routes
  it('GET /access/provision → proxy_legacy (wrong method)', () => {
    expect(resolveRoute('GET', '/access/provision')).toBe('proxy_legacy')
  })

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

  it('GET /builders/companies/abc123/share-links/nested → proxy_legacy', () => {
    expect(resolveRoute('GET', '/builders/companies/abc123/share-links/nested')).toBe('proxy_legacy')
  })

  it('GET /health/ (trailing slash) → proxy_legacy', () => {
    expect(resolveRoute('GET', '/health/')).toBe('proxy_legacy')
  })
})

describe('mapLegacyPath', () => {
  it('maps company details to legacy details endpoint', () => {
    expect(mapLegacyPath('/builders/companies/abc123/details')).toBe('/api/company/details')
  })

  it('maps share-links endpoints to legacy share-links endpoint', () => {
    expect(mapLegacyPath('/builders/companies/abc123/share-links')).toBe('/api/company/share-links')
    expect(mapLegacyPath('/builders/share-links/abc123/revoke')).toBe('/api/company/share-links/abc123/revoke')
  })

  it('maps interest and public share endpoints to legacy endpoints', () => {
    expect(mapLegacyPath('/builders/companies/abc123/interest')).toBe('/api/interest')
    expect(mapLegacyPath('/public/company-share/abc123')).toBe('/api/public/company-share/abc123')
    expect(mapLegacyPath('/public/share-lead')).toBe('/api/public/share-lead')
  })
})

describe('applyLegacyQueryDefaults', () => {
  it('adds companyId for details and share-link reads', () => {
    const detailsTarget = new URL('https://legacy.example/api/company/details')
    applyLegacyQueryDefaults('/builders/companies/abc123/details', detailsTarget)
    expect(detailsTarget.searchParams.get('companyId')).toBe('abc123')

    const shareLinksTarget = new URL('https://legacy.example/api/company/share-links')
    applyLegacyQueryDefaults('/builders/companies/xyz789/share-links', shareLinksTarget)
    expect(shareLinksTarget.searchParams.get('companyId')).toBe('xyz789')
  })

  it('preserves existing query params and list limits', () => {
    const target = new URL('https://legacy.example/api/public/companies?companyId=keepme&limit=50')
    applyLegacyQueryDefaults('/builders/companies/keepme/details', target)
    expect(target.searchParams.get('companyId')).toBe('keepme')
    expect(target.searchParams.get('limit')).toBe('50')
  })
})

describe('normalizeLegacyBodyForPath', () => {
  it('normalizes sparse company records on details responses', () => {
    const normalized = normalizeLegacyBodyForPath('/builders/companies/abc123/details', {
      company: {
        name: '  Test Company  ',
        productName: '  Edge Sensor  ',
        missionArea: '',
        warfareDomain: null,
        description: '',
      },
    })

    expect(normalized).toEqual({
      company: {
        name: 'Test Company',
        productName: 'Edge Sensor',
        missionArea: 'Unspecified',
        warfareDomain: 'Unspecified',
        description: 'Test Company builds Edge Sensor, a technology capability for national security missions.',
      },
    })
  })

  it('wraps singular company responses and normalizes public share payloads', () => {
    expect(normalizeLegacyBodyForPath('/builders/companies/abc123', {
      name: 'Solo Company',
      missionArea: '',
      warfareDomain: '',
      description: '',
    })).toEqual({
      company: {
        name: 'Solo Company',
        missionArea: 'Unspecified',
        warfareDomain: 'Unspecified',
        description: 'Solo Company builds a technology capability for national security missions.',
      },
    })

    expect(normalizeLegacyBodyForPath('/public/company-share/abc123', {
      company: {
        name: 'Shared Company',
        productName: 'Relay',
        missionArea: '',
        warfareDomain: '',
        description: '',
      },
    })).toEqual({
      company: {
        name: 'Shared Company',
        productName: 'Relay',
        missionArea: 'Unspecified',
        warfareDomain: 'Unspecified',
        description: 'Shared Company builds Relay, a technology capability for national security missions.',
      },
    })
  })
})

describe('normalizeLegacyCompanyRecord', () => {
  it('preserves existing description and classification fields', () => {
    expect(normalizeLegacyCompanyRecord({
      name: 'Ready Company',
      productName: 'Navigator',
      missionArea: 'Autonomy',
      warfareDomain: 'Air',
      description: 'Already normalized.',
    })).toEqual({
      name: 'Ready Company',
      productName: 'Navigator',
      missionArea: 'Autonomy',
      warfareDomain: 'Air',
      description: 'Already normalized.',
    })
  })
})
