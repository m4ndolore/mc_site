# Phase 1 Last Mile: Guild SPA → API Spine Integration

**Date:** 2026-02-27
**Status:** Approved
**Tracks:** REQ-BUG-014, REQ-BUG-016, REQ-BUG-013
**Parent:** `docs/plans/2026-02-26-phase1-api-spine-design.md`

---

## Goal

Phase 1 is done when:
1. Guild SPA loads on `guild.mergecombinator.com` (not "coming soon")
2. Guild SPA calls `https://api.mergecombinator.com/*` with Bearer token
3. User can sign in and sign out reliably

---

## Auth & Roles Architecture (Canonical)

### VIA is the single authority for identity and roles.

The platform role hierarchy is:
```
admin (4) > trusted (3) > industry (2.5) > member (2) > guest (1.5) > restricted (0.5)
```

VIA (Authentik) emits canonical role names directly in the token via the configured claim path (`OIDC_ROLES_CLAIM`). No translation layers, no mapping tables, no client-side inference.

**Token is source of truth.** The API reads roles from claims and computes roleLevel. The SPA reads roles from the ID token for UI gating only. Authorization enforcement is always server-side.

**Explicitly avoided:**
- `mc-admins → admin` mapping logic
- Fallback role inference
- Hardcoded role translation tables in SPA or API
- Runtime VIA API calls for role lookup
- Storing roles in guild_users as authoritative (cache for audit only)

### Token flow
```
VIA (Authentik) → OIDC token with canonical roles → API validates locally via JWKS → SPA consumes for UI
```

---

## Guardrails

### G1: Refresh Tokens — Enabled But Not Guaranteed

Even with `offline_access` scope, a misconfigured VIA client/scope may not issue a `refresh_token`. The SPA must:
- Attempt refresh on token expiry (via `oidc-client-ts` `automaticSilentRenew`)
- If no refresh token was issued: fall back to full re-auth redirect (no crash, no infinite loop)
- Log a clear console warning: `"No refresh token issued — re-auth required on expiry"`

### G2: Pinned Issuer + Audience

SPA and API must use identical OIDC coordinates. Single source of truth:

| Param | Value | Used by |
|-------|-------|---------|
| `authority` (issuer/discovery) | `https://via.mergecombinator.com/application/o/defense-builders/` | SPA (`oidc.ts`), API (`OIDC_ISSUER_ALLOWLIST`) |
| `client_id` | `mc-web-prod` | SPA (`oidc.ts`), VIA client config |
| `audience` | `mc-web-prod` | API (`OIDC_AUDIENCE`) |
| `redirect_uri` | `https://guild.mergecombinator.com/login/callback` | SPA (`oidc.ts`), VIA redirect list |

These are build-time constants in the SPA (via `oidc.ts`) and deploy-time env vars in the API (via `wrangler.toml`). Both reference the same VIA application.

### G3: Role Claim Assertion

On login callback, if the role claim (`groups` or `roles`) is missing or empty:
- Log a clear error: `"VIA token missing role claim — defaulting to guest"`
- Set user role to `guest` (not undefined, not crash)
- Console admin features gated behind role check will be invisible but the app remains usable

This prevents silent 403 confusion where the user is authenticated but can't access anything.

### G4: Logout — Local-Clear First, End-Session Best-Effort

Logout sequence:
1. **Always:** Clear OIDC state from sessionStorage, clear React Query auth cache
2. **Best-effort:** Redirect to VIA `end_session_endpoint`
3. **Always:** User lands on `https://mergecombinator.com/access`

If VIA end-session fails, errors, or is misconfigured, the user is still logged out locally. No phantom sessions.

```typescript
const logout = async () => {
  // 1. Local clear (always)
  queryClient.setQueryData(['auth'], { authenticated: false })
  await userManager.removeUser()  // clears sessionStorage

  // 2. Best-effort VIA end-session, fallback to /access
  try {
    await userManager.signoutRedirect()
  } catch {
    window.location.href = 'https://mergecombinator.com/access'
  }
}
```

### G5: CORS — Tight Allow List

Phase 1 CORS origins (api-worker):
```
guild.mergecombinator.com
wingman.mergecombinator.com
```

`mergecombinator.com` is **removed** from the allow list. Tokens never live on the marketing domain. Add it back only when a public (non-auth) endpoint is called from mc_site.

---

## Blockers Found During Analysis

### Blocker 1: Console Rollout Gate

**File:** `cloudflare/api-worker/src/middleware/console-gate.ts`

Production has `CONSOLE_ROLLOUT_MODE = "internal"` with `CONSOLE_MIN_ROLE_LEVEL = "3"`. This was a SigmaBlox-era artifact — VIA groups (`mc-admins`, `builders`) didn't match the canonical role hierarchy, so everyone got roleLevel 0 and was blocked.

**Fix:** Set `CONSOLE_ROLLOUT_MODE = "on"` for Phase 1. VIA will be configured to emit canonical roles. Role-based gating can be re-enabled once VIA role configuration is validated.

### Blocker 2: Auth Model Mismatch

Guild SPA uses cookie auth (`credentials: 'include'`, `GET /auth/me` proxied to SigmaBlox). API spine expects `Authorization: Bearer <token>`. The SPA has zero OIDC client code.

**Fix:** Add `oidc-client-ts` with PKCE flow, Bearer token auth, refresh token support (with fallback per G1).

### Blocker 3: Endpoint + Response Shape Mismatch

| SPA calls | API serves | Shape difference |
|-----------|-----------|------------------|
| `GET /api/public/companies` | `GET /builders/companies` | Path differs |
| Response: `{ companies: [...] }` | Response: `{ data: { companies: [...] }, meta: {...} }` | Envelope wrapping |
| `cohort: string \| null` | `cohort: { cohortId, name } \| null` | Nested object |
| `upvoteCount: number` | Not returned | Missing field |
| `tulsaAttended: string \| null` | Not returned | Missing field |

**Fix:** API client wrapper unwraps envelope. Compatibility adapter converts DTO shapes. Missing fields get safe defaults.

### Blocker 4: CORS Too Broad

Production `CORS_ALLOWED_ORIGINS` includes `mergecombinator.com` which should not hold tokens. **Fix per G5:** Remove from allow list.

---

## Implementation Plan

### Step 1: API Worker Config Changes

**Repo:** mc_site
**File:** `cloudflare/api-worker/wrangler.toml`

Two changes:
1. `CONSOLE_ROLLOUT_MODE = "on"` (prod + staging) — ungate builders routes
2. `CORS_ALLOWED_ORIGINS` — remove `mergecombinator.com`, keep `guild.*` and `wingman.*` only

Deploy: `cd cloudflare/api-worker && npx wrangler deploy`

### Step 2: Add OIDC PKCE Client to Guild SPA

**Repo:** signal-incubator
**Package:** `oidc-client-ts`

#### New file: `apps/console/src/lib/oidc.ts`

```typescript
import { UserManager, WebStorageStateStore, Log } from 'oidc-client-ts'

// Pinned OIDC coordinates — must match API worker wrangler.toml (G2)
const OIDC_AUTHORITY = 'https://via.mergecombinator.com/application/o/defense-builders/'
const OIDC_CLIENT_ID = 'mc-web-prod'
const OIDC_REDIRECT_URI = 'https://guild.mergecombinator.com/login/callback'
const OIDC_POST_LOGOUT_URI = 'https://mergecombinator.com/access'

const settings = {
  authority: OIDC_AUTHORITY,
  client_id: OIDC_CLIENT_ID,
  redirect_uri: OIDC_REDIRECT_URI,
  post_logout_redirect_uri: OIDC_POST_LOGOUT_URI,
  scope: 'openid email profile groups offline_access',
  response_type: 'code',
  userStore: new WebStorageStateStore({ store: sessionStorage }),
  automaticSilentRenew: true,
}

if (import.meta.env.DEV) {
  Object.assign(settings, {
    authority: 'http://localhost:9000/application/o/defense-builders/',
    redirect_uri: 'http://localhost:3003/login/callback',
    post_logout_redirect_uri: 'http://localhost:3003/',
  })
  Log.setLevel(Log.DEBUG)
  Log.setLogger(console)
}

export const userManager = new UserManager(settings)

// G1: Log warning if no refresh token was issued
userManager.events.addUserLoaded((user) => {
  if (!user.refresh_token) {
    console.warn('[oidc] No refresh token issued — re-auth required on expiry')
  }
})

// G1: On silent renew failure, redirect to login (no infinite loop)
userManager.events.addSilentRenewError((err) => {
  console.warn('[oidc] Silent renew failed, will redirect on next API call:', err.message)
})
```

Key decisions:
- **`offline_access` scope** — requests refresh token; if VIA doesn't issue one, G1 fallback applies
- **`sessionStorage`** — tokens survive page refresh within tab, cleared on tab close
- **`automaticSilentRenew`** — uses refresh_token grant when available; no iframe needed
- **Dev mode:** OIDC debug logging enabled via `Log.setLevel`

#### New file: `apps/console/src/lib/api-client.ts`

```typescript
import { userManager } from './oidc'

// Pinned API base — matches CORS allow list (G5)
const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8787'
  : 'https://api.mergecombinator.com'

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const user = await userManager.getUser()

  if (!user || user.expired) {
    await userManager.signinRedirect({
      state: { returnTo: window.location.pathname },
    })
    throw new Error('Redirecting to login')
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.access_token}`,
      ...options.headers,
    },
  })

  if (res.status === 401) {
    // Single retry: attempt silent renew, then full redirect
    try {
      await userManager.signinSilent()
      const retryUser = await userManager.getUser()
      if (!retryUser || retryUser.expired) throw new Error('Renew failed')

      const retryRes = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${retryUser.access_token}`,
          ...options.headers,
        },
      })
      if (!retryRes.ok) throw new Error(`Retry failed: ${retryRes.status}`)
      const retryEnvelope = await retryRes.json()
      return retryEnvelope.data as T
    } catch {
      await userManager.signinRedirect({
        state: { returnTo: window.location.pathname },
      })
      throw new Error('Redirecting to login')
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error?.message || `API error: ${res.status}`)
  }

  const envelope = await res.json()
  return envelope.data as T
}
```

Design:
- Attaches `Authorization: Bearer <access_token>` to every request
- Unwraps `{ data, meta }` envelope — callers get `data` directly
- On 401: single retry with silent renew, then full redirect (no infinite recursion)
- No `credentials: 'include'` — Bearer tokens only

#### Rewritten: `apps/console/src/lib/auth.ts`

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { userManager } from './oidc'
import type { User as OidcUser } from 'oidc-client-ts'

const ROLES_CLAIM = 'groups'  // Must match API OIDC_ROLES_CLAIM

interface User {
  sub: string
  email: string
  name: string
  groups: string[]  // Canonical roles from VIA, consumed directly
}

interface AuthState {
  authenticated: boolean
  user?: User
}

function oidcUserToUser(oidcUser: OidcUser): User {
  const profile = oidcUser.profile
  const roles = (profile[ROLES_CLAIM] as string[]) || []

  // G3: Assert role claim presence
  if (roles.length === 0) {
    console.error('[auth] VIA token missing role claim — defaulting to guest')
  }

  return {
    sub: profile.sub,
    email: profile.email || '',
    name: profile.name || profile.preferred_username || '',
    groups: roles.length > 0 ? roles : ['guest'],
  }
}

async function fetchAuthState(): Promise<AuthState> {
  try {
    const oidcUser = await userManager.getUser()
    if (oidcUser && !oidcUser.expired) {
      return { authenticated: true, user: oidcUserToUser(oidcUser) }
    }
    return { authenticated: false }
  } catch {
    return { authenticated: false }
  }
}

export function useAuth() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: fetchAuthState,
    staleTime: 60 * 1000,
    retry: false,
  })

  const login = (returnTo?: string) => {
    userManager.signinRedirect({
      state: { returnTo: returnTo || window.location.pathname },
    })
  }

  // G4: Local-clear first, end-session best-effort
  const logout = async () => {
    queryClient.setQueryData(['auth'], { authenticated: false })
    await userManager.removeUser()

    try {
      await userManager.signoutRedirect()
    } catch {
      window.location.href = 'https://mergecombinator.com/access'
    }
  }

  return {
    user: data?.user,
    isAuthenticated: data?.authenticated ?? false,
    isLoading,
    login,
    logout,
  }
}
```

#### New file: `apps/console/src/pages/LoginCallback.tsx`

```typescript
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { userManager } from '../lib/oidc'

export function LoginCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    userManager.signinRedirectCallback()
      .then((user) => {
        const returnTo = (user.state as { returnTo?: string })?.returnTo || '/'
        navigate(returnTo, { replace: true })
      })
      .catch((err) => {
        console.error('[oidc] Login callback failed:', err)
        navigate('/', { replace: true })
      })
  }, [navigate])

  return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--mc-text-muted)' }}>
      Completing sign in...
    </div>
  )
}
```

#### Updated: `apps/console/src/App.tsx`

Add callback route (outside PanelLayout — no nav during callback):

```tsx
import { LoginCallbackPage } from './pages/LoginCallback'

// In App component, before PanelLayout:
if (location.pathname === '/login/callback') {
  return <LoginCallbackPage />
}
```

### Step 3: Response Shape Adapter

#### New file: `apps/console/src/lib/adapters.ts`

```typescript
// New API DTO shape (matches api.mergecombinator.com/builders/companies response)
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

// Shape the existing UI expects
export interface CompanyAPI {
  id: string
  name: string
  productName: string | null
  website: string | null
  logoUrl: string | null
  location: string | null
  missionArea: string | null
  warfareDomain: string | null
  description: string | null
  trlLevel: number
  fundingStage: string | null
  teamSize: string | null
  tulsaAttended: string | null
  upvoteCount: number
  cohort: string | null
  cohortId: string | null
}

const CF_IMAGES_BASE = 'https://imagedelivery.net'
const CF_IMAGES_ACCOUNT = '9Lsa8lkCUz_we5KeaTm7fw'

export function adaptCompany(dto: CompanyDto): CompanyAPI {
  return {
    id: dto.id,
    name: dto.name,
    productName: dto.productName,
    website: dto.website,
    logoUrl: dto.cfImageId
      ? `${CF_IMAGES_BASE}/${CF_IMAGES_ACCOUNT}/${dto.cfImageId}/public`
      : dto.logoUrl,
    location: dto.location,
    missionArea: dto.missionArea,
    warfareDomain: dto.warfareDomain,
    description: dto.description,
    trlLevel: dto.trlLevel ?? 0,
    fundingStage: dto.fundingStage,
    teamSize: dto.teamSize,
    // Phase 1 defaults — fields not in current API SELECT
    tulsaAttended: null,
    upvoteCount: 0,
    // Flatten cohort object → string
    cohort: dto.cohort?.name ?? null,
    cohortId: dto.cohort?.cohortId ?? null,
  }
}

// Coach adapter (similar pattern)
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
```

### Step 4: Switch Builders/Champions Pages to New API

Replace `fetch('/api/public/companies')` with `apiFetch('/builders/companies')` + adapter in:
- `Builders.tsx`
- `BuilderDetail.tsx`
- `Champions.tsx`
- `ChampionDetail.tsx`

The fetch functions change from:
```typescript
// OLD
const res = await fetch('/api/public/companies')
const data = await res.json()
return data.companies
```
to:
```typescript
// NEW
const data = await apiFetch<{ companies: CompanyDto[] }>('/builders/companies')
return data.companies.map(adaptCompany)
```

### Step 5: Fix Logout (BUG-016)

Solved by Step 2 with G4 guardrail. Sequence:
1. Clear sessionStorage (always)
2. Clear React Query cache (always)
3. Redirect to VIA end-session (best-effort)
4. Land on `/access` (always — either via VIA redirect or direct fallback)

### Step 6: Fix Images (BUG-013)

Handled by the adapter in Step 3. `cfImageId` → CF Images URL. Fallback to `logoUrl` as-is.

### Step 7: Remove Vite Dev Proxy

**File:** `apps/console/vite.config.ts`

Remove the SigmaBlox proxy config. API calls go directly to `API_BASE`. Auth is OIDC redirect-based.

---

## VIA Configuration Required (Manual — Paul)

1. **mc-web-prod OAuth client:**
   - Add redirect URI: `https://guild.mergecombinator.com/login/callback`
   - Add post-logout redirect URI: `https://mergecombinator.com/access`
   - Verify scopes: `openid email profile groups offline_access`
   - Verify PKCE enabled (already is per discovery doc)

2. **Dev URIs (if not registered):**
   - `http://localhost:3003/login/callback`

3. **Role configuration (critical):**
   - Configure VIA to emit canonical role names (`admin`, `trusted`, `member`, etc.) in the `groups` claim
   - Not organizational labels (`mc-admins`, `builders`)
   - Set `OIDC_ROLES_CLAIM` env var to `groups` (already set in wrangler.toml)

---

## Deployment Sequence

1. **VIA config** — register redirect URIs, configure canonical roles (manual, Paul)
2. **API worker** — set `CONSOLE_ROLLOUT_MODE = "on"`, tighten CORS, deploy
3. **Guild SPA** — install `oidc-client-ts`, add OIDC client + API wrapper + adapters + callback route
4. **Build & deploy** Guild SPA to CF Pages at `guild.mergecombinator.com`
5. **Smoke test** — login → /guild/me 200 → /builders/companies loads → logout → 401

---

## Acceptance Tests

| Test | Expected |
|------|----------|
| Open guild.mergecombinator.com | SPA loads (not "coming soon") |
| Click "Sign In" | Redirects to VIA login |
| Complete VIA login | Returns to Guild SPA, user menu shows name |
| Network tab: /builders/companies | Hits api.mergecombinator.com with Bearer token, 200 |
| Navigate to /builders/:id | Builder detail loads with data |
| Network tab: /guild/me | Returns 200 with guild_user_id |
| Click "Sign Out" | Local tokens cleared, lands at /access |
| Refresh after logout | Not authenticated, shows "Sign In" |
| Builder card images | CF Images URLs load or graceful fallback |
| Token without roles claim | Console error logged, user treated as guest, app doesn't crash |
| Token expires without refresh_token | Console warning, next API call redirects to login |

---

## Files Changed

### mc_site (api-worker)
| File | Change |
|------|--------|
| `cloudflare/api-worker/wrangler.toml` | `CONSOLE_ROLLOUT_MODE = "on"`, tighten CORS (prod + staging) |

### signal-incubator (Guild SPA)
| File | Change |
|------|--------|
| `apps/console/package.json` | Add `oidc-client-ts` dependency |
| `apps/console/src/lib/oidc.ts` | **New:** OIDC UserManager config with G1/G2 guardrails |
| `apps/console/src/lib/api-client.ts` | **New:** fetch wrapper with Bearer token + envelope unwrap + 401 retry |
| `apps/console/src/lib/auth.ts` | **Rewrite:** OIDC-based auth hook with G3/G4 guardrails |
| `apps/console/src/lib/adapters.ts` | **New:** CompanyDto/CoachDto → legacy shape adapters |
| `apps/console/src/pages/LoginCallback.tsx` | **New:** OIDC redirect callback handler |
| `apps/console/src/pages/Builders.tsx` | Switch to apiFetch + adapter |
| `apps/console/src/pages/BuilderDetail.tsx` | Switch to apiFetch + adapter |
| `apps/console/src/pages/Champions.tsx` | Switch to apiFetch + adapter |
| `apps/console/src/pages/ChampionDetail.tsx` | Switch to apiFetch + adapter |
| `apps/console/src/App.tsx` | Add `/login/callback` route |
| `apps/console/vite.config.ts` | Remove SigmaBlox proxy |

---

## Out of Scope (Phase 2)

- `upvoteCount` and `tulsaAttended` column backfill in API SELECT
- Watchlist persistence (currently localStorage → Phase 2 Builders API)
- Docs redirect fix (BUG-015) — separate infrastructure issue
- Admin dashboard / role-gated features
- Company profiles, claiming, onboarding
- Re-enabling console rollout gate with canonical VIA roles
