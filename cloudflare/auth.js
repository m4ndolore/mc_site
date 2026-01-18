/**
 * VIA OAuth Authentication Module for Cloudflare Workers
 *
 * Handles OAuth 2.0 PKCE flow with VIA/Authentik
 */

// VIA/Authentik OAuth endpoints
const VIA_ISSUER = "https://auth.sigmablox.com";
const VIA_AUTHORIZE_URL = `${VIA_ISSUER}/application/o/authorize/`;
const VIA_TOKEN_URL = `${VIA_ISSUER}/application/o/token/`;
const VIA_USERINFO_URL = `${VIA_ISSUER}/application/o/userinfo/`;

// Cookie settings
const SESSION_COOKIE_NAME = "mc_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

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
 */
function createCookieHeader(name, value, maxAge, secure = true) {
  const parts = [
    `${name}=${value}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAge}`,
  ];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

/**
 * Handle /auth/login - Redirect to VIA OAuth
 */
async function handleLogin(request, env) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("return_to") || "/";

  const { verifier, challenge } = await generatePKCE();
  const state = generateRandomString(16);

  // Store PKCE verifier and state in a temporary cookie
  const stateData = await encryptSession(
    { verifier, state, returnTo },
    env.SESSION_SECRET
  );

  const redirectUri = `${url.origin}/auth/callback`;
  const authUrl = new URL(VIA_AUTHORIZE_URL);
  authUrl.searchParams.set("client_id", env.MC_OAUTH_CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "openid email profile groups");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const response = Response.redirect(authUrl.toString(), 302);
  const headers = new Headers(response.headers);
  headers.append(
    "Set-Cookie",
    createCookieHeader("mc_auth_state", stateData, 600, url.protocol === "https:")
  );

  return new Response(null, {
    status: 302,
    headers,
  });
}

/**
 * Handle /auth/callback - Exchange code for tokens
 */
async function handleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(`Authentication error: ${error}`, { status: 400 });
  }

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  // Retrieve and validate state
  const cookies = parseCookies(request);
  const stateData = await decryptSession(cookies.mc_auth_state, env.SESSION_SECRET);

  if (!stateData || stateData.state !== state) {
    return new Response("Invalid state", { status: 400 });
  }

  // Exchange code for tokens
  const redirectUri = `${url.origin}/auth/callback`;
  const tokenResponse = await fetch(VIA_TOKEN_URL, {
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
    console.error("Token exchange failed:", errorText);
    return new Response("Failed to exchange token", { status: 500 });
  }

  const tokens = await tokenResponse.json();

  // Fetch user info
  const userResponse = await fetch(VIA_USERINFO_URL, {
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
  const returnTo = stateData.returnTo || "/";

  const headers = new Headers();
  headers.set("Location", returnTo);
  headers.append(
    "Set-Cookie",
    createCookieHeader(SESSION_COOKIE_NAME, sessionCookie, SESSION_MAX_AGE, url.protocol === "https:")
  );
  // Clear the state cookie
  headers.append(
    "Set-Cookie",
    createCookieHeader("mc_auth_state", "", 0, url.protocol === "https:")
  );

  return new Response(null, { status: 302, headers });
}

/**
 * Handle /auth/logout - Clear session
 */
async function handleLogout(request, env) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("return_to") || "/";

  const headers = new Headers();
  headers.set("Location", returnTo);
  headers.append(
    "Set-Cookie",
    createCookieHeader(SESSION_COOKIE_NAME, "", 0, url.protocol === "https:")
  );

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
