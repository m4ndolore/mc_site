import type { Context } from 'hono'
import type { Env, AppVars } from '../types'
import { err } from './envelope'

type RouteTarget = 'native' | 'proxy_legacy'

const NATIVE_ROUTES: Array<{ method: string; pattern: RegExp }> = [
  { method: 'GET', pattern: /^\/health$/ },
  { method: 'GET', pattern: /^\/guild\/me$/ },
  { method: 'GET', pattern: /^\/builders\/companies$/ },
  { method: 'GET', pattern: /^\/builders\/companies\/[^/]+$/ },
  { method: 'GET', pattern: /^\/builders\/coaches$/ },
  { method: 'GET', pattern: /^\/builders\/coaches\/[^/]+$/ },
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

  // Build forwarded headers
  const headers = new Headers()
  headers.set('X-Forwarded-Host', 'api.mergecombinator.com')
  headers.set('X-Forwarded-Proto', 'https')
  headers.set('X-Request-Id', requestId)

  // Forward safe headers
  const authHeader = c.req.header('Authorization')
  if (authHeader) headers.set('Authorization', authHeader)

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

function mapLegacyPath(pathname: string): string {
  if (pathname === '/builders/companies') return '/api/public/companies'
  if (pathname.startsWith('/builders/companies/')) {
    return pathname.replace('/builders/companies/', '/api/public/companies/')
  }
  if (pathname === '/builders/coaches') return '/api/public/coaches'
  if (pathname.startsWith('/builders/coaches/')) {
    return pathname.replace('/builders/coaches/', '/api/public/coaches/')
  }
  return pathname
}

function normalizeLegacyBodyForPath(pathname: string, body: Record<string, unknown>): Record<string, unknown> {
  // Keep expected singular DTO shape for Guild detail pages.
  if (pathname.startsWith('/builders/companies/') && !('company' in body)) {
    return { company: body }
  }
  if (pathname.startsWith('/builders/coaches/') && !('coach' in body)) {
    return { coach: body }
  }
  return body
}
