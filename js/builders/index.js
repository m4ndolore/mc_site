// js/builders/index.js
// Main entry point for builder directory

import {
    fetchCompanies,
    fetchFilterOptions,
    extractCompanies,
    extractFilterOptions
} from './api.js';
import {
    renderBuilderCard,
    renderBuilderModal,
    renderEmptyState,
    renderLoadingState,
    renderErrorState
} from './components.js';
import {
    filterCompanies,
    populateFilters,
    getFilterState,
    updateStats,
    updateResultsCount
} from './filters.js';
import { checkAuth } from './auth.js';

// State
let allCompanies = [];
let currentCompany = null;
let authState = { authenticated: false, user: null };

// DOM Elements
const grid = document.getElementById('builders-grid');
const modal = document.getElementById('builder-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

/**
 * Initialize the builder directory
 */
async function init() {
    console.log('[Builders] Initializing...');

    // Show loading state
    if (grid) grid.innerHTML = renderLoadingState();

    // Check auth status in parallel with data fetch
    checkAuth().then(state => {
        authState = state;
        console.log('[Builders] Auth state:', authState.authenticated ? 'authenticated' : 'anonymous');
    }).catch(err => {
        console.warn('[Builders] Auth check failed:', err.message);
    });

    try {
        // Fetch companies from API
        const data = await fetchCompanies({ limit: 100 });
        console.log('[Builders] Fetched data:', data);

        // Extract and normalize companies
        allCompanies = extractCompanies(data);
        console.log('[Builders] Processed companies:', allCompanies.length);

        // Try to get filter options from API, fall back to extracting from data
        let filterOptions;
        try {
            filterOptions = await fetchFilterOptions();
            console.log('[Builders] Fetched filter options from API');
        } catch (filterError) {
            console.warn('[Builders] Filter API unavailable, extracting from data');
            filterOptions = extractFilterOptions(allCompanies);
        }

        // Update stats
        updateStats({
            builders: data.total || allCompanies.length,
            missionAreas: filterOptions.missionAreas?.length || 0,
            warfareDomains: filterOptions.warfareDomains?.length || 0,
            fundingStages: filterOptions.fundingStages?.length || 0,
            // Legacy support
            ctas: filterOptions.warfareDomains?.length || filterOptions.ctas?.length || 0
        });

        // Populate filter dropdowns
        populateFilters(filterOptions);

        // Render initial view
        renderBuilders(allCompanies);

        // Setup event listeners
        setupEventListeners();

        console.log('[Builders] Initialization complete');
    } catch (error) {
        console.error('[Builders] Failed to initialize:', error);
        if (grid) grid.innerHTML = renderErrorState(error.message);
    }
}

/**
 * Render the builder cards
 * @param {Array} companies - Companies to render
 */
function renderBuilders(companies) {
    if (!grid) return;

    updateResultsCount(companies.length);

    if (companies.length === 0) {
        grid.innerHTML = renderEmptyState();
        return;
    }

    grid.innerHTML = companies.map(renderBuilderCard).join('');

    // Add click handlers to cards
    grid.querySelectorAll('.builder-card').forEach(card => {
        card.addEventListener('click', () => openModal(card.dataset.id));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(card.dataset.id);
            }
        });
    });
}

/**
 * Apply filters and re-render
 */
function applyFilters() {
    const filters = getFilterState();
    const filtered = filterCompanies(allCompanies, filters);
    renderBuilders(filtered);
}

/**
 * Open the modal for a company
 * @param {string} companyId - Company ID
 */
function openModal(companyId) {
    currentCompany = allCompanies.find(c => c.id === companyId);
    if (!currentCompany) return;

    // Pass auth state to modal renderer
    if (modalBody) {
        modalBody.innerHTML = renderBuilderModal(currentCompany, {
            authenticated: authState.authenticated,
            user: authState.user
        });
    }
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the modal
 */
function closeModal() {
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    currentCompany = null;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search input (debounced)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyFilters, 300);
        });
    }

    // Filter dropdowns - support both new and legacy IDs
    const filterIds = [
        'filter-mission',
        'filter-domain',
        'filter-funding',
        'filter-cohort',
        'filter-tech'  // Legacy
    ];
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', applyFilters);
    });

    // Modal close button
    if (modalClose) modalClose.addEventListener('click', closeModal);

    // Modal overlay click (close when clicking outside modal-content)
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-overlay')) {
                closeModal();
            }
        });
    }

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('active')) {
            closeModal();
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
