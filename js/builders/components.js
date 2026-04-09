// js/builders/components.js
// UI components for builder directory
import { outboundUrl } from '../lib/outbound.js';

/**
 * Ensure a URL has a protocol prefix.
 * Handles missing protocol, www-only, and mixed-case schemes.
 */
function normalizeUrl(url) {
    if (!url) return '';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}

const SYNOPSIS_SECTION_LABELS = {
    problem: 'Problem',
    solution: 'Solution',
    fieldValidation: 'Field Validation',
    technologyMaturity: 'Technology Maturity',
    strategicAdvantage: 'Strategic Advantage',
    goToMarketAccess: 'Go-To-Market Access',
    dualUsePotential: 'Dual-Use Potential',
    team: 'Team',
    competitiveLandscape: 'Competitive Landscape',
    primaryUser: 'Primary User',
    userCriticalProblem: 'User-Critical Problem'
};

function renderParagraphs(text) {
    if (!text) return '';
    return String(text)
        .split(/\n\n+/)
        .map(paragraph => paragraph.trim())
        .filter(Boolean)
        .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
        .join('');
}

function renderProfileSection(company) {
    if (company.synopsisSections && typeof company.synopsisSections === 'object') {
        const sections = Object.entries(company.synopsisSections)
            .filter(([, value]) => typeof value === 'string' && value.trim());

        if (sections.length > 0) {
            const content = sections.map(([key, value]) => `
                <div class="modal-rich-block">
                    <h5 class="modal-rich-block__title">${escapeHtml(SYNOPSIS_SECTION_LABELS[key] || key)}</h5>
                    ${renderParagraphs(value)}
                </div>
            `).join('');

            return `
                <div class="modal-section">
                    <h4 class="modal-section-title">Profile</h4>
                    <div class="modal-rich-grid">${content}</div>
                </div>
            `;
        }
    }

    if (company.synopsisRaw) {
        return `
            <div class="modal-section">
                <h4 class="modal-section-title">Profile</h4>
                ${renderParagraphs(company.synopsisRaw)}
            </div>
        `;
    }

    return '';
}

/**
 * Render a builder card (YC Launches style with rocket upvote)
 * @param {Object} company - Company data
 * @returns {string} - HTML string
 */
export function renderBuilderCard(company) {
    // Use real upvote count from API
    const upvoteCount = company.upvoteCount || 0;

    const logoHtml = company.logo
        ? `<img src="${escapeHtml(company.logo)}" alt="${escapeHtml(company.name)} logo" class="builder-card__logo">`
        : `<div class="builder-card__logo-placeholder">${escapeHtml(company.name.charAt(0))}</div>`;

    // Mission area tags
    const missionTags = (company.missionAreas || []).slice(0, 2)
        .map(m => `<span class="builder-tag mission">${escapeHtml(m)}</span>`)
        .join('');

    // Warfare domain tag
    const domainTag = company.warfareDomain
        ? `<span class="builder-tag domain">${escapeHtml(company.warfareDomain)}</span>`
        : '';

    // TRL badge if available
    const trlBadge = company.trlLevel
        ? `<span class="builder-tag trl">TRL ${escapeHtml(company.trlLevel)}</span>`
        : '';

    // Cohort tag
    const cohortTag = company.cohort
        ? `<span class="builder-tag cohort">${escapeHtml(company.cohort)}</span>`
        : '';

    // Use displayName if available, otherwise name
    const displayName = company.displayName || company.name;

    return `
        <article class="builder-card" data-id="${escapeHtml(company.id)}" tabindex="0" role="button" aria-label="View ${escapeHtml(company.name)} details">
            <div class="builder-card__upvote">
                <button class="builder-card__upvote-btn" data-company-id="${escapeHtml(company.id)}" aria-label="Upvote ${escapeHtml(company.name)}">
                    <span class="track-icon">▲</span>
                </button>
                <span class="builder-card__upvote-count">${upvoteCount}</span>
            </div>
            ${logoHtml}
            <div class="builder-card__content">
                <h3 class="builder-card__name">${escapeHtml(displayName)}</h3>
                <p class="builder-card__tagline">${escapeHtml(company.tagline)}</p>
                <div class="builder-card__tags">
                    ${missionTags}
                    ${domainTag}
                    ${trlBadge}
                    ${cohortTag}
                </div>
            </div>
        </article>
    `;
}

/**
 * Render the modal content for a company
 * @param {Object} company - Company data
 * @param {Object} options - Render options
 * @param {boolean} options.authenticated - Whether user is authenticated
 * @param {Object} options.user - Current user info (if authenticated)
 * @returns {string} - HTML string
 */
export function renderBuilderModal(company, options = {}) {
    const { authenticated = false, user = null, isAdminUser = false } = options;
    const logoHtml = company.logo
        ? `<img src="${escapeHtml(company.logo)}" alt="${escapeHtml(company.name)} logo" class="modal-logo">`
        : `<div class="modal-logo" style="display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;background:linear-gradient(135deg,#667eea,#764ba2);">${escapeHtml(company.name.charAt(0))}</div>`;

    const websiteUrl = normalizeUrl(company.website || '');
    const websiteDisplay = websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const companySlug = toSlug(company.name);
    const websiteGoUrl = outboundUrl(websiteUrl, companySlug, 'builders');
    const websiteHtml = websiteUrl
        ? `<a href="${escapeHtml(websiteGoUrl)}" target="_blank" rel="noopener" class="modal-website">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            ${escapeHtml(websiteDisplay)}
           </a>`
        : '';

    // Mission area tags
    const missionTags = (company.missionAreas || [])
        .map(m => `<span class="builder-tag mission">${escapeHtml(m)}</span>`)
        .join('');

    // Domain tag
    const domainTag = company.warfareDomain
        ? `<span class="builder-tag domain">${escapeHtml(company.warfareDomain)}</span>`
        : '';

    const contentSection = `
        <div class="modal-section">
            <h4 class="modal-section-title">About</h4>
            ${renderParagraphs(company.description || company.problemStatement || company.tagline)}
        </div>
    `;
    const profileSection = renderProfileSection(company);

    // Classification tags — mission areas and warfare domains inline
    const classificationTags = [missionTags, domainTag].filter(Boolean).join('');
    const classificationSection = classificationTags ? `
        <div class="modal-section">
            <h4 class="modal-section-title">Classification</h4>
            <div class="modal-tags">${classificationTags}</div>
        </div>
    ` : '';

    // Company details section — enriched with new fields
    const detailItems = [];
    if (company.trlLevel) {
        const maturity = company.technicalMaturity ? ` (${escapeHtml(company.technicalMaturity)})` : '';
        detailItems.push(`<span class="modal-detail-item"><strong>TRL:</strong> ${escapeHtml(company.trlLevel)}${maturity}</span>`);
    }
    if (company.teamSize) detailItems.push(`<span class="modal-detail-item"><strong>Team:</strong> ${escapeHtml(company.teamSize)}</span>`);
    if (company.productType) detailItems.push(`<span class="modal-detail-item"><strong>Type:</strong> ${escapeHtml(company.productType)}</span>`);
    if (company.technologyArea) detailItems.push(`<span class="modal-detail-item"><strong>Tech:</strong> ${escapeHtml(company.technologyArea)}</span>`);
    if (company.location) detailItems.push(`<span class="modal-detail-item"><strong>Location:</strong> ${escapeHtml(company.location)}</span>`);
    if (company.pipelineStage) detailItems.push(`<span class="modal-detail-item"><strong>Status:</strong> ${escapeHtml(company.pipelineStage === 'alumni' ? 'Alumni' : 'Applicant')}</span>`);

    const detailsSection = detailItems.length > 0 ? `
        <div class="modal-section">
            <h4 class="modal-section-title">Details</h4>
            <div class="modal-details">${detailItems.join('')}</div>
        </div>
    ` : '';

    // Video/Pitch links - private content, requires authentication
    // Show placeholder for unauthenticated users to indicate restricted content
    let linksSection = '';
    const hasPrivateResources = company.videoUrl || company.pitchUrl;

    if (hasPrivateResources) {
        if (authenticated && user) {
            // Authenticated: show actual resource links
            const linksHtml = [];
            if (company.videoUrl) {
                linksHtml.push(`<a href="${escapeHtml(company.videoUrl)}" target="_blank" rel="noopener" class="modal-link">View Demo</a>`);
            }
            if (company.pitchUrl) {
                linksHtml.push(`<a href="${escapeHtml(company.pitchUrl)}" target="_blank" rel="noopener" class="modal-link">View Pitch</a>`);
            }
            linksSection = `
                <div class="modal-section">
                    <h4 class="modal-section-title">Resources</h4>
                    <div class="modal-links">${linksHtml.join('')}</div>
                </div>
            `;
        } else {
            // Unauthenticated: show restricted access placeholder
            // C2UX: operational language, no consumer terms
            const resourceCount = (company.videoUrl ? 1 : 0) + (company.pitchUrl ? 1 : 0);
            const resourceText = resourceCount === 1
                ? (company.videoUrl ? 'Demo video' : 'Pitch materials')
                : 'Demo video and pitch materials';
            linksSection = `
                <div class="modal-section modal-section--restricted">
                    <h4 class="modal-section-title">Resources</h4>
                    <div class="modal-restricted-placeholder">
                        <span class="modal-restricted-placeholder__icon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </span>
                        <span class="modal-restricted-placeholder__text">
                            ${escapeHtml(resourceText)} available after authentication
                        </span>
                    </div>
                </div>
            `;
        }
    }

    // Access control box - operational language per C2UX
    // Show different content based on authentication status
    let ctaBox;
    if (authenticated && user) {
        // Authenticated user: show contact/coordination options
        ctaBox = `
            <div class="modal-cta-box modal-cta-box--authenticated">
                <h4 class="modal-cta-box__title">Authorized Access</h4>
                <p class="modal-cta-box__text">
                    Authenticated as ${escapeHtml(user.email || user.name || 'user')}. Contact and coordination available.
                </p>
                <div class="modal-cta-box__actions">
                    ${company.founders ? `
                        <button class="modal-cta-btn modal-cta-btn--primary" onclick="navigator.clipboard.writeText('${escapeHtml(company.founders)}')">
                            Copy Contact
                        </button>
                    ` : ''}
                    ${websiteUrl ? `
                        <a href="${escapeHtml(websiteGoUrl)}" target="_blank" rel="noopener" class="modal-cta-btn modal-cta-btn--secondary">
                            External Site
                        </a>
                    ` : ''}
                    <a href="/auth/logout?returnTo=/builders" class="modal-cta-btn modal-cta-btn--tertiary">
                        Sign Out
                    </a>
                </div>
            </div>
        `;
    } else {
        // Not authenticated: show login prompt
        ctaBox = `
            <div class="modal-cta-box">
                <h4 class="modal-cta-box__title">Restricted Access</h4>
                <p class="modal-cta-box__text">
                    Authentication required for pitch materials and direct coordination.
                </p>
                <div class="modal-cta-box__actions">
                    <a href="/auth/login?returnTo=${encodeURIComponent(window.location.pathname)}" class="modal-cta-btn modal-cta-btn--primary">
                        Authenticate
                    </a>
                    ${websiteUrl ? `
                        <a href="${escapeHtml(websiteGoUrl)}" target="_blank" rel="noopener" class="modal-cta-btn modal-cta-btn--secondary">
                            External Site
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Use displayName if available
    const displayName = company.displayName || company.name;
    const entitySlug = toSlug(company.name);
    const entityLink = `<a href="/companies/${entitySlug}" class="modal-entity-link">Full profile</a>`;

    const editBtn = isAdminUser
        ? `<button class="modal-edit-btn" id="modal-edit-toggle" data-company-id="${escapeHtml(company.id)}" title="Edit company">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>`
        : '';

    return `
        <div class="modal-header">
            ${logoHtml}
            <div class="modal-title-section">
                <h2 class="modal-title">${escapeHtml(displayName)}</h2>
                <div class="modal-cohort">${escapeHtml(company.cohort || '')} · ${entityLink} ${editBtn}</div>
                ${websiteHtml}
            </div>
        </div>
        <div class="modal-body">
            ${detailsSection}
            ${classificationSection}
            ${contentSection}
            ${profileSection}
            ${linksSection}
        </div>
        ${ctaBox}
    `;
}

/**
 * Check if user is an admin (mc-admins group)
 * @param {Object} user - User object from auth
 * @returns {boolean}
 */
export function isAdmin(user) {
    if (!user || !user.groups) return false;
    const groups = Array.isArray(user.groups) ? user.groups : [];
    return groups.some(g => String(g).toLowerCase() === 'mc-admins');
}

/**
 * Render the edit form for a company (admin only)
 * @param {Object} company - Company data
 * @returns {string} - HTML string
 */
export function renderBuilderEditForm(company) {
    const CTA_OPTIONS = ['AAI', 'BIO', 'LOG', 'Q-BID', 'SCADE', 'SHY'];
    const companyCtas = company.ctas || [];

    const ctaChips = CTA_OPTIONS.map(cta => {
        const active = companyCtas.includes(cta) ? ' active' : '';
        return `<button type="button" class="edit-cta-chip${active}" data-cta="${cta}">${cta}</button>`;
    }).join('');

    const PIPELINE_OPTIONS = ['alumni', 'applicant'];
    const pipelineSelect = PIPELINE_OPTIONS.map(p =>
        `<option value="${p}"${company.pipelineStage === p ? ' selected' : ''}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>`
    ).join('');

    const FUNDING_OPTIONS = ['', 'Angel/Private', 'Bootstrapped', 'Grant Funded', 'Series Funding'];
    const fundingSelect = FUNDING_OPTIONS.map(f =>
        `<option value="${escapeHtml(f)}"${company.fundingStage === f ? ' selected' : ''}>${f || '—'}</option>`
    ).join('');

    return `
        <form class="edit-form" id="company-edit-form" data-company-id="${escapeHtml(company.id)}">
            <div class="edit-form__group">
                <label class="edit-form__label">Company Name</label>
                <input type="text" name="name" value="${escapeAttr(company.name)}" class="edit-form__input" required>
            </div>
            <div class="edit-form__group">
                <label class="edit-form__label">Product Name</label>
                <input type="text" name="productName" value="${escapeAttr(company.productName || '')}" class="edit-form__input">
            </div>
            <div class="edit-form__group">
                <label class="edit-form__label">Description</label>
                <textarea name="description" rows="4" class="edit-form__textarea">${escapeHtml(company.description || '')}</textarea>
            </div>
            <div class="edit-form__row">
                <div class="edit-form__group">
                    <label class="edit-form__label">Mission Area</label>
                    <input type="text" name="missionArea" value="${escapeAttr(company.missionArea || '')}" class="edit-form__input">
                </div>
                <div class="edit-form__group">
                    <label class="edit-form__label">Pipeline Stage</label>
                    <select name="pipelineStage" class="edit-form__select">${pipelineSelect}</select>
                </div>
            </div>
            <div class="edit-form__group">
                <label class="edit-form__label">Critical Technology Areas</label>
                <div class="edit-form__cta-chips" id="edit-cta-chips">${ctaChips}</div>
                <input type="hidden" name="ctas" id="edit-ctas-value" value="${escapeAttr(JSON.stringify(companyCtas))}">
            </div>
            <div class="edit-form__row">
                <div class="edit-form__group">
                    <label class="edit-form__label">Warfare Domain</label>
                    <input type="text" name="warfareDomain" value="${escapeAttr(company.warfareDomain || '')}" class="edit-form__input" placeholder="Air, Land, Sea">
                </div>
                <div class="edit-form__group">
                    <label class="edit-form__label">Technology Area</label>
                    <input type="text" name="technologyArea" value="${escapeAttr(company.technologyArea || '')}" class="edit-form__input">
                </div>
            </div>
            <div class="edit-form__row">
                <div class="edit-form__group">
                    <label class="edit-form__label">TRL Level</label>
                    <input type="number" name="trlLevel" min="1" max="9" value="${company.trlLevel || ''}" class="edit-form__input">
                </div>
                <div class="edit-form__group">
                    <label class="edit-form__label">Funding Stage</label>
                    <select name="fundingStage" class="edit-form__select">${fundingSelect}</select>
                </div>
                <div class="edit-form__group">
                    <label class="edit-form__label">Product Type</label>
                    <input type="text" name="productType" value="${escapeAttr(company.productType || '')}" class="edit-form__input" placeholder="Software, Hardware, Both">
                </div>
            </div>
            <div class="edit-form__row">
                <div class="edit-form__group">
                    <label class="edit-form__label">Website</label>
                    <input type="text" name="website" value="${escapeAttr(company.website || '')}" class="edit-form__input">
                </div>
                <div class="edit-form__group">
                    <label class="edit-form__label">Location</label>
                    <input type="text" name="location" value="${escapeAttr(company.location || '')}" class="edit-form__input">
                </div>
            </div>
            <div class="edit-form__actions">
                <button type="submit" class="edit-form__save">Save Changes</button>
                <button type="button" class="edit-form__cancel" id="edit-cancel">Cancel</button>
            </div>
            <div class="edit-form__status" id="edit-status"></div>
        </form>
    `;
}

function escapeAttr(str) {
    if (str == null) return '';
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Render empty state - operational language per C2UX
 * @returns {string} - HTML string
 */
export function renderEmptyState() {
    return `
        <div class="empty-state">
            <h3>No results</h3>
            <p>Adjust filter parameters.</p>
        </div>
    `;
}

/**
 * Render loading state - operational language per C2UX
 * @returns {string} - HTML string
 */
export function renderLoadingState() {
    return `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Retrieving data...</p>
        </div>
    `;
}

/**
 * Render error state - operational language per C2UX
 * @param {string} message - Error message
 * @returns {string} - HTML string
 */
export function renderErrorState(message) {
    return `
        <div class="empty-state">
            <h3>Data unavailable</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

/**
 * Generate URL slug from company name (matches optimize-static.mjs)
 * @param {string} name - Company name
 * @returns {string} - URL slug
 */
function toSlug(name) {
    return name
        .replace(/,?\s*(Inc\.?|LLC\.?|Corporation|Corp\.?|Technologies|Technology)\s*/gi, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();
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
