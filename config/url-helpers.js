/**
 * URL Helpers - Single Source of Truth for All URLs
 *
 * All URLs derive from PUBLIC_BASE_URL.
 * This prevents hardcoded URLs scattered throughout the codebase.
 *
 * @module config/url-helpers
 */

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/$/, '');
}

function parseCsv(value = '') {
  return String(value || '')
    .split(',')
    .map((entry) => stripTrailingSlash(entry.trim()))
    .filter(Boolean);
}

/**
 * Get the public base URL from environment
 * This is the single source of truth for all URLs
 *
 * @returns {string} Public base URL
 * @throws {Error} If PUBLIC_BASE_URL is not set
 */
function getPublicBaseUrl() {
  const url = process.env.PUBLIC_BASE_URL;

  if (!url) {
    throw new Error(
      'PUBLIC_BASE_URL environment variable is required but not set. ' +
        'Set it in your config YAML or environment.'
    );
  }

  // Validate it's a proper URL
  try {
    new URL(url);
  } catch (error) {
    throw new Error(`PUBLIC_BASE_URL must be a valid URL, got: ${url}`);
  }

  return stripTrailingSlash(url);
}

/**
 * Get the internal base URL (defaults to public base URL if not set)
 * @deprecated Use getPublicBaseUrl() or getGhostInternalUrl() instead.
 * INTERNAL_BASE_URL is deprecated per RULES.md - do not re-introduce.
 *
 * @returns {string} Internal base URL (falls back to PUBLIC_BASE_URL)
 */
function getInternalBaseUrl() {
  // DEPRECATED: INTERNAL_BASE_URL should not be used. Always returns PUBLIC_BASE_URL.
  const url = process.env.INTERNAL_BASE_URL;
  if (url) {
    return stripTrailingSlash(url);
  }
  return getPublicBaseUrl();
}

/**
 * Get the Ghost CMS public URL
 * Used for user-facing URLs: redirects, CORS origins, browser navigation
 *
 * Priority: GHOST_PUBLIC_URL > PUBLIC_BASE_URL
 *
 * @returns {string} Ghost public URL
 */
function getGhostPublicUrl() {
  if (process.env.GHOST_PUBLIC_URL) {
    return stripTrailingSlash(process.env.GHOST_PUBLIC_URL);
  }
  if (process.env.GHOST_URL) {
    return stripTrailingSlash(process.env.GHOST_URL);
  }
  return getPublicBaseUrl();
}

/**
 * Get the Ghost CMS internal URL
 * Used for service-to-service API calls (webhook→ghost within Docker network)
 *
 * In local dev: http://ghost-local:2368 (Docker DNS)
 * In production: Same as public URL (no Docker network in Cloud Run)
 *
 * Priority: GHOST_INTERNAL_URL
 *
 * @returns {string} Ghost internal URL
 */
function getGhostInternalUrl() {
  const url = process.env.GHOST_INTERNAL_URL;
  if (url) {
    return stripTrailingSlash(url);
  }
  if (process.env.GHOST_URL) {
    return stripTrailingSlash(process.env.GHOST_URL);
  }
  return getGhostPublicUrl();
}

/**
 * Get the Ghost CMS URL (backward compatibility alias)
 * @deprecated Use getGhostPublicUrl() or getGhostInternalUrl() explicitly
 *
 * @returns {string} Ghost CMS URL
 */
function getGhostUrl() {
  if (process.env.GHOST_URL) {
    return stripTrailingSlash(process.env.GHOST_URL);
  }
  return getGhostPublicUrl();
}

/**
 * Get the OIDC redirect URI
 * Defaults to PUBLIC_BASE_URL/auth/callback if not explicitly set
 *
 * @returns {string} OIDC redirect URI
 */
function getOidcRedirectUri() {
  if (process.env.OIDC_REDIRECT_URI) {
    return process.env.OIDC_REDIRECT_URI;
  }

  const baseUrl = getPublicBaseUrl();
  return `${baseUrl}/auth/callback`;
}

/**
 * Get the OAuth redirect URI
 * Defaults to PUBLIC_BASE_URL/auth/callback if not explicitly set
 *
 * @returns {string} OAuth redirect URI
 */
function getOauthRedirectUri() {
  if (process.env.OAUTH_REDIRECT_URI) {
    return process.env.OAUTH_REDIRECT_URI;
  }

  const baseUrl = getPublicBaseUrl();
  return `${baseUrl}/auth/callback`;
}

/**
 * Get the Ghost SSO callback URI
 * Used for Authentik integration with Ghost
 *
 * @returns {string} Ghost SSO callback URI
 */
function getGhostSsoCallbackUri() {
  if (process.env.AUTHENTIK_REDIRECT_URI) {
    return process.env.AUTHENTIK_REDIRECT_URI;
  }

  const baseUrl = getPublicBaseUrl();
  return `${baseUrl}/ghost/sso/callback`;
}

/**
 * Get webhook public URL for a specific path
 * Used for generating webhook callback URLs
 *
 * @param {string} path - Path to append to base URL (should start with /)
 * @returns {string} Full webhook URL
 */
function getWebhookUrl(path = '') {
  const baseUrl = getPublicBaseUrl();

  if (!path.startsWith('/')) {
    throw new Error(`Webhook path must start with /, got: ${path}`);
  }

  return `${baseUrl}${path}`;
}

/**
 * Get the OIDC issuer URL
 *
 * @returns {string} OIDC issuer URL
 * @throws {Error} If OIDC_ISSUER_URL is not set
 */
function getOidcIssuerUrl() {
  const url = process.env.OIDC_ISSUER_URL;

  if (!url) {
    throw new Error('OIDC_ISSUER_URL environment variable is required but not set');
  }

  return stripTrailingSlash(url);
}

/**
 * Get the Authentik base URL
 *
 * @returns {string} Authentik base URL
 * @throws {Error} If AUTHENTIK_BASE_URL is not set
 */
function getAuthentikBaseUrl() {
  const url = process.env.AUTHENTIK_BASE_URL;

  if (!url) {
    // Fallback to OIDC issuer URL if available
    if (process.env.OIDC_ISSUER_URL) {
      // Extract base URL from issuer URL (remove path)
      const issuerUrl = new URL(process.env.OIDC_ISSUER_URL);
      return `${issuerUrl.protocol}//${issuerUrl.host}`;
    }

    throw new Error('AUTHENTIK_BASE_URL environment variable is required but not set');
  }

  return stripTrailingSlash(url);
}

/**
 * Compute the canonical list of CORS origins.
 * Starts from PUBLIC_BASE_URL, then adds GHOST_PUBLIC_URL,
 * and any comma-separated extras from EXTRA_CORS_ORIGINS (or ALLOWED_ORIGINS for backward compatibility).
 *
 * IMPORTANT: Never include internal URLs (like docker DNS names) in CORS origins.
 * CORS origins must be browser-accessible public URLs only.
 *
 * @returns {string[]} Array of allowed origins
 */
function getCorsOrigins() {
  const origins = new Set();

  const publicBase = getPublicBaseUrl();
  origins.add(publicBase);

  // Use public Ghost URL only - internal URLs should never be in CORS
  origins.add(getGhostPublicUrl());

  parseCsv(process.env.EXTRA_CORS_ORIGINS).forEach((origin) => origins.add(origin));

  // Backward compatibility with legacy ALLOWED_ORIGINS env var
  parseCsv(process.env.ALLOWED_ORIGINS).forEach((origin) => origins.add(origin));

  // Include scheme variations of PUBLIC_BASE_URL for local dev flexibility
  if (publicBase.startsWith('http://')) {
    origins.add(publicBase.replace(/^http:/, 'https:'));
  } else if (publicBase.startsWith('https://')) {
    origins.add(publicBase.replace(/^https:/, 'http:'));
  }

  // Remove falsy entries and return deterministic order
  return Array.from(origins).filter(Boolean);
}

/**
 * Get all derived URLs for debugging/documentation
 *
 * @returns {Object} Object containing all derived URLs
 */
function getAllUrls() {
  try {
    return {
      publicBaseUrl: getPublicBaseUrl(),
      internalBaseUrl: getInternalBaseUrl(),
      ghostPublicUrl: getGhostPublicUrl(),
      ghostInternalUrl: getGhostInternalUrl(),
      ghostUrl: getGhostUrl(),
      oidcRedirectUri: getOidcRedirectUri(),
      oauthRedirectUri: getOauthRedirectUri(),
      ghostSsoCallbackUri: getGhostSsoCallbackUri(),
      oidcIssuerUrl: getOidcIssuerUrl(),
      authentikBaseUrl: getAuthentikBaseUrl(),
      corsOrigins: getCorsOrigins(),
    };
  } catch (error) {
    // Return partial object if some URLs are missing
    return {
      error: error.message,
      publicBaseUrl: process.env.PUBLIC_BASE_URL || 'NOT SET',
      ghostPublicUrl: process.env.GHOST_PUBLIC_URL || 'NOT SET',
      ghostInternalUrl: process.env.GHOST_INTERNAL_URL || 'NOT SET',
      ghostUrl: getGhostPublicUrl(),
      corsOrigins: process.env.EXTRA_CORS_ORIGINS || process.env.ALLOWED_ORIGINS || 'NOT SET',
    };
  }
}

/**
 * Validate that no localhost URLs are present in production
 * Call this on startup in production to enforce the rule
 *
 * @throws {Error} If localhost URLs are found in production
 */
function validateNoLocalhostInProduction() {
  const appEnv = process.env.APP_ENV || 'dev';

  if (appEnv !== 'prod') {
    return; // Only enforce in production
  }

  const urls = getAllUrls();
  const localhostUrls = [];

  for (const [key, value] of Object.entries(urls)) {
    if (typeof value === 'string' && value.includes('localhost')) {
      localhostUrls.push(`${key}: ${value}`);
    }
  }

  if (localhostUrls.length > 0) {
    throw new Error(
      'CRITICAL: Production environment cannot use localhost URLs:\n' +
        localhostUrls.map((u) => `  - ${u}`).join('\n')
    );
  }
}

module.exports = {
  getPublicBaseUrl,
  getInternalBaseUrl,
  getGhostPublicUrl,
  getGhostInternalUrl,
  getGhostUrl, // backward compat alias for getGhostPublicUrl
  getOidcRedirectUri,
  getOauthRedirectUri,
  getGhostSsoCallbackUri,
  getWebhookUrl,
  getOidcIssuerUrl,
  getAuthentikBaseUrl,
  getAllUrls,
  validateNoLocalhostInProduction,
  getCorsOrigins,
};
