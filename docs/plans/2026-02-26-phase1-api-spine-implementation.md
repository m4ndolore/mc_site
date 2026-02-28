# Phase 1: API Spine on Workers — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stand up `api.mergecombinator.com` on Workers with Hono, Hyperdrive → Postgres, shared OIDC middleware, read-only builders endpoints, and strangler proxy to SigmaBlox.

**Architecture:** Single CF Workers project using Hono for routing/middleware. Prisma manages guild_users table. Raw SQL repos for SigmaBlox read-only queries. Strangler catch-all proxies unrecognized routes to SigmaBlox. All responses use `{ data, meta }` envelope.

**Tech Stack:** Hono 4, Prisma (driverAdapters), pg (Pool), Cloudflare Workers, Hyperdrive, TypeScript

**Design doc:** `docs/plans/2026-02-26-phase1-api-spine-design.md`

---

### Task 1: Project Scaffold — package.json, tsconfig, wrangler.toml

**Files:**
- Replace: `cloudflare/api-worker/wrangler.toml`
- Create: `cloudflare/api-worker/package.json`
- Create: `cloudflare/api-worker/tsconfig.json`
- Delete: `cloudflare/api-worker/index.js` (replaced by src/index.ts)

**Step 1: Create package.json**

```json
{
  "name": "mc-api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "deploy:staging": "wrangler deploy --env staging",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@prisma/client": "^6.0.0",
    "@prisma/adapter-pg": "^6.0.0",
    "pg": "^8.13.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "typescript": "^5.0.0",
    "wrangler": "^3.0.0",
    "vitest": "^2.0.0",
    "prisma": "^6.0.0",
    "@types/pg": "^8.0.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"]
}
```

**Step 3: Replace wrangler.toml**

```toml
name = "mc-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[routes]]
pattern = "api.mergecombinator.com/*"
zone_name = "mergecombinator.com"

[vars]
MC_PUBLIC_URL = "https://www.mergecombinator.com"
VIA_ISSUER_URL = "https://via.mergecombinator.com"
OIDC_ISSUER_ALLOWLIST = "https://via.mergecombinator.com/application/o/defense-builders/"
OIDC_AUDIENCE = "defense-builders"
OIDC_ROLES_CLAIM = "groups"
LEGACY_API_ORIGIN = "<sigmablox-api-origin>"
CORS_ALLOWED_ORIGINS = "https://guild.mergecombinator.com,https://wingman.mergecombinator.com"

# Hyperdrive binding — configure after `wrangler hyperdrive create mc-api-db`
# [[hyperdrive]]
# binding = "HYPERDRIVE"
# id = "<hyperdrive-config-id>"

[env.staging]
name = "mc-api-staging"

[env.staging.vars]
MC_PUBLIC_URL = "https://www.mergecombinator.com"
VIA_ISSUER_URL = "https://via.mergecombinator.com"
OIDC_ISSUER_ALLOWLIST = "https://via.mergecombinator.com/application/o/defense-builders/"
OIDC_AUDIENCE = "defense-builders"
OIDC_ROLES_CLAIM = "groups"
LEGACY_API_ORIGIN = "<sigmablox-api-origin>"
CORS_ALLOWED_ORIGINS = "https://guild.mergecombinator.com,https://wingman.mergecombinator.com"

[env.dev]
name = "mc-api-dev"

[env.dev.vars]
MC_PUBLIC_URL = "http://localhost:5173"
VIA_ISSUER_URL = "http://localhost:9000"
OIDC_ISSUER_ALLOWLIST = "http://localhost:9000/application/o/defense-builders/"
OIDC_AUDIENCE = "defense-builders"
OIDC_ROLES_CLAIM = "groups"
LEGACY_API_ORIGIN = "http://localhost:3001"
CORS_ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:3003,http://localhost:5173"
```

**Step 4: Delete old index.js**

Remove `cloudflare/api-worker/index.js` — replaced by `src/index.ts` in next task.

**Step 5: Install dependencies**

Run: `cd cloudflare/api-worker && npm install`
Expected: `node_modules/` created, `package-lock.json` generated

**Step 6: Verify TypeScript compiles**

Run: `cd cloudflare/api-worker && npx tsc --noEmit`
Expected: No errors (no source files yet, just validates config)

**Step 7: Commit**

```bash
git add cloudflare/api-worker/package.json cloudflare/api-worker/tsconfig.json cloudflare/api-worker/wrangler.toml cloudflare/api-worker/package-lock.json
git rm cloudflare/api-worker/index.js
git commit -m "feat(api): scaffold Hono project with TypeScript + Prisma deps"
```

---

### Task 2: Types, Envelope, and Health Route — Smoke Deploy

**Files:**
- Create: `cloudflare/api-worker/src/types.ts`
- Create: `cloudflare/api-worker/src/lib/envelope.ts`
- Create: `cloudflare/api-worker/src/routes/health.ts`
- Create: `cloudflare/api-worker/src/index.ts`

**Step 1: Create src/types.ts**

```ts
export interface Env {
  // Cloudflare bindings
  HYPERDRIVE: Hyperdrive

  // Auth
  OIDC_ISSUER_ALLOWLIST: string
  OIDC_AUDIENCE: string
  OIDC_ROLES_CLAIM: string

  // Origins
  MC_PUBLIC_URL: string
  VIA_ISSUER_URL: string
  LEGACY_API_ORIGIN: string
  CORS_ALLOWED_ORIGINS: string
}

export interface UserContext {
  issuer: string
  sub: string
  email: string | null
  name: string | null
  roles: string[]
  roleLevel: number
}

export interface AppVars {
  requestId: string
  user: UserContext
  guildUserId: string
}
```

**Step 2: Create src/lib/envelope.ts**

```ts
export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return { data, meta: meta ?? {} }
}

export function err(code: string, message: string, meta?: Record<string, unknown>) {
  return { error: { code, message }, meta: meta ?? {} }
}
```

**Step 3: Create src/routes/health.ts**

```ts
import { Hono } from 'hono'
import type { Env, AppVars } from '../types'
import { ok } from '../lib/envelope'

const health = new Hono<{ Bindings: Env; Variables: AppVars }>()

health.get('/', (c) => {
  return c.json(ok({
    status: 'ok',
    service: 'mc-api',
    timestamp: new Date().toISOString(),
  }, {
    request_id: c.get('requestId'),
  }), 200)
})

export { health as healthRouter }
```

**Step 4: Create src/index.ts**

```ts
import { Hono } from 'hono'
import type { Env, AppVars } from './types'
import { err } from './lib/envelope'
import { healthRouter } from './routes/health'

const app = new Hono<{ Bindings: Env; Variables: AppVars }>()

// Temporary request ID middleware (replaced in Task 3)
app.use('*', async (c, next) => {
  c.set('requestId', c.req.header('X-Request-Id') ?? crypto.randomUUID())
  await next()
})

app.route('/health', healthRouter)

// Catch-all 404
app.all('*', (c) => {
  return c.json(err('NOT_FOUND', `No route: ${c.req.method} ${c.req.path}`, {
    request_id: c.get('requestId'),
  }), 404)
})

export default app
```

**Step 5: Verify typecheck**

Run: `cd cloudflare/api-worker && npx tsc --noEmit`
Expected: No errors

**Step 6: Smoke test locally**

Run: `cd cloudflare/api-worker && npx wrangler dev --env dev`
Then in another terminal:
```bash
curl http://localhost:8787/health
```
Expected: `{"data":{"status":"ok","service":"mc-api","timestamp":"..."},"meta":{"request_id":"..."}}`

```bash
curl http://localhost:8787/nonexistent
```
Expected: `{"error":{"code":"NOT_FOUND","message":"No route: GET /nonexistent"},"meta":{"request_id":"..."}}`

**Step 7: Commit**

```bash
git add cloudflare/api-worker/src/
git commit -m "feat(api): add types, envelope, health route — Hono smoke test"
```

---

### Task 3: CORS Middleware + Request ID Middleware

**Files:**
- Create: `cloudflare/api-worker/src/middleware/cors.ts`
- Create: `cloudflare/api-worker/src/middleware/request-id.ts`
- Modify: `cloudflare/api-worker/src/index.ts`

**Step 1: Create src/middleware/request-id.ts**

```ts
import { createMiddleware } from 'hono/factory'
import type { Env, AppVars } from '../types'

export const requestId = createMiddleware<{ Bindings: Env; Variables: AppVars }>(
  async (c, next) => {
    const id = c.req.header('X-Request-Id') ?? crypto.randomUUID()
    c.set('requestId', id)
    await next()
    c.header('X-Request-Id', id)
  }
)
```

**Step 2: Create src/middleware/cors.ts**

```ts
import { cors as honoCors } from 'hono/cors'
import type { Env, AppVars } from '../types'
import { createMiddleware } from 'hono/factory'

export const corsMiddleware = createMiddleware<{ Bindings: Env; Variables: AppVars }>(
  async (c, next) => {
    const allowedRaw = c.env.CORS_ALLOWED_ORIGINS || ''
    const allowedOrigins = allowedRaw.split(',').map(s => s.trim()).filter(Boolean)

    const handler = honoCors({
      origin: (origin) => {
        if (allowedOrigins.includes(origin)) return origin
        return ''
      },
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
      maxAge: 86400,
    })

    return handler(c, next)
  }
)
```

**Step 3: Update src/index.ts — replace inline middleware with imports**

Replace the temporary request-id middleware and add CORS:

```ts
import { Hono } from 'hono'
import type { Env, AppVars } from './types'
import { err } from './lib/envelope'
import { requestId } from './middleware/request-id'
import { corsMiddleware } from './middleware/cors'
import { healthRouter } from './routes/health'

const app = new Hono<{ Bindings: Env; Variables: AppVars }>()

app.use('*', requestId)
app.use('*', corsMiddleware)

app.route('/health', healthRouter)

app.all('*', (c) => {
  return c.json(err('NOT_FOUND', `No route: ${c.req.method} ${c.req.path}`, {
    request_id: c.get('requestId'),
  }), 404)
})

export default app
```

**Step 4: Verify typecheck**

Run: `cd cloudflare/api-worker && npx tsc --noEmit`
Expected: No errors

**Step 5: Smoke test CORS**

Run: `cd cloudflare/api-worker && npx wrangler dev --env dev`
```bash
curl -i -H "Origin: http://localhost:3003" http://localhost:8787/health
```
Expected: Response includes `Access-Control-Allow-Origin: http://localhost:3003` and `X-Request-Id` header.

```bash
curl -i -H "Origin: https://evil.com" http://localhost:8787/health
```
Expected: No `Access-Control-Allow-Origin` header in response.

**Step 6: Commit**

```bash
git add cloudflare/api-worker/src/middleware/ cloudflare/api-worker/src/index.ts
git commit -m "feat(api): add CORS + request-id middleware"
```

---

### Task 4: OIDC Token Verification Middleware

**Files:**
- Create: `cloudflare/api-worker/src/middleware/verify-oidc.ts`
- Create: `cloudflare/api-worker/src/lib/jwt.ts`
- Create: `cloudflare/api-worker/src/lib/roles.ts`
- Create: `cloudflare/api-worker/src/test/verify-oidc.test.ts`

**Step 1: Create src/lib/roles.ts**

```ts
const ROLE_HIERARCHY: Record<string, number> = {
  admin: 4,
  trusted: 3,
  industry: 2.5,
  member: 2,
  guest: 1.5,
  restricted: 0.5,
}

export function computeRoleLevel(roles: string[]): number {
  let max = 0
  for (const role of roles) {
    const level = ROLE_HIERARCHY[role.toLowerCase()]
    if (level !== undefined && level > max) max = level
  }
  return max
}

export function extractRolesFromClaims(
  payload: Record<string, unknown>,
  claimPath: string
): string[] {
  // Support dotted paths like "realm_access.roles"
  const parts = claimPath.split('.')
  let current: unknown = payload
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return []
    current = (current as Record<string, unknown>)[part]
  }
  if (Array.isArray(current)) {
    return current.filter((v): v is string => typeof v === 'string')
  }
  return []
}
```

**Step 2: Create src/lib/jwt.ts**

```ts
// Per-issuer JWKS cache at module scope
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
    : { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' } // Default to RS256

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

  // iss
  if (!payload.iss || !issuerAllowlist.includes(payload.iss)) {
    return 'Invalid issuer'
  }

  // aud
  const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
  if (!audList.includes(audience)) {
    return 'Invalid audience'
  }

  // exp
  if (!payload.exp || payload.exp < now - CLOCK_SKEW_SECONDS) {
    return 'Token expired'
  }

  // iat
  if (payload.iat !== undefined && payload.iat > now + CLOCK_SKEW_SECONDS) {
    return 'Token issued in the future'
  }

  // nbf
  if (payload.nbf !== undefined && payload.nbf > now + CLOCK_SKEW_SECONDS) {
    return 'Token not yet valid'
  }

  return null // valid
}
```

**Step 3: Create src/middleware/verify-oidc.ts**

```ts
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

    // Validate claims first (cheap, no network)
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

    // Fetch JWKS and verify signature
    try {
      let keys = await getJwks(payload.iss!)
      let jwk = keys.find(k => k.kid === header.kid)

      // kid miss — force refresh (key rotation)
      if (!jwk) {
        keys = await getJwks(payload.iss!, true)
        jwk = keys.find(k => k.kid === header.kid)
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

    // Extract roles
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
```

**Step 4: Write unit tests for roles and JWT helpers**

Create: `cloudflare/api-worker/src/test/roles.test.ts`

```ts
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
```

Create: `cloudflare/api-worker/src/test/jwt.test.ts`

```ts
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
```

**Step 5: Add vitest config**

Create: `cloudflare/api-worker/vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
})
```

**Step 6: Run tests**

Run: `cd cloudflare/api-worker && npx vitest run`
Expected: All tests pass

**Step 7: Commit**

```bash
git add cloudflare/api-worker/src/lib/jwt.ts cloudflare/api-worker/src/lib/roles.ts \
  cloudflare/api-worker/src/middleware/verify-oidc.ts \
  cloudflare/api-worker/src/test/ cloudflare/api-worker/vitest.config.ts
git commit -m "feat(api): add OIDC token verification middleware with JWKS caching"
```

---

### Task 5: Database Client + Prisma Schema + Guild User Repo

**Files:**
- Create: `cloudflare/api-worker/prisma/schema.prisma`
- Create: `cloudflare/api-worker/src/lib/db.ts`
- Create: `cloudflare/api-worker/src/repos/guild/users.ts`

**Step 1: Create prisma/schema.prisma**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

model GuildUser {
  id         String   @id @default(uuid()) @db.Uuid
  issuer     String
  subject    String
  email      String?
  name       String?
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  lastSeenAt DateTime @default(now()) @map("last_seen_at") @db.Timestamptz

  @@unique([issuer, subject])
  @@index([email])
  @@map("guild_users")
}
```

**Step 2: Generate Prisma client**

Run: `cd cloudflare/api-worker && npx prisma generate`
Expected: Prisma Client generated successfully

**Step 3: Create src/lib/db.ts**

```ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import pg from 'pg'

const { Pool } = pg

// Module-scope singleton — reused across requests within the Worker isolate
let pool: InstanceType<typeof Pool> | null = null
let prisma: PrismaClient | null = null

export function getDb(hyperdrive: Hyperdrive) {
  if (!pool) {
    pool = new Pool({ connectionString: hyperdrive.connectionString })
    const adapter = new PrismaPg(pool)
    prisma = new PrismaClient({ adapter })
  }
  return { prisma: prisma!, pool: pool! }
}
```

**Step 4: Create src/repos/guild/users.ts**

```ts
import type { PrismaClient } from '@prisma/client'

interface UpsertGuildUserParams {
  issuer: string
  subject: string
  email: string | null
  name: string | null
}

export async function upsertGuildUser(
  prisma: PrismaClient,
  params: UpsertGuildUserParams
): Promise<string> {
  const user = await prisma.guildUser.upsert({
    where: {
      issuer_subject: {
        issuer: params.issuer,
        subject: params.subject,
      },
    },
    create: {
      issuer: params.issuer,
      subject: params.subject,
      email: params.email,
      name: params.name,
    },
    update: {
      ...(params.email !== null && { email: params.email }),
      ...(params.name !== null && { name: params.name }),
      lastSeenAt: new Date(),
    },
    select: { id: true },
  })
  return user.id
}
```

**Step 5: Verify typecheck**

Run: `cd cloudflare/api-worker && npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add cloudflare/api-worker/prisma/ cloudflare/api-worker/src/lib/db.ts \
  cloudflare/api-worker/src/repos/guild/
git commit -m "feat(api): add Prisma schema for guild_users + DB client singleton + upsert repo"
```

---

### Task 6: Ensure Guild User Middleware + /guild/me Route

**Files:**
- Create: `cloudflare/api-worker/src/middleware/ensure-guild-user.ts`
- Create: `cloudflare/api-worker/src/routes/guild.ts`
- Modify: `cloudflare/api-worker/src/index.ts`

**Step 1: Create src/middleware/ensure-guild-user.ts**

```ts
import { createMiddleware } from 'hono/factory'
import type { Env, AppVars } from '../types'
import { getDb } from '../lib/db'
import { upsertGuildUser } from '../repos/guild/users'

export const ensureGuildUser = createMiddleware<{ Bindings: Env; Variables: AppVars }>(
  async (c, next) => {
    const user = c.get('user')
    const { prisma } = getDb(c.env.HYPERDRIVE)

    const guildUserId = await upsertGuildUser(prisma, {
      issuer: user.issuer,
      subject: user.sub,
      email: user.email,
      name: user.name,
    })

    c.set('guildUserId', guildUserId)
    await next()
  }
)
```

**Step 2: Create src/routes/guild.ts**

```ts
import { Hono } from 'hono'
import type { Env, AppVars } from '../types'
import { ok } from '../lib/envelope'
import { verifyOidc } from '../middleware/verify-oidc'
import { ensureGuildUser } from '../middleware/ensure-guild-user'

const guild = new Hono<{ Bindings: Env; Variables: AppVars }>()

guild.use('*', verifyOidc)
guild.use('/me', ensureGuildUser)

guild.get('/me', (c) => {
  const user = c.get('user')
  return c.json(ok({
    user: {
      guild_user_id: c.get('guildUserId'),
      issuer: user.issuer,
      sub: user.sub,
      email: user.email,
      name: user.name,
    },
    roles: user.roles,
    entitlements: {},
  }, {
    request_id: c.get('requestId'),
    role_level: user.roleLevel,
    issued_at: new Date().toISOString(),
  }), 200)
})

export { guild as guildRouter }
```

**Step 3: Update src/index.ts — mount guild router**

```ts
import { Hono } from 'hono'
import type { Env, AppVars } from './types'
import { err } from './lib/envelope'
import { requestId } from './middleware/request-id'
import { corsMiddleware } from './middleware/cors'
import { healthRouter } from './routes/health'
import { guildRouter } from './routes/guild'

const app = new Hono<{ Bindings: Env; Variables: AppVars }>()

app.use('*', requestId)
app.use('*', corsMiddleware)

app.route('/health', healthRouter)
app.route('/guild', guildRouter)

app.all('*', (c) => {
  return c.json(err('NOT_FOUND', `No route: ${c.req.method} ${c.req.path}`, {
    request_id: c.get('requestId'),
  }), 404)
})

export default app
```

**Step 4: Verify typecheck**

Run: `cd cloudflare/api-worker && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add cloudflare/api-worker/src/middleware/ensure-guild-user.ts \
  cloudflare/api-worker/src/routes/guild.ts cloudflare/api-worker/src/index.ts
git commit -m "feat(api): add /guild/me with auto-provisioning identity surface"
```

---

### Task 7: SigmaBlox Companies Repo + Mapper

**Files:**
- Create: `cloudflare/api-worker/src/repos/sigmablox/companies.ts`
- Create: `cloudflare/api-worker/src/lib/mappers.ts`
- Create: `cloudflare/api-worker/src/lib/pagination.ts`

**Step 1: Create src/lib/pagination.ts**

```ts
import { err } from './envelope'

export interface Pagination {
  limit: number
  offset: number
}

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

export function parsePagination(
  query: Record<string, string>
): { pagination: Pagination } | { error: ReturnType<typeof err>; status: number } {
  const rawLimit = query.limit
  const rawOffset = query.offset

  let limit = DEFAULT_LIMIT
  let offset = 0

  if (rawLimit !== undefined) {
    limit = parseInt(rawLimit, 10)
    if (isNaN(limit) || limit < 0) {
      return { error: err('BAD_REQUEST', 'Invalid limit: must be a non-negative integer'), status: 400 }
    }
    if (limit > MAX_LIMIT) limit = MAX_LIMIT
  }

  if (rawOffset !== undefined) {
    offset = parseInt(rawOffset, 10)
    if (isNaN(offset) || offset < 0) {
      return { error: err('BAD_REQUEST', 'Invalid offset: must be a non-negative integer'), status: 400 }
    }
  }

  return { pagination: { limit, offset } }
}
```

**Step 2: Create src/repos/sigmablox/companies.ts**

Note: SigmaBlox Prisma uses camelCase column names without `@map`. In PostgreSQL, unquoted identifiers fold to lowercase, but Prisma creates columns with quoted camelCase names. So raw SQL must quote camelCase columns: `"companyName"`, `"missionArea"`, etc.

```ts
import type pg from 'pg'
import type { Pagination } from '../../lib/pagination'

const { Pool } = pg

export interface CompanyRow {
  id: string
  name: string
  companyName: string | null
  productName: string | null
  website: string | null
  linkedInUrl: string | null
  logoUrl: string | null
  cfImageId: string | null
  contactName: string | null
  location: string | null
  missionArea: string | null
  warfareDomain: string | null
  description: string | null
  problemStatement: string | null
  trlLevel: number | null
  fundingStage: string | null
  teamSize: string | null
  cohortId: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  // Joined from Cohort
  cohort_cohortId: string | null
  cohort_name: string | null
}

export interface CompanyFilters {
  search?: string
  missionArea?: string
  warfareDomain?: string
  fundingStage?: string
}

const UUID_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i
// Also match cuid format (starts with c, 25 chars)
const CUID_RE = /^c[a-z0-9]{24}$/

const COMPANY_COLUMNS = `
  c.id, c.name, c."companyName", c."productName", c.website,
  c."linkedInUrl", c."logoUrl", c."cfImageId", c."contactName",
  c.location, c."missionArea", c."warfareDomain", c.description,
  c."problemStatement", c."trlLevel", c."fundingStage", c."teamSize",
  c."cohortId", c.status, c."createdAt", c."updatedAt",
  co."cohortId" AS "cohort_cohortId", co.name AS "cohort_name"
`.trim()

const COMPANY_FROM = `
  "Company" c LEFT JOIN "Cohort" co ON c."cohortId" = co.id
`.trim()

const MAX_SEARCH_LENGTH = 100

function buildWhereClause(
  filters: CompanyFilters
): { where: string; params: unknown[]; paramIndex: number } {
  const conditions: string[] = ['c.status = $1']
  const params: unknown[] = ['active']
  let idx = 2

  if (filters.search) {
    const term = `%${filters.search.trim().slice(0, MAX_SEARCH_LENGTH)}%`
    conditions.push(`(c.name ILIKE $${idx} OR c."companyName" ILIKE $${idx} OR c.description ILIKE $${idx})`)
    params.push(term)
    idx++
  }

  if (filters.missionArea) {
    conditions.push(`c."missionArea" = $${idx}`)
    params.push(filters.missionArea)
    idx++
  }

  if (filters.warfareDomain) {
    conditions.push(`c."warfareDomain" = $${idx}`)
    params.push(filters.warfareDomain)
    idx++
  }

  if (filters.fundingStage) {
    conditions.push(`c."fundingStage" = $${idx}`)
    params.push(filters.fundingStage)
    idx++
  }

  return { where: conditions.join(' AND '), params, paramIndex: idx }
}

export async function listCompanies(
  pool: InstanceType<typeof Pool>,
  filters: CompanyFilters,
  pagination: Pagination
): Promise<{ rows: CompanyRow[]; total: number }> {
  const { where, params, paramIndex } = buildWhereClause(filters)

  // Count query (separate, no window functions)
  const countResult = await pool.query(
    `SELECT COUNT(*) AS count FROM ${COMPANY_FROM} WHERE ${where}`,
    params
  )
  const total = parseInt(countResult.rows[0].count, 10)

  // Data query
  const dataParams = [...params, pagination.limit, pagination.offset]
  const dataResult = await pool.query(
    `SELECT ${COMPANY_COLUMNS} FROM ${COMPANY_FROM}
     WHERE ${where}
     ORDER BY c."updatedAt" DESC, c.id ASC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    dataParams
  )

  return { rows: dataResult.rows as CompanyRow[], total }
}

export async function getCompany(
  pool: InstanceType<typeof Pool>,
  id: string
): Promise<CompanyRow | null> {
  const isUuidOrCuid = UUID_RE.test(id) || CUID_RE.test(id)
  const column = isUuidOrCuid ? 'c.id' : 'c."legacyAirtableId"'

  const result = await pool.query(
    `SELECT ${COMPANY_COLUMNS} FROM ${COMPANY_FROM} WHERE ${column} = $1`,
    [id]
  )

  return (result.rows[0] as CompanyRow) ?? null
}
```

**Step 3: Create src/lib/mappers.ts**

```ts
import type { CompanyRow } from '../repos/sigmablox/companies'
import type { CoachRow } from '../repos/sigmablox/coaches'

export interface CompanyDto {
  id: string
  name: string
  companyName: string | null
  productName: string | null
  website: string | null
  linkedInUrl: string | null
  logoUrl: string | null
  cfImageId: string | null
  contactName: string | null
  location: string | null
  missionArea: string | null
  warfareDomain: string | null
  description: string | null
  problemStatement: string | null
  trlLevel: number | null
  fundingStage: string | null
  teamSize: string | null
  status: string
  cohort: { cohortId: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export function companyToDto(row: CompanyRow): CompanyDto {
  return {
    id: row.id,
    name: row.name,
    companyName: row.companyName,
    productName: row.productName,
    website: row.website,
    linkedInUrl: row.linkedInUrl,
    logoUrl: row.logoUrl,
    cfImageId: row.cfImageId,
    contactName: row.contactName,
    location: row.location,
    missionArea: row.missionArea,
    warfareDomain: row.warfareDomain,
    description: row.description,
    problemStatement: row.problemStatement,
    trlLevel: row.trlLevel,
    fundingStage: row.fundingStage,
    teamSize: row.teamSize,
    status: row.status,
    cohort: row.cohort_cohortId
      ? { cohortId: row.cohort_cohortId, name: row.cohort_name! }
      : null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  }
}

export interface CoachDto {
  id: string
  name: string
  email: string | null
  linkedIn: string | null
  photoUrl: string | null
  affiliation: string | null
  company: string | null
  combineRole: string | null
  domain: string | null
  smeArea: string | null
  bio: string | null
  cohort: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export function coachToDto(row: CoachRow): CoachDto {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    linkedIn: row.linkedIn,
    photoUrl: row.photoUrl,
    affiliation: row.affiliation,
    company: row.company,
    combineRole: row.combineRole,
    domain: row.domain,
    smeArea: row.smeArea,
    bio: row.bio,
    cohort: row.cohort,
    status: row.status,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  }
}
```

**Step 4: Verify typecheck** (will fail until coaches.ts exists — that's Task 8)

Run: `cd cloudflare/api-worker && npx tsc --noEmit`
Expected: Error about missing `../repos/sigmablox/coaches` — expected, fixed in Task 8.

**Step 5: Commit**

```bash
git add cloudflare/api-worker/src/repos/sigmablox/companies.ts \
  cloudflare/api-worker/src/lib/mappers.ts cloudflare/api-worker/src/lib/pagination.ts
git commit -m "feat(api): add companies repo (raw SQL) + DTO mappers + pagination"
```

---

### Task 8: SigmaBlox Coaches Repo

**Files:**
- Create: `cloudflare/api-worker/src/repos/sigmablox/coaches.ts`

**Step 1: Create src/repos/sigmablox/coaches.ts**

```ts
import type pg from 'pg'
import type { Pagination } from '../../lib/pagination'

const { Pool } = pg

export interface CoachRow {
  id: string
  name: string
  email: string | null
  linkedIn: string | null
  photoUrl: string | null
  affiliation: string | null
  company: string | null
  combineRole: string | null
  domain: string | null
  smeArea: string | null
  bio: string | null
  cohort: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface CoachFilters {
  search?: string
  domain?: string
}

const UUID_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i
const CUID_RE = /^c[a-z0-9]{24}$/

const COACH_COLUMNS = `
  id, name, email, "linkedIn", "photoUrl", affiliation, company,
  "combineRole", domain, "smeArea", bio, cohort, status,
  "createdAt", "updatedAt"
`.trim()

const MAX_SEARCH_LENGTH = 100

function buildWhereClause(
  filters: CoachFilters
): { where: string; params: unknown[]; paramIndex: number } {
  const conditions: string[] = ['status = $1']
  const params: unknown[] = ['active']
  let idx = 2

  if (filters.search) {
    const term = `%${filters.search.trim().slice(0, MAX_SEARCH_LENGTH)}%`
    conditions.push(`(name ILIKE $${idx} OR bio ILIKE $${idx} OR company ILIKE $${idx})`)
    params.push(term)
    idx++
  }

  if (filters.domain) {
    conditions.push(`domain = $${idx}`)
    params.push(filters.domain)
    idx++
  }

  return { where: conditions.join(' AND '), params, paramIndex: idx }
}

export async function listCoaches(
  pool: InstanceType<typeof Pool>,
  filters: CoachFilters,
  pagination: Pagination
): Promise<{ rows: CoachRow[]; total: number }> {
  const { where, params, paramIndex } = buildWhereClause(filters)

  const countResult = await pool.query(
    `SELECT COUNT(*) AS count FROM "Coach" WHERE ${where}`,
    params
  )
  const total = parseInt(countResult.rows[0].count, 10)

  const dataParams = [...params, pagination.limit, pagination.offset]
  const dataResult = await pool.query(
    `SELECT ${COACH_COLUMNS} FROM "Coach"
     WHERE ${where}
     ORDER BY "updatedAt" DESC, id ASC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    dataParams
  )

  return { rows: dataResult.rows as CoachRow[], total }
}

export async function getCoach(
  pool: InstanceType<typeof Pool>,
  id: string
): Promise<CoachRow | null> {
  const isUuidOrCuid = UUID_RE.test(id) || CUID_RE.test(id)
  const column = isUuidOrCuid ? 'id' : '"legacyAirtableId"'

  const result = await pool.query(
    `SELECT ${COACH_COLUMNS} FROM "Coach" WHERE ${column} = $1`,
    [id]
  )

  return (result.rows[0] as CoachRow) ?? null
}
```

**Step 2: Verify typecheck**

Run: `cd cloudflare/api-worker && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add cloudflare/api-worker/src/repos/sigmablox/coaches.ts
git commit -m "feat(api): add coaches repo (raw SQL, SELECT-only)"
```

---

### Task 9: Builders Route Handlers

**Files:**
- Create: `cloudflare/api-worker/src/routes/builders.ts`
- Modify: `cloudflare/api-worker/src/index.ts`

**Step 1: Create src/routes/builders.ts**

```ts
import { Hono } from 'hono'
import type { Env, AppVars } from '../types'
import { ok, err } from '../lib/envelope'
import { verifyOidc } from '../middleware/verify-oidc'
import { getDb } from '../lib/db'
import { parsePagination } from '../lib/pagination'
import { listCompanies, getCompany } from '../repos/sigmablox/companies'
import { listCoaches, getCoach } from '../repos/sigmablox/coaches'
import { companyToDto, coachToDto } from '../lib/mappers'

const builders = new Hono<{ Bindings: Env; Variables: AppVars }>()

builders.use('*', verifyOidc)

// GET /builders/companies
builders.get('/companies', async (c) => {
  const requestId = c.get('requestId')
  const query = c.req.query()

  const paginationResult = parsePagination(query)
  if ('error' in paginationResult) {
    return c.json(paginationResult.error, paginationResult.status as 400)
  }
  const { pagination } = paginationResult

  const filters = {
    search: query.search?.trim().slice(0, 100) || undefined,
    missionArea: query.missionArea || undefined,
    warfareDomain: query.warfareDomain || undefined,
    fundingStage: query.fundingStage || undefined,
  }

  const { pool } = getDb(c.env.HYPERDRIVE)
  const { rows, total } = await listCompanies(pool, filters, pagination)

  return c.json(ok(
    { companies: rows.map(companyToDto) },
    { request_id: requestId, total, limit: pagination.limit, offset: pagination.offset }
  ), 200)
})

// GET /builders/companies/:id
builders.get('/companies/:id', async (c) => {
  const requestId = c.get('requestId')
  const id = c.req.param('id')

  const { pool } = getDb(c.env.HYPERDRIVE)
  const row = await getCompany(pool, id)

  if (!row) {
    return c.json(err('NOT_FOUND', `Company ${id} not found`, { request_id: requestId }), 404)
  }

  return c.json(ok(
    { company: companyToDto(row) },
    { request_id: requestId }
  ), 200)
})

// GET /builders/coaches
builders.get('/coaches', async (c) => {
  const requestId = c.get('requestId')
  const query = c.req.query()

  const paginationResult = parsePagination(query)
  if ('error' in paginationResult) {
    return c.json(paginationResult.error, paginationResult.status as 400)
  }
  const { pagination } = paginationResult

  const filters = {
    search: query.search?.trim().slice(0, 100) || undefined,
    domain: query.domain || undefined,
  }

  const { pool } = getDb(c.env.HYPERDRIVE)
  const { rows, total } = await listCoaches(pool, filters, pagination)

  return c.json(ok(
    { coaches: rows.map(coachToDto) },
    { request_id: requestId, total, limit: pagination.limit, offset: pagination.offset }
  ), 200)
})

// GET /builders/coaches/:id
builders.get('/coaches/:id', async (c) => {
  const requestId = c.get('requestId')
  const id = c.req.param('id')

  const { pool } = getDb(c.env.HYPERDRIVE)
  const row = await getCoach(pool, id)

  if (!row) {
    return c.json(err('NOT_FOUND', `Coach ${id} not found`, { request_id: requestId }), 404)
  }

  return c.json(ok(
    { coach: coachToDto(row) },
    { request_id: requestId }
  ), 200)
})

export { builders as buildersRouter }
```

**Step 2: Update src/index.ts — mount builders router**

```ts
import { Hono } from 'hono'
import type { Env, AppVars } from './types'
import { err } from './lib/envelope'
import { requestId } from './middleware/request-id'
import { corsMiddleware } from './middleware/cors'
import { healthRouter } from './routes/health'
import { guildRouter } from './routes/guild'
import { buildersRouter } from './routes/builders'

const app = new Hono<{ Bindings: Env; Variables: AppVars }>()

app.use('*', requestId)
app.use('*', corsMiddleware)

app.route('/health', healthRouter)
app.route('/guild', guildRouter)
app.route('/builders', buildersRouter)

app.all('*', (c) => {
  return c.json(err('NOT_FOUND', `No route: ${c.req.method} ${c.req.path}`, {
    request_id: c.get('requestId'),
  }), 404)
})

export default app
```

**Step 3: Verify typecheck**

Run: `cd cloudflare/api-worker && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add cloudflare/api-worker/src/routes/builders.ts cloudflare/api-worker/src/index.ts
git commit -m "feat(api): add builders route handlers (companies/coaches read-only)"
```

---

### Task 10: Strangler Config Map + Legacy Proxy

**Files:**
- Create: `cloudflare/api-worker/src/lib/strangler.ts`
- Modify: `cloudflare/api-worker/src/index.ts`
- Create: `cloudflare/api-worker/src/test/strangler.test.ts`

**Step 1: Write strangler tests first**

Create: `cloudflare/api-worker/src/test/strangler.test.ts`

```ts
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
```

**Step 2: Run tests to verify they fail**

Run: `cd cloudflare/api-worker && npx vitest run src/test/strangler.test.ts`
Expected: FAIL — module not found

**Step 3: Create src/lib/strangler.ts**

```ts
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

export function resolveRoute(method: string, path: string): RouteTarget | null {
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
```

**Step 4: Update src/index.ts — add strangler catch-all**

```ts
import { Hono } from 'hono'
import type { Env, AppVars } from './types'
import { err } from './lib/envelope'
import { requestId } from './middleware/request-id'
import { corsMiddleware } from './middleware/cors'
import { healthRouter } from './routes/health'
import { guildRouter } from './routes/guild'
import { buildersRouter } from './routes/builders'
import { resolveRoute, proxyToLegacy } from './lib/strangler'

const app = new Hono<{ Bindings: Env; Variables: AppVars }>()

app.use('*', requestId)
app.use('*', corsMiddleware)

app.route('/health', healthRouter)
app.route('/guild', guildRouter)
app.route('/builders', buildersRouter)

// Catch-all: strangler proxy or 404
app.all('*', async (c) => {
  const target = resolveRoute(c.req.method, c.req.path)
  if (target === 'proxy_legacy') {
    return proxyToLegacy(c)
  }
  if (target === 'native') {
    return c.json(err('INTERNAL', 'Route marked native but no handler mounted', {
      route: `${c.req.method} ${c.req.path}`,
      request_id: c.get('requestId'),
    }), 500)
  }
  return c.json(err('NOT_FOUND', `No route: ${c.req.method} ${c.req.path}`, {
    request_id: c.get('requestId'),
  }), 404)
})

export default app
```

**Step 5: Run all tests**

Run: `cd cloudflare/api-worker && npx vitest run`
Expected: All tests pass (strangler + jwt + roles)

**Step 6: Verify typecheck**

Run: `cd cloudflare/api-worker && npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add cloudflare/api-worker/src/lib/strangler.ts cloudflare/api-worker/src/test/strangler.test.ts \
  cloudflare/api-worker/src/index.ts
git commit -m "feat(api): add strangler config map + legacy proxy with envelope normalization"
```

---

### Task 11: Hyperdrive Setup + guild_users Migration

> **Note:** This task requires access to Cloudflare dashboard and the Postgres connection string. Some steps are manual.

**Step 1: Create Hyperdrive configuration**

Run: `cd cloudflare/api-worker && npx wrangler hyperdrive create mc-api-db --connection-string="<postgres-connection-string>"`
Expected: Returns a Hyperdrive config ID

**Step 2: Update wrangler.toml with Hyperdrive ID**

Uncomment and fill in the Hyperdrive binding:

```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "<hyperdrive-config-id-from-step-1>"
```

**Step 3: Run Prisma migration to create guild_users table**

Set DATABASE_URL to the direct Postgres connection string (not Hyperdrive — Prisma migrate needs direct access):

Run: `cd cloudflare/api-worker && DATABASE_URL="<direct-postgres-url>" npx prisma migrate dev --name init-guild-users`
Expected: Migration created and applied. `guild_users` table exists in `public` schema.

**Step 4: Verify table exists**

Run: `DATABASE_URL="<direct-postgres-url>" npx prisma studio`
Expected: Can see GuildUser model with 0 rows

**Step 5: Commit migration files**

```bash
git add cloudflare/api-worker/prisma/ cloudflare/api-worker/wrangler.toml
git commit -m "feat(api): create guild_users table via Prisma migration + Hyperdrive binding"
```

---

### Task 12: Deploy to Staging + Smoke Test

**Step 1: Deploy to staging**

Run: `cd cloudflare/api-worker && npx wrangler deploy --env staging`
Expected: Deployed successfully

**Step 2: Smoke test health endpoint**

```bash
curl https://api.mergecombinator.com/health
```
Expected: `{"data":{"status":"ok","service":"mc-api",...},"meta":{"request_id":"..."}}`

**Step 3: Smoke test 404 envelope**

```bash
curl https://api.mergecombinator.com/nonexistent
```
Expected: Proxied to legacy (proxy_legacy), or if legacy is unreachable: `{"error":{"code":"PROXY_ERROR",...}}`

**Step 4: Smoke test CORS**

```bash
curl -i -H "Origin: https://guild.mergecombinator.com" https://api.mergecombinator.com/health
```
Expected: `Access-Control-Allow-Origin: https://guild.mergecombinator.com`

**Step 5: Smoke test auth rejection**

```bash
curl https://api.mergecombinator.com/guild/me
```
Expected: `{"error":{"code":"UNAUTHORIZED","message":"Missing or malformed token"},"meta":{...}}`

**Step 6: Commit any fixes, tag milestone**

```bash
git tag phase1-api-spine-staging
git push origin main --tags
```

---

### Task 13: Deploy to Production + End-to-End Validation

**Step 1: Deploy to production**

Run: `cd cloudflare/api-worker && npx wrangler deploy`
Expected: Deployed to `api.mergecombinator.com`

**Step 2: Run full smoke test battery**

```bash
# Health
curl -s https://api.mergecombinator.com/health | jq .

# 401 on /guild/me without token
curl -s https://api.mergecombinator.com/guild/me | jq .

# 401 on /builders/companies without token
curl -s https://api.mergecombinator.com/builders/companies | jq .

# CORS headers present
curl -si -H "Origin: https://guild.mergecombinator.com" https://api.mergecombinator.com/health | head -20

# Unknown route → proxy_legacy or PROXY_ERROR
curl -s https://api.mergecombinator.com/unknown | jq .
```

**Step 3: Test with real VIA token (manual)**

Obtain a token from VIA and test:
```bash
# Set bearer credential in your local environment before running this call.
curl -s -H "Authorization: Bearer $TOKEN" https://api.mergecombinator.com/guild/me | jq .
curl -s -H "Authorization: Bearer $TOKEN" https://api.mergecombinator.com/builders/companies | jq .
```

Expected: `/guild/me` returns user object with `guild_user_id`. `/builders/companies` returns company list.

**Step 4: Update RTMX**

Update `.rtmx/database.csv` — REQ-PLATFORM-001 Phase 1 milestone.

**Step 5: Tag release**

```bash
git tag phase1-api-spine-complete
git push origin main --tags
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Project scaffold | package.json, tsconfig, wrangler.toml |
| 2 | Types, envelope, health, smoke deploy | src/types.ts, src/lib/envelope.ts, src/routes/health.ts, src/index.ts |
| 3 | CORS + request-id middleware | src/middleware/cors.ts, src/middleware/request-id.ts |
| 4 | OIDC token verification | src/middleware/verify-oidc.ts, src/lib/jwt.ts, src/lib/roles.ts |
| 5 | DB client + Prisma schema + guild repo | prisma/schema.prisma, src/lib/db.ts, src/repos/guild/users.ts |
| 6 | /guild/me route + ensure-guild-user | src/middleware/ensure-guild-user.ts, src/routes/guild.ts |
| 7 | Companies repo + mappers | src/repos/sigmablox/companies.ts, src/lib/mappers.ts |
| 8 | Coaches repo | src/repos/sigmablox/coaches.ts |
| 9 | Builders route handlers | src/routes/builders.ts |
| 10 | Strangler map + legacy proxy | src/lib/strangler.ts |
| 11 | Hyperdrive + guild_users migration | wrangler.toml, prisma/migrations/ |
| 12 | Deploy staging + smoke test | — |
| 13 | Deploy production + e2e validation | — |
