/**
 * URL Helpers - Single Source of Truth for All URLs
 *
 * All URLs derive from PUBLIC_BASE_URL and API_BASE_URL.
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
 * This is the single source of truth for frontend URLs
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
 * Get the API base URL from environment
 *
 * @returns {string} API base URL
 * @throws {Error} If API_BASE_URL is not set
 */
function getApiBaseUrl() {
  const url = process.env.API_BASE_URL;

  if (!url) {
    throw new Error(
      'API_BASE_URL environment variable is required but not set. ' +
        'Set it in your config YAML or environment.'
    );
  }

  try {
    new URL(url);
  } catch (error) {
    throw new Error(`API_BASE_URL must be a valid URL, got: ${url}`);
  }

  return stripTrailingSlash(url);
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
 * Compute the canonical list of CORS origins.
 * Starts from PUBLIC_BASE_URL, then adds API_BASE_URL,
 * and any comma-separated extras from ALLOWED_ORIGINS.
 *
 * @returns {string[]} Array of allowed origins
 */
function getCorsOrigins() {
  const origins = new Set();

  try {
    origins.add(getPublicBaseUrl());
  } catch (e) {
    // PUBLIC_BASE_URL not set
  }

  try {
    origins.add(getApiBaseUrl());
  } catch (e) {
    // API_BASE_URL not set
  }

  parseCsv(process.env.ALLOWED_ORIGINS).forEach((origin) => origins.add(origin));

  // Include scheme variations for local dev flexibility
  const publicBase = process.env.PUBLIC_BASE_URL;
  if (publicBase) {
    if (publicBase.startsWith('http://')) {
      origins.add(publicBase.replace(/^http:/, 'https:'));
    } else if (publicBase.startsWith('https://')) {
      origins.add(publicBase.replace(/^https:/, 'http:'));
    }
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
      apiBaseUrl: getApiBaseUrl(),
      oidcRedirectUri: getOidcRedirectUri(),
      oauthRedirectUri: getOauthRedirectUri(),
      oidcIssuerUrl: getOidcIssuerUrl(),
      corsOrigins: getCorsOrigins(),
    };
  } catch (error) {
    // Return partial object if some URLs are missing
    return {
      error: error.message,
      publicBaseUrl: process.env.PUBLIC_BASE_URL || 'NOT SET',
      apiBaseUrl: process.env.API_BASE_URL || 'NOT SET',
      oidcIssuerUrl: process.env.OIDC_ISSUER_URL || 'NOT SET',
      corsOrigins: process.env.ALLOWED_ORIGINS || 'NOT SET',
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
  getApiBaseUrl,
  getOidcRedirectUri,
  getOauthRedirectUri,
  getOidcIssuerUrl,
  getAllUrls,
  validateNoLocalhostInProduction,
  getCorsOrigins,
};
