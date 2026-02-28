import { createMiddleware } from 'hono/factory'
import type { Env, AppVars } from '../types'
import { err } from '../lib/envelope'
import {
  getJwks, decodeJwtHeader, decodeJwtPayload,
  verifyJwtSignature, validateClaims,
} from '../lib/jwt'
import { extractRolesFromClaims, computeRoleLevel } from '../lib/roles'

export const verifyOidc = createMiddleware<{ Bindings: Env; Variables: AppVars }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(err('UNAUTHORIZED', 'Missing or malformed token', {
        request_id: c.get('requestId'),
      }), 401)
    }

    const token = authHeader.slice(7)

    let header, payload
    try {
      header = decodeJwtHeader(token)
      payload = decodeJwtPayload(token)
    } catch {
      return c.json(err('UNAUTHORIZED', 'Malformed token', {
        request_id: c.get('requestId'),
      }), 401)
    }

    const issuerAllowlist = c.env.OIDC_ISSUER_ALLOWLIST.split(',').map(s => s.trim())
    const claimError = validateClaims(payload, issuerAllowlist, c.env.OIDC_AUDIENCE)

    if (claimError === 'Token expired') {
      c.header('WWW-Authenticate', 'Bearer error="invalid_token"')
      return c.json(err('TOKEN_EXPIRED', 'Token expired', {
        request_id: c.get('requestId'),
      }), 401)
    }

    if (claimError) {
      return c.json(err('UNAUTHORIZED', claimError, {
        request_id: c.get('requestId'),
      }), 401)
    }

    try {
      let keys = await getJwks(payload.iss!)
      let jwk = keys.find(k => (k as { kid?: string }).kid === header.kid)

      if (!jwk) {
        keys = await getJwks(payload.iss!, true)
        jwk = keys.find(k => (k as { kid?: string }).kid === header.kid)
      }

      if (!jwk) {
        return c.json(err('UNAUTHORIZED', 'No matching key found', {
          request_id: c.get('requestId'),
        }), 401)
      }

      const valid = await verifyJwtSignature(token, jwk)
      if (!valid) {
        return c.json(err('UNAUTHORIZED', 'Invalid signature', {
          request_id: c.get('requestId'),
        }), 401)
      }
    } catch {
      return c.json(err('UNAUTHORIZED', 'Token verification failed', {
        request_id: c.get('requestId'),
      }), 401)
    }

    const roles = extractRolesFromClaims(
      payload as Record<string, unknown>,
      c.env.OIDC_ROLES_CLAIM
    )
    const roleLevel = computeRoleLevel(roles)

    c.set('user', {
      issuer: payload.iss!,
      sub: payload.sub!,
      email: (payload.email as string) ?? null,
      name: (payload.name as string) ?? null,
      roles,
      roleLevel,
    })

    await next()
  }
)
