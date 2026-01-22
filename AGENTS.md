# mc_site Operational Guide

## Build & Run

```bash
# Development server (localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Validation (Backpressure)

Run these after implementing to get immediate feedback:

### 1. Build Check
```bash
npm run build
```
Must exit 0. Any build error = fail.

### 2. Visual Verification (Playwright MCP - Chromium)

Start dev server, then use Playwright MCP tools:

```
# Navigate to page
mcp__playwright__browser_navigate url="http://localhost:5173"

# Take screenshot for audit
mcp__playwright__browser_take_screenshot

# Save to .playwright-mcp/ with descriptive name
```

Visual checks:
- Layout renders correctly
- No broken images (check Network tab)
- No console errors
- Responsive at 1920px, 1024px, 768px, 375px

### 3. LLM-as-Judge Criteria

Binary pass/fail on these:
- C2UX compliant (operational, not marketing-y)
- Typography hierarchy correct
- Color palette matches design system
- No broken links (404s)

## Project Structure

```
mc_site/
├── *.html              # Page files (index, builders, blog, etc.)
├── script.js           # Main JavaScript
├── styles.css          # Main Tailwind CSS
├── js/                 # Additional JS modules
│   ├── auth/           # VIA authentication (REQ-AUTH-002)
│   └── builders/       # Builder page modules
├── styles/             # Additional CSS
├── assets/             # Images, fonts
├── public/             # Static files (robots.txt, sitemap.xml)
├── config/             # Build/deploy config
├── docs/               # Documentation
├── specs/              # Legacy Ralph specs (migrated to RTMX)
└── .rtmx/              # Requirements database
    ├── database.csv
    └── requirements/
```

## Deployment

- Deploys to Cloudflare Pages on push
- Staging: mc-site-dr4.pages.dev
- Production: www.mergecombinator.com

## Codebase Patterns

- Tailwind CSS for styling (v4)
- Vite for build (v7)
- No framework (vanilla HTML/JS)
- CF Image Resizing via `cfImage()` utility in script.js

## VIA/Authentik Reference

**Skill documentation**: `~/.claude/skills/via-configuration/SKILL.md` - Full API patterns, stage types, policy expressions

**SigmaBlox reference implementations**:
- `sigmablox/apps/ghost-theme/ease/assets/js/auth-service.js` - Client-side auth
- `sigmablox/apps/webhook/lib/authentik-middleware.js` - Server-side middleware

**API quick reference**:
```bash
# Authentik API base
AUTHENTIK_URL="https://via.sigmablox.com"
TOKEN="$AUTHENTIK_ADMIN_TOKEN"

# Common endpoints
/api/v3/core/applications/         # Applications
/api/v3/providers/oauth2/          # OAuth providers
/api/v3/core/users/me/             # Current user (with session cookie)
```

**OAuth PKCE flow** (for client-side auth):
1. Generate `code_verifier` and `code_challenge`
2. Redirect to `/application/o/authorize/` with challenge
3. Handle callback with auth code
4. Exchange code + verifier for tokens via Cloudflare Worker

## Work Priority Guidance

**Phase 1 (Foundation)**: REQ-AUTH-001, REQ-AUTH-002
- Configure VIA OAuth for mergecombinator.com
- Build client-side auth service

**Phase 2 (Protected Content)**: REQ-CONTENT-001, REQ-CONTENT-002
- Gate builder modal private fields
- Add auth UI to header

**Phase 3 (Docs)**: REQ-DOCS-001, REQ-DOCS-002, REQ-DOCS-003
- docs.mergecombinator.com SSO
- Unified navigation

**Phase 4 (C2UX)**: REQ-C2UX-001, REQ-C2UX-002
- Command center UX evolution
- Ecosystem dashboard

**Commit frequently** - if build passes and work is incremental, commit and push.
