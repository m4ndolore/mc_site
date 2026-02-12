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

const SIGMABLOX_HOSTNAMES = new Set(["www.sigmablox.com", "sigmablox.com"]);

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

const CONSOLE_PATHS = new Set(["/app", "/control"]);
const DEFAULT_CONSOLE_PATH = "/app";
const DEFAULT_ADMIN_GROUPS = ["via-admins", "sigmablox-admins"];

const CANONICAL_HOST = "mergecombinator.com";
const ALIAS_HOSTS = new Set(["www.mergecombinator.com", "build.mergecombinator.com"]);

// ────────────────────────────────────────────────────────────────────────────
// HTML Injection Templates
// ────────────────────────────────────────────────────────────────────────────

const BANNER_HTML = `
  <div data-mc-banner="true" style="position: sticky; top: 0; z-index: 2147483647; font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif; background: #0b1116; color: #e9f2ff; border-bottom: 1px solid rgba(233, 242, 255, 0.12); padding: 10px 16px; text-align: center; letter-spacing: 0.02em;">
    <span style="opacity: 0.9;">Brought to you by Merge Combinator. Build what warfighters need.</span>
    <a href="/builders" style="margin-left: 12px; color: #7fd1ff; text-decoration: none; font-weight: 600;">Explore our Defense Builders -&gt;</a>
  </div>
`;

const BANNER_FOOTER_HTML = `
  <div style="font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif; background: #0b1116; color: #e9f2ff; border-top: 1px solid rgba(233, 242, 255, 0.12); padding: 12px 16px; text-align: center; letter-spacing: 0.02em;">
    <span style="opacity: 0.9;">Brought to you by Merge Combinator. Build what warfighters need.</span>
    <a href="/builders" style="margin-left: 12px; color: #7fd1ff; text-decoration: none; font-weight: 600;">Explore our Defense Builders -&gt;</a>
  </div>
`;

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

const SHIM_HTML = `
  <script>
    (function () {
      if (!location.pathname.startsWith("/combine")) return;
      var prefix = "/combine";
      var localApiOrigin = null;
      if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        localApiOrigin = "http://localhost:2368";
      }
      function rewriteUrl(input) {
        if (!input) return input;
        try {
          if (typeof input === "string") {
            if (localApiOrigin && input.startsWith("https://api.sigmablox.com")) {
              return localApiOrigin + input.slice("https://api.sigmablox.com".length);
            }
            if (input.startsWith("/") && !input.startsWith(prefix)) {
              return prefix + input;
            }
            if (input.startsWith(location.origin)) {
              var url = new URL(input);
              if (!url.pathname.startsWith(prefix)) {
                url.pathname = prefix + url.pathname;
              }
              return url.toString();
            }
            return input;
          }
          return input;
        } catch (e) {
          return input;
        }
      }

      var originalFetch = window.fetch;
      if (originalFetch) {
        window.fetch = function (input, init) {
          if (typeof input === "string") {
            return originalFetch.call(this, rewriteUrl(input), init);
          }
          if (input instanceof Request) {
            var rewritten = rewriteUrl(input.url);
            if (rewritten !== input.url) {
              var cloned = input.clone();
              return originalFetch.call(this, new Request(rewritten, cloned), init);
            }
          }
          return originalFetch.call(this, input, init);
        };
      }

      var originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (method, url) {
        var rewritten = rewriteUrl(url);
        return originalOpen.apply(this, [method, rewritten].concat([].slice.call(arguments, 2)));
      };

      if (navigator.sendBeacon) {
        var originalBeacon = navigator.sendBeacon.bind(navigator);
        navigator.sendBeacon = function (url, data) {
          return originalBeacon(rewriteUrl(url), data);
        };
      }
    })();
  <\/script>
`;

// ────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────────────────────────────────────────

const REQUIRED_ORIGIN_VARS = [
  "MC_PAGES_ORIGIN",
  "SIGMABLOX_ORIGIN",
  "SIGMABLOX_API_ORIGIN",
  "APP_ORIGIN",
  "WINGMAN_ORIGIN",
  "CONTROL_ORIGIN",
];

function getOrigins(env) {
  const missing = REQUIRED_ORIGIN_VARS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required origin vars: ${missing.join(", ")}`);
  }
  return {
    mcPages: env.MC_PAGES_ORIGIN,
    sigmablox: env.SIGMABLOX_ORIGIN,
    sigmabloxApi: env.SIGMABLOX_API_ORIGIN,
    app: env.APP_ORIGIN,
    wingman: env.WINGMAN_ORIGIN,
    control: env.CONTROL_ORIGIN,
  };
}

function parseCorsOrigins(env) {
  const raw = env.API_CORS_ORIGINS || "";
  if (!raw) {
    console.warn("[mc-router] API_CORS_ORIGINS not configured - CORS disabled for /api/* routes");
    return new Set();
  }
  const origins = new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
  if (origins.size === 0) {
    console.warn("[mc-router] API_CORS_ORIGINS is empty - CORS disabled for /api/* routes");
  }
  return origins;
}

function getRoutes(origins) {
  return [
    { prefix: "/app/wingman", origin: origins.wingman, stripPrefix: true, preserveRoot: true },
    { prefix: "/app", origin: origins.app, stripPrefix: true },
    { prefix: "/control", origin: origins.control, stripPrefix: true },
    { prefix: "/api", origin: origins.sigmabloxApi, stripPrefix: false, isApi: true },
    { prefix: "/combine", origin: origins.sigmablox, stripPrefix: true, preserveRoot: true },
    { prefix: "/opportunities", origin: "https://sbir.mergecombinator.com", stripPrefix: true },
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
  if (pathname === "/wingman" || pathname.startsWith("/wingman/")) {
    return "wingman";
  }
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

  return headers;
}

// ────────────────────────────────────────────────────────────────────────────
// CORS Handling
// ────────────────────────────────────────────────────────────────────────────

function getCorsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowedOrigins = parseCorsOrigins(env);
  if (origin && allowedOrigins.has(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    };
  }
  return null;
}

async function handleApiRoute(request, targetUrl, env) {
  if (request.method === "OPTIONS") {
    const corsHeaders = getCorsHeaders(request, env);
    if (corsHeaders) {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    return new Response(null, { status: 204 });
  }

  const upstreamHeaders = buildUpstreamHeaders(request, { stripCookies: true });
  const session = await getSession(request, env);
  if (session && session.accessToken) {
    upstreamHeaders.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const clonedRequest = request.clone();
  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers: upstreamHeaders,
    body: clonedRequest.body,
  });

  const response = await fetch(proxyRequest);
  const corsHeaders = getCorsHeaders(request, env);

  if (corsHeaders) {
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      newHeaders.set(key, value);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return response;
}

// ────────────────────────────────────────────────────────────────────────────
// Sigmablox URL Rewriting
// ────────────────────────────────────────────────────────────────────────────

function shouldRewriteBanner(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("text/html");
}

function isRedirectResponse(response) {
  return [301, 302, 303, 307, 308].includes(response.status);
}

function rewriteSigmabloxLocation(value) {
  if (!value) return null;

  if (value.startsWith("//")) {
    const url = new URL(`https:${value}`);
    if (SIGMABLOX_HOSTNAMES.has(url.hostname)) {
      return `/combine${url.pathname}${url.search}${url.hash}`;
    }
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    const url = new URL(value);
    if (SIGMABLOX_HOSTNAMES.has(url.hostname)) {
      return `/combine${url.pathname}${url.search}${url.hash}`;
    }
    return null;
  }

  if (value.startsWith("/")) {
    if (value.startsWith("/combine")) {
      return value;
    }
    return `/combine${value}`;
  }

  return null;
}

function rewriteSigmabloxUrl(value) {
  if (!value) return null;
  const trimmed = value.trim();

  if (
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("#")
  ) {
    return null;
  }

  if (trimmed.startsWith("//")) {
    const url = new URL(`https:${trimmed}`);
    if (SIGMABLOX_HOSTNAMES.has(url.hostname)) {
      return `/combine${url.pathname}${url.search}${url.hash}`;
    }
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const url = new URL(trimmed);
    if (SIGMABLOX_HOSTNAMES.has(url.hostname)) {
      return `/combine${url.pathname}${url.search}${url.hash}`;
    }
    return null;
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("/combine")) {
    return `/combine${trimmed}`;
  }

  if (trimmed === "/combine" || trimmed === "/combine/") {
    return "/combine/combine/";
  }

  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Main Fetch Handler
// ────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = request.headers.get("host") || url.hostname;

    // 1) Canonical host redirect
    if (ALIAS_HOSTS.has(host)) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    const origins = getOrigins(env);
    const routes = getRoutes(origins);

    // 2) Auth routes
    if (isAuthRoute(url.pathname)) {
      const authResponse = await handleAuthRoute(request, env);
      if (authResponse) return authResponse;
    }

    // 3) Console gating
    const isWingmanMarketing = url.pathname === "/wingman" || url.pathname.startsWith("/wingman/");

    if (!isWingmanMarketing && isConsolePath(url.pathname)) {
      const session = await getSession(request, env);
      if (!session) return createLoginRedirect(request);

      const isControl = url.pathname === "/control" || url.pathname.startsWith("/control/");
      if (isControl && !isAdminSession(session, env)) {
        const redirect = Response.redirect(new URL(DEFAULT_CONSOLE_PATH, url.origin).toString(), 302);
        return withLastConsoleCookie(redirect, "app", env, request);
      }
    }

    // 4) Route matching
    const route = routes.find(
      (entry) => url.pathname === entry.prefix || url.pathname.startsWith(`${entry.prefix}/`)
    );

    // 5) No route matched - fall through to Pages or Sigmablox
    if (!route) {
      const referer = request.headers.get("referer") || "";
      const refererUrl = referer ? new URL(referer) : null;
      const isFromCombine =
        refererUrl &&
        (refererUrl.pathname.startsWith("/combine") || SIGMABLOX_HOSTNAMES.has(refererUrl.hostname));

      if (isFromCombine) {
        const sigmabloxUrl = new URL(url.pathname, origins.sigmablox);
        sigmabloxUrl.search = url.search;
        const clonedRequest = request.clone();
        const upstreamHeaders = buildUpstreamHeaders(request);
        return fetch(
          new Request(sigmabloxUrl, {
            method: request.method,
            headers: upstreamHeaders,
            body: clonedRequest.body,
          })
        );
      }

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

      // Dashboard redirect for authenticated users
      if (url.pathname === "/dashboard" || url.pathname === "/dashboard/") {
        const session = await getSession(request, env);
        if (session) {
          const redirect = Response.redirect(new URL(DEFAULT_CONSOLE_PATH, url.origin).toString(), 302);
          return withLastConsoleCookie(redirect, "app", env, request);
        }
      }

      // Inject Turnstile key into HTML responses
      return transformMcPagesHtml(response, env, url);
    }

    // 6) API route handling
    const targetUrl = resolveTarget(url, route);
    if (route.isApi) {
      return handleApiRoute(request, targetUrl, env);
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

    // 8) Sigmablox redirect rewriting
    if (route.origin === origins.sigmablox && isRedirectResponse(response)) {
      const location = response.headers.get("location");
      let replacement = rewriteSigmabloxLocation(location);

      const isCombineDeep = url.pathname === "/combine/combine" || url.pathname === "/combine/combine/";
      if (isCombineDeep && (replacement === "/combine" || replacement === "/combine/")) {
        replacement = "/combine/combine/";
      }

      if (replacement) {
        const isCombineRoot =
          route.prefix === "/combine" && (url.pathname === "/combine" || url.pathname === "/combine/");
        if (isCombineRoot && replacement.startsWith("/combine")) {
          const followUrl = new URL(replacement, url.origin);
          const followTarget = resolveTarget(followUrl, route);
          response = await fetch(new Request(followTarget, request));
        } else {
          const headers = new Headers(response.headers);
          headers.set("location", replacement);
          return new Response(null, { status: 302, headers });
        }
      } else {
        return response;
      }
    }

    // 9) Sigmablox HTML rewriting (banner injection + URL rewriting)
    if (route.origin !== origins.sigmablox || !shouldRewriteBanner(response)) {
      return response;
    }

    let headerAdjusted = false;
    let shimInjected = false;

    return new HTMLRewriter()
      .on("head", {
        element(element) {
          if (shimInjected) return;
          element.append(SHIM_HTML, { html: true });
          shimInjected = true;
        },
      })
      .on("header", {
        element(element) {
          if (headerAdjusted) return;
          const existing = element.getAttribute("style") || "";
          const next = `${existing}${existing ? " " : ""}margin-top: 44px; top: 44px;`;
          element.setAttribute("style", next);
          headerAdjusted = true;
        },
      })
      .on("a", {
        element(element) {
          const href = element.getAttribute("href");
          const replacement = rewriteSigmabloxUrl(href);
          if (replacement) {
            element.setAttribute("href", replacement);
          }
        },
      })
      .on("link", {
        element(element) {
          const href = element.getAttribute("href");
          const replacement = rewriteSigmabloxUrl(href);
          if (replacement) {
            element.setAttribute("href", replacement);
          }
        },
      })
      .on("script", {
        element(element) {
          const src = element.getAttribute("src");
          const replacement = rewriteSigmabloxUrl(src);
          if (replacement) {
            element.setAttribute("src", replacement);
          }
        },
      })
      .on("img", {
        element(element) {
          const src = element.getAttribute("src");
          const replacement = rewriteSigmabloxUrl(src);
          if (replacement) {
            element.setAttribute("src", replacement);
          }
        },
      })
      .on("form", {
        element(element) {
          const action = element.getAttribute("action");
          const replacement = rewriteSigmabloxUrl(action);
          if (replacement) {
            element.setAttribute("action", replacement);
          }
        },
      })
      .on("body", {
        element(element) {
          if (shimInjected) return;
          element.prepend(SHIM_HTML, { html: true });
          shimInjected = true;
        },
      })
      .on("body", {
        element(element) {
          element.prepend(BANNER_HTML, { html: true });
        },
      })
      .on("body", {
        element(element) {
          element.append(BANNER_FOOTER_HTML, { html: true });
        },
      })
      .transform(response);
  },
};
