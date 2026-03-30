# Phase 1 Last Mile Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire Guild SPA to api.mergecombinator.com with OIDC PKCE auth, fixing BUG-014/016/013.

**Architecture:** Add `oidc-client-ts` to Guild SPA for PKCE login/logout via VIA. Create `apiFetch()` wrapper that attaches Bearer token and unwraps `{ data, meta }` envelopes. Compatibility adapters convert new API DTO shapes to existing UI shapes. One wrangler.toml change ungates the API.

**Tech Stack:** oidc-client-ts, React 18, TanStack Query 5, Hono (API worker), Cloudflare Workers/Pages

**Design doc:** `docs/archive/plans/2026-02-27-phase1-last-mile-design.md`

**Repos:**
- mc_site: `/Users/paulgarcia/Dev/mc_site` (API worker changes)
- signal-incubator: `/Users/paulgarcia/dev/signal-incubator` (Guild SPA changes)

---

### Task 1: Ungate API + Tighten CORS (mc_site)

**Files:**
- Modify: `/Users/paulgarcia/Dev/mc_site/cloudflare/api-worker/wrangler.toml`

**Step 1: Update wrangler.toml production vars**

In the `[vars]` section (production), change:
```toml
CONSOLE_ROLLOUT_MODE = "on"
CORS_ALLOWED_ORIGINS = "https://guild.mergecombinator.com,https://wingman.mergecombinator.com"
```

In the `[env.staging.vars]` section, same changes:
```toml
CONSOLE_ROLLOUT_MODE = "on"
CORS_ALLOWED_ORIGINS = "https://guild.mergecombinator.com,https://wingman.mergecombinator.com"
```

Leave `[env.dev.vars]` unchanged (already `CONSOLE_ROLLOUT_MODE = "on"`).

**Step 2: Deploy API worker**

Run: `cd /Users/paulgarcia/Dev/mc_site/cloudflare/api-worker && npx wrangler deploy`
Expected: Successful deploy to `api.mergecombinator.com`

**Step 3: Verify health endpoint**

Run: `curl -s https://api.mergecombinator.com/health | jq .`
Expected: `{ "data": { "status": "ok", ... } }`

**Step 4: Commit**

```bash
cd /Users/paulgarcia/Dev/mc_site
git add cloudflare/api-worker/wrangler.toml
git commit -m "feat(api): ungate console rollout + tighten CORS to guild/wingman only"
```

---

### Task 2: Install oidc-client-ts (signal-incubator)

**Files:**
- Modify: `/Users/paulgarcia/dev/signal-incubator/apps/console/package.json`

**Step 1: Install dependency**

Run: `cd /Users/paulgarcia/dev/signal-incubator && pnpm add oidc-client-ts --filter @mc/console`
Expected: `oidc-client-ts` added to `apps/console/package.json` dependencies

**Step 2: Verify install**

Run: `cd /Users/paulgarcia/dev/signal-incubator/apps/console && pnpm ls oidc-client-ts`
Expected: Shows installed version

**Step 3: Commit**

```bash
cd /Users/paulgarcia/dev/signal-incubator
git add apps/console/package.json pnpm-lock.yaml
git commit -m "deps(console): add oidc-client-ts for PKCE auth"
```

---

### Task 3: Create OIDC Client Config (signal-incubator)

**Files:**
- Create: `/Users/paulgarcia/dev/signal-incubator/apps/console/src/lib/oidc.ts`

**Step 1: Write oidc.ts**

```typescript
import { UserManager, WebStorageStateStore, Log } from 'oidc-client-ts'

// Pinned OIDC coordinates — must match API worker wrangler.toml (G2)
const OIDC_AUTHORITY = 'https://via.mergecombinator.com/application/o/defense-builders/'
const OIDC_CLIENT_ID = 'mc-web-prod'
const OIDC_REDIRECT_URI = 'https://guild.mergecombinator.com/login/callback'
const OIDC_POST_LOGOUT_URI = 'https://mergecombinator.com/access'

const settings: ConstructorParameters<typeof UserManager>[0] = {
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

// G1: On silent renew failure, log (apiFetch handles the redirect)
userManager.events.addSilentRenewError((err) => {
  console.warn('[oidc] Silent renew failed:', err.message)
})
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/paulgarcia/dev/signal-incubator/apps/console && npx tsc --noEmit src/lib/oidc.ts 2>&1 | head -20`
Expected: No errors (or only unrelated errors from other files)

**Step 3: Commit**

```bash
cd /Users/paulgarcia/dev/signal-incubator
git add apps/console/src/lib/oidc.ts
git commit -m "feat(console): add OIDC PKCE client config for VIA"
```

---

### Task 4: Create API Client Wrapper (signal-incubator)

**Files:**
- Create: `/Users/paulgarcia/dev/signal-incubator/apps/console/src/lib/api-client.ts`

**Step 1: Write api-client.ts**

```typescript
import { userManager } from './oidc'

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8787'
  : 'https://api.mergecombinator.com'

export { API_BASE }

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const user = await userManager.getUser()

  if (!user || user.expired) {
    await userManager.signinRedirect({
      state: { returnTo: window.location.pathname },
    })
    // This throw prevents callers from continuing after redirect
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
    const body = await res.json().catch(() => null) as
      | { error?: { message?: string } }
      | null
    throw new Error(body?.error?.message || `API error: ${res.status}`)
  }

  const envelope = await res.json()
  return envelope.data as T
}
```

**Step 2: Commit**

```bash
cd /Users/paulgarcia/dev/signal-incubator
git add apps/console/src/lib/api-client.ts
git commit -m "feat(console): add API client wrapper with Bearer token + envelope unwrap"
```

---

### Task 5: Create Response Shape Adapters (signal-incubator)

**Files:**
- Create: `/Users/paulgarcia/dev/signal-incubator/apps/console/src/lib/adapters.ts`

**Step 1: Write adapters.ts**

```typescript
// --- API DTO shapes (from api.mergecombinator.com) ---

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

// --- Legacy UI shapes (consumed by existing page components) ---

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

export interface CoachAPI {
  id: string
  name: string
  email: string | null
  linkedIn: string | null
  photoUrl: string | null
  phone: string | null
  company: string | null
  affiliation: string | null
  combineRole: string | null
  domain: string | null
  smeArea: string | null
  problemAreas: string | null
  onMind: string | null
  expertise: string[]
  status: string
  cohort: string | null
}

// --- CF Images ---

const CF_IMAGES_ACCOUNT = '9Lsa8lkCUz_we5KeaTm7fw'

function cfImageUrl(cfImageId: string, variant = 'public'): string {
  return `https://imagedelivery.net/${CF_IMAGES_ACCOUNT}/${cfImageId}/${variant}`
}

// --- Adapters ---

export function adaptCompany(dto: CompanyDto): CompanyAPI {
  return {
    id: dto.id,
    name: dto.name,
    productName: dto.productName,
    website: dto.website,
    logoUrl: dto.cfImageId ? cfImageUrl(dto.cfImageId) : dto.logoUrl,
    location: dto.location,
    missionArea: dto.missionArea,
    warfareDomain: dto.warfareDomain,
    description: dto.description,
    trlLevel: dto.trlLevel ?? 0,
    fundingStage: dto.fundingStage,
    teamSize: dto.teamSize,
    // Phase 1 defaults — not in current API SELECT
    tulsaAttended: null,
    upvoteCount: 0,
    // Flatten cohort object → string
    cohort: dto.cohort?.name ?? null,
    cohortId: dto.cohort?.cohortId ?? null,
  }
}

export function adaptCoach(dto: CoachDto): CoachAPI {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    linkedIn: dto.linkedIn,
    photoUrl: dto.photoUrl,
    phone: null,           // Not in new API
    company: dto.company,
    affiliation: dto.affiliation,
    combineRole: dto.combineRole,
    domain: dto.domain,
    smeArea: dto.smeArea,
    problemAreas: null,    // Not in new API
    onMind: null,          // Not in new API
    expertise: [],         // Not in new API
    status: dto.status,
    cohort: dto.cohort,
  }
}
```

**Step 2: Commit**

```bash
cd /Users/paulgarcia/dev/signal-incubator
git add apps/console/src/lib/adapters.ts
git commit -m "feat(console): add API response shape adapters for builders/coaches"
```

---

### Task 6: Rewrite Auth Hook (signal-incubator)

**Files:**
- Modify: `/Users/paulgarcia/dev/signal-incubator/apps/console/src/lib/auth.ts`

**Step 1: Replace entire file with OIDC-based auth**

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { userManager } from './oidc'
import type { User as OidcUser } from 'oidc-client-ts'

// Must match API worker OIDC_ROLES_CLAIM env var
const ROLES_CLAIM = 'groups'

interface User {
  sub: string
  email: string
  name: string
  groups: string[]
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
    console.error(
      '[auth] VIA token missing role claim (%s) — defaulting to guest. ' +
      'Configure VIA to emit canonical roles in this claim.',
      ROLES_CLAIM
    )
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

**Step 2: Commit**

```bash
cd /Users/paulgarcia/dev/signal-incubator
git add apps/console/src/lib/auth.ts
git commit -m "feat(console): rewrite auth hook for OIDC PKCE (replaces cookie auth)"
```

---

### Task 7: Update Console Admin Detection (signal-incubator)

**Files:**
- Modify: `/Users/paulgarcia/dev/signal-incubator/apps/console/src/lib/consoles.ts`

**Step 1: Update admin detection to use canonical roles**

Change `ADMIN_GROUPS` and `isAdmin` to use the canonical role hierarchy instead of organizational group names:

Replace:
```typescript
const ADMIN_GROUPS = ['via-admins', 'sigmablox-admins']

export function isAdmin(groups: string[] | undefined): boolean {
  if (!groups || groups.length === 0) return false
  return groups.some((g) => ADMIN_GROUPS.includes(g) || g.endsWith('-admins'))
}
```

With:
```typescript
// Canonical roles that grant admin console access
const ADMIN_ROLES = ['admin', 'trusted']

export function isAdmin(groups: string[] | undefined): boolean {
  if (!groups || groups.length === 0) return false
  return groups.some((g) => ADMIN_ROLES.includes(g))
}
```

**Step 2: Commit**

```bash
cd /Users/paulgarcia/dev/signal-incubator
git add apps/console/src/lib/consoles.ts
git commit -m "feat(console): use canonical VIA roles for admin detection"
```

---

### Task 8: Add Login Callback Page + Route (signal-incubator)

**Files:**
- Create: `/Users/paulgarcia/dev/signal-incubator/apps/console/src/pages/LoginCallback.tsx`
- Modify: `/Users/paulgarcia/dev/signal-incubator/apps/console/src/App.tsx`

**Step 1: Create LoginCallback.tsx**

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

**Step 2: Add callback route to App.tsx**

In `/Users/paulgarcia/dev/signal-incubator/apps/console/src/App.tsx`:

Add import at top (with the other page imports around line 101):
```typescript
import { LoginCallbackPage } from './pages/LoginCallback'
```

In the `App()` function, add an early return before the `PanelLayout` JSX (around line 462, after `const currentPath = location.pathname`):

```typescript
  // OIDC callback — render outside PanelLayout (no nav during auth)
  if (currentPath === '/login/callback') {
    return <LoginCallbackPage />
  }
```

**Step 3: Commit**

```bash
cd /Users/paulgarcia/dev/signal-incubator
git add apps/console/src/pages/LoginCallback.tsx apps/console/src/App.tsx
git commit -m "feat(console): add OIDC login callback route"
```

---

### Task 9: Switch Builders Page to New API (signal-incubator)

**Files:**
- Modify: `/Users/paulgarcia/dev/signal-incubator/apps/console/src/pages/Builders.tsx`

**Step 1: Update imports and fetch function**

Replace lines 1-66 (everything above `export function BuildersPage()`) with:

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api-client'
import { adaptCompany, type CompanyDto } from '../lib/adapters'

// Internal builder shape for display
interface Builder {
  id: string
  name: string
  description: string
  domains: string[]
  stage: string
  location: string
  verified: boolean
  website: string | null
  trlLevel: number
  upvotes: number
  cohort: string | null
}

async function fetchBuilders(): Promise<Builder[]> {
  const data = await apiFetch<{ companies: CompanyDto[] }>('/builders/companies')

  return data.companies
    .map(adaptCompany)
    .filter((c) => c.name && c.description && c.description.length > 20)
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description?.split('\n')[0]?.slice(0, 200) || '',
      domains: [c.missionArea, c.warfareDomain].filter(Boolean) as string[],
      stage: c.fundingStage || 'Unknown',
      location: c.location || 'Unknown',
      verified: c.tulsaAttended === 'Attended',
      website: c.website,
      trlLevel: c.trlLevel,
      upvotes: c.upvoteCount,
      cohort: c.cohort,
    }))
}
```

The `BuildersPage` component and `BuilderCard` component remain unchanged — they consume the `Builder` interface which is the same.

**Step 2: Commit**

```bash
cd /Users/paulgarcia/dev/signal-incubator
git add apps/console/src/pages/Builders.tsx
git commit -m "feat(console): wire Builders page to api.mergecombinator.com"
```

---

### Task 10: Switch BuilderDetail Page to New API (signal-incubator)

**Files:**
- Modify: `/Users/paulgarcia/dev/signal-incubator/apps/console/src/pages/BuilderDetail.tsx`

**Step 1: Update imports and fetch function**

Replace lines 1-31 (everything above the icon components) with:

```typescript
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLocalWatchlist } from '../lib/watchlist-local'
import { apiFetch } from '../lib/api-client'
import { adaptCompany, type CompanyAPI, type CompanyDto } from '../lib/adapters'

async function fetchBuilder(id: string): Promise<CompanyAPI> {
  const data = await apiFetch<{ company: CompanyDto }>(`/builders/companies/${id}`)
  return adaptCompany(data.company)
}
```

The rest of the file (icon components, `BuilderDetailPage` component, `DetailRow`) uses the `builder` variable which still has the same shape fields (`name`, `productName`, `logoUrl`, `trlLevel`, etc.) — all provided by the `CompanyAPI` adapter. No other changes needed.

**Step 2: Commit**

```bash
cd /Users/paulgarcia/dev/signal-incubator
git add apps/console/src/pages/BuilderDetail.tsx
git commit -m "feat(console): wire BuilderDetail page to api.mergecombinator.com"
```

---

### Task 11: Switch Champions Page to New API (signal-incubator)

**Files:**
- Modify: `/Users/paulgarcia/dev/signal-incubator/apps/console/src/pages/Champions.tsx`

**Step 1: Update imports and fetch function**

Replace lines 1-68 (everything above `export function ChampionsPage()`) with:

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api-client'
import { adaptCoach, type CoachDto } from '../lib/adapters'

// Internal champion shape for display
interface Champion {
  id: string
  name: string
  role: string
  organization: string
  domain: string
  smeArea: string | null
  problemAreas: string[]
  expertise: string[]
  linkedIn: string | null
  photoUrl: string | null
  active: boolean
  affiliation: string | null
}

async function fetchChampions(): Promise<Champion[]> {
  const data = await apiFetch<{ coaches: CoachDto[] }>('/builders/coaches')

  return data.coaches
    .map(adaptCoach)
    .filter((c) => c.name && c.status === 'active')
    .map((c) => ({
      id: c.id,
      name: c.name,
      role: c.combineRole || 'Coach',
      organization: c.company || c.affiliation || 'Independent',
      domain: c.domain || 'Multi',
      smeArea: c.smeArea,
      problemAreas: c.problemAreas ? [c.problemAreas] : [],
      expertise: c.expertise || [],
      linkedIn: c.linkedIn,
      photoUrl: c.photoUrl,
      active: c.status === 'active',
      affiliation: c.affiliation,
    }))
}
```

**Step 2: Commit**

```bash
cd /Users/paulgarcia/dev/signal-incubator
git add apps/console/src/pages/Champions.tsx
git commit -m "feat(console): wire Champions page to api.mergecombinator.com"
```

---

### Task 12: Switch ChampionDetail Page to New API (signal-incubator)

**Files:**
- Modify: `/Users/paulgarcia/dev/signal-incubator/apps/console/src/pages/ChampionDetail.tsx`

**Step 1: Update imports and fetch function**

Replace lines 1-36 (everything above the icon components) with:

```typescript
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLocalWatchlist } from '../lib/watchlist-local'
import { apiFetch } from '../lib/api-client'
import { adaptCoach, type CoachAPI, type CoachDto } from '../lib/adapters'

async function fetchChampion(id: string): Promise<CoachAPI | null> {
  try {
    const data = await apiFetch<{ coach: CoachDto }>(`/builders/coaches/${id}`)
    return adaptCoach(data.coach)
  } catch {
    return null
  }
}
```

Note: The old code fetched ALL coaches and filtered client-side. The new API has `GET /builders/coaches/:id` — we use it directly. Much more efficient.

The rest of the file uses `champion` which has the `CoachAPI` shape — same fields. No other changes needed.

**Step 2: Commit**

```bash
cd /Users/paulgarcia/dev/signal-incubator
git add apps/console/src/pages/ChampionDetail.tsx
git commit -m "feat(console): wire ChampionDetail to /builders/coaches/:id endpoint"
```

---

### Task 13: Remove Vite Dev Proxy (signal-incubator)

**Files:**
- Modify: `/Users/paulgarcia/dev/signal-incubator/apps/console/vite.config.ts`

**Step 1: Remove proxy config**

Replace the entire `server` block:

```typescript
  server: {
    port: 3003,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://www.mergecombinator.com',
        changeOrigin: true,
        secure: true,
      },
      '/auth': {
        target: 'https://www.mergecombinator.com',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
```

With:

```typescript
  server: {
    port: 3003,
    strictPort: true,
    // API calls go directly to API_BASE (localhost:8787 in dev)
    // Auth handled by OIDC redirect to VIA, not proxy
  },
```

**Step 2: Commit**

```bash
cd /Users/paulgarcia/dev/signal-incubator
git add apps/console/vite.config.ts
git commit -m "chore(console): remove SigmaBlox dev proxy — API calls go direct"
```

---

### Task 14: Build Verification (signal-incubator)

**Step 1: TypeScript check**

Run: `cd /Users/paulgarcia/dev/signal-incubator/apps/console && npx tsc --noEmit`
Expected: No errors

**Step 2: Build**

Run: `cd /Users/paulgarcia/dev/signal-incubator/apps/console && pnpm build`
Expected: Successful Vite build

**Step 3: If build fails, fix issues and commit**

Common issues:
- Type mismatches between old `CompanyAPI`/`CoachAPI` and new adapter output
- Missing imports
- `oidc-client-ts` type issues

Fix any issues, then:
```bash
cd /Users/paulgarcia/dev/signal-incubator
git add -A
git commit -m "fix(console): resolve build errors from API spine integration"
```

---

### Task 15: Smoke Test Checklist

This is a manual verification task. Do NOT deploy until VIA redirect URIs are configured.

**Prerequisites (Paul must do manually):**
- [ ] VIA: Register `https://guild.mergecombinator.com/login/callback` as redirect URI on `mc-web-prod`
- [ ] VIA: Register `https://mergecombinator.com/access` as post-logout redirect URI
- [ ] VIA: Verify scopes include `offline_access`
- [ ] VIA: Configure canonical roles in groups claim

**After VIA config + deploy:**

| # | Test | How | Expected |
|---|------|-----|----------|
| 1 | SPA loads | Open guild.mergecombinator.com | App shell renders, "Sign In" button visible |
| 2 | Login redirect | Click "Sign In" | Browser navigates to via.mergecombinator.com |
| 3 | Login callback | Complete VIA login | Browser returns to Guild SPA, user menu shows name |
| 4 | Builders load | Navigate to /builders | Builder cards render with data from API |
| 5 | Builder detail | Click a builder card | Detail page loads with company info |
| 6 | Champions load | Navigate to /champions | Champion cards render |
| 7 | Champion detail | Click a champion card | Detail page loads |
| 8 | Guild identity | Check network tab for /guild/me | Returns 200 with guild_user_id |
| 9 | Builder images | Check builder detail page | Logos load (CF Images or fallback) |
| 10 | Logout | Click user menu → Sign Out | Tokens cleared, lands at /access |
| 11 | Post-logout state | Navigate back to guild.* | Shows "Sign In" (not authenticated) |
| 12 | No role claim | (If VIA roles not yet configured) | Console error logged, user treated as guest |

---

### Task 16: Update RTMX (mc_site)

**Files:**
- Modify: `/Users/paulgarcia/Dev/mc_site/.rtmx/database.csv`
- Modify: `/Users/paulgarcia/Dev/mc_site/.rtmx/requirements/BUGS/REQ-BUG-014.md`
- Modify: `/Users/paulgarcia/Dev/mc_site/.rtmx/requirements/BUGS/REQ-BUG-016.md`
- Modify: `/Users/paulgarcia/Dev/mc_site/.rtmx/requirements/BUGS/REQ-BUG-013.md`
- Modify: `/Users/paulgarcia/Dev/mc_site/.rtmx/requirements/PLATFORM/REQ-PLATFORM-001.md`

**Step 1: Update bug statuses after smoke test passes**

Update REQ-BUG-014, REQ-BUG-016, REQ-BUG-013 status to COMPLETE with implementation notes.

Update REQ-PLATFORM-001 notes to reflect Phase 1 last mile completion.

**Step 2: Commit**

```bash
cd /Users/paulgarcia/Dev/mc_site
git add .rtmx/
git commit -m "docs(rtmx): mark BUG-014/016/013 complete — Phase 1 last mile done"
```
