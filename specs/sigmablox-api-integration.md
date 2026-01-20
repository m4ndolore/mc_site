# SigmaBlox API Integration

## Job to Be Done

Seed mc_site with dynamic content from SigmaBlox APIs so the marketing site displays real data (companies, cohorts, team members) without manual updates.

## Context

SigmaBlox has multiple data sources:

| Source | Type | Content |
|--------|------|---------|
| `api.sigmablox.com` | Public REST | Companies, filters, cohorts |
| Ghost CMS | Private | Members, labels, user profiles |
| Airtable | Private | Companies base, Coaches base (enriched data) |
| VIA/Authentik | OAuth | Authentication for private APIs |

## Requirements

### Public API (No Auth Required)

The public API at `api.sigmablox.com` MUST be used for:

- **Companies listing** - `GET /api/public/companies`
  - Query params: `missionArea`, `search`, `limit`, `offset`
  - Returns: Company profiles with pagination

- **Filter options** - `GET /api/public/companies/filters`
  - Returns: `missionAreas`, `warfareDomains`, `fundingStages`

- **Company detail** - `GET /api/public/companies/{id}`
  - Returns: Full company profile

**Company Data Fields:**
```javascript
{
  airtableId, companyName, productName, logoUrl,
  description, problemStatement, website,
  missionArea, secondaryMissions, warfareDomain,
  trlLevel, fundingStage, cohort,
  videoLink, pitchLink, founders, location, teamSize
}
```

### Private API (Auth Required)

For authenticated content, use VIA OAuth flow:

- **OAuth Issuer:** `https://auth.sigmablox.com`
- **Scopes:** `openid email profile groups`
- **Flow:** OAuth 2.0 PKCE

Private endpoints SHOULD include:
- `GET /api/members` - Team/coach profiles
- `GET /api/cohorts` - Cohort details with participants
- `GET /getFavorites` - User's saved companies (user-specific)

### Content Seeding Strategy

**Build-time seeding** (preferred for static site):
1. Fetch data from public API during `npm run build`
2. Generate static JSON files in `public/data/`
3. Site loads pre-fetched data (fast, cacheable)

**Runtime fetching** (for dynamic content):
1. Client-side fetch from `api.sigmablox.com`
2. Use existing `js/builders/api.js` pattern
3. Fallback to mock data on localhost

### Pages to Seed

| Page | Content Source | Data |
|------|---------------|------|
| `/builders` | Public API | Companies grid, filters |
| `/portfolio` | Public API | Cohort showcase |
| `/about` | Private API (or static) | Team members |
| `/` (homepage) | Public API | Featured companies, stats |

## Acceptance Criteria

### Public API Integration
- [ ] Companies load on `/builders` page from live API
- [ ] Filters populate from `/api/public/companies/filters`
- [ ] Company modals show full detail from API
- [ ] Graceful fallback when API unavailable (cached/mock data)
- [ ] API base URL configurable via `window.MCBuildersConfig.apiBase`

### Build-time Seeding
- [ ] `npm run build` fetches and caches company data
- [ ] Static JSON written to `public/data/companies.json`
- [ ] Build fails gracefully if API unreachable (uses cached data)
- [ ] Cache invalidation strategy documented

### Private API Integration (Phase 2)
- [ ] VIA OAuth login flow works (`/auth/login`)
- [ ] Authenticated requests include Bearer token
- [ ] Private content only shown to logged-in users
- [ ] Session persists across page navigation

### Error Handling
- [ ] Network errors show user-friendly message
- [ ] 401/403 redirects to login
- [ ] Rate limiting handled with exponential backoff
- [ ] No API keys exposed in client-side code

## Technical Constraints

### Security
- API keys MUST NOT be in client-side JavaScript
- Use Cloudflare Workers for private API proxy if needed
- OAuth tokens stored in httpOnly cookies (see `cloudflare/auth.js`)

### Configuration
Env vars required (from `config/schema.cjs`):
```
PUBLIC_BASE_URL=https://www.mergecombinator.com
API_BASE_URL=https://api.sigmablox.com
OIDC_ISSUER_URL=https://auth.sigmablox.com
OIDC_CLIENT_ID=<from VIA>
OIDC_CLIENT_SECRET=<from VIA>
```

### Existing Code
- `js/builders/api.js` - Existing API client (extend, don't replace)
- `cloudflare/auth.js` - OAuth implementation (ready to use)
- `cloudflare/merge-router.js` - Reverse proxy routes

### Performance
- Cache API responses (15min TTL for companies)
- Use stale-while-revalidate pattern
- Lazy load company detail (not on initial page load)

## Visual/UX Notes

Per C2UX doctrine:
- Loading states: minimal spinner, not friendly skeleton
- Error states: operational language ("Data unavailable" not "Oops!")
- Empty states: "No results" not "Nothing here yet!"

## Implementation Order

1. **Phase 1: Public API** - Companies on `/builders` (extend existing)
2. **Phase 2: Build-time seeding** - Pre-fetch for static pages
3. **Phase 3: Private API** - Authenticated content via VIA OAuth
4. **Phase 4: Real-time updates** - WebSocket or polling for live data

## Related Files

- `js/builders/api.js` - API client
- `cloudflare/auth.js` - OAuth flow
- `config/schema.cjs` - Env var schema
- `scripts/DATA-SOURCES.md` - Data source documentation
