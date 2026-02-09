var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

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
var LAST_CONSOLE_COOKIE_NAME = "mc_last_console";
var LAST_CONSOLE_MAX_AGE = 60 * 60 * 24 * 365;
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
function createCookieHeader(name, value, maxAge, secure = true, domain = void 0, httpOnly = true) {
  const parts = [
    `${name}=${value}`,
    `Path=/`,
    `SameSite=Lax`,
    `Max-Age=${maxAge}`
  ];
  if (httpOnly) {
    parts.push("HttpOnly");
  }
  if (maxAge <= 0) {
    parts.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  }
  if (secure) {
    parts.push("Secure");
  }
  if (domain) {
    parts.push(`Domain=${domain}`);
  }
  return parts.join("; ");
}
__name(createCookieHeader, "createCookieHeader");
function isAllowedHost(hostname) {
  if (!hostname) return false;
  if (hostname === "mergecombinator.com") return true;
  if (hostname === "www.mergecombinator.com") return true;
  return hostname.endsWith(".mergecombinator.com");
}
__name(isAllowedHost, "isAllowedHost");
function sanitizeReturnTo(returnTo) {
  if (!returnTo) return null;
  if (returnTo.startsWith("/")) return returnTo;
  try {
    const url = new URL(returnTo);
    if (!isAllowedHost(url.hostname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
__name(sanitizeReturnTo, "sanitizeReturnTo");
function getLastConsoleDestination(request) {
  const cookies = parseCookies(request);
  const value = cookies[LAST_CONSOLE_COOKIE_NAME];
  if (value === "wingman") return "/wingman";
  if (value === "control") return "/control";
  if (value === "app") return "/app";
  return "/app";
}
__name(getLastConsoleDestination, "getLastConsoleDestination");
function createLastConsoleCookie(value, env, isSecure) {
  return createCookieHeader(
    LAST_CONSOLE_COOKIE_NAME,
    value,
    LAST_CONSOLE_MAX_AGE,
    isSecure,
    env.COOKIE_DOMAIN,
    false
  );
}
__name(createLastConsoleCookie, "createLastConsoleCookie");
async function handleLogin(request, env) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || "/";
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
    const safeReturnTo = sanitizeReturnTo(stateData.returnTo);
    const returnTo = safeReturnTo || getLastConsoleDestination(request);
    const headers = new Headers();
    headers.set("Location", returnTo);
    headers.append(
      "Set-Cookie",
      createCookieHeader(
        SESSION_COOKIE_NAME,
        sessionCookie,
        SESSION_MAX_AGE,
        url.protocol === "https:",
        env.COOKIE_DOMAIN
        // Cross-subdomain support
      )
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
  const returnTo = url.searchParams.get("returnTo") || url.origin;
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    createCookieHeader(
      SESSION_COOKIE_NAME,
      "",
      0,
      url.protocol === "https:",
      env.COOKIE_DOMAIN
      // Must match domain used when setting cookie
    )
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
var DEFAULT_ORIGINS = {
  mcPages: "https://mc-site-dr4.pages.dev",
  sigmablox: "https://www.sigmablox.com",
  sigmabloxApi: "https://api.sigmablox.com",
  app: "https://app.mergecombinator.com",
  wingman: "https://wingman.mergecombinator.com",
  control: "https://control.mergecombinator.com"
};
var SIGMABLOX_HOSTNAMES = /* @__PURE__ */ new Set(["www.sigmablox.com", "sigmablox.com"]);
var API_CORS_ORIGINS = /* @__PURE__ */ new Set([
  "https://console.mergecombinator.com",
  "https://mergecombinator.com",
  "https://www.mergecombinator.com",
  "http://localhost:3000",
  "http://localhost:3002",
  "http://localhost:5173"
]);
var HOP_BY_HOP_HEADERS = /* @__PURE__ */ new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]);
var CONSOLE_PATHS = /* @__PURE__ */ new Set(["/app", "/control"]);
var DEFAULT_CONSOLE_PATH = "/app";
var DEFAULT_ADMIN_GROUPS = ["via-admins", "sigmablox-admins"];
var BANNER_HTML = `
  <div data-mc-banner="true" style="position: sticky; top: 0; z-index: 2147483647; font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif; background: #0b1116; color: #e9f2ff; border-bottom: 1px solid rgba(233, 242, 255, 0.12); padding: 10px 16px; text-align: center; letter-spacing: 0.02em;">
    <span style="opacity: 0.9;">Brought to you by Merge Combinator. Build what warfighters need.</span>
    <a href="/builders" style="margin-left: 12px; color: #7fd1ff; text-decoration: none; font-weight: 600;">Explore our Defense Builders -&gt;</a>
  </div>
`;
var BANNER_FOOTER_HTML = `
  <div style="font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif; background: #0b1116; color: #e9f2ff; border-top: 1px solid rgba(233, 242, 255, 0.12); padding: 12px 16px; text-align: center; letter-spacing: 0.02em;">
    <span style="opacity: 0.9;">Brought to you by Merge Combinator. Build what warfighters need.</span>
    <a href="/builders" style="margin-left: 12px; color: #7fd1ff; text-decoration: none; font-weight: 600;">Explore our Defense Builders -&gt;</a>
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
function isConsolePath(pathname) {
  return Array.from(CONSOLE_PATHS).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
__name(isConsolePath, "isConsolePath");
function consoleValueFromPath(pathname) {
  if (pathname === "/wingman" || pathname.startsWith("/wingman/")) {
    return "wingman";
  }
  if (pathname === "/control" || pathname.startsWith("/control/")) {
    return "control";
  }
  return "app";
}
__name(consoleValueFromPath, "consoleValueFromPath");
function isAdminSession(session, env) {
  if (!session || !session.user || !Array.isArray(session.user.groups)) {
    return false;
  }
  const configured = env.CONTROL_ADMIN_GROUPS ? env.CONTROL_ADMIN_GROUPS.split(",").map((item) => item.trim()).filter(Boolean) : DEFAULT_ADMIN_GROUPS;
  const groupSet = new Set(configured);
  return session.user.groups.some((group) => groupSet.has(group));
}
__name(isAdminSession, "isAdminSession");
function createLoginRedirect(request) {
  const url = new URL(request.url);
  const loginUrl = new URL("/auth/login", url.origin);
  loginUrl.searchParams.set("returnTo", `${url.pathname}${url.search}${url.hash}`);
  return Response.redirect(loginUrl.toString(), 302);
}
__name(createLoginRedirect, "createLoginRedirect");
function withLastConsoleCookie(response, value, env, request) {
  const headers = new Headers(response.headers);
  headers.append(
    "Set-Cookie",
    createLastConsoleCookie(value, env, new URL(request.url).protocol === "https:")
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
__name(withLastConsoleCookie, "withLastConsoleCookie");
function isWebSocketRequest(request) {
  const upgrade = request.headers.get("upgrade");
  return upgrade && upgrade.toLowerCase() === "websocket";
}
__name(isWebSocketRequest, "isWebSocketRequest");
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
__name(buildUpstreamHeaders, "buildUpstreamHeaders");
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
  const upstreamHeaders = buildUpstreamHeaders(request, { stripCookies: true });
  const session = await getSession(request, env);
  if (session && session.accessToken) {
    upstreamHeaders.set("Authorization", `Bearer ${session.accessToken}`);
  }
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
function getOrigins(env) {
  return {
    mcPages: env.MC_PAGES_ORIGIN || DEFAULT_ORIGINS.mcPages,
    sigmablox: env.SIGMABLOX_ORIGIN || DEFAULT_ORIGINS.sigmablox,
    sigmabloxApi: env.SIGMABLOX_API_ORIGIN || DEFAULT_ORIGINS.sigmabloxApi,
    app: env.APP_ORIGIN || DEFAULT_ORIGINS.app,
    wingman: env.WINGMAN_ORIGIN || DEFAULT_ORIGINS.wingman,
    control: env.CONTROL_ORIGIN || DEFAULT_ORIGINS.control
  };
}
__name(getOrigins, "getOrigins");
function getRoutes(origins) {
  return [
    { prefix: "/app/wingman", origin: origins.wingman, stripPrefix: true, preserveRoot: true },
    { prefix: "/app", origin: origins.app, stripPrefix: true },
    { prefix: "/control", origin: origins.control, stripPrefix: true },
    { prefix: "/api", origin: origins.sigmabloxApi, stripPrefix: false, isApi: true },
    { prefix: "/combine", origin: origins.sigmablox, stripPrefix: true, preserveRoot: true },
    { prefix: "/opportunities", origin: "https://sbir.mergecombinator.com", stripPrefix: true }
  ];
}
__name(getRoutes, "getRoutes");
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
    const host = request.headers.get("host") || url.hostname;

    const CANONICAL_HOST = "mergecombinator.com";
    const ALIAS_HOSTS = new Set(["www.mergecombinator.com", "build.mergecombinator.com"]);
    
    // 1) Canonical host redirect FIRST
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

    // 3) Console gating (single block)
    const isWingmanMarketing = (url.pathname === "/wingman" || url.pathname.startsWith("/wingman/"));

    if (!isWingmanMarketing && isConsolePath(url.pathname)) {
      const session = await getSession(request, env);
      if (!session) return createLoginRedirect(request);

      const isControl = (url.pathname === "/control" || url.pathname.startsWith("/control/"));
      if (isControl && !isAdminSession(session, env)) {
        const redirect = Response.redirect(new URL(DEFAULT_CONSOLE_PATH, url.origin).toString(), 302);
        return withLastConsoleCookie(redirect, "app", env, request);
      }

    const route = routes.find(
      (entry) => url.pathname === entry.prefix || url.pathname.startsWith(`${entry.prefix}/`)
    );
    if (!route) {
      const referer = request.headers.get("referer") || "";
      const refererUrl = referer ? new URL(referer) : null;
      const isFromCombine = refererUrl && (refererUrl.pathname.startsWith("/combine") || SIGMABLOX_HOSTNAMES.has(refererUrl.hostname));
      if (isFromCombine) {
        const sigmabloxUrl = new URL(url.pathname, origins.sigmablox);
        sigmabloxUrl.search = url.search;
        const upstreamHeaders3 = buildUpstreamHeaders(request);
        return fetch(new Request(sigmabloxUrl, {
          method: request.method,
          headers: upstreamHeaders3,
          body: request.body
        }));
      }
      const mcPagesUrl = new URL(url.pathname, origins.mcPages);
      mcPagesUrl.search = url.search;
      const upstreamHeaders2 = buildUpstreamHeaders(request);
      let response2 = await fetch(new Request(mcPagesUrl, {
        method: request.method,
        headers: upstreamHeaders2,
        body: request.body
      }));
      if (isConsolePath(url.pathname)) {
        response2 = withLastConsoleCookie(response2, consoleValueFromPath(url.pathname), env, request);
      }
      if (url.pathname === "/dashboard" || url.pathname === "/dashboard/") {
        const session = await getSession(request, env);
        if (session) {
          const redirect = Response.redirect(new URL(DEFAULT_CONSOLE_PATH, url.origin).toString(), 302);
          return withLastConsoleCookie(redirect, "app", env, request);
        }
      }
      return response2;
    }
    const targetUrl = resolveTarget(url, route);
    if (route.isApi) {
      return handleApiRoute(request, targetUrl, env);
    }
    const upstreamHeaders = buildUpstreamHeaders(request);
    let response = await fetch(new Request(targetUrl, {
      method: request.method,
      headers: upstreamHeaders,
      body: request.body
    }));
    if (isConsolePath(url.pathname)) {
      response = withLastConsoleCookie(response, consoleValueFromPath(url.pathname), env, request);
    }
    if (route.origin === origins.sigmablox && isRedirectResponse(response)) {
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
    if (route.origin !== origins.sigmablox || !shouldRewriteBanner(response)) {
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
  }
};

export {
  merge_router_default as default
};
//# sourceMappingURL=merge-router.js.map
