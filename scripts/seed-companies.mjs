#!/usr/bin/env node
/**
 * Build-time seeding script for company data
 *
 * Fetches company data from SigmaBlox API and writes to public/data/companies.json
 * Falls back to existing cached data if API is unavailable
 *
 * Usage: node scripts/seed-companies.js
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data', 'companies.json');
const API_BASE = 'https://api.sigmablox.com';

/**
 * Fallback mock data when API is unavailable and no cache exists
 * This ensures the /builders page always has content to display
 */
const FALLBACK_MOCK_DATA = {
    companies: [
        {
            airtableId: 'company-1',
            companyName: 'ShieldAI',
            productName: 'Hivemind',
            logoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop',
            problemStatement: 'AI-powered autonomous systems for defense',
            description: 'Building intelligent systems that protect service members and civilians.',
            website: 'https://shield.ai',
            missionArea: 'Autonomy',
            secondaryMissions: ['ISR'],
            warfareDomain: 'Air',
            trlLevel: '7',
            fundingStage: 'Series C+',
            cohort: 'Cohort 1'
        },
        {
            airtableId: 'company-2',
            companyName: 'Anduril Industries',
            productName: 'Lattice',
            logoUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=200&fit=crop',
            problemStatement: 'Transforming defense capabilities through technology',
            description: 'Bringing Silicon Valley innovation to national security.',
            website: 'https://anduril.com',
            missionArea: 'Autonomy',
            secondaryMissions: ['C2'],
            warfareDomain: 'Multi-Domain',
            trlLevel: '8',
            fundingStage: 'Series C+',
            cohort: 'Cohort 1'
        },
        {
            airtableId: 'company-3',
            companyName: 'Palantir Technologies',
            productName: 'Gotham',
            logoUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&h=200&fit=crop',
            problemStatement: 'Data integration and analytics for defense',
            description: 'Empowering operators with actionable intelligence.',
            website: 'https://palantir.com',
            missionArea: 'Intelligence',
            secondaryMissions: ['C2'],
            warfareDomain: 'Cyber',
            trlLevel: '9',
            fundingStage: 'Series C+',
            cohort: 'Cohort 1'
        },
        {
            airtableId: 'company-4',
            companyName: 'Rebellion Defense',
            productName: 'Nova',
            logoUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200&h=200&fit=crop',
            problemStatement: 'AI for national security decision-making',
            description: 'Accelerating mission-critical decisions with AI.',
            website: 'https://rebelliondefense.com',
            missionArea: 'Intelligence',
            secondaryMissions: ['Cyber'],
            warfareDomain: 'Cyber',
            trlLevel: '6',
            fundingStage: 'Series B',
            cohort: 'Cohort 2'
        },
        {
            airtableId: 'company-5',
            companyName: 'Hadrian',
            productName: 'Automated Manufacturing',
            logoUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop',
            problemStatement: 'Automated manufacturing for defense hardware',
            description: 'Rebuilding the defense industrial base with autonomy.',
            website: 'https://hadrian.co',
            missionArea: 'Logistics',
            secondaryMissions: [],
            warfareDomain: 'Ground',
            trlLevel: '7',
            fundingStage: 'Series B',
            cohort: 'Cohort 2'
        },
        {
            airtableId: 'company-6',
            companyName: 'Epirus',
            productName: 'Leonidas',
            logoUrl: 'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=200&h=200&fit=crop',
            problemStatement: 'High-power microwave systems for counter-drone',
            description: 'Directed energy for counter-drone and electronic warfare.',
            website: 'https://epirusinc.com',
            missionArea: 'Fires',
            secondaryMissions: ['C2'],
            warfareDomain: 'Air',
            trlLevel: '8',
            fundingStage: 'Series C+',
            cohort: 'Cohort 2'
        }
    ],
    pagination: {
        total: 6,
        limit: 100,
        offset: 0,
        hasMore: false
    }
};

/**
 * Fetch companies from public API
 */
async function fetchCompanies() {
    const response = await fetch(`${API_BASE}/api/public/companies`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'mc_site-build/1.0'
        }
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API returned ${response.status}: ${text}`);
    }

    const data = await response.json();

    // Check for application-level errors
    if (data.error) {
        throw new Error(`API error: ${data.error}`);
    }

    return data;
}

/**
 * Fetch filter options from public API
 */
async function fetchFilters() {
    const response = await fetch(`${API_BASE}/api/public/companies/filters`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'mc_site-build/1.0'
        }
    });

    if (!response.ok) {
        return null; // Filters are optional
    }

    const data = await response.json();
    if (data.error) {
        return null;
    }

    return data;
}

/**
 * Load existing cached data
 */
function loadCachedData() {
    if (!existsSync(OUTPUT_PATH)) {
        return null;
    }

    try {
        const content = readFileSync(OUTPUT_PATH, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.warn('[seed] Failed to load cached data:', error.message);
        return null;
    }
}

/**
 * Main seeding function
 */
async function seed() {
    console.log('[seed] Starting company data seeding...');

    let companiesData = null;
    let filtersData = null;
    let fromCache = false;

    try {
        // Try to fetch from API
        console.log('[seed] Fetching from API:', API_BASE);
        companiesData = await fetchCompanies();
        filtersData = await fetchFilters();
        console.log('[seed] API fetch successful:', companiesData.companies?.length || 0, 'companies');
    } catch (error) {
        console.warn('[seed] API unavailable:', error.message);

        // Fall back to cached data (only if it has actual companies)
        const cached = loadCachedData();
        if (cached && cached.companies && cached.companies.length > 0) {
            console.log('[seed] Using cached data from previous build:', cached.companies.length, 'companies');
            companiesData = { companies: cached.companies, pagination: cached.pagination };
            filtersData = cached.filters;
            fromCache = true;
        } else {
            console.log('[seed] No valid cached data - using fallback mock data');
            companiesData = FALLBACK_MOCK_DATA;
        }
    }

    // Determine source label
    let source = 'api';
    let fetchedAt = new Date().toISOString();
    if (fromCache) {
        source = 'cache';
        fetchedAt = loadCachedData()?.metadata?.fetchedAt || fetchedAt;
    } else if (companiesData === FALLBACK_MOCK_DATA) {
        source = 'fallback';
        fetchedAt = null;
    }

    // Build output data
    const outputData = {
        companies: companiesData.companies || [],
        pagination: companiesData.pagination || { total: 0, limit: 100, offset: 0, hasMore: false },
        filters: filtersData || null,
        metadata: {
            fetchedAt,
            buildAt: new Date().toISOString(),
            source,
            apiBase: API_BASE
        }
    };

    // Write to output file
    writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2));
    console.log('[seed] Written to:', OUTPUT_PATH);
    console.log('[seed] Companies:', outputData.companies.length);
    console.log('[seed] Source:', outputData.metadata.source);
    console.log('[seed] Seeding complete');
}

// Run the script
seed().catch(error => {
    console.error('[seed] Fatal error:', error);
    // Don't fail the build - just use empty data
    const emptyData = {
        companies: [],
        pagination: { total: 0, limit: 100, offset: 0, hasMore: false },
        filters: null,
        metadata: {
            fetchedAt: null,
            buildAt: new Date().toISOString(),
            source: 'error',
            error: error.message
        }
    };
    writeFileSync(OUTPUT_PATH, JSON.stringify(emptyData, null, 2));
    console.log('[seed] Written empty fallback data');
});
