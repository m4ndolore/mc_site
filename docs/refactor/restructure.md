Merge Combinator Restructuring & Troubleshooting Plan
1. Consolidate domains and routes
Canonical domain – use https://mergecombinator.com as the only canonical origin. Create 301 redirects for all aliases:
Alias domain	Required action
www.mergecombinator.com	Add a Cloudflare Worker rule that checks request.headers.get("host") and issues a 301 redirect to the apex. Remove any existing A/AAAA records pointing directly to Cloudflare’s IPs to avoid DNS conflicts.
build.mergecombinator.com	Similarly, route this alias to the Worker and issue a 301 redirect to the apex.
This approach ensures that marketing pages, consoles and API calls always use a single origin and avoids duplicate content. Cloudflare documentation notes that Workers can be bound to multiple hostnames and should return 301 responses on alternate hostnames to preserve canonical URLs.
Route ordering – ensure the Worker’s routing table matches your desired precedence:
/app/wingman/* → WINGMAN_ORIGIN (strip the /app/wingman prefix before proxying)
/app/* → APP_ORIGIN (strip /app)
/control/* → CONTROL_ORIGIN (strip /control)
/api/* → SIGMABLOX_API_ORIGIN with added API token header and CORS headers
/combine → SIGMABLOX_ORIGIN (proxy and rewrite to /programs/the-combine or perform a fetch to the external origin)
/opportunities → SBIR proxy target
/wingman → marketing page (served by mc_site and never gated)
Route order matters because Cloudflare Workers do not expose the matching route; you must manually check the request path and strip prefixes inside the Worker. A common pattern is:
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // canonical redirect
    if (env.ALIAS_HOSTS.includes(url.hostname)) {
      return Response.redirect(`https://${env.APEX_DOMAIN}${url.pathname}${url.search}`, 301);
    }

    // marketing path should bypass auth
    if (url.pathname === "/wingman") {
      return env.MC_SITE.fetch(request);
    }

    // determine console based on prefix
    if (url.pathname.startsWith("/app/wingman")) {
      url.hostname = env.WINGMAN_ORIGIN;
      url.pathname = url.pathname.replace(/^\/app\/wingman/, "");
      return fetch(url.toString(), request);
    }
    if (url.pathname.startsWith("/app")) {
      url.hostname = env.APP_ORIGIN;
      url.pathname = url.pathname.replace(/^\/app/, "");
      return fetch(url.toString(), request);
    }
    // … additional routes …
  }
};
The official Cloudflare workers documentation recommends using environment variables for origin hosts and accessing them via the env parameter. Environment variables can be defined per environment (production, staging, etc.) in wrangler.toml and accessed via env.API_HOST.
2. Fix the Turnstile error on /access
Your logs show 400020 errors when the Turnstile widget loads. The Turnstile documentation lists two separate meanings for 400020 depending on context:
Cloudflare docs – 400020 denotes an invalid widget size and instructs using one of normal, compact or flexible.
Latest reference (2025) – updated guidance from community resources indicates that 400020 can also mean an invalid site key on the server. In this case the error is functionally the same as error 110100/110110 and means that the site key is invalid or missing.
To resolve the Turnstile bug:
Verify sitekey – log into the Cloudflare dashboard → Turnstile → Widget settings. Ensure that the site key configured in Cloudflare matches the data-sitekey attribute in your /access page. If you previously removed Turnstile from the auth flow, check that the TURNSTILE_SITE_KEY environment variable in the mc_site build still contains the correct key and is injected into the HTML. If the widget uses a testing key (e.g., 1x00000000000000000000AA), replace it with the production key.
Check hostname allowlist – Turnstile requires the request host to be listed in the widget’s allowed hostnames. Add mergecombinator.com, www.mergecombinator.com and build.mergecombinator.com (if you continue to serve content from these aliases) to the allowed hosts. Otherwise rely on the canonical redirect so that the user always ends up on the apex domain.
Use a valid size and appearance – if you specify options when rendering the widget, choose one of the supported values (size: 'normal' | 'compact' | 'flexible' and theme: 'light' | 'dark' | 'auto'). Remove any unsupported size (such as large) or theme parameters.
Remove stale widget injection – ensure the worker or template does not override the Turnstile site key from old configuration. In the past, the Worker attempted to set TURNSTILE_SITE_KEY via HTML rewriting; if this logic remains, delete it in favour of injecting the site key at build time in the mc_site template.
Test locally and on staging – use the 2x00000000000000000000AB test key for development to confirm that the widget loads. The test key always fails with a 600-series error as described in the reference but indicates the widget loads correctly.
By validating the site key and allowed hostnames, you will stop the 400020 error and allow the Turnstile token to be generated. When the token is received, the client-side script should submit the form to the /access endpoint.
3. Standardise configuration and remove unsafe fallbacks
Your RULES.md emphasises not hiding configuration issues. The current Worker code has hard‑coded CORS allow lists (API_CORS_ORIGINS) and default origins (DEFAULT_ORIGINS) that mask missing environment variables. This contravenes your guidelines.
Recommendations:
Define all origins as environment variables – include APP_ORIGIN, WINGMAN_ORIGIN, CONTROL_ORIGIN, SIGMABLOX_API_ORIGIN, SIGMABLOX_ORIGIN and APEX_DOMAIN in the [vars] section of wrangler.toml. Provide explicit values per environment (staging, production) so that the Worker will fail during deployment if a variable is missing. Remove the DEFAULT_ORIGINS fallback.
Configure CORS via environment – add an environment variable such as API_CORS_ORIGINS containing a comma‑separated list of domains allowed for cross‑origin requests (e.g., https://mergecombinator.com,https://app.mergecombinator.com). In the Worker, parse this string to build the Access-Control-Allow-Origin header. If API_CORS_ORIGINS is undefined, throw an exception on startup. This ensures missing configuration is noticed rather than silently allowing all origins.
Limit number of variables – although your team flagged a “tripwire” for more than 10 worker variables, the better practice is explicit configuration. With six to seven variables you remain below that limit. Resist the temptation to implement a YAML render pipeline now; instead, move CORS values into vars and revisit a templating system later.
Use Wrangler environments – maintain separate [env.staging] and [env.production] sections. Deploy to staging first, run integration tests, then promote to production. Cloudflare’s docs describe how environment-specific variables override the top-level ones.
Remove console.log secrets – ensure that secret values (e.g., encryption keys) are only stored as secrets in the Worker and not logged. Use the wrangler secret command to set them. Avoid embedding secrets into HTML responses.
4. Ensure /wingman remains public
The marketing requirement is that /wingman should always resolve to the Wingman marketing page and never trigger auth. To guarantee this:
Place the /wingman check before any auth‑gating logic in the Worker. For example, return mc_site response for /wingman before validating cookies or redirecting to /auth/login.
Confirm that the wingman marketing page is deployed in mc_site via Cloudflare Pages and accessible at /wingman. Since Cloudflare’s static hosting uses a pages.dev origin, ensure the Worker proxies requests to this origin rather than requiring an auth cookie.
Exclude /wingman/* from the /app/ prefix. There is both a marketing page at /wingman and a console at /app/wingman/*. Check the prefix strictly (e.g., url.pathname.startsWith('/app/wingman')) before gating.
5. Address DNS & Worker deployment confusion
Because Cloudflare’s dashboard displays Workers and Pages together, it is easy to misconfigure DNS:
DNS records – remove any old A or CNAME records that point to 192.0.2.1 or other dummy IPs. For the apex domain, create a CNAME flattening record pointing to Cloudflare’s internal infrastructure only if required. Usually the Worker binding will handle this automatically; leaving stray records will cause errors like HTTP 522 (connection timed out), as seen during earlier experiments.
Binding the Worker to the apex – use the Routes tab in the Workers dashboard to bind mergecombinator.com/* (and the alias domains) to the Worker script. Cloudflare docs state that routes map URL patterns (like example.com/*) to a Worker; you can attach multiple hostnames to a single Worker. If a DNS record already exists, Cloudflare warns about conflicts; removing or editing the record resolves the issue.
Testing environment – you already created a staging worker environment (e.g., mc-router-staging) with its own wrangler.toml [env.staging]. Continue to deploy there, run automated tests (see next section), and only promote to production once behaviour is correct.
6. Test and promote safely
Write integration tests – in the signal-incubator repository you added test-router.mjs. Expand these tests to simulate requests to different paths and verify that:
Requests to /wingman return a 200 OK from the marketing origin.
Requests to /app or /app/wingman without cookies are redirected to /auth/login and preserve a safe returnTo path (relative only, not absolute). The worker should reject absolute return URLs to mitigate host‑bloat attacks.
Requests with valid mc_session cookies are proxied to the correct origin and return 200.
Requests to /control/* require group membership; test both allowed and denied users.
API routes set proper CORS headers and forward auth tokens.
Monitor Turnstile – once the fix is deployed, monitor logs for the 400020 or 110200 errors. Use Cloudflare’s Turnstile analytics or client‑side logging to confirm tokens are being generated and validated.
Gradual rollout – Cloudflare Workers supports Gradual Deployments where a new version of a Worker is gradually rolled out to a percentage of traffic. Consider using this to minimise impact if there is a bug in the new routing logic. Alternatively, switch mc-router-staging to be the default environment by editing the route in the dashboard and revert if issues appear.
7. Maintain clean code and avoid repeated mistakes
Previous incidents (e.g., a misplaced closing brace causing downtime) highlight the need for code hygiene:
Use modules to separate concerns (auth functions, routing logic, utils). When migrating to modules, ensure that you import and export functions correctly. A common pattern is import { validateSession } from './auth'; and then call it within the Worker. Avoid circular imports.
Set up automated linting (e.g., ESLint) and type checking (with TypeScript) to catch syntax errors before deployment.
Use version control branches and pull‑request reviews. Ensure that any bundling step (esbuild or Vite) is run locally rather than pasting compiled code into the Cloudflare GUI. Wrangler can build and deploy the Worker; using it reduces the risk of manual copy mistakes.
Keep mc_last_console cookie logic simple. If the cookie determines the default console (/app vs. /app/wingman), ensure it is updated upon successful logins and is not used for unauthenticated requests (to avoid redirect loops).
8. Confirm subdomain origin readiness
Currently your console apps are built with Vite and can be deployed to Cloudflare Pages under their own subdomains. Before finishing the routing work, verify that each subdomain is serving a valid build:
Path prefix	Expected origin	Notes
/app/*	app.mergecombinator.com	React/Vite build for Mission Control / Defense Builders. Deploy to Cloudflare Pages or another static host.
/app/wingman/*	wingman.mergecombinator.com	React/Vite build for Wingman console.
/control/*	control.mergecombinator.com	Next.js build hosted on Cloud Run. This origin is dynamic; ensure CORS and auth headers are passed through.
If these origins are not yet live, create placeholder deployments (even a simple “Coming Soon” page) to avoid the Worker returning host not found errors. Once the actual builds are deployed, update the env variables accordingly and test again.
9. Summary & Next steps
By following this plan you will:
Fix the Turnstile bug by validating the site key, allowed hostnames and widget options, ensuring the /access page loads correctly and the submit handler fires.
Standardise environment variables and remove hidden defaults, satisfying your RULES.md guidelines.
Implement clear routing in the Worker, ensuring that /wingman remains public and that the correct consoles are proxied based on path prefixes.
Establish a canonical domain with 301 redirects from www and build hosts to the apex, reducing DNS confusion.
Test thoroughly in staging, write integration tests, and gradually deploy to production.
This roadmap should stabilise the mergecombinator.com platform, support marketing SEO objectives, and provide a clean foundation for Mission Control, Wingman and Control consoles.