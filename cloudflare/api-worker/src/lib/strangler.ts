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

  // Build target URL — use URL constructor for safe origin composition
  const target = new URL(
    new URL(c.req.url).pathname + new URL(c.req.url).search,
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

    // Not enveloped → wrap
    return c.json(
      { data: body, meta: requestMeta },
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
