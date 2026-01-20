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
            throw new Error(`Auth check failed: ${response.status}`);
        }

        const data = await response.json();
        authCache = data;
        authCacheTimestamp = Date.now();
        return data;
    } catch (error) {
        console.error('[Auth] Failed to check auth status:', error.message);
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
    window.location.href = getLoginUrl(returnTo);
}
