# CI/CD Alignment Implementation Plan (Lean Version)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean up legacy SigmaBlox references and add basic CI for the static Vite site deployed on Vercel.

**Architecture:** Static site built with Vite, deployed via Vercel. The `config/` directory was inherited from SigmaBlox for future backend use - keep it minimal but functional.

**Tech Stack:** Vite, Vercel, GitHub Actions

---

## Context: What This Project Actually Is

mc_site is a **static marketing site** deployed on Vercel:
- No backend services
- No Docker or Cloud Run
- No MongoDB, OIDC, SMTP connections at runtime
- The `config/` directory was copied from SigmaBlox for future expansion

**What we need now:**
1. Fix doctor.js so it doesn't crash on undefined Ghost URLs
2. Add GitHub Actions CI for build validation
3. Clean up unused SigmaBlox artifacts

**What we DON'T need (defer until backend exists):**
- `render-env.js` script - no services consuming `.runtime/*.env`
- Complex config validation - Vercel handles env vars directly
- `.env.local.example` with backend secrets - static site doesn't use them

---

### Task 1: Fix config/doctor.js Legacy References

**Files:**
- Modify: `config/doctor.js`

**Step 1: Update User-Agent string (line 49)**

```javascript
// Change from:
'User-Agent': 'SigmaBlox-Config-Doctor/1.0',
// To:
'User-Agent': 'MC-Platform-Config-Doctor/1.0',
```

**Step 2: Update URL output section (lines 207-218)**

The `getAllUrls()` in `url-helpers.js` now returns different keys. Update doctor.js to match:

```javascript
// Replace lines 207-218 with:
console.log('Public Base URL:      ', urls.publicBaseUrl);
console.log('API Base URL:         ', urls.apiBaseUrl);
console.log('OIDC Redirect URI:    ', urls.oidcRedirectUri);
console.log('OAuth Redirect URI:   ', urls.oauthRedirectUri);
console.log('OIDC Issuer URL:      ', urls.oidcIssuerUrl);
console.log('CORS Origins:         ', Array.isArray(urls.corsOrigins) ? urls.corsOrigins.join(', ') : 'NOT SET');
```

**Step 3: Test doctor runs without crashes**

Run: `node config/doctor.js`
Expected: Script runs (will show missing vars - that's OK for static site)

**Step 4: Commit**

```bash
git add config/doctor.js
git commit -m "fix(config): remove Ghost/SigmaBlox references from doctor.js"
```

---

### Task 2: Add GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create directory and workflow file**

```bash
mkdir -p .github/workflows
```

**Step 2: Create minimal CI workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
```

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions build workflow"
```

---

### Task 3: Commit pending config changes

**Files:**
- Stage: `config/base.yaml`, `config/dev.local.yaml`, `config/dev.public.yaml`, `config/prod.yaml`, `config/schema.js`, `config/url-helpers.js`, `config/README.md`

These files were already modified to remove SigmaBlox-specific values. Commit them.

**Step 1: Review changes**

Run: `git diff --stat config/`
Expected: Shows the files modified

**Step 2: Commit config updates**

```bash
git add config/
git commit -m "refactor(config): migrate from SigmaBlox to MC Platform patterns

- Replace hardcoded SigmaBlox values with PLACEHOLDER_ markers
- Remove Ghost CMS configuration (not used by mc_site)
- Update schema.js to MC Platform variables
- Clean up url-helpers.js to remove Ghost-specific URLs
- Update README with current architecture"
```

---

### Task 4: Verify build still works

**Files:**
- No changes - verification only

**Step 1: Run build**

Run: `npm run build`
Expected: Vite build completes successfully, creates dist/

**Step 2: Preview build**

Run: `npm run preview`
Expected: Preview server starts, site loads correctly

**Step 3: Verify git status is clean**

Run: `git status`
Expected: Working directory clean (except gitignored files)

---

## Summary of Changes

| File | Action | Purpose |
|------|--------|---------|
| `config/doctor.js` | Modify | Remove Ghost/SigmaBlox references |
| `.github/workflows/ci.yml` | Create | GitHub Actions build validation |
| `config/*.yaml` | Commit | Migrate to MC Platform patterns |
| `config/schema.js` | Commit | Remove Ghost-specific variables |
| `config/url-helpers.js` | Commit | Remove Ghost-specific URLs |

## Deferred (Until Backend Exists)

These items from RULES.md are deferred since mc_site is currently a static site:

- `scripts/render-env.js` - No services consuming rendered env files
- `.env.local.example` - No backend secrets needed
- Config validation in CI - Static site doesn't read env vars
- Docker/Cloud Run patterns - Deploying via Vercel

When a backend is added to mc_site, revisit RULES.md and implement the full config contract.
