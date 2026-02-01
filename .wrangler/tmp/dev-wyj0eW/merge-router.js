var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-bQxboi/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// cloudflare/auth.js
function getOAuthUrls(env) {
  const issuer = env.OIDC_ISSUER_URL;
  if (!issuer) {
    throw new Error("Missing required env var: OIDC_ISSUER_URL");
  }
  return {
    authorize: `${issuer}/application/o/authorize/`,
    token: `${issuer}/application/o/token/`,
    userinfo: `${issuer}/application/o/userinfo/`
  };
}
__name(getOAuthUrls, "getOAuthUrls");
var SESSION_COOKIE_NAME = "mc_session";
var SESSION_MAX_AGE = 60 * 60 * 24 * 7;
function generateRandomString(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(generateRandomString, "generateRandomString");
async function generatePKCE() {
  const verifier = generateRandomString(32);
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return { verifier, challenge };
}
__name(generatePKCE, "generatePKCE");
async function encryptSession(data, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret.slice(0, 32).padEnd(32, "0"));
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}
__name(encryptSession, "encryptSession");
async function decryptSession(encrypted, secret) {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret.slice(0, 32).padEnd(32, "0"));
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  } catch (e) {
    return null;
  }
}
__name(decryptSession, "decryptSession");
function parseCookies(request) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) {
      cookies[name] = rest.join("=");
    }
  });
  return cookies;
}
__name(parseCookies, "parseCookies");
function createCookieHeader(name, value, maxAge, secure = true) {
  const parts = [
    `${name}=${value}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAge}`
  ];
  if (maxAge <= 0) {
    parts.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  }
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}
__name(createCookieHeader, "createCookieHeader");
async function handleLogin(request, env) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("return_to") || "/";
  const { verifier, challenge } = await generatePKCE();
  const nonce = generateRandomString(16);
  const statePayload = {
    nonce,
    verifier,
    returnTo,
    iat: Math.floor(Date.now() / 1e3),
    exp: Math.floor(Date.now() / 1e3) + 600
    // 10 minute expiry
  };
  const encryptedState = await encryptSession(statePayload, env.SESSION_SECRET);
  const viaUrls = getOAuthUrls(env);
  const redirectUri = `${url.origin}/auth/callback`;
  const authUrl = new URL(viaUrls.authorize);
  authUrl.searchParams.set("client_id", env.MC_OAUTH_CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "openid email profile groups");
  authUrl.searchParams.set("state", encryptedState);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  return Response.redirect(authUrl.toString(), 302);
}
__name(handleLogin, "handleLogin");
async function handleCallback(request, env) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const encryptedState = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    if (error) {
      return new Response(`Authentication error: ${error}`, { status: 400 });
    }
    if (!code || !encryptedState) {
      return new Response("Missing code or state", { status: 400 });
    }
    if (!env.SESSION_SECRET) {
      console.error("SESSION_SECRET is not set");
      return new Response("Server configuration error: missing SESSION_SECRET", { status: 500 });
    }
    const stateData = await decryptSession(encryptedState, env.SESSION_SECRET);
    if (!stateData) {
      console.error("State decryption failed");
      return new Response("Invalid state - try logging in again", { status: 400 });
    }
    const now = Math.floor(Date.now() / 1e3);
    if (stateData.exp && stateData.exp < now) {
      console.error("State expired", { exp: stateData.exp, now });
      return new Response("Login session expired - try logging in again", { status: 400 });
    }
    const viaUrls = getOAuthUrls(env);
    const redirectUri = `${url.origin}/auth/callback`;
    const tokenResponse = await fetch(viaUrls.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: env.MC_OAUTH_CLIENT_ID,
        client_secret: env.MC_OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        code_verifier: stateData.verifier
      })
    });
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", tokenResponse.status, errorText);
      return new Response(`Failed to exchange token: ${tokenResponse.status} - ${errorText}`, { status: 500 });
    }
    const tokens = await tokenResponse.json();
    const userResponse = await fetch(viaUrls.userinfo, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });
    if (!userResponse.ok) {
      return new Response("Failed to fetch user info", { status: 500 });
    }
    const user = await userResponse.json();
    const session = {
      user: {
        sub: user.sub,
        email: user.email,
        name: user.name || user.preferred_username,
        groups: user.groups || []
      },
      accessToken: tokens.access_token,
      expiresAt: Date.now() + tokens.expires_in * 1e3
    };
    const sessionCookie = await encryptSession(session, env.SESSION_SECRET);
    const returnTo = stateData.returnTo || "/";
    const headers = new Headers();
    headers.set("Location", returnTo);
    headers.append(
      "Set-Cookie",
      createCookieHeader(SESSION_COOKIE_NAME, sessionCookie, SESSION_MAX_AGE, url.protocol === "https:")
    );
    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error("Callback error:", err.message, err.stack);
    return new Response(`Authentication callback failed: ${err.message}`, { status: 500 });
  }
}
__name(handleCallback, "handleCallback");
async function handleLogout(request, env) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("return_to") || url.origin;
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    createCookieHeader(SESSION_COOKIE_NAME, "", 0, url.protocol === "https:")
  );
  const logoutUrl = env.OAUTH_LOGOUT_URL;
  if (logoutUrl) {
    const endSessionUrl = new URL(logoutUrl);
    endSessionUrl.searchParams.set("post_logout_redirect_uri", returnTo);
    headers.set("Location", endSessionUrl.toString());
  } else {
    headers.set("Location", returnTo);
  }
  return new Response(null, { status: 302, headers });
}
__name(handleLogout, "handleLogout");
async function handleMe(request, env) {
  const cookies = parseCookies(request);
  const sessionCookie = cookies[SESSION_COOKIE_NAME];
  if (!sessionCookie) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  const session = await decryptSession(sessionCookie, env.SESSION_SECRET);
  if (!session || session.expiresAt < Date.now()) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(
    JSON.stringify({
      authenticated: true,
      user: session.user
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}
__name(handleMe, "handleMe");
async function getSession(request, env) {
  const cookies = parseCookies(request);
  const sessionCookie = cookies[SESSION_COOKIE_NAME];
  if (!sessionCookie) {
    return null;
  }
  const session = await decryptSession(sessionCookie, env.SESSION_SECRET);
  if (!session || session.expiresAt < Date.now()) {
    return null;
  }
  return session;
}
__name(getSession, "getSession");
async function handleAuthRoute(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === "/auth/login") {
    return handleLogin(request, env);
  }
  if (path === "/auth/callback") {
    return handleCallback(request, env);
  }
  if (path === "/auth/logout") {
    return handleLogout(request, env);
  }
  if (path === "/auth/me") {
    return handleMe(request, env);
  }
  return null;
}
__name(handleAuthRoute, "handleAuthRoute");
function isAuthRoute(pathname) {
  return pathname.startsWith("/auth/");
}
__name(isAuthRoute, "isAuthRoute");

// cloudflare/merge-router.js
var MC_PAGES_ORIGIN = "https://mc-site-dr4.pages.dev";
var SIGMABLOX_ORIGIN = "https://www.sigmablox.com";
var SIGMABLOX_API_ORIGIN = "https://api.sigmablox.com";
var SIGMABLOX_HOSTNAMES = /* @__PURE__ */ new Set(["www.sigmablox.com", "sigmablox.com"]);
var API_CORS_ORIGINS = /* @__PURE__ */ new Set([
  "https://console.mergecombinator.com",
  "https://mergecombinator.com",
  "https://www.mergecombinator.com",
  "http://localhost:3000",
  "http://localhost:3002",
  "http://localhost:5173"
]);
var ROUTES = [
  { prefix: "/api", origin: SIGMABLOX_API_ORIGIN, stripPrefix: false, isApi: true },
  { prefix: "/combine", origin: SIGMABLOX_ORIGIN, stripPrefix: true, preserveRoot: true },
  // /builders is served from MC Pages (default origin), no route entry needed
  { prefix: "/opportunities", origin: "https://sbir.mergecombinator.com", stripPrefix: true },
  { prefix: "/merch", origin: "https://merge-combinator-shop.fourthwall.com", stripPrefix: true }
];
var BANNER_HTML = `
  <div data-mc-banner="true" style="position: sticky; top: 0; z-index: 2147483647; font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif; background: #0b1116; color: #e9f2ff; border-bottom: 1px solid rgba(233, 242, 255, 0.12); padding: 10px 16px; text-align: center; letter-spacing: 0.02em;">
    <span style="opacity: 0.9;">Brought to you by Merge Combinator. Build what warfighters need.</span>
    <a href="/builders" style="margin-left: 12px; color: #7fd1ff; text-decoration: none; font-weight: 600;">Explore Defense Builders -&gt;</a>
  </div>
`;
var BANNER_FOOTER_HTML = `
  <div style="font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif; background: #0b1116; color: #e9f2ff; border-top: 1px solid rgba(233, 242, 255, 0.12); padding: 12px 16px; text-align: center; letter-spacing: 0.02em;">
    <span style="opacity: 0.9;">Brought to you by Merge Combinator. Build what warfighters need.</span>
    <a href="/builders" style="margin-left: 12px; color: #7fd1ff; text-decoration: none; font-weight: 600;">Explore Defense Builders -&gt;</a>
  </div>
`;
var SHIM_HTML = `
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
__name(resolveTarget, "resolveTarget");
function getCorsHeaders(request) {
  const origin = request.headers.get("Origin");
  if (origin && API_CORS_ORIGINS.has(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true"
    };
  }
  return null;
}
__name(getCorsHeaders, "getCorsHeaders");
async function handleApiRoute(request, targetUrl, env) {
  if (request.method === "OPTIONS") {
    const corsHeaders2 = getCorsHeaders(request);
    if (corsHeaders2) {
      return new Response(null, {
        status: 204,
        headers: corsHeaders2
      });
    }
    return new Response(null, { status: 204 });
  }
  const upstreamHeaders = new Headers(request.headers);
  const session = await getSession(request, env);
  if (session && session.accessToken) {
    upstreamHeaders.set("Authorization", `Bearer ${session.accessToken}`);
  }
  upstreamHeaders.delete("Cookie");
  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers: upstreamHeaders,
    body: request.body
  });
  const response = await fetch(proxyRequest);
  const corsHeaders = getCorsHeaders(request);
  if (corsHeaders) {
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      newHeaders.set(key, value);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
  return response;
}
__name(handleApiRoute, "handleApiRoute");
function shouldRewriteBanner(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("text/html");
}
__name(shouldRewriteBanner, "shouldRewriteBanner");
function isRedirectResponse(response) {
  return [301, 302, 303, 307, 308].includes(response.status);
}
__name(isRedirectResponse, "isRedirectResponse");
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
__name(rewriteSigmabloxLocation, "rewriteSigmabloxLocation");
function rewriteSigmabloxUrl(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("mailto:") || trimmed.startsWith("tel:") || trimmed.startsWith("javascript:") || trimmed.startsWith("#")) {
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
__name(rewriteSigmabloxUrl, "rewriteSigmabloxUrl");
var merge_router_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
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
    const route = ROUTES.find(
      (entry) => url.pathname === entry.prefix || url.pathname.startsWith(`${entry.prefix}/`)
    );
    if (!route) {
      const referer = request.headers.get("referer") || "";
      const refererUrl = referer ? new URL(referer) : null;
      const isFromCombine = refererUrl && (refererUrl.pathname.startsWith("/combine") || SIGMABLOX_HOSTNAMES.has(refererUrl.hostname));
      if (isFromCombine) {
        const sigmabloxUrl = new URL(url.pathname, SIGMABLOX_ORIGIN);
        sigmabloxUrl.search = url.search;
        return fetch(new Request(sigmabloxUrl, request));
      }
      const mcPagesUrl = new URL(url.pathname, MC_PAGES_ORIGIN);
      mcPagesUrl.search = url.search;
      return fetch(new Request(mcPagesUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      }));
    }
    const targetUrl = resolveTarget(url, route);
    if (route.isApi) {
      return handleApiRoute(request, targetUrl, env);
    }
    let response = await fetch(new Request(targetUrl, request));
    if (route.origin === SIGMABLOX_ORIGIN && isRedirectResponse(response)) {
      const location = response.headers.get("location");
      let replacement = rewriteSigmabloxLocation(location);
      const isCombineDeep = url.pathname === "/combine/combine" || url.pathname === "/combine/combine/";
      if (isCombineDeep && (replacement === "/combine" || replacement === "/combine/")) {
        replacement = "/combine/combine/";
      }
      if (replacement) {
        const isCombineRoot = route.prefix === "/combine" && (url.pathname === "/combine" || url.pathname === "/combine/");
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
    return new HTMLRewriter().on("head", {
      element(element) {
        if (shimInjected) return;
        element.append(SHIM_HTML, { html: true });
        shimInjected = true;
      }
    }).on("header", {
      element(element) {
        if (headerAdjusted) return;
        const existing = element.getAttribute("style") || "";
        const next = `${existing}${existing ? " " : ""}margin-top: 44px; top: 44px;`;
        element.setAttribute("style", next);
        headerAdjusted = true;
      }
    }).on("a", {
      element(element) {
        const href = element.getAttribute("href");
        const replacement = rewriteSigmabloxUrl(href);
        if (replacement) {
          element.setAttribute("href", replacement);
        }
      }
    }).on("link", {
      element(element) {
        const href = element.getAttribute("href");
        const replacement = rewriteSigmabloxUrl(href);
        if (replacement) {
          element.setAttribute("href", replacement);
        }
      }
    }).on("script", {
      element(element) {
        const src = element.getAttribute("src");
        const replacement = rewriteSigmabloxUrl(src);
        if (replacement) {
          element.setAttribute("src", replacement);
        }
      }
    }).on("img", {
      element(element) {
        const src = element.getAttribute("src");
        const replacement = rewriteSigmabloxUrl(src);
        if (replacement) {
          element.setAttribute("src", replacement);
        }
      }
    }).on("form", {
      element(element) {
        const action = element.getAttribute("action");
        const replacement = rewriteSigmabloxUrl(action);
        if (replacement) {
          element.setAttribute("action", replacement);
        }
      }
    }).on("body", {
      element(element) {
        if (shimInjected) return;
        element.prepend(SHIM_HTML, { html: true });
        shimInjected = true;
      }
    }).on("body", {
      element(element) {
        element.prepend(BANNER_HTML, { html: true });
      }
    }).on("body", {
      element(element) {
        element.append(BANNER_FOOTER_HTML, { html: true });
      }
    }).transform(response);
  }
};

// ../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-bQxboi/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = merge_router_default;

// ../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-bQxboi/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=merge-router.js.map
