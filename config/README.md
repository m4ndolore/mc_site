# Configuration System

This directory contains the authoritative environment configuration for the MC Platform (Defense Builders).

## Architecture Principles

1. **Applications read ONLY from `process.env`** - No YAML loading in app code
2. **Secrets NEVER in YAML** - Only in `.env.local` (dev) or Secret Manager (prod)
3. **URLs derived from `PUBLIC_BASE_URL`** - Single source of truth
4. **Fail-fast validation** - Invalid config crashes at startup with clear errors
5. **PLACEHOLDER values must be replaced** - Config validation fails on PLACEHOLDER_ prefixed values

## File Structure

```
config/
├── schema.cjs          # Configuration contract + validation
├── base.yaml           # Non-secret defaults (all environments)
├── dev.local.yaml      # Local development (localhost)
├── dev.public.yaml     # Public development (Cloudflare tunnel)
├── prod.yaml           # Production non-secrets
├── url-helpers.cjs     # URL derivation utilities
├── env.cjs             # Environment helpers
├── doctor.cjs          # Configuration diagnostics
└── README.md           # This file
```

## YAML Overlay Files

### base.yaml
Common non-secret configuration shared across all environments.

**Rules:**
- NO secrets
- NO environment-specific URLs
- Shared defaults only
- PLACEHOLDER_ prefixed values indicate required configuration

### dev.local.yaml
Local development mode (localhost).

**Characteristics:**
- Uses `http://localhost:*` URLs
- Mailpit for email testing
- Relaxed security settings

### dev.public.yaml
Public development mode (with Cloudflare tunnel).

**Characteristics:**
- Uses public dev domain
- Real SMTP
- Production-like security

### prod.yaml
Production configuration (non-secrets only).

**Characteristics:**
- Production domains
- Strict security settings
- All secrets from Secret Manager

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
# Injected on deployment
```

## Required Secrets (.env.local)

These must be provided in `.env.local` (never in YAML):

```bash
# MongoDB
MONGODB_URI=mongodb+srv://...

# Auth/OIDC
OIDC_CLIENT_SECRET=...

# Security
JWT_SECRET=...          # Generate: openssl rand -base64 32
SESSION_SECRET=...      # Generate: openssl rand -base64 32

# Email (optional)
SMTP_PASS=...

# AI (optional)
OPENAI_API_KEY=...
AI_API_KEY=...
```

## Validation

The schema enforces:
- Required variables present
- Correct types (string, number, boolean, url, email)
- Valid enum values
- No PLACEHOLDER_ values in runtime
- Production rules (no localhost URLs)

**Test validation:**
```bash
node config/doctor.cjs
```

## Placeholder Values

All `PLACEHOLDER_*` values in the YAML files MUST be replaced before the application will start:

| Placeholder | Description |
|-------------|-------------|
| `PLACEHOLDER_OIDC_CLIENT_ID_DEV` | OpenPass/Authentik client ID for dev |
| `PLACEHOLDER_OIDC_CLIENT_ID_PROD` | OpenPass/Authentik client ID for prod |
| `PLACEHOLDER_DEV_PUBLIC_URL` | Public dev URL (e.g., https://dev.defensebuilders.com) |
| `PLACEHOLDER_PROD_PUBLIC_URL` | Production URL (e.g., https://app.defensebuilders.com) |
| `PLACEHOLDER_GCP_PROJECT_ID` | Your Google Cloud project ID |
| `PLACEHOLDER_ADMIN_EMAIL` | Admin email address |

## Commands

```bash
# Validate configuration
node config/doctor.cjs

# Check schema
node -e "require('./config/schema.cjs').printConfigStatus()"
```

## Adding New Config Variables

1. **Add to `schema.cjs`** - Define in appropriate group
2. **Add default to `base.yaml`** - If it's shared
3. **Override in env-specific YAML** - If needed
4. **Update .env.local.example** - If it's a secret
5. **Test validation** - Ensure it validates correctly

## Rules

**DO:**
- Define all config in schema.cjs
- Use environment-specific overlays for differences
- Validate on startup with `requireValidConfig()`
- Use PLACEHOLDER_ for values that must be configured

**DON'T:**
- Put secrets in YAML files
- Hardcode URLs in application code
- Load YAML at runtime in app code
- Use sigmablox-specific values (this is the MC Platform)
