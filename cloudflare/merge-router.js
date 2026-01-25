import { handleAuthRoute, isAuthRoute, getSession } from "./auth.js";

const MC_PAGES_ORIGIN = "https://mc-site-dr4.pages.dev";
const SIGMABLOX_ORIGIN = "https://www.sigmablox.com";
const SIGMABLOX_API_ORIGIN = "https://api.sigmablox.com";
const SIGMABLOX_HOSTNAMES = new Set(["www.sigmablox.com", "sigmablox.com"]);

// Allowed origins for CORS on /api/* routes
const API_CORS_ORIGINS = new Set([
  "https://console.mergecombinator.com",
  "https://mergecombinator.com",
  "https://www.mergecombinator.com",
  "http://localhost:3000",
  "http://localhost:3002",
  "http://localhost:5173",
]);

const ROUTES = [
  { prefix: "/api", origin: SIGMABLOX_API_ORIGIN, stripPrefix: false, isApi: true },
  { prefix: "/combine", origin: SIGMABLOX_ORIGIN, stripPrefix: true, preserveRoot: true },
  // /builders is served from MC Pages (default origin), no route entry needed
  { prefix: "/opportunities", origin: "https://sbir.mergecombinator.com", stripPrefix: true },
  { prefix: "/merch", origin: "https://merge-combinator-shop.fourthwall.com", stripPrefix: true },
];


const BANNER_HTML = `
  <div data-mc-banner="true" style="position: sticky; top: 0; z-index: 2147483647; font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif; background: #0b1116; color: #e9f2ff; border-bottom: 1px solid rgba(233, 242, 255, 0.12); padding: 10px 16px; text-align: center; letter-spacing: 0.02em;">
    <span style="opacity: 0.9;">Brought to you by Merge Combinator. Build what warfighters need.</span>
    <a href="/builders" style="margin-left: 12px; color: #7fd1ff; text-decoration: none; font-weight: 600;">Explore Defense Builders -&gt;</a>
  </div>
`;

const BANNER_FOOTER_HTML = `
  <div style="font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif; background: #0b1116; color: #e9f2ff; border-top: 1px solid rgba(233, 242, 255, 0.12); padding: 12px 16px; text-align: center; letter-spacing: 0.02em;">
    <span style="opacity: 0.9;">Brought to you by Merge Combinator. Build what warfighters need.</span>
    <a href="/builders" style="margin-left: 12px; color: #7fd1ff; text-decoration: none; font-weight: 600;">Explore Defense Builders -&gt;</a>
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

async function handleApiRoute(request, targetUrl) {
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

  // Proxy the request to SigmaBlox API
  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle auth routes first
    if (isAuthRoute(url.pathname)) {
      const authResponse = await handleAuthRoute(request, env);
      if (authResponse) {
        return authResponse;
      }
    }

    if (url.pathname === "/dashboard" || url.pathname === "/dashboard/") {
      const redirectUrl = new URL("/combine/dashboard", url.origin);
      redirectUrl.search = url.search;
      return Response.redirect(redirectUrl.toString(), 302);
    }

    const route = ROUTES.find((entry) =>
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
        const sigmabloxUrl = new URL(url.pathname, SIGMABLOX_ORIGIN);
        sigmabloxUrl.search = url.search;
        return fetch(new Request(sigmabloxUrl, request));
      }

      // Proxy unmatched routes to MC Pages origin (homepage, assets, etc.)
      const mcPagesUrl = new URL(url.pathname, MC_PAGES_ORIGIN);
      mcPagesUrl.search = url.search;
      return fetch(new Request(mcPagesUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      }));
    }

    const targetUrl = resolveTarget(url, route);

    // Handle API routes with CORS
    if (route.isApi) {
      return handleApiRoute(request, targetUrl);
    }

    let response = await fetch(new Request(targetUrl, request));

    if (route.origin === SIGMABLOX_ORIGIN && isRedirectResponse(response)) {
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

    if (route.origin !== SIGMABLOX_ORIGIN || !shouldRewriteBanner(response)) {
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
