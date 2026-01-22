# REQ-DOCS-001: docs.mergecombinator.com VIA SSO

## Description
Configure VIA authentication for the docs.mergecombinator.com knowledge base so users authenticate once and have access to both the main site and documentation.

## Target
**Metric**: Users authenticate once for both mc-site and docs

## Reference
- VIA skill: `~/.claude/skills/via-configuration/SKILL.md`
- Current docs platform (likely GitBook or Docusaurus)

## Acceptance Criteria
- [ ] VIA OAuth configured for docs.mergecombinator.com
- [ ] Shared session between www and docs subdomains
- [ ] Login on mc-site grants access to docs
- [ ] Login on docs grants access to mc-site
- [ ] Session cookie works across subdomains

## Implementation Considerations

### Cookie Domain
For cross-subdomain auth, cookies must be set on `.mergecombinator.com`:
```javascript
// Cloudflare Worker cookie settings
{
  domain: '.mergecombinator.com',
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'Lax'
}
```

### Docs Platform Integration
Depending on platform:
- **GitBook**: Custom SSO via GitBook API
- **Docusaurus**: Custom auth plugin
- **ReadMe.io**: OAuth integration
- **Self-hosted**: Direct VIA integration

### Shared Components
May need shared auth middleware deployed to:
- `www.mergecombinator.com` (main site)
- `docs.mergecombinator.com` (knowledge base)
- Or central auth at `auth.mergecombinator.com`

## Implementation
- **Status**: PENDING
- **Phase**: 3
- **Priority**: MEDIUM

## Validation
- **Method**: Manual Test
- Login on mc-site → navigate to docs → should be logged in
- Login on docs → navigate to mc-site → should be logged in

## Dependencies
- REQ-AUTH-001 (VIA must be configured for MC domain first)
