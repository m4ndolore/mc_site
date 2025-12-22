// js/builders/index.js
// Main entry point for builder directory

import { fetchCohorts, extractCompanies, extractFilterOptions } from './api.js';
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

// State
let allCompanies = [];
let currentCompany = null;

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

    try {
        // Fetch data
        const data = await fetchCohorts();
        console.log('[Builders] Fetched cohorts:', data);

        // Extract companies
        allCompanies = extractCompanies(data.cohorts || data);
        console.log('[Builders] Extracted companies:', allCompanies.length);

        // Extract filter options
        const filterOptions = extractFilterOptions(allCompanies);

        // Update stats
        updateStats({
            builders: allCompanies.length,
            missionAreas: filterOptions.missionAreas.length,
            ctas: filterOptions.ctas.length,
            cohorts: filterOptions.cohorts.length
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

    if (modalBody) modalBody.innerHTML = renderBuilderModal(currentCompany);
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

    // Filter dropdowns
    ['filter-mission', 'filter-cta', 'filter-cohort'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', applyFilters);
    });

    // Modal close button
    if (modalClose) modalClose.addEventListener('click', closeModal);

    // Modal overlay click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
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
