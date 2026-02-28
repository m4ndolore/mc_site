const jwksCache = new Map<string, { keys: JsonWebKey[]; fetchedAt: number }>()
const JWKS_TTL_MS = 60 * 60 * 1000 // 1 hour

interface JwtHeader {
  alg: string
  kid?: string
  typ?: string
}

interface JwtPayload {
  iss?: string
  sub?: string
  aud?: string | string[]
  exp?: number
  iat?: number
  nbf?: number
  email?: string
  name?: string
  [key: string]: unknown
}

export type { JwtPayload }

export async function getJwks(issuerUrl: string, forceRefresh = false): Promise<JsonWebKey[]> {
  const now = Date.now()
  const cached = jwksCache.get(issuerUrl)

  if (!forceRefresh && cached && (now - cached.fetchedAt) < JWKS_TTL_MS) {
    return cached.keys
  }

  const discoveryUrl = `${issuerUrl.replace(/\/$/, '')}/.well-known/openid-configuration`
  const discovery = await fetch(discoveryUrl)
  if (!discovery.ok) throw new Error(`OIDC discovery failed: ${discovery.status}`)
  const { jwks_uri } = await discovery.json() as { jwks_uri: string }

  const jwksResponse = await fetch(jwks_uri)
  if (!jwksResponse.ok) throw new Error(`JWKS fetch failed: ${jwksResponse.status}`)
  const { keys } = await jwksResponse.json() as { keys: JsonWebKey[] }

  jwksCache.set(issuerUrl, { keys, fetchedAt: now })
  return keys
}

export function decodeJwtHeader(token: string): JwtHeader {
  const [headerB64] = token.split('.')
  if (!headerB64) throw new Error('Invalid JWT format')
  const json = atob(headerB64.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json)
}

export function decodeJwtPayload(token: string): JwtPayload {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT format')
  const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json)
}

export async function verifyJwtSignature(
  token: string,
  jwk: JsonWebKey
): Promise<boolean> {
  const [headerB64, payloadB64, signatureB64] = token.split('.')
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  const signature = Uint8Array.from(
    atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  )

  const algorithm = jwk.alg === 'RS256'
    ? { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }
    : { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }

  const key = await crypto.subtle.importKey('jwk', jwk, algorithm, false, ['verify'])
  return crypto.subtle.verify(algorithm, key, signature, data)
}

const CLOCK_SKEW_SECONDS = 30

export function validateClaims(
  payload: JwtPayload,
  issuerAllowlist: string[],
  audience: string
): string | null {
  const now = Math.floor(Date.now() / 1000)

  if (!payload.iss || !issuerAllowlist.includes(payload.iss)) {
    return 'Invalid issuer'
  }

  const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
  if (!audList.includes(audience)) {
    return 'Invalid audience'
  }

  if (!payload.exp || payload.exp < now - CLOCK_SKEW_SECONDS) {
    return 'Token expired'
  }

  if (payload.iat !== undefined && payload.iat > now + CLOCK_SKEW_SECONDS) {
    return 'Token issued in the future'
  }

  if (payload.nbf !== undefined && payload.nbf > now + CLOCK_SKEW_SECONDS) {
    return 'Token not yet valid'
  }

  return null
}
