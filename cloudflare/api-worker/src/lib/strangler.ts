import type { Context } from 'hono'
import type { Env, AppVars } from '../types'
import { err } from './envelope'

type RouteTarget = 'native' | 'proxy_legacy'

const NATIVE_ROUTES: Array<{ method: string; pattern: RegExp }> = [
  { method: 'GET', pattern: /^\/health$/ },
  { method: 'GET', pattern: /^\/guild\/me$/ },
  { method: 'GET', pattern: /^\/builders\/companies$/ },
  { method: 'GET', pattern: /^\/builders\/companies\/[^/]+\/details$/ },
  { method: 'GET', pattern: /^\/builders\/companies\/[^/]+\/share-links$/ },
  { method: 'POST', pattern: /^\/builders\/companies\/[^/]+\/share-links$/ },
  { method: 'POST', pattern: /^\/builders\/companies\/[^/]+\/interest$/ },
  { method: 'GET', pattern: /^\/builders\/companies\/[^/]+$/ },
  { method: 'GET', pattern: /^\/builders\/coaches$/ },
  { method: 'GET', pattern: /^\/builders\/coaches\/[^/]+$/ },
  { method: 'POST', pattern: /^\/builders\/share-links\/[^/]+\/revoke$/ },
  { method: 'POST', pattern: /^\/access\/provision$/ },
  { method: 'GET', pattern: /^\/problems$/ },
  { method: 'GET', pattern: /^\/problems\/[^/]+$/ },
  { method: 'POST', pattern: /^\/problems$/ },
  { method: 'PATCH', pattern: /^\/problems\/[^/]+$/ },
  { method: 'DELETE', pattern: /^\/problems\/[^/]+$/ },
  { method: 'GET', pattern: /^\/guild\/users$/ },
  { method: 'PATCH', pattern: /^\/guild\/users\/[^/]+\/role$/ },
]

export function resolveRoute(method: string, path: string): RouteTarget {
  const isNative = NATIVE_ROUTES.some(r => r.method === method && r.pattern.test(path))
  if (isNative) return 'native'
  return 'proxy_legacy'
}

export async function proxyToLegacy(
  c: Context<{ Bindings: Env; Variables: AppVars }>
): Promise<Response> {
  const legacyOrigin = c.env.LEGACY_API_ORIGIN
  const requestId = c.get('requestId')
  const incomingUrl = new URL(c.req.url)
  const legacyPath = mapLegacyPath(incomingUrl.pathname)

  // Build target URL — use URL constructor for safe origin composition
  const target = new URL(
    legacyPath + incomingUrl.search,
    legacyOrigin
  )
  applyLegacyQueryDefaults(incomingUrl.pathname, target)

  // Build forwarded headers
  const headers = new Headers()
  headers.set('X-Forwarded-Host', 'api.mergecombinator.com')
  headers.set('X-Forwarded-Proto', 'https')
  headers.set('X-Request-Id', requestId)

  // Forward safe headers
  const authHeader = c.req.header('Authorization')
  if (authHeader) headers.set('Authorization', authHeader)

  const user = c.var.user
  if (user?.email) {
    headers.set('x-member-email', user.email)
  }

  const contentType = c.req.header('Content-Type')
  if (contentType) headers.set('Content-Type', contentType)

  const accept = c.req.header('Accept')
  if (accept) headers.set('Accept', accept)

  // NOT forwarded: Cookie, Host, Origin (prevent confused-deputy)

  try {
    const upstream = await fetch(target.toString(), {
      method: c.req.method,
      headers,
      body: ['GET', 'HEAD'].includes(c.req.method) ? null : c.req.raw.body,
    })

    const upstreamContentType = upstream.headers.get('Content-Type') || ''
    const requestMeta = {
      request_id: requestId,
      upstream_status: upstream.status,
      proxied: true,
    }

    // Non-JSON response → wrap in error envelope
    if (!upstreamContentType.includes('application/json')) {
      const body = await upstream.text()
      return c.json(
        err('LEGACY_ERROR', body.slice(0, 500), {
          ...requestMeta,
          content_type: upstreamContentType,
        }),
        upstream.ok ? 502 : (upstream.status as any)
      )
    }

    // JSON response
    const body = await upstream.json() as Record<string, unknown>

    // Already enveloped → augment meta
    if (body.data !== undefined) {
      const meta = (body.meta as Record<string, unknown>) ?? {}
      body.meta = { ...meta, ...requestMeta }
      return c.json(body, upstream.status as any)
    }

    // Not enveloped → normalize to API DTO shape where needed, then wrap
    const normalizedData = normalizeLegacyBodyForPath(incomingUrl.pathname, body)
    return c.json(
      { data: normalizedData, meta: requestMeta },
      upstream.status as any
    )
  } catch (e) {
    return c.json(
      err('PROXY_ERROR', 'Failed to reach legacy API', {
        request_id: requestId,
      }),
      502
    )
  }
}

export function mapLegacyPath(pathname: string): string {
  if (pathname === '/builders/companies') return '/api/public/companies'
  if (/^\/builders\/companies\/[^/]+\/details$/.test(pathname)) {
    return '/api/company/details'
  }
  if (/^\/builders\/companies\/[^/]+\/share-links$/.test(pathname)) {
    return '/api/company/share-links'
  }
  if (/^\/builders\/companies\/[^/]+\/interest$/.test(pathname)) {
    return '/api/interest'
  }
  if (pathname.startsWith('/builders/companies/')) {
    return pathname.replace('/builders/companies/', '/api/public/companies/')
  }
  if (pathname === '/builders/coaches') return '/api/public/coaches'
  if (pathname.startsWith('/builders/coaches/')) {
    return pathname.replace('/builders/coaches/', '/api/public/coaches/')
  }
  if (/^\/builders\/share-links\/[^/]+\/revoke$/.test(pathname)) {
    return pathname.replace('/builders/share-links/', '/api/company/share-links/')
  }
  if (pathname.startsWith('/public/company-share/')) {
    return pathname.replace('/public/company-share/', '/api/public/company-share/')
  }
  if (pathname === '/public/share-lead') {
    return '/api/public/share-lead'
  }
  return pathname
}

export function applyLegacyQueryDefaults(pathname: string, target: URL) {
  // Guild expects the full list for client-side filtering, but the legacy
  // SigmaBlox public API paginates list responses by default.
  if (
    (pathname === '/builders/companies' || pathname === '/builders/coaches') &&
    !target.searchParams.has('limit')
  ) {
    target.searchParams.set('limit', '200')
  }

  const detailsMatch = pathname.match(/^\/builders\/companies\/([^/]+)\/details$/)
  if (detailsMatch && !target.searchParams.has('companyId')) {
    target.searchParams.set('companyId', detailsMatch[1]!)
  }

  const shareLinksMatch = pathname.match(/^\/builders\/companies\/([^/]+)\/share-links$/)
  if (shareLinksMatch && !target.searchParams.has('companyId')) {
    target.searchParams.set('companyId', shareLinksMatch[1]!)
  }
}

export function normalizeLegacyBodyForPath(pathname: string, body: Record<string, unknown>): Record<string, unknown> {
  if (pathname === '/builders/companies' && Array.isArray(body.companies)) {
    return {
      ...body,
      companies: body.companies.map(normalizeLegacyCompanyRecord),
    }
  }

  // Keep expected singular DTO shape for Guild detail pages.
  if (pathname.startsWith('/builders/companies/') && !('company' in body)) {
    return { company: normalizeLegacyCompanyRecord(body) }
  }
  if (/^\/builders\/companies\/[^/]+\/details$/.test(pathname) && body.company && typeof body.company === 'object') {
    return {
      ...body,
      company: normalizeLegacyCompanyRecord(body.company as Record<string, unknown>),
    }
  }
  if (pathname.startsWith('/public/company-share/') && body.company && typeof body.company === 'object') {
    return {
      ...body,
      company: normalizeLegacyCompanyRecord(body.company as Record<string, unknown>),
    }
  }
  if (pathname.startsWith('/builders/coaches/') && !('coach' in body)) {
    return { coach: body }
  }
  return body
}

export function normalizeLegacyCompanyRecord(input: Record<string, unknown>): Record<string, unknown> {
  const company = { ...input }
  const name = typeof company.name === 'string' ? company.name.trim() : 'Unknown company'
  const productName = typeof company.productName === 'string' ? company.productName.trim() : ''

  company.name = name
  if (productName) company.productName = productName

  // The guild client expects browseable catalog rows to have non-null
  // classification fields. Legacy SigmaBlox still has a few attended alumni
  // rows with sparse metadata; backfill them so they render instead of being
  // dropped client-side.
  if (company.missionArea == null || company.missionArea === '') {
    company.missionArea = 'Unspecified'
  }
  if (company.warfareDomain == null || company.warfareDomain === '') {
    company.warfareDomain = 'Unspecified'
  }
  if (company.description == null || company.description === '') {
    company.description = productName
      ? `${name} builds ${productName}, a technology capability for national security missions.`
      : `${name} builds a technology capability for national security missions.`
  }

  return company
}
