/**
 * Merge Combinator Edge Router
 *
 * Routes requests to appropriate backends based on path prefix.
 * Handles authentication, console access gating, and Sigmablox content proxying.
 */

import {
  handleAuthRoute,
  isAuthRoute,
  getSession,
  createLastConsoleCookie,
} from "./auth.js";

// ────────────────────────────────────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────────────────────────────────────

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const CONSOLE_PATHS = new Set(["/control"]);
const DEFAULT_ADMIN_GROUPS = ["mc-admins"];

// Platform convergence: canonical redirect targets
// guild.mergecombinator.com = authenticated platform
// wingman.mergecombinator.com = messaging intelligence product
// api.mergecombinator.com = single API entrypoint
const GUILD_HOST = "guild.mergecombinator.com";
const WINGMAN_HOST = "wingman.mergecombinator.com";
const API_HOST = "api.mergecombinator.com";

const CANONICAL_HOST = "mergecombinator.com";
const ALIAS_HOSTS = new Set(["www.mergecombinator.com", "build.mergecombinator.com"]);
// Legacy subdomain → canonical host redirects
const SUBDOMAIN_REDIRECTS = new Map([
  ["app.mergecombinator.com", GUILD_HOST],
]);
const SUBDOMAIN_PLACEHOLDER_REDIRECTS = new Map([
  ["wingman.mergecombinator.com", "/wingman"],
]);
const LEGACY_PATH_REDIRECTS = new Map([
  ["/sbir", "/knowledge/sbir"],
  ["/contact", "/access"],
  ["/join", "/access?context=combine"],
  ["/combine", "/programs/the-combine"],
]);

// ────────────────────────────────────────────────────────────────────────────
// MC Pages HTML Transformation (Turnstile injection)
// ────────────────────────────────────────────────────────────────────────────

function maskKey(key) {
  if (!key || key.length < 8) return "****";
  return "****" + key.slice(-4);
}

function transformMcPagesHtml(response, env, url) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  const turnstileKey = env.TURNSTILE_SITE_KEY || "";
  if (!turnstileKey) {
    console.log("[mc-router] TURNSTILE_SITE_KEY not configured");
    return response;
  }

  const isDebug = url.searchParams.get("debug") === "1";
  const debugScript = isDebug
    ? `<script>console.log("[mc-router] Turnstile key injected: ${maskKey(turnstileKey)}");</script>`
    : "";

  return new HTMLRewriter()
    .on("body", {
      element(element) {
        element.setAttribute("data-turnstile-site-key", turnstileKey);
        if (debugScript) {
          element.append(debugScript, { html: true });
        }
      },
    })
    .transform(response);
}

// ────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────────────────────────────────────────

const REQUIRED_ORIGIN_VARS = [
  "MC_PAGES_ORIGIN",
];

function getOrigins(env) {
  const missing = REQUIRED_ORIGIN_VARS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required origin vars: ${missing.join(", ")}`);
  }
  return {
    mcPages: env.MC_PAGES_ORIGIN,
    opportunities: env.OPPORTUNITIES_PAGES_URL || "https://mc-opportunities.pages.dev",
  };
}


function getRoutes(origins) {
  // /app/*, /app/wingman/*, and /api/* are now 301 redirects
  // handled in step 1.5 before route matching. Only proxy routes remain here.
  // /wingman is served by Pages (wingman.html) — not redirected.
  // /control no longer proxied — redirected to Guild /admin in step 3
  // /combine is now a 301 redirect to /programs/the-combine (handled by _redirects)
  // SigmaBlox proxy removed — see docs/plans/2026-03-29-seo-optimization-implementation-prompt.md
  return [
    { prefix: "/opportunities", origin: origins.opportunities, stripPrefix: true, preserveRoot: true },
  ];
}

function resolveTarget(url, route) {
  const target = new URL(route.origin);
  if (route.stripPrefix) {
    if (route.preserveRoot && (url.pathname === route.prefix || url.pathname === `${route.prefix}/`)) {
      target.pathname = "/";
    } else {
      const suffix = url.pathname === route.prefix ? "/" : url.pathname.slice(route.prefix.length);
      target.pathname = suffix || "/";
    }
  } else {
    target.pathname = url.pathname;
  }
  target.search = url.search;
  return target;
}

function isConsolePath(pathname) {
  return Array.from(CONSOLE_PATHS).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function consoleValueFromPath(pathname) {
  if (pathname === "/control" || pathname.startsWith("/control/")) {
    return "control";
  }
  return "app";
}

function isAdminSession(session, env) {
  if (!session || !session.user || !Array.isArray(session.user.groups)) {
    return false;
  }
  const configured = env.CONTROL_ADMIN_GROUPS
    ? env.CONTROL_ADMIN_GROUPS.split(",").map((item) => item.trim()).filter(Boolean)
    : DEFAULT_ADMIN_GROUPS;
  const groupSet = new Set(configured);
  return session.user.groups.some((group) => groupSet.has(group));
}

function createLoginRedirect(request) {
  const url = new URL(request.url);
  const loginUrl = new URL("/auth/login", url.origin);
  loginUrl.searchParams.set("returnTo", `${url.pathname}${url.search}${url.hash}`);
  return Response.redirect(loginUrl.toString(), 302);
}

function withLastConsoleCookie(response, value, env, request) {
  const headers = new Headers(response.headers);
  headers.append(
    "Set-Cookie",
    createLastConsoleCookie(value, env, new URL(request.url).protocol === "https:")
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isWebSocketRequest(request) {
  const upgrade = request.headers.get("upgrade");
  return upgrade && upgrade.toLowerCase() === "websocket";
}

function buildUpstreamHeaders(request, { stripCookies = false } = {}) {
  const headers = new Headers(request.headers);
  const isWebSocket = isWebSocketRequest(request);

  if (!isWebSocket) {
    for (const header of HOP_BY_HOP_HEADERS) {
      headers.delete(header);
    }
  }

  if (stripCookies) {
    headers.delete("cookie");
  }

  const originalUrl = new URL(request.url);
  const originalHost = request.headers.get("host");
  if (originalHost) {
    headers.set("x-forwarded-host", originalHost);
  }
  headers.set("x-original-path", originalUrl.pathname);
  headers.set("x-forwarded-proto", originalUrl.protocol.replace(":", ""));

  // Remove original Host header so fetch() sets it correctly for the target URL
  headers.delete("host");

  return headers;
}

// ────────────────────────────────────────────────────────────────────────────
// Main Fetch Handler
// ────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = request.headers.get("host") || url.hostname;
    const wingmanEnabled = String(env.WINGMAN_CONSOLE_ENABLED || "").toLowerCase() === "true";

    // 1) Canonical host redirect
    if (ALIAS_HOSTS.has(host)) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    // 1.1) Legacy subdomain redirects (e.g. app.* → guild.*)
    if (host === "ask.mergecombinator.com" || host === "sbir.mergecombinator.com") {
      return Response.redirect(`https://${CANONICAL_HOST}/`, 301);
    }
    const redirectHost = SUBDOMAIN_REDIRECTS.get(host);
    if (redirectHost) {
      url.hostname = redirectHost;
      return Response.redirect(url.toString(), 301);
    }
    const placeholderPath = SUBDOMAIN_PLACEHOLDER_REDIRECTS.get(host);
    if (placeholderPath) {
      const isWingmanHost = host === WINGMAN_HOST;
      const shouldRedirectToPlaceholder = isWingmanHost && !wingmanEnabled;
      if (shouldRedirectToPlaceholder) {
        const target = `https://${CANONICAL_HOST}${placeholderPath}`;
        return Response.redirect(target, 302);
      }
    }

    // 1.5) Platform convergence redirects (301)
    // These canonicalize legacy subpath-proxied routes to their proper hosts.
    // Order matters: /app/wingman/* must be checked before /app/*
    if (url.pathname.endsWith(".html")) {
      const isYandexVerification = /^\/yandex_[\w-]+\.html$/i.test(url.pathname);
      const is404Page = url.pathname === "/404.html";
      if (!isYandexVerification && !is404Page) {
        let cleanPath = url.pathname.slice(0, -5) || "/";
        if (cleanPath === "/index") cleanPath = "/";
        return Response.redirect(`https://${CANONICAL_HOST}${cleanPath}${url.search}`, 301);
      }
    }
    const legacyTarget = LEGACY_PATH_REDIRECTS.get(url.pathname);
    if (legacyTarget) {
      return Response.redirect(`https://${CANONICAL_HOST}${legacyTarget}${url.search}`, 301);
    }
    if (url.pathname.startsWith("/combine/")) {
      return Response.redirect(`https://${CANONICAL_HOST}/programs/the-combine`, 301);
    }
    if (url.pathname.startsWith("/updates/")) {
      return Response.redirect(`https://${CANONICAL_HOST}/blog`, 301);
    }
    if (url.pathname === "/admin-console" || url.pathname.startsWith("/admin-console/")) {
      return Response.redirect(`https://${GUILD_HOST}/admin`, 302);
    }
    if (url.pathname.startsWith("/app/wingman")) {
      if (!wingmanEnabled) {
        return Response.redirect(`https://${CANONICAL_HOST}/wingman`, 302);
      }
      const suffix = url.pathname.slice("/app/wingman".length) || "/";
      const target = `https://${WINGMAN_HOST}${suffix}${url.search}`;
      return Response.redirect(target, 301);
    }
    if (url.pathname === "/app" || url.pathname.startsWith("/app/")) {
      const suffix = url.pathname.slice("/app".length) || "/";
      const target = `https://${GUILD_HOST}${suffix}${url.search}`;
      return Response.redirect(target, 301);
    }
    // /wingman marketing page is served by Pages (wingman.html).
    // /app/wingman/* redirects to the subdomain (handled above).
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      const target = `https://${API_HOST}${url.pathname}${url.search}`;
      return Response.redirect(target, 301);
    }

    // 1.7) Outbound click redirect: /go/:slug?url=<target>&src=<source_page>
    if (url.pathname.startsWith('/go/')) {
      const slug = decodeURIComponent(url.pathname.slice(4).replace(/\/$/, ''));
      const targetRaw = url.searchParams.get('url');
      const sourcePage = url.searchParams.get('src') || 'unknown';

      if (!targetRaw || !slug) {
        return Response.redirect(`https://${CANONICAL_HOST}/builders`, 302);
      }

      // Ensure target has protocol
      let targetUrl = targetRaw.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = `https://${targetUrl}`;
      }

      // Append UTM parameters
      try {
        const target = new URL(targetUrl);
        if (!target.searchParams.has('utm_source')) {
          target.searchParams.set('utm_source', 'mergecombinator');
          target.searchParams.set('utm_medium', sourcePage);
          target.searchParams.set('utm_campaign', 'builders_directory');
        }
        targetUrl = target.toString();
      } catch {
        return Response.redirect(`https://${CANONICAL_HOST}/builders`, 302);
      }

      // Fire-and-forget: Analytics Engine write
      if (env.OUTBOUND_CLICKS) {
        try {
          env.OUTBOUND_CLICKS.writeDataPoint({
            blobs: [
              slug,
              sourcePage,
              targetUrl,
              request.headers.get('referer') || '',
              (request.headers.get('user-agent') || '').slice(0, 256),
            ],
            doubles: [Date.now()],
          });
        } catch (e) {
          console.error('[mc-router] analytics engine write failed', e);
        }
      }

      // Fire-and-forget: Postgres aggregate via API worker
      ctx.waitUntil(
        fetch(`https://${API_HOST}/analytics/outbound/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_slug: slug, source_page: sourcePage }),
        }).catch((e) => console.error('[mc-router] outbound analytics post failed', e))
      );

      return Response.redirect(targetUrl, 302);
    }

    const origins = getOrigins(env);
    const routes = getRoutes(origins);

    // 2) Auth routes
    if (isAuthRoute(url.pathname)) {
      const authResponse = await handleAuthRoute(request, env);
      if (authResponse) return authResponse;
    }

    // 3) Console gating: /control now redirects to Guild /admin (no more Cloud Run proxy)
    if (isConsolePath(url.pathname)) {
      const suffix = url.pathname.slice("/control".length) || "";
      const target = `https://${GUILD_HOST}/admin${suffix}${url.search}`;
      return Response.redirect(target, 302);
    }

    // 4) Route matching
    const route = routes.find(
      (entry) => url.pathname === entry.prefix || url.pathname.startsWith(`${entry.prefix}/`)
    );

    // 5) No route matched - fall through to MC Pages
    if (!route) {
      // Default to MC Pages
      const mcPagesUrl = new URL(url.pathname, origins.mcPages);
      mcPagesUrl.search = url.search;
      const clonedRequest = request.clone();
      const upstreamHeaders = buildUpstreamHeaders(request);
      let response = await fetch(
        new Request(mcPagesUrl, {
          method: request.method,
          headers: upstreamHeaders,
          body: clonedRequest.body,
        })
      );

      if (isConsolePath(url.pathname)) {
        response = withLastConsoleCookie(response, consoleValueFromPath(url.pathname), env, request);
      }

      // Dashboard redirect for authenticated users → authenticated console
      if (url.pathname === "/dashboard" || url.pathname === "/dashboard/") {
        const session = await getSession(request, env);
        if (session) {
          return Response.redirect(`https://${GUILD_HOST}/`, 302);
        }
      }

      // Inject Turnstile key into HTML responses
      return transformMcPagesHtml(response, env, url);
    }

    // 6) Resolve target for proxy routes
    const targetUrl = resolveTarget(url, route);

    // 6.5) Redirect-only routes (external services that can't be proxied)
    if (route.redirectOnly) {
      return Response.redirect(targetUrl.toString(), 302);
    }

    // 7) Standard proxy
    const clonedRequest = request.clone();
    const upstreamHeaders = buildUpstreamHeaders(request);
    let response = await fetch(
      new Request(targetUrl, {
        method: request.method,
        headers: upstreamHeaders,
        body: clonedRequest.body,
      })
    );

    if (isConsolePath(url.pathname)) {
      response = withLastConsoleCookie(response, consoleValueFromPath(url.pathname), env, request);
    }

    return response;
  },
};
