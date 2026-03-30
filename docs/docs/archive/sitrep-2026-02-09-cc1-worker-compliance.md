# Situation Report: 2026-02-09

**Status:** Production Deployed
**Primary Focus:** CC-1 RULES.md Compliance & Turnstile Fix

---

## Completed This Session

### 1. CC-1: RULES.md Compliance for mc-router Worker

**Problem:** Worker had hardcoded configuration that violated RULES.md:
- `DEFAULT_ORIGINS` fallbacks masked missing config
- `API_CORS_ORIGINS` hardcoded in source code
- Turnstile site key not properly injected

**Solution:**
- Removed `DEFAULT_ORIGINS` constant - Worker now fails loudly on missing env vars
- Moved `API_CORS_ORIGINS` to `wrangler.toml [vars]` (comma-separated list)
- Added `REQUIRED_ORIGIN_VARS` validation array
- `getOrigins(env)` throws if any required origin is missing
- `parseCorsOrigins(env)` parses env var into Set

**Files Changed:**
- `cloudflare/merge-router.js` - removed hardcoded config, added validation
- `wrangler.toml` - added `API_CORS_ORIGINS` to prod/staging/dev

### 2. Turnstile Race Condition Fix

**Problem:** Turnstile widget showed 400020 error (invalid sitekey)
- Worker injected key on `<body data-turnstile-site-key="...">`
- But Turnstile script auto-rendered before JS could read the key

**Solution:**
- Changed to explicit rendering: `?render=explicit&onload=onloadTurnstileCallback`
- JS callback reads key from body attribute, then calls `turnstile.render()`
- Added `?debug=1` query param to log masked key to console

**Files Changed:**
- `access.html` - explicit Turnstile render setup

### 3. Test Suite Added

New comprehensive test suite at `cloudflare/test-router.mjs`:
- Route matching unit tests (15 cases)
- `sanitizeReturnTo` security tests (13 cases)
- Smoke tests for all routes (8 endpoints)
- Turnstile injection verification
- CORS header tests (allow/block)
- Canonical redirect tests (www → apex)

**Run with:** `node cloudflare/test-router.mjs prod`

### 4. CF Pages Build Fix

**Problem:** Vite 7.x requires Node 20.19.0+ with `crypto.hash` support
- CF Pages build environment didn't support this

**Solution:**
- Downgraded Vite from 7.x to 6.x
- Added `.nvmrc` as fallback

### 5. Multi-Environment Support

`wrangler.toml` now has three environments:
- **Production:** `wrangler deploy`
- **Staging:** `wrangler deploy --env staging`
- **Development:** `wrangler dev --env dev`

All origins, CORS, and Turnstile keys configured per environment.

---

## Deployment

| Component | Status | Command |
|-----------|--------|---------|
| Worker | ✅ Deployed | `npm run deploy:worker` |
| Pages | ✅ Deployed | `npm run deploy:pages` |
| PR #3 | ✅ Merged | `staging/modular-worker` → `main` |

---

## Test Results (Production)

```
Route matching: 15 passed, 0 failed
SanitizeReturnTo: 13 passed, 0 failed
Smoke tests: 8 passed, 0 failed
Turnstile tests: 2 passed, 0 failed
Canonical redirects: 2 passed, 0 failed
CORS tests: 2 passed, 0 failed
✓ All tests passed!
```

---

## Architecture Notes

### Config Flow (Post CC-1)
```
wrangler.toml [vars]     → Worker env parameter → Runtime config
                              ↓
                         HTMLRewriter injects Turnstile key on <body>
                              ↓
                         Client JS reads from body, renders widget
```

### CORS Flow
```
wrangler.toml: API_CORS_ORIGINS = "https://mergecombinator.com,..."
                              ↓
Worker: parseCorsOrigins(env) → Set of allowed origins
                              ↓
getCorsHeaders(request, env) → Returns headers or null
```

---

## RTMX Impact

No direct requirement changes. This was infrastructure/compliance work:
- Aligns with RULES.md "Static Sites & Cloudflare Workers" section
- Improves maintainability and debuggability
- Adds test coverage for routing logic

---

## Files Added/Changed

| File | Change |
|------|--------|
| `cloudflare/merge-router.js` | CC-1 compliance refactor |
| `cloudflare/test-router.mjs` | New test suite |
| `cloudflare/DEPLOYMENT.md` | Deployment guide |
| `wrangler.toml` | Multi-env config, CORS origins |
| `access.html` | Turnstile explicit render |
| `package.json` | Vite 6.x, deploy scripts |
| `.nvmrc` | Node version for CF Pages |

---

## Next Steps (Optional)

- [ ] Delete vestigial `config/*.yaml` files (not used by Worker)
- [ ] Update RULES.md tripwire threshold (currently 10 vars, have ~12)
- [ ] Consider adding `SBIR_ORIGIN` to env vars (currently hardcoded)
