/**
 * Shared outbound URL utilities for company links.
 * Used by builders, portfolio, and cohort pages.
 */

/**
 * Generate a tracked outbound URL via the /go/ redirect.
 * @param {string} websiteUrl - The destination URL
 * @param {string} companySlug - Slug identifying the company
 * @param {string} sourcePage - Page that originated the click
 * @returns {string} Outbound redirect path, or empty string if no URL
 */
export function outboundUrl(websiteUrl, companySlug, sourcePage) {
    if (!websiteUrl) return '';
    return `/go/${encodeURIComponent(companySlug)}?url=${encodeURIComponent(websiteUrl)}&src=${encodeURIComponent(sourcePage)}`;
}

/**
 * Generate a URL slug from a company name.
 * Strips common suffixes (Inc, LLC, Corp, etc.), removes special characters,
 * and returns a lowercased hyphenated slug.
 * @param {string} name - Company name
 * @returns {string} URL-safe slug
 */
export function toCompanySlug(name) {
    return name
        .replace(/,?\s*(Inc\.?|LLC\.?|Corporation|Corp\.?|Technologies|Technology)\s*/gi, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();
}
