// js/builders/auth.js
// Client-side auth service for mc_site
// Checks VIA OAuth session via /auth/me endpoint

/**
 * Auth state cache
 */
let authCache = null;
let authCacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Flag to prevent multiple simultaneous redirects
 */
let redirectInProgress = false;

/**
 * Check if user is authenticated
 * @param {boolean} forceRefresh - Skip cache and fetch fresh
 * @returns {Promise<{authenticated: boolean, user: Object|null}>}
 */
export async function checkAuth(forceRefresh = false) {
    // Use cache if valid
    if (!forceRefresh && authCache !== null && authCacheTimestamp) {
        const age = Date.now() - authCacheTimestamp;
        if (age < CACHE_DURATION) {
            return authCache;
        }
    }

    try {
        const response = await fetch('/auth/me', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            // Auth endpoint unavailable — treat as unauthenticated
            const fallback = { authenticated: false, user: null };
            authCache = fallback;
            authCacheTimestamp = Date.now();
            return fallback;
        }

        const ct = response.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
            // Non-JSON response (e.g. HTML fallback on dev server)
            const fallback = { authenticated: false, user: null };
            authCache = fallback;
            authCacheTimestamp = Date.now();
            return fallback;
        }

        const data = await response.json();
        authCache = data;
        authCacheTimestamp = Date.now();
        return data;
    } catch (error) {
        console.debug('[Auth] Auth endpoint unavailable:', error.message);
        // Return unauthenticated on error
        const fallback = { authenticated: false, user: null };
        authCache = fallback;
        authCacheTimestamp = Date.now();
        return fallback;
    }
}

/**
 * Check if user is authenticated (convenience method)
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
    const { authenticated } = await checkAuth();
    return authenticated;
}

/**
 * Get current user info
 * @returns {Promise<Object|null>}
 */
export async function getUser() {
    const { user } = await checkAuth();
    return user;
}

/**
 * Clear auth cache (call after login/logout)
 */
export function clearAuthCache() {
    authCache = null;
    authCacheTimestamp = null;
}

/**
 * Get login URL with return path
 * @param {string} returnTo - Path to return to after login
 * @returns {string}
 */
export function getLoginUrl(returnTo = window.location.pathname) {
    return `/auth/login?return_to=${encodeURIComponent(returnTo)}`;
}

/**
 * Get logout URL with return path
 * @param {string} returnTo - Path to return to after logout
 * @returns {string}
 */
export function getLogoutUrl(returnTo = '/') {
    return `/auth/logout?return_to=${encodeURIComponent(returnTo)}`;
}

/**
 * Redirect to login
 * @param {string} returnTo - Path to return to after login
 */
export function redirectToLogin(returnTo = window.location.pathname) {
    // Prevent multiple redirects
    if (redirectInProgress) {
        return;
    }
    redirectInProgress = true;
    window.location.href = getLoginUrl(returnTo);
}

/**
 * Handle API response errors
 * Checks for 401/403 and redirects to login if needed
 *
 * @param {Response} response - Fetch Response object
 * @param {Object} options - Options
 * @param {boolean} options.redirectOn401 - Redirect to login on 401 (default: true)
 * @param {boolean} options.redirectOn403 - Redirect to login on 403 (default: false)
 * @returns {Response} - The original response if no redirect needed
 * @throws {Error} - If response is not ok and not handled
 */
export function handleApiResponse(response, options = {}) {
    const { redirectOn401 = true, redirectOn403 = false } = options;

    if (response.ok) {
        return response;
    }

    // Handle 401 Unauthorized
    if (response.status === 401 && redirectOn401) {
        console.log('[Auth] 401 response - session expired or unauthorized');
        clearAuthCache();
        redirectToLogin();
        // Throw to prevent further processing
        throw new Error('Session expired. Redirecting to login.');
    }

    // Handle 403 Forbidden
    if (response.status === 403 && redirectOn403) {
        console.log('[Auth] 403 response - access denied');
        clearAuthCache();
        redirectToLogin();
        throw new Error('Access denied. Redirecting to login.');
    }

    return response;
}

/**
 * Wrapper for fetch that handles auth errors
 * Use this for API calls that require authentication
 *
 * @param {string} url - URL to fetch
 * @param {RequestInit} init - Fetch init options
 * @param {Object} authOptions - Auth handling options
 * @param {boolean} authOptions.redirectOn401 - Redirect on 401 (default: true)
 * @param {boolean} authOptions.redirectOn403 - Redirect on 403 (default: false)
 * @returns {Promise<Response>}
 */
export async function authFetch(url, init = {}, authOptions = {}) {
    const response = await fetch(url, {
        ...init,
        credentials: 'same-origin'
    });

    return handleApiResponse(response, authOptions);
}
