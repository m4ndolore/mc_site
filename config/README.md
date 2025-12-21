# Configuration System

This directory contains the authoritative environment configuration for Merge Combinator.

## Architecture Principles

1. **Applications read ONLY from `process.env`** - No YAML loading in app code
2. **Secrets NEVER in YAML** - Only in `.env.local` (dev) or Secret Manager (prod)
3. **URLs derived from `PUBLIC_BASE_URL`** - Single source of truth
4. **Fail-fast validation** - Invalid config crashes at startup with clear errors

## File Structure

```
config/
├── schema.js           # Configuration contract + validation
├── base.yaml           # Non-secret defaults (all environments)
├── dev.local.yaml      # Local development (localhost)
├── dev.public.yaml     # Public development (Cloudflare tunnel)
├── prod.yaml           # Production non-secrets
└── README.md           # This file
```

## YAML Overlay Files

### base.yaml
Common non-secret configuration shared across all environments.

**Rules:**
- NO secrets
- NO environment-specific URLs
- Shared defaults only

### dev.local.yaml
Local development mode (localhost).

**Usage:** `docker compose --profile local up`

**Characteristics:**
- Uses `http://localhost:*` URLs
- SQLite for Ghost
- Mailpit for email
- No Cloudflare tunnel
- Relaxed security settings

### dev.public.yaml
Public development mode (with Cloudflare tunnel).

**Usage:** `docker compose --profile public up`

**Characteristics:**
- Uses `https://dev.sigmablox.com` URLs
- SQLite for Ghost (still dev)
- Real SMTP
- Cloudflare tunnel active
- Production-like security

### prod.yaml
Production configuration (non-secrets only).

**Characteristics:**
- Uses `https://www.sigmablox.com` URLs
- **MUST use MySQL** for Ghost
- Strict security settings
- All secrets from Secret Manager

## How Config is Loaded

```
1. scripts/render-env.sh merges:
   base.yaml → {dev.local|dev.public|prod}.yaml → /tmp/runtime.env

2. secrets fetched separately:
   Dev:  .env.local (gitignored)
   Prod: Secret Manager injection (Cloud Run: --set-secrets; VM: generated .ghost.secrets.env)

3. Docker loads both:
   env_file:
     - /tmp/runtime.env
     - .env.local            (dev only; gitignored)

4. App reads from process.env only
```

## Secret Management

**Development:**
```bash
# Create .env.local with secrets (gitignored)
cp .env.local.example .env.local
# Edit and add your secrets
```

**Production:**
```bash
# Secrets stored in Google Secret Manager
# Injected on deployment (no printing to stdout)
```

## Validation

The schema enforces:
- Required variables present
- Correct types (string, number, boolean, url, email)
- Valid enum values
- Production rules (MySQL only, no localhost URLs)

**Test validation:**
```javascript
const { validateConfig, printConfigStatus } = require('./schema');
printConfigStatus(); // Prints validation results
```

## URL Derivation

All URLs derive from `PUBLIC_BASE_URL`:

```javascript
const { getPublicBaseUrl, getOidcRedirectUrl } = require('./url-helpers');

// PUBLIC_BASE_URL is set in `base.yaml`
getPublicBaseUrl()    
getOidcRedirectUrl()          
```

## Migration Path

This config system replaces:
- ❌ `apps/webhook/.env.dev.yaml` (YAML loading in app)
- ❌ `apps/webhook/.env.prod.yaml` (YAML loading in app)
- ❌ `apps/webhook/config-manager.js` (runtime YAML parsing)
- ❌ `.deploy/config/production.env` (scattered config)

During migration, both systems work in parallel. Once migration is complete, old files are removed.

## Commands

```bash
# Validate configuration
npm run doctor

# Render environment files (local)
scripts/render-env.sh dev.local

# Render environment files (prod)
scripts/render-env.sh prod

# Fetch production secrets
scripts/fetch-secrets-gsm.sh
```

## Adding New Config Variables

1. **Add to `schema.js`** - Define in appropriate group
2. **Add default to `base.yaml`** - If it's shared
3. **Override in env-specific YAML** - If needed
4. **Update URL helpers** - If it's a derived URL
5. **Test validation** - Ensure it validates correctly

## Rules

✅ **DO:**
- Define all config in schema.js
- Use environment-specific overlays for differences
- Validate on startup with `requireValidConfig()`
- Derive URLs from PUBLIC_BASE_URL

❌ **DON'T:**
- Put secrets in YAML files
- Hardcode URLs in application code
- Load YAML at runtime in app code
- Branch logic on environment (use config values instead)
