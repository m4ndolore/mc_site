// js/combine/cohort.js
// Combine cohort directory — displays companies from API with category filtering

const API_BASE = 'https://api.sigmablox.com';

let allCompanies = [];
let currentFilter = 'all';

const filterContainer = document.querySelector('.filter-tags');
const gridContainer = document.querySelector('#cohort-grid');
const resultsCount = document.getElementById('portfolio-count');

const CATEGORY_MAP = {
    'Autonomy': 'autonomy',
    'ISR': 'isr',
    'Intel and Battlespace Awareness': 'isr',
    'Intelligence': 'isr',
    'Logistics': 'logistics',
    'Cyber': 'cyber',
    'Command and Control': 'c2',
    'C2': 'c2',
    'Fires': 'autonomy',
    'Joint Fires (Offense)': 'autonomy'
};

function getCategories(company) {
    const categories = new Set();
    if (company.missionArea) {
        const cat = CATEGORY_MAP[company.missionArea];
        if (cat) categories.add(cat);
    }
    if (company.secondaryMissions && Array.isArray(company.secondaryMissions)) {
        company.secondaryMissions.forEach(mission => {
            const cat = CATEGORY_MAP[mission];
            if (cat) categories.add(cat);
        });
    }
    return Array.from(categories);
}

function normalizeUrl(url) {
    if (!url) return '';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Extract the problem summary from the description blob.
 * Looks for text after "Problem\n" up to the next section header,
 * or falls back to the first ~200 chars.
 */
function extractSummary(description) {
    if (!description) return '';
    // Try to extract just the Problem section
    const problemMatch = description.match(/Problem\n([\s\S]*?)(?:\n(?:Solution|Field|Technology|Strategic|Go-to-Market|Dual-Use|Team|Competitive|Primary|User-Critical)\b)/i);
    if (problemMatch) {
        return problemMatch[1].trim().replace(/\n/g, ' ');
    }
    // Fallback: first sentence or 200 chars
    const firstLine = description.split('\n')[0].trim();
    if (firstLine.length > 10) return firstLine;
    return description.substring(0, 200).replace(/\n/g, ' ').trim();
}

/**
 * Get a company logo URL. Prefers cfImageId, falls back to logoUrl.
 */
function getLogoUrl(company) {
    if (company.cfImageId) {
        return `https://imagedelivery.net/9Lsa8lkCUz_we5KeaTm7fw/${company.cfImageId}/public`;
    }
    // Skip logoUrl — Airtable signed URLs expire within hours
    return null;
}

function renderCard(company) {
    const categories = getCategories(company);
    const categoryAttr = categories.join(' ');
    const primaryCategory = categories[0] || 'autonomy';

    const companyName = company.name || company.companyName || 'Unknown';

    const tagsHtml = categories.map(cat =>
        `<span class="case-tag case-tag--${cat}">${cat.toUpperCase()}</span>`
    ).join('');

    const summary = extractSummary(company.description);

    // Logos disabled until image quality is cleaned up in the source database
    const logoHtml = `<span style="font-family: var(--font-mono); font-size: 14px; font-weight: 600; color: rgba(255,255,255,.7); letter-spacing: .05em; text-align: center; padding: 0 12px;">${escapeHtml(companyName)}</span>`;

    return `
        <article class="portfolio-card" data-category="${categoryAttr}" data-id="${company.airtableId || company.id}">
            <div class="portfolio-card__visual" style="display: flex; align-items: center; justify-content: center; min-height: 100px;">
                <div class="portfolio-card__gradient portfolio-card__gradient--${primaryCategory}"></div>
                <div class="portfolio-card__pattern"></div>
                <div style="position: relative; z-index: 1;">
                    ${logoHtml}
                </div>
            </div>
            <div class="portfolio-card__content">
                <h3 class="portfolio-card__title">${escapeHtml(companyName)}</h3>
                ${company.productName ? `<p style="font-size: 13px; color: rgba(255,255,255,.5); margin: -4px 0 8px; font-family: var(--font-mono); letter-spacing: .02em;">${escapeHtml(company.productName)}</p>` : ''}
                <p class="portfolio-card__description" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                    ${escapeHtml(summary)}
                </p>
                <div class="portfolio-card__tags">
                    ${tagsHtml}
                </div>
                ${company.website ? `
                <a href="${escapeHtml(normalizeUrl(company.website))}" class="portfolio-card__link" target="_blank" rel="noopener">
                    Website
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </a>
                ` : ''}
            </div>
        </article>
    `;
}

function renderGrid(companies) {
    if (!gridContainer) return;
    if (companies.length === 0) {
        gridContainer.innerHTML = '<div class="portfolio-empty"><p>No companies found.</p></div>';
        return;
    }
    gridContainer.innerHTML = companies.map(renderCard).join('');
}

function updateResultsCount(visible, total) {
    if (!resultsCount) return;
    resultsCount.textContent = `${visible} of ${total} companies`;
}

function applyFilter(filter) {
    currentFilter = filter;

    if (filterContainer) {
        filterContainer.querySelectorAll('.filter-tag').forEach(btn => {
            btn.classList.toggle('filter-tag--active', btn.dataset.filter === filter);
        });
    }

    let visibleCount = 0;
    if (gridContainer) {
        gridContainer.querySelectorAll('.portfolio-card').forEach(card => {
            const categories = card.dataset.category?.split(' ') || [];
            const show = filter === 'all' || categories.includes(filter);
            card.style.display = show ? '' : 'none';
            if (show) visibleCount++;
        });
    }

    updateResultsCount(visibleCount, allCompanies.length);
}

function setupFilters() {
    if (!filterContainer) return;
    filterContainer.querySelectorAll('.filter-tag').forEach(btn => {
        btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
    });
}

function isLocalhost() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

async function loadSeededData() {
    try {
        const response = await fetch('/data/companies.json');
        if (!response.ok) return null;
        const data = await response.json();
        if (data.companies && Array.isArray(data.companies) && data.companies.length > 0) {
            return data.companies;
        }
        return null;
    } catch (error) {
        console.warn('[Cohort] Failed to load seeded data:', error.message);
        return null;
    }
}

async function loadCompanies() {
    if (isLocalhost()) {
        const seededData = await loadSeededData();
        if (seededData) return seededData;
        console.warn('[Cohort] No seeded data available on localhost');
        return [];
    }

    try {
        const response = await fetch(`${API_BASE}/api/public/companies?limit=100`);
        if (!response.ok) throw new Error(`Failed to load data: ${response.status}`);
        const data = await response.json();
        if (data.companies && data.companies.length > 0) return data.companies;
        throw new Error('API returned empty data');
    } catch (error) {
        console.warn('[Cohort] Live API failed:', error.message, '- trying seeded data');
        const seededData = await loadSeededData();
        if (seededData) return seededData;
        console.error('[Cohort] No data available');
        return [];
    }
}

async function init() {
    const raw = await loadCompanies();

    // Filter to real records: must have description >50 chars and a mission area
    allCompanies = raw.filter(c =>
        c.description && c.description.length > 50 && c.missionArea
    );

    // Deduplicate by name (keep first occurrence)
    const seen = new Set();
    allCompanies = allCompanies.filter(c => {
        const key = (c.name || '').toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    if (allCompanies.length === 0) {
        console.warn('[Cohort] No company data available');
        return;
    }

    renderGrid(allCompanies);
    setupFilters();
    updateResultsCount(allCompanies.length, allCompanies.length);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
