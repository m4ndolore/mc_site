// js/builders/components.js
// UI components for builder directory

/**
 * Render a builder card
 * @param {Object} company - Company data
 * @returns {string} - HTML string
 */
export function renderBuilderCard(company) {
    const logoHtml = company.logo
        ? `<img src="${escapeHtml(company.logo)}" alt="${escapeHtml(company.name)} logo" class="builder-card-logo">`
        : `<div class="builder-card-logo" style="display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:#666;">${escapeHtml(company.name.charAt(0))}</div>`;

    const missionTags = (company.missionAreas || []).slice(0, 2)
        .map(m => `<span class="builder-tag mission">${escapeHtml(m)}</span>`)
        .join('');

    const ctaTags = (company.ctas || []).slice(0, 1)
        .map(c => `<span class="builder-tag cta">${escapeHtml(c)}</span>`)
        .join('');

    return `
        <article class="builder-card" data-id="${escapeHtml(company.id)}" tabindex="0" role="button">
            ${logoHtml}
            <h3 class="builder-card-name">${escapeHtml(company.name)}</h3>
            <p class="builder-card-tagline">${escapeHtml(company.tagline)}</p>
            <div class="builder-card-tags">
                ${missionTags}
                ${ctaTags}
            </div>
        </article>
    `;
}

/**
 * Render the modal content for a company
 * @param {Object} company - Company data
 * @returns {string} - HTML string
 */
export function renderBuilderModal(company) {
    const logoHtml = company.logo
        ? `<img src="${escapeHtml(company.logo)}" alt="${escapeHtml(company.name)} logo" class="modal-logo">`
        : `<div class="modal-logo" style="display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;color:#666;">${escapeHtml(company.name.charAt(0))}</div>`;

    const websiteHtml = company.website
        ? `<a href="${escapeHtml(company.website)}" target="_blank" rel="noopener" class="modal-website">${escapeHtml(company.website.replace(/^https?:\/\//, ''))}</a>`
        : '';

    const missionTags = (company.missionAreas || [])
        .map(m => `<span class="builder-tag mission">${escapeHtml(m)}</span>`)
        .join('');

    const ctaTags = (company.ctas || [])
        .map(c => `<span class="builder-tag cta">${escapeHtml(c)}</span>`)
        .join('');

    const videoHtml = company.videoUrl
        ? `
            <div class="modal-section">
                <h4 class="modal-section-title">Video</h4>
                <div class="modal-video">
                    <iframe
                        src="${escapeHtml(company.videoUrl)}"
                        style="width:100%;aspect-ratio:16/9;border:none;border-radius:8px;"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                    ></iframe>
                </div>
            </div>
        `
        : '';

    return `
        <div class="modal-header">
            ${logoHtml}
            <div class="modal-title-section">
                <h2 class="modal-title">${escapeHtml(company.name)}</h2>
                <div class="modal-cohort">${escapeHtml(company.cohort)}</div>
                ${websiteHtml}
            </div>
        </div>
        <div class="modal-body">
            <div class="modal-section">
                <h4 class="modal-section-title">About</h4>
                <p>${escapeHtml(company.description || company.tagline)}</p>
            </div>
            ${missionTags ? `
                <div class="modal-section">
                    <h4 class="modal-section-title">Mission Areas</h4>
                    <div class="modal-tags">${missionTags}</div>
                </div>
            ` : ''}
            ${ctaTags ? `
                <div class="modal-section">
                    <h4 class="modal-section-title">Critical Technology Areas</h4>
                    <div class="modal-tags">${ctaTags}</div>
                </div>
            ` : ''}
            ${videoHtml}
        </div>
    `;
}

/**
 * Render empty state
 * @returns {string} - HTML string
 */
export function renderEmptyState() {
    return `
        <div class="empty-state">
            <h3>No builders found</h3>
            <p>Try adjusting your search or filters.</p>
        </div>
    `;
}

/**
 * Render loading state
 * @returns {string} - HTML string
 */
export function renderLoadingState() {
    return `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading builders...</p>
        </div>
    `;
}

/**
 * Render error state
 * @param {string} message - Error message
 * @returns {string} - HTML string
 */
export function renderErrorState(message) {
    return `
        <div class="empty-state">
            <h3>Failed to load builders</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
