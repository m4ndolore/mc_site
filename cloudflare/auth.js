/**
 * VIA OAuth Authentication Module for Cloudflare Workers
 *
 * Handles OAuth 2.0 PKCE flow with VIA/Authentik
 *
 * STATE MANAGEMENT:
 *   OAuth state is stored in the URL state parameter (encrypted), NOT in cookies.
 *   This avoids cookie loss during cross-site OAuth redirects (SameSite issues).
 *   Pattern borrowed from SigmaBlox VIA integration.
 *
 * Configuration:
 *   - OIDC_ISSUER_URL: from wrangler.toml (must align with config/*.yaml)
 *   - MC_OAUTH_CLIENT_ID, MC_OAUTH_CLIENT_SECRET, SESSION_SECRET: from .dev.vars (symlink to .env.local)
 *
 * See wrangler.toml header and docs/ai/RULES.md for configuration pattern.
 */

/**
 * Get OAuth URLs from environment config
 *
 * OIDC_ISSUER_URL source of truth:
 *   - Production: config/base.yaml → wrangler.toml [vars]
 *   - Local dev:  config/dev.local.yaml → wrangler.toml [env.dev.vars]
 */
function getOAuthUrls(env) {
  const issuer = env.OIDC_ISSUER_URL;
  if (!issuer) {
    throw new Error("Missing required env var: OIDC_ISSUER_URL");
  }
  return {
    authorize: `${issuer}/application/o/authorize/`,
    token: `${issuer}/application/o/token/`,
    userinfo: `${issuer}/application/o/userinfo/`,
  };
}

// Cookie settings
const SESSION_COOKIE_NAME = "mc_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const LAST_CONSOLE_COOKIE_NAME = "mc_last_console";
const LAST_CONSOLE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Generate a random string for PKCE and state
 */
function generateRandomString(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate PKCE code verifier and challenge
 */
async function generatePKCE() {
  const verifier = generateRandomString(32);
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return { verifier, challenge };
}

/**
 * Encrypt session data for cookie storage
 */
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

/**
 * Decrypt session data from cookie
 */
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

/**
 * Parse cookies from request
 */
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

/**
 * Create a secure cookie header
 *
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} maxAge - Cookie max age in seconds
 * @param {boolean} secure - Whether to set Secure flag
 * @param {string|undefined} domain - Optional domain for cross-subdomain cookies
 */
function createCookieHeader(
  name,
  value,
  maxAge,
  secure = true,
  domain = undefined,
  httpOnly = true
) {
  const parts = [
    `${name}=${value}`,
    `Path=/`,
    `SameSite=Lax`,
    `Max-Age=${maxAge}`,
  ];
  if (httpOnly) {
    parts.push("HttpOnly");
  }
  // For deletion (maxAge=0), also set explicit expired date for browser compatibility
  if (maxAge <= 0) {
    parts.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  }
  if (secure) {
    parts.push("Secure");
  }
  // Cross-subdomain support: set domain for shared sessions (e.g., ".mergecombinator.com")
  if (domain) {
    parts.push(`Domain=${domain}`);
  }
  return parts.join("; ");
}

function isAllowedHost(hostname) {
  if (!hostname) return false;
  if (hostname === "mergecombinator.com") return true;
  if (hostname === "www.mergecombinator.com") return true;
  return hostname.endsWith(".mergecombinator.com");
}

function sanitizeReturnTo(returnTo) {
  if (!returnTo) return null;
  if (returnTo.startsWith("/")) {
    return returnTo;
  }
  try {
    const url = new URL(returnTo);
    if (!isAllowedHost(url.hostname)) {
      return null;
    }
    return url.toString();
  } catch (err) {
    return null;
  }
}

function getLastConsoleDestination(request) {
  const cookies = parseCookies(request);
  const value = cookies[LAST_CONSOLE_COOKIE_NAME];
  if (value === "wingman") return "/wingman";
  if (value === "control") return "/control";
  if (value === "app") return "/app";
  return "/app";
}

export function createLastConsoleCookie(value, env, isSecure) {
  return createCookieHeader(
    LAST_CONSOLE_COOKIE_NAME,
    value,
    LAST_CONSOLE_MAX_AGE,
    isSecure,
    env.COOKIE_DOMAIN,
    false
  );
}

/**
 * Handle /auth/login - Redirect to VIA OAuth
 *
 * State is stored in the OAuth state parameter itself (encrypted), not in a cookie.
 * This survives cross-site redirects where cookies may be blocked.
 */
async function handleLogin(request, env) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || "/";

  const { verifier, challenge } = await generatePKCE();
  const nonce = generateRandomString(16);

  // Encode ALL state data into the OAuth state parameter (encrypted)
  // This survives cross-site redirects where cookies are blocked
  const statePayload = {
    nonce,
    verifier,
    returnTo,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 600, // 10 minute expiry
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

/**
 * Handle /auth/callback - Exchange code for tokens
 *
 * State is decoded from the OAuth state parameter (encrypted), not from a cookie.
 */
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

    // Check env vars
    if (!env.SESSION_SECRET) {
      console.error("SESSION_SECRET is not set");
      return new Response("Server configuration error: missing SESSION_SECRET", { status: 500 });
    }

    // Decrypt and validate state from URL parameter (not cookie)
    const stateData = await decryptSession(encryptedState, env.SESSION_SECRET);

    if (!stateData) {
      console.error("State decryption failed");
      return new Response("Invalid state - try logging in again", { status: 400 });
    }

    // Validate expiration
    const now = Math.floor(Date.now() / 1000);
    if (stateData.exp && stateData.exp < now) {
      console.error("State expired", { exp: stateData.exp, now });
      return new Response("Login session expired - try logging in again", { status: 400 });
    }

    // Exchange code for tokens
    const viaUrls = getOAuthUrls(env);
    const redirectUri = `${url.origin}/auth/callback`;
    const tokenResponse = await fetch(viaUrls.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: env.MC_OAUTH_CLIENT_ID,
        client_secret: env.MC_OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        code_verifier: stateData.verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", tokenResponse.status, errorText);
      return new Response(`Failed to exchange token: ${tokenResponse.status} - ${errorText}`, { status: 500 });
    }

    const tokens = await tokenResponse.json();

    // Fetch user info
    const userResponse = await fetch(viaUrls.userinfo, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      return new Response("Failed to fetch user info", { status: 500 });
    }

    const user = await userResponse.json();

    // Create session
    const session = {
      user: {
        sub: user.sub,
        email: user.email,
        name: user.name || user.preferred_username,
        groups: user.groups || [],
      },
      accessToken: tokens.access_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
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
        env.COOKIE_DOMAIN  // Cross-subdomain support
      )
    );

    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error("Callback error:", err.message, err.stack);
    return new Response(`Authentication callback failed: ${err.message}`, { status: 500 });
  }
}

/**
 * Handle /auth/logout - Clear local session AND end Authentik SSO session
 *
 * Without redirecting to Authentik's end-session endpoint, the user remains
 * logged into SSO and will be auto-authenticated on next login attempt.
 */
async function handleLogout(request, env) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || url.origin;

  // Clear local session cookie (must include domain to delete cross-subdomain cookie)
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    createCookieHeader(
      SESSION_COOKIE_NAME,
      "",
      0,
      url.protocol === "https:",
      env.COOKIE_DOMAIN  // Must match domain used when setting cookie
    )
  );

  // Redirect to Authentik end-session to fully log out of SSO
  // post_logout_redirect_uri brings user back to our site after SSO logout
  const logoutUrl = env.OAUTH_LOGOUT_URL;
  if (logoutUrl) {
    const endSessionUrl = new URL(logoutUrl);
    endSessionUrl.searchParams.set("post_logout_redirect_uri", returnTo);
    headers.set("Location", endSessionUrl.toString());
  } else {
    // Fallback if OAUTH_LOGOUT_URL not configured
    headers.set("Location", returnTo);
  }

  return new Response(null, { status: 302, headers });
}

/**
 * Handle /auth/me - Return current user info
 */
async function handleMe(request, env) {
  const cookies = parseCookies(request);
  const sessionCookie = cookies[SESSION_COOKIE_NAME];

  if (!sessionCookie) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = await decryptSession(sessionCookie, env.SESSION_SECRET);

  if (!session || session.expiresAt < Date.now()) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      authenticated: true,
      user: session.user,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Get current session from request
 */
export async function getSession(request, env) {
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

export function getLastConsoleCookieName() {
  return LAST_CONSOLE_COOKIE_NAME;
}

export function sanitizeReturnToParam(value) {
  return sanitizeReturnTo(value);
}

/**
 * Main auth route handler
 */
export async function handleAuthRoute(request, env) {
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

/**
 * Check if path is an auth route
 */
export function isAuthRoute(pathname) {
  return pathname.startsWith("/auth/");
}
