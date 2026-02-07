import {
  handleAuthRoute,
  isAuthRoute,
  getSession,
  createLastConsoleCookie,
} from "./auth.js";

const DEFAULT_ORIGINS = {
  mcPages: "https://mc-site-dr4.pages.dev",
  sigmablox: "https://www.sigmablox.com",
  sigmabloxApi: "https://api.sigmablox.com",
  app: "https://app.mergecombinator.com",
  wingman: "https://wingman.mergecombinator.com",
  control: "https://control.mergecombinator.com",
};

const SIGMABLOX_HOSTNAMES = new Set(["www.sigmablox.com", "sigmablox.com"]);

// Allowed origins for CORS on /api/* routes
const API_CORS_ORIGINS = new Set([
  "https://console.mergecombinator.com",
  "https://app.mergecombinator.com",
  "https://wingman.mergecombinator.com",
  "https://control.mergecombinator.com",
  "https://mergecombinator.com",
  "https://www.mergecombinator.com",
  "http://localhost:3000",
  "http://localhost:3002",
  "http://localhost:5173",
]);

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

const CONSOLE_PATHS = new Set(["/app", "/wingman", "/control"]);
const DEFAULT_CONSOLE_PATH = "/app";
const DEFAULT_ADMIN_GROUPS = ["via-admins", "sigmablox-admins"];


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
  </script>
`;

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
  const relativeReturnTo = `${url.pathname}${url.search}${url.hash}`;
  loginUrl.searchParams.set("returnTo", relativeReturnTo);
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

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin");
  if (origin && API_CORS_ORIGINS.has(origin)) {
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
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    const corsHeaders = getCorsHeaders(request);
    if (corsHeaders) {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }
    return new Response(null, { status: 204 });
  }

  // Build headers for upstream request
  const upstreamHeaders = buildUpstreamHeaders(request, { stripCookies: true });
  const cloned = request.clone();

  // Check for authenticated session and pass token to SigmaBlox
  const session = await getSession(request, env);
  if (session && session.accessToken) {
    upstreamHeaders.set("Authorization", `Bearer ${session.accessToken}`);
  }

  // Proxy the request to SigmaBlox API
  const proxyRequest = new Request(targetUrl, {
    method: cloned.method,
    headers: upstreamHeaders,
    body: cloned.body,
  });

  const response = await fetch(proxyRequest);

  // Add CORS headers to response
  const corsHeaders = getCorsHeaders(request);
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

function getOrigins(env) {
  return {
    mcPages: env.MC_PAGES_ORIGIN || DEFAULT_ORIGINS.mcPages,
    sigmablox: env.SIGMABLOX_ORIGIN || DEFAULT_ORIGINS.sigmablox,
    sigmabloxApi: env.SIGMABLOX_API_ORIGIN || DEFAULT_ORIGINS.sigmabloxApi,
    app: env.APP_ORIGIN || DEFAULT_ORIGINS.app,
    wingman: env.WINGMAN_ORIGIN || DEFAULT_ORIGINS.wingman,
    control: env.CONTROL_ORIGIN || DEFAULT_ORIGINS.control,
  };
}

function getRoutes(origins) {
  return [
    { prefix: "/app/wingman", origin: origins.wingman, stripPrefix: true, preserveRoot: true },
    { prefix: "/app", origin: origins.app, stripPrefix: true },
    { prefix: "/control", origin: origins.control, stripPrefix: true },
    { prefix: "/api", origin: origins.sigmabloxApi, stripPrefix: false, isApi: true },
    { prefix: "/combine", origin: origins.sigmablox, stripPrefix: true, preserveRoot: true },
    // /builders is served from MC Pages (default origin), no route entry needed
    { prefix: "/opportunities", origin: "https://sbir.mergecombinator.com", stripPrefix: true },
  ];
}

function shouldRewriteBanner(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("text/html");
}

function shouldRewriteWingman(pathname, response) {
  if (pathname !== "/wingman" && pathname !== "/wingman/") return false;
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("text/html");
}

function buildWingmanConfigScript(enabled) {
  return `<script>window.MC_CONFIG={wingmanConsoleEnabled:${enabled}};</script>`;
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origins = getOrigins(env);
    const routes = getRoutes(origins);
    const wingmanConsoleEnabled = String(env.WINGMAN_CONSOLE_ENABLED || "false")
      .toLowerCase()
      .trim() === "true";

    // Handle auth routes first
    if (isAuthRoute(url.pathname)) {
      const authResponse = await handleAuthRoute(request, env);
      if (authResponse) {
        return authResponse;
      }
    }

    if (url.pathname === "/marketplace" || url.pathname.startsWith("/marketplace/")) {
      const redirectUrl = new URL("/guild", url.origin);
      redirectUrl.search = url.search;
      return Response.redirect(redirectUrl.toString(), 301);
    }

    if (url.pathname === "/combine" || url.pathname.startsWith("/combine/")) {
      const redirectUrl = new URL("/programs/the-combine", url.origin);
      redirectUrl.search = url.search;
      return Response.redirect(redirectUrl.toString(), 301);
    }

    if (url.pathname === "/dashboard" || url.pathname === "/dashboard/") {
      const session = await getSession(request, env);
      if (session) {
        const redirect = Response.redirect(new URL(DEFAULT_CONSOLE_PATH, url.origin).toString(), 302);
        return withLastConsoleCookie(redirect, "app", env, request);
      }
    }

    if (isConsolePath(url.pathname)) {
      const session = await getSession(request, env);
      if (!session) {
        return createLoginRedirect(request);
      }

      if (
        (url.pathname === "/control" || url.pathname.startsWith("/control/")) &&
        !isAdminSession(session, env)
      ) {
        const redirect = Response.redirect(new URL(DEFAULT_CONSOLE_PATH, url.origin).toString(), 302);
        return withLastConsoleCookie(redirect, "app", env, request);
      }
    }

    const route = routes.find((entry) =>
      url.pathname === entry.prefix || url.pathname.startsWith(`${entry.prefix}/`)
    );

    if (!route) {
      // Check if this is a SigmaBlox asset request (from /combine pages)
      const referer = request.headers.get("referer") || "";
      const refererUrl = referer ? new URL(referer) : null;
      const isFromCombine = refererUrl && (
        refererUrl.pathname.startsWith("/combine") ||
        SIGMABLOX_HOSTNAMES.has(refererUrl.hostname)
      );

      if (isFromCombine) {
        // Route to SigmaBlox for assets requested from /combine pages
        const sigmabloxUrl = new URL(url.pathname, origins.sigmablox);
        sigmabloxUrl.search = url.search;
        const cloned = request.clone();
        const upstreamHeaders = buildUpstreamHeaders(request);
        return fetch(new Request(sigmabloxUrl, {
          method: cloned.method,
          headers: upstreamHeaders,
          body: cloned.body,
        }));
      }

      // Proxy unmatched routes to MC Pages origin (homepage, assets, etc.)
      const mcPagesUrl = new URL(url.pathname, origins.mcPages);
      mcPagesUrl.search = url.search;
      const cloned = request.clone();
      const upstreamHeaders = buildUpstreamHeaders(request);
      let response = await fetch(new Request(mcPagesUrl, {
        method: cloned.method,
        headers: upstreamHeaders,
        body: cloned.body,
      }));
      if (shouldRewriteWingman(url.pathname, response)) {
        const configScript = buildWingmanConfigScript(wingmanConsoleEnabled);
        response = new HTMLRewriter()
          .on("head", {
            element(element) {
              element.append(configScript, { html: true });
            },
          })
          .transform(response);
      }
      if (isConsolePath(url.pathname)) {
        response = withLastConsoleCookie(response, consoleValueFromPath(url.pathname), env, request);
      }
      return response;
    }

    const targetUrl = resolveTarget(url, route);

    // Handle API routes with CORS and auth passthrough
    if (route.isApi) {
      return handleApiRoute(request, targetUrl, env);
    }

    const upstreamHeaders = buildUpstreamHeaders(request);
    const cloned = request.clone();
    let response = await fetch(new Request(targetUrl, {
      method: cloned.method,
      headers: upstreamHeaders,
      body: cloned.body,
    }));

    if (isConsolePath(url.pathname)) {
      response = withLastConsoleCookie(response, consoleValueFromPath(url.pathname), env, request);
    }

    if (route.origin === origins.sigmablox && isRedirectResponse(response)) {
      const location = response.headers.get("location");
      let replacement = rewriteSigmabloxLocation(location);
      const isCombineDeep =
        url.pathname === "/combine/combine" || url.pathname === "/combine/combine/";
      if (isCombineDeep && (replacement === "/combine" || replacement === "/combine/")) {
        replacement = "/combine/combine/";
      }
      if (replacement) {
        const isCombineRoot =
          route.prefix === "/combine" &&
          (url.pathname === "/combine" || url.pathname === "/combine/");
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
