# REQ-BUG-007: /opportunities returns 500 from SBIR origin

## Metadata
- **Status**: COMPLETE
- **Priority**: LOW
- **Phase**: 2
- **Effort**: 0.5 weeks
- **Dependencies**: None
- **Blocks**: None
- **Resolved Date**: 2026-02-12

## Bug Description
The `/opportunities` route on mergecombinator.com returns a 500 error when proxied through the MC Router, despite the SBIR origin (sbir.mergecombinator.com) working correctly when accessed directly.

## Root Cause Analysis (2026-02-12)
**Root Cause**: Cloudflare Worker subrequest to sbir.mergecombinator.com triggers an infinite redirect loop.

### Investigation Details
1. Initial error was `1101` (DNS resolution/connection error)
2. After adding `redirect: "manual"`, discovered Railway was returning 301 redirects
3. The redirect pointed to the same URL: `https://sbir.mergecombinator.com/` → `https://sbir.mergecombinator.com/`
4. This created an infinite redirect loop (21+ redirects)

### Tests Performed
- Direct curl to sbir.mergecombinator.com: 200 OK ✓
- Curl with wrong Host header: 404 (confirms Host sensitivity)
- Curl with X-Forwarded-* headers: 200 OK ✓
- Worker subrequest: Redirect loop ✗

### Likely Cause
Railway edge may be detecting Cloudflare Worker traffic and redirecting it, possibly due to:
- Worker IP range detection
- Internal Cloudflare routing behavior
- Railway's edge handling of CNAME-resolved traffic from CF nameservers

## Resolution
**Implemented**: Redirect-only route instead of proxy

```javascript
{ prefix: "/opportunities", origin: origins.sbir, stripPrefix: true, redirectOnly: true }
```

The router now returns a 302 redirect to `sbir.mergecombinator.com` instead of proxying the content.

### Trade-offs
- ✓ Feature works - users can access opportunities
- ✓ No complex proxy debugging required
- ✗ Users see subdomain URL in browser bar
- ✗ No unified URL experience

## Future Improvement
To achieve full proxy support (unified URL), consider:
1. **Migrate SBIR frontend to CF Pages** - Eliminates proxy need entirely
2. **Use CF Access service tokens** - May bypass Railway edge behavior
3. **Direct Railway internal URL** - Would require Railway config for Host acceptance

## Acceptance Criteria
- [x] `/opportunities` returns usable content (via redirect)
- [x] No errors in MC Router logs
- [x] Feature accessible to users
