# Phase 1: API Spine on Workers — Design Document

**Date:** 2026-02-26
**Status:** Approved
**Tracks:** REQ-PLATFORM-001 (Phase 1)
**Authors:** Paul Garcia, Claude
**Parent:** `docs/plans/2026-02-22-platform-convergence-architecture.md`

---

## Goal

Stand up `api.mergecombinator.com` on Cloudflare Workers with Hyperdrive → Postgres. Mirror initial read-only endpoints. Strangler config map in place. Guild identity surface established.

**Exit criteria:** Guild SPA fetches builders/champions from Workers → Postgres (not through SigmaBlox proxy chain). `GET /guild/me` auto-provisions Guild identity. Strangler map routes remaining endpoints to SigmaBlox.

---

## Section 1: Project Structure & Routing

### Framework

Hono — already proven in opportunities-api, Workers-native, middleware-first, ~14kb.

### Project Structure

```
cloudflare/api-worker/
├── wrangler.toml
├── package.json
├── tsconfig.json
├── prisma/
│   └── schema.prisma              # Guild schema (guild_users)
├── src/
│   ├── index.ts                   # Hono app, mount routes, catch-all strangler
│   ├── middleware/
│   │   ├── verify-oidc.ts         # Token verification only → c.set('user')
│   │   ├── ensure-guild-user.ts   # DB upsert → c.set('guildUserId')
│   │   ├── cors.ts                # CORS middleware
│   │   └── request-id.ts          # Generate/propagate X-Request-Id
│   ├── routes/
│   │   ├── guild.ts               # /guild/* (GET /me)
│   │   ├── builders.ts            # /builders/* (companies, coaches)
│   │   └── health.ts              # GET /health
│   ├── repos/
│   │   ├── guild/
│   │   │   └── users.ts           # GuildUser upsert/find (via Prisma)
│   │   └── sigmablox/
│   │       ├── companies.ts       # listCompanies, getCompany (raw SQL)
│   │       └── coaches.ts         # listCoaches, getCoach (raw SQL)
│   ├── lib/
│   │   ├── envelope.ts            # ok(data, meta?) / err(code, message, meta?)
│   │   ├── strangler.ts           # Route map + proxyToLegacy handler
│   │   └── db.ts                  # Prisma + Hyperdrive client (module-scope singleton)
│   └── types.ts                   # Env bindings, Variables, UserContext
```

### Routing (`src/index.ts`)

```ts
const app = new Hono<{ Bindings: Env; Variables: AppVars }>()

app.use('*', requestId())
app.use('*', cors())
app.route('/health', healthRouter)
app.route('/guild', guildRouter)
app.route('/builders', buildersRouter)

// Catch-all: strangler or 404 envelope
app.all('*', async (c) => {
  const target = resolveRoute(c.req.method, c.req.path)
  if (target === 'proxy_legacy') {
    return proxyToLegacy(c)
  }
  if (target === 'native') {
    // Route marked native but no Hono handler matched — bug
    return c.json(err('INTERNAL', 'Route marked native but no handler mounted', {
      route: `${c.req.method} ${c.req.path}`,
      request_id: c.get('requestId'),
    }), 500)
  }
  return c.json(err('NOT_FOUND', `No route: ${c.req.method} ${c.req.path}`, {
    request_id: c.get('requestId'),
  }), 404)
})
```

### Strangler Route Map (`src/lib/strangler.ts`)

```ts
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
  // All other paths proxy to legacy during migration
  return 'proxy_legacy'
}
```

`resolveRoute` currently never returns `null` — everything not native is `proxy_legacy`. `null` is reserved for when SigmaBlox is retired and unrecognized routes should 404. The catch-all handles all three cases for forward-compatibility.

### Response Envelope (`src/lib/envelope.ts`)

```ts
export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return { data, meta: meta ?? {} }
}

export function err(code: string, message: string, meta?: Record<string, unknown>) {
  return { error: { code, message }, meta: meta ?? {} }
}
```

Status always via `c.json(ok/err(...), statusCode)`. One place for HTTP status, no duplication.

---

## Section 2: Database & Prisma

### Guild Schema (`prisma/schema.prisma`)

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

### Invariants

- **Hyperdrive invariant:** All DB access in Workers goes through Hyperdrive. If `DATABASE_URL` is used (Prisma requires it), it must point to the Hyperdrive connection string. No direct DB URLs.
- **Schema choice (Phase 1):** `guild_users` lives in `public` schema to avoid search_path/migration complexity. Schema/DB split per bounded context occurs later.
- **Raw SQL isolation:** Builders read endpoints use a small repo layer under `src/repos/sigmablox/*` with typed row mappers. SELECT-only contract enforced by code review, file location, and tests.
- **Pool lifecycle:** Create Pool/PrismaClient once per Worker isolate (module scope), not per request.

### DB Client (`src/lib/db.ts`)

```ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

// Module-scope singleton — reused across requests within the isolate
let pool: Pool | null = null
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

`prisma` for guild_users operations. `pool` (same Hyperdrive connection) for raw SQL against SigmaBlox tables.

### SigmaBlox Read Model (Phase 1 Contract)

Workers read only from a stable subset of columns on `Company`, `Coach`, and `Cohort` tables:

| Table | Columns used (Phase 1) |
|-------|----------------------|
| `Company` | id, name, companyName, productName, website, linkedInUrl, logoUrl, cfImageId, contactName, location, missionArea, warfareDomain, description, problemStatement, trlLevel, fundingStage, teamSize, cohortId, status, createdAt, updatedAt |
| `Coach` | id, name, email, linkedIn, photoUrl, affiliation, company, combineRole, domain, smeArea, bio, cohort, status, createdAt, updatedAt |
| `Cohort` | id, cohortId, name |

If SigmaBlox schema changes on these columns, either update the SQL mappers or shift those endpoints to `proxy_legacy` temporarily. Strangler philosophy stays intact.

### Hyperdrive Binding (`wrangler.toml`)

```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "<hyperdrive-config-id>"
```

---

## Section 3: OIDC Middleware & `/guild/me`

### `src/middleware/verify-oidc.ts` — Stateless Token Verification

1. Extract `Authorization: Bearer <token>` header
2. Decode JWT header → extract `kid`
3. Fetch OIDC discovery from issuer (`/.well-known/openid-configuration`), then JWKS from `jwks_uri`
   - Cache per issuer in module-scope `Map<string, { keys, fetchedAt }>`, TTL 1 hour
   - Force-refresh on `kid` miss (key rotation)
4. Verify signature against matching JWKS key
5. Validate claims:
   - `iss` ∈ issuer allowlist (env: `OIDC_ISSUER_ALLOWLIST`)
   - `aud` matches expected audience (env: `OIDC_AUDIENCE`)
   - `exp` > now - 30s (clock skew tolerance)
   - `iat` <= now + 30s (clock skew tolerance)
   - `nbf` <= now + 30s (if present)
6. Extract roles from configurable claim path (env: `OIDC_ROLES_CLAIM`, e.g. `groups`, `roles`, `realm_access.roles`). Map to canonical roles via deterministic mapping config. Compute `roleLevel` from hierarchy.
7. Attach: `c.set('user', { issuer, sub, email, name, roles, roleLevel })`

Never touches DB.

**Failure responses (per Appendix A.5):**
- Missing/malformed → `c.json(err('UNAUTHORIZED', 'Missing or malformed token'), 401)`
- Expired → `c.json(err('TOKEN_EXPIRED', 'Token expired'), 401)` with `WWW-Authenticate: Bearer error="invalid_token"`
- Bad signature/issuer → `c.json(err('UNAUTHORIZED', 'Invalid token'), 401)`

### `src/middleware/ensure-guild-user.ts` — Identity Provisioning

Applied only to `/guild/me` and future write endpoints. Not on read-only builders routes.

1. Read `c.get('user')` (requires verify-oidc to have run)
2. UPSERT `guild_users` ON `(issuer, subject)`:
   - INSERT if missing (new user auto-provisioned)
   - UPDATE `email`, `name`, `last_seen_at` if present
3. Attach `c.set('guildUserId', id)`

### `GET /guild/me` Handler

```ts
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
```

### Canonical Identity Model

- Canonical external identity = `(issuer, sub)` from VIA.
- Internal platform identity = `guild_user_id` (UUID).
- `/guild/me` is the auto-provisioning path.
- Roles derived from OIDC group claims via deterministic mapping config; API returns normalized roles + computed roleLevel.
- Ghost Members reconciliation deferred to Phase 2+ via a separate `external_identities` link table.

### Role Hierarchy

```
admin (4) > trusted (3) > industry (2.5) > member (2) > guest (1.5) > restricted (0.5)
```

---

## Section 4: Builders Read Endpoints

### Routes (`src/routes/builders.ts`)

```ts
const builders = new Hono<{ Bindings: Env; Variables: AppVars }>()
builders.use('*', verifyOidc)

builders.get('/companies', listCompanies)
builders.get('/companies/:id', getCompany)
builders.get('/coaches', listCoaches)
builders.get('/coaches/:id', getCoach)
```

Auth: `verifyOidc` only (no `ensureGuildUser` — read-only, no DB writes to guild_users). Authenticated-only; public browse remains outside this worker until later.

### Repos (`src/repos/sigmablox/companies.ts`)

```ts
export interface CompanyRow { /* snake_case DB columns */ }
export interface CompanyFilters {
  search?: string         // trimmed, max 100 chars
  missionArea?: string
  warfareDomain?: string
  fundingStage?: string
}
export interface Pagination {
  limit: number   // default 50, max 200, reject negative
  offset: number  // default 0, reject negative
}

export async function listCompanies(
  pool: Pool, filters: CompanyFilters, pagination: Pagination
): Promise<{ rows: CompanyRow[]; total: number }>
// Parameterized SELECT with WHERE clauses from filters
// Separate COUNT(*) query (same filters) — no window functions
// ORDER BY "updatedAt" DESC, id ASC
// LIMIT $n OFFSET $m

export async function getCompany(
  pool: Pool, id: string
): Promise<CompanyRow | null>
// UUID-shaped → query by id only; else → query by legacy_airtable_id only
```

Same pattern for `src/repos/sigmablox/coaches.ts` with `CoachRow`.

### Key Rules

- All queries parameterized (`$1`, `$2`, etc.). No string concatenation.
- `search` filter: `ILIKE` on `name`, `"companyName"`, `description`. Trimmed, max 100 chars.
- ID resolution: UUID regex check → query `id` column only; else → query `"legacyAirtableId"` column only. Never both.
- SELECT-only in sigmablox repos. No INSERT/UPDATE/DELETE. Enforced by code review + file location + tests.
- Unknown filter keys silently ignored (only destructure known keys).

### DTO Mapping

```ts
// src/lib/mappers.ts
export function companyToDto(row: CompanyRow): CompanyDto
// snake_case DB → camelCase API (same shape Guild SPA expects)
// Dates as ISO 8601 strings
// Cohort as { cohortId: string, name: string } | null
```

### Response Shape

```ts
// GET /builders/companies
c.json(ok(
  { companies: rows.map(companyToDto) },
  { request_id: requestId, total, limit, offset }
), 200)

// GET /builders/companies/:id
c.json(ok(
  { company: companyToDto(row) },
  { request_id: requestId }
), 200)

// Not found
c.json(err('NOT_FOUND', `Company ${id} not found`, { request_id: requestId }), 404)
```

### Pagination

| Param | Default | Max | Validation |
|-------|---------|-----|------------|
| `limit` | 50 | 200 | Clamp to max, reject negative → 400 |
| `offset` | 0 | — | Reject negative → 400 |

### Stable Ordering

All list endpoints enforce deterministic `ORDER BY updated_at DESC, id ASC`.

---

## Section 5: Strangler Map & Legacy Proxy Contract

### Complete Phase 1 Route Map

| Method | Pattern | Target | Handler |
|--------|---------|--------|---------|
| `GET` | `/health` | native | `healthRouter` |
| `GET` | `/guild/me` | native | `guildRouter` (verifyOidc + ensureGuildUser) |
| `GET` | `/builders/companies` | native | `buildersRouter` (verifyOidc) |
| `GET` | `/builders/companies/:id` | native | `buildersRouter` (verifyOidc) |
| `GET` | `/builders/coaches` | native | `buildersRouter` (verifyOidc) |
| `GET` | `/builders/coaches/:id` | native | `buildersRouter` (verifyOidc) |
| `*` | everything else | proxy_legacy | `proxyToLegacy()` |

### Legacy Proxy (`proxyToLegacy`)

**`LEGACY_API_ORIGIN`** must be the legacy API server origin that serves `/api/*` routes, not the marketing/campaign root. If the monolith currently serves at `sigmablox.com/api/...`, that's acceptable — but the env var must point to the origin that responds to legacy API paths.

**Target URL construction:**

Build proxy target using `new URL(path + search, LEGACY_API_ORIGIN)` to ensure correct origin composition. No manual hostname/port/protocol copying.

### Headers Forwarded

| Header | Forwarded? | Notes |
|--------|-----------|-------|
| `Authorization` | Yes | SigmaBlox validates its own tokens |
| `Content-Type` | Yes | For request bodies |
| `Accept` | Yes | Content negotiation |
| `X-Forwarded-Host` | Set to `api.mergecombinator.com` | Always |
| `X-Forwarded-Proto` | Set to `https` | Always |
| `X-Request-Id` | Generated or propagated | Tracing |
| `Cookie` | No | Prevent session confusion |
| `Host` | No | Rewritten to legacy origin |
| `Origin` | No | Prevent confused-deputy |

### Response Envelope Normalization

- **Non-JSON from legacy** (HTML error page, text, etc.) → wrapped in `err('LEGACY_ERROR', body.slice(0, 500), { content_type, upstream_status, request_id, proxied: true })`. Status 502 if upstream was 2xx (unexpected), else upstream status. Prevents content-type leaks from SigmaBlox error pages.
- **JSON with `{ data, meta }` shape** → augment `meta` with `request_id`, `upstream_status`, `proxied: true`.
- **JSON without envelope** → wrap in `{ data: <body>, meta: { request_id, upstream_status, proxied: true } }`.

### CORS — Owned by the API Worker

```ts
const ALLOWED_ORIGINS = [
  'https://guild.mergecombinator.com',
  'https://wingman.mergecombinator.com',
]
// Dev additions via env: CORS_DEV_ORIGINS (comma-separated)
```

`mergecombinator.com` is **not** in the Phase 1 allowlist — all Phase 1 endpoints are authenticated-only, and mc_site stores no tokens. Add it later only for non-auth endpoints (e.g., public teasers).

Legacy proxy responses get CORS headers stripped and re-applied by the api worker. CORS is the api worker's responsibility, not SigmaBlox's.

### `request_id` Propagation

```
Client → api.mergecombinator.com
  ↓ request-id middleware generates UUID (or reads X-Request-Id from client)
  ↓ attaches via c.set('requestId', id)
  ↓
  ├─ native handler → includes in response meta.request_id
  └─ proxyToLegacy → sets X-Request-Id header → includes in response meta.request_id
```

### Environment Variables (`wrangler.toml`)

```toml
[vars]
OIDC_ISSUER_ALLOWLIST = "https://via.mergecombinator.com/application/o/defense-builders/"
OIDC_AUDIENCE = "defense-builders"
OIDC_ROLES_CLAIM = "groups"
LEGACY_API_ORIGIN = "<sigmablox-api-origin>"
CORS_ALLOWED_ORIGINS = "https://guild.mergecombinator.com,https://wingman.mergecombinator.com"

[env.dev.vars]
OIDC_ISSUER_ALLOWLIST = "http://localhost:9000/application/o/defense-builders/"
OIDC_AUDIENCE = "defense-builders"
OIDC_ROLES_CLAIM = "groups"
LEGACY_API_ORIGIN = "http://localhost:3001"
CORS_ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:3003,http://localhost:5173"
```

---

## Implementation Order

Ordered to avoid thrash — each step builds on the last:

1. `/health` + envelope utility (smoke deploy to validate Hono + wrangler)
2. CORS middleware + `request_id` middleware
3. `verify-oidc` with per-issuer JWKS cache
4. `/guild/me` + `ensure-guild-user` + `guild_users` Prisma migration
5. Builders repos (companies/coaches) + typed row mappers + DTO mappers
6. Builders route handlers with pagination/filtering
7. Strangler `proxyToLegacy` last (native paths tested cleanly first)
