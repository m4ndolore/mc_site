#!/usr/bin/env node
/**
 * optimize-static.mjs — SEO & AI visibility build step.
 *
 * Reads enriched companies.json and:
 *  1. Computes aggregate stats
 *  2. Injects stats + cards into builders.html
 *  3. Injects stats + grounding into dashboard.html
 *  4. Generates entity pages at companies/{slug}.html
 *  5. Generates faq.html
 *  6. Generates sitemap.xml
 *  7. Updates llms.txt
 *
 * Run: node scripts/optimize-static.mjs
 * No external dependencies — Node built-ins only.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_PATH = join(ROOT, 'public', 'data', 'companies.json');
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const CF_IMAGES_BASE = 'https://imagedelivery.net/9Lsa8lkCUz_we5KeaTm7fw';

// ── Helpers ──────────────────────────────────────────────────────────

function getLogoUrl(c) {
  if (c.cfImageId) return `${CF_IMAGES_BASE}/${c.cfImageId}/public`;
  return null; // Airtable URLs expire — don't use logoUrl
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsonLd(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/</g, '\\u003c');
}

function truncate(str, max) {
  if (!str) return '';
  const s = str.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 3).replace(/\s+\S*$/, '') + '...';
}

function toSlug(name) {
  return name
    .replace(/,?\s*(Inc\.?|LLC\.?|Corporation|Corp\.?|Technologies|Technology)\s*/gi, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function getUniqueWarfareDomains(companies) {
  const domains = new Set();
  for (const c of companies) {
    if (c.warfareDomain) {
      c.warfareDomain.split(',').map(d => d.trim()).filter(Boolean).forEach(d => domains.add(d));
    }
  }
  return [...domains].sort();
}

function getUniqueMissionAreas(companies) {
  const areas = new Set();
  for (const c of companies) {
    if (c.missionArea) areas.add(c.missionArea);
  }
  return [...areas].sort();
}

function getRecentCount(companies) {
  const thirtyDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return companies.filter(c => {
    const t = c.metadata?.enrichedAt ? new Date(c.metadata.enrichedAt).getTime() : 0;
    return t > thirtyDaysAgo;
  }).length;
}

// ── Load Data ────────────────────────────────────────────────────────

console.log('[optimize] Loading enriched companies.json...');
const raw = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
const companies = raw.companies;

const alumni = companies.filter(c => c.pipelineStage === 'alumni');
const applicants = companies.filter(c => c.pipelineStage === 'applicant');
const missionAreas = getUniqueMissionAreas(companies);
const warfareDomains = getUniqueWarfareDomains(companies);
const cohorts = [...new Set(companies.map(c => c.cohortLabel).filter(Boolean))];
const recentCount = getRecentCount(companies);

const stats = {
  total: companies.length,
  alumni: alumni.length,
  applicants: applicants.length,
  missionAreas: missionAreas.length,
  warfareDomains: warfareDomains.length,
  cohorts: cohorts.length || 1,
  recent: recentCount,
};

console.log(`[optimize] ${stats.total} companies (${stats.alumni} alumni, ${stats.applicants} applicants)`);
console.log(`[optimize] ${stats.missionAreas} mission areas, ${stats.warfareDomains} warfare domains`);

// ── 1. Builders Page ─────────────────────────────────────────────────

function buildCompanyCard(c) {
  const slug = toSlug(c.name);
  const desc = escapeHtml(truncate(c.description, 150));
  const firstDomain = c.warfareDomain ? c.warfareDomain.split(',')[0].trim() : '';

  let metaHtml = '';
  if (c.missionArea) {
    metaHtml += `<span class="builder-tag mission">${escapeHtml(c.missionArea)}</span>`;
  }
  if (firstDomain) {
    metaHtml += `<span class="builder-tag tech">${escapeHtml(firstDomain)}</span>`;
  }
  if (c.productType) {
    metaHtml += `<span class="builder-tag cohort">${escapeHtml(c.productType)}</span>`;
  }

  const logo = getLogoUrl(c);
  const logoHtml = logo
    ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(c.name)} logo" class="builder-card__logo" loading="lazy" width="48" height="48" style="width:48px;height:48px;object-fit:contain;border-radius:2px;background:rgba(255,255,255,.04);flex-shrink:0;">`
    : '';

  return `<a href="/companies/${slug}" class="builder-card" data-company-id="${escapeHtml(c.id)}" style="text-decoration:none;color:inherit;">
  <div class="builder-card__content" style="${logo ? 'display:flex;gap:14px;align-items:flex-start;' : ''}">
    ${logoHtml}<div>
    <h3 class="builder-card__name">${escapeHtml(c.name)}</h3>${c.productName ? `\n    <div class="builder-card__tagline" style="margin-bottom:8px;font-size:0.9rem;color:var(--text-secondary);">${escapeHtml(c.productName)}</div>` : ''}
    <div class="builder-card__tags">${metaHtml}</div>
    <p class="builder-card__tagline">${desc}</p>
    </div>
  </div>
</a>`;
}

function injectBuilders(html) {
  // 1. Fix H1
  html = html.replace(
    '<h1 class="builders-console__title">Builder Records</h1>',
    '<h1 class="builders-console__title">Defense Builders Directory</h1>'
  );

  // 2. Inject stats
  html = html.replace(
    /(<span class="builders-stats__value" id="stat-builders">)0(<\/span>)/,
    `$1${stats.total}$2`
  );
  html = html.replace(
    /(<span class="builders-stats__value" id="stat-mission-areas">)0(<\/span>)/,
    `$1${stats.missionAreas}$2`
  );
  html = html.replace(
    /(<span class="builders-stats__value" id="stat-tech-areas">)0(<\/span>)/,
    `$1${stats.warfareDomains}$2`
  );
  html = html.replace(
    /(<span class="builders-stats__value" id="stat-cohorts">)0(<\/span>)/,
    `$1${stats.cohorts}$2`
  );

  // 2b. Inject last refresh timestamp
  html = html.replace(
    /(<div class="rail-kv__value" id="builders-last-refresh">).*?(<\/div>)/,
    `$1Built ${BUILD_DATE}$2`
  );

  // 3. Grounding paragraph — insert before #builders-grid section (idempotent)
  const topMissions = missionAreas.slice(0, 4).join(', ');
  const groundingText = `<div class="builders-grounding" style="padding:0 0 20px;">
  <p style="font-size:0.95rem;line-height:1.6;color:var(--text-secondary,#a3a3a3);margin:0;">The Defense Builders Directory lists ${stats.total} companies evaluated for The Combine program by Merge Combinator. ${stats.alumni} alumni completed in-person operator validation in Cohort 25-1 (Tulsa, OK). ${stats.applicants} applicants are under review. Companies span ${stats.missionAreas} mission areas including ${topMissions} across ${stats.warfareDomains} warfare domains.</p>
</div>`;

  // Strip any existing grounding blocks before re-injecting
  html = html.replace(/<div class="builders-grounding"[\s\S]*?<\/div>\s*/g, '');
  html = html.replace(
    '<!-- Builders Grid -->',
    `${groundingText}\n          <!-- Builders Grid -->`
  );

  // 4. Replace skeleton cards with static company cards
  const alumniCards = alumni.map(buildCompanyCard).join('\n');
  const applicantDivider = `\n<div class="builders-grid__section-divider" style="padding:24px 0 12px;border-top:1px solid rgba(255,255,255,0.06);margin-top:16px;">
  <h2 class="builders-grid__section-title" style="font-size:1.25rem;font-weight:700;color:var(--text-primary,#e8e8e8);margin:0;">Applicants</h2>
</div>`;
  const applicantCards = applicants.map(buildCompanyCard).join('\n');

  const gridContent = alumniCards + applicantDivider + '\n' + applicantCards;

  // Replace the skeleton content inside #builders-grid
  html = html.replace(
    /<div class="builders-grid__items" id="builders-grid">[\s\S]*?<\/div>\s*<\/section>/,
    `<div class="builders-grid__items" id="builders-grid">\n${gridContent}\n</div>\n          </section>`
  );

  // 5. JSON-LD (idempotent — strip existing before injecting)
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
  const jsonLd = `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Defense Builders Directory — Merge Combinator",
    "url": "https://mergecombinator.com/builders",
    "description": "Directory of ${stats.total} defense technology companies evaluated for The Combine program by Merge Combinator.",
    "numberOfItems": ${stats.total}
  }
  </script>`;

  html = html.replace('</head>', `  ${jsonLd}\n</head>`);

  return html;
}

// ── 2. Dashboard Page ────────────────────────────────────────────────

function injectDashboard(html) {
  // 1. Replace skeleton metrics with real values
  html = html.replace(
    /(<div class="metric__value" id="metric-builders">)<span class="skeleton skeleton-metric"><\/span>(<\/div>)/,
    `$1${stats.total}$2`
  );
  html = html.replace(
    /(<div class="metric__value" id="metric-missions">)<span class="skeleton skeleton-metric"><\/span>(<\/div>)/,
    `$1${stats.missionAreas}$2`
  );
  html = html.replace(
    /(<div class="metric__value" id="metric-domains">)<span class="skeleton skeleton-metric"><\/span>(<\/div>)/,
    `$1${stats.warfareDomains}$2`
  );
  html = html.replace(
    /(<div class="metric__value" id="metric-recent">)<span class="skeleton skeleton-metric"><\/span>(<\/div>)/,
    `$1${stats.recent}$2`
  );

  // 2. Timestamp
  html = html.replace(
    /(<div class="dashboard__timestamp-value" id="dashboard-last-updated">)--:--:--(<\/div>)/,
    `$1Built ${BUILD_DATE}$2`
  );

  // 3. Grounding paragraph after subtitle (idempotent)
  html = html.replace(/<p class="dashboard__grounding"[^>]*>[\s\S]*?<\/p>\s*/g, '');
  const groundingText = `\n          <p class="dashboard__grounding" style="font-size:0.95rem;line-height:1.6;color:var(--text-secondary,#a3a3a3);margin:8px 0 0;">Operational view of ${stats.total} defense technology companies evaluated for The Combine program. ${stats.alumni} alumni completed in-person operator validation in Cohort 25-1. Data sourced from Merge Combinator&rsquo;s builder intake pipeline.</p>`;

  html = html.replace(
    /(<p class="dashboard__subtitle">Operational view of builder inventory, coverage, and recent records\.<\/p>)/,
    `$1${groundingText}`
  );

  // 4. JSON-LD (idempotent — strip existing before injecting)
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
  const jsonLd = `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Ecosystem Status — Merge Combinator",
    "url": "https://mergecombinator.com/dashboard",
    "description": "Operational view of ${stats.total} defense technology companies evaluated for The Combine program by Merge Combinator.",
    "numberOfItems": ${stats.total},
    "about": ["defense technology", "The Combine", "Cohort 25-1", "Merge Combinator"]
  }
  </script>`;

  html = html.replace('</head>', `  ${jsonLd}\n</head>`);

  return html;
}

// ── 3. Entity Pages ──────────────────────────────────────────────────

const SYNOPSIS_ORDER = [
  { key: 'problem', label: 'Problem' },
  { key: 'solution', label: 'Solution' },
  { key: 'fieldValidation', label: 'Field Validation' },
  { key: 'strategicAdvantage', label: 'Strategic Advantage' },
  { key: 'goToMarketAccess', label: 'Go-to-Market Access' },
  { key: 'dualUsePotential', label: 'Dual-Use Potential' },
  { key: 'team', label: 'Team' },
  { key: 'competitiveLandscape', label: 'Competitive Landscape' },
  { key: 'primaryUser', label: 'Primary User' },
  { key: 'userCriticalProblem', label: 'User-Critical Problem' },
  { key: 'technologyMaturity', label: 'Technology Maturity' },
];

const FOUC_SCRIPT = `(function(){var t=localStorage.getItem('mc-theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'}if(t==='light'){document.documentElement.classList.add('light-theme','no-transitions');requestAnimationFrame(function(){requestAnimationFrame(function(){document.documentElement.classList.remove('no-transitions')})})}})();`;

function renderSynopsisSections(sections) {
  if (!sections) return '';
  let html = '';
  for (const { key, label } of SYNOPSIS_ORDER) {
    const content = sections[key];
    if (!content) continue;
    const paragraphs = content.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    const pHtml = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n        ');
    html += `\n      <div class="company-page__section">
        <h2>${escapeHtml(label)}</h2>
        ${pHtml}
      </div>`;
  }
  return html;
}

function renderSynopsisRaw(raw) {
  if (!raw) return '';
  const paragraphs = raw.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  const pHtml = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n        ');
  return `\n      <div class="company-page__section">
        <h2>Synopsis</h2>
        ${pHtml}
      </div>`;
}

function buildMetaBadges(c) {
  const badges = [];
  if (c.pipelineStage) {
    const label = c.pipelineStage === 'alumni' ? 'Alumni' : 'Applicant';
    badges.push(`<span class="company-page__badge company-page__badge--stage">${escapeHtml(label)}</span>`);
  }
  if (c.missionArea) {
    badges.push(`<span class="company-page__badge company-page__badge--mission">${escapeHtml(c.missionArea)}</span>`);
  }
  if (c.warfareDomain) {
    c.warfareDomain.split(',').map(d => d.trim()).filter(Boolean).forEach(d => {
      badges.push(`<span class="company-page__badge company-page__badge--domain">${escapeHtml(d)}</span>`);
    });
  }
  if (c.productType) {
    badges.push(`<span class="company-page__badge company-page__badge--product">${escapeHtml(c.productType)}</span>`);
  }
  if (c.trlLevel) {
    badges.push(`<span class="company-page__badge company-page__badge--trl">TRL ${c.trlLevel}</span>`);
  }
  if (c.fundingStage) {
    badges.push(`<span class="company-page__badge company-page__badge--funding">${escapeHtml(c.fundingStage)}</span>`);
  }
  if (c.teamSize) {
    badges.push(`<span class="company-page__badge company-page__badge--team">${escapeHtml(c.teamSize)} people</span>`);
  }
  return badges.join('\n        ');
}

function generateEntityPage(c) {
  const slug = toSlug(c.name);
  const descTrunc = truncate(c.description, 155);
  const cohortOrPool = c.cohortLabel || 'Applicant Pool';

  let synopsisHtml = '';
  if (c.synopsisSections) {
    synopsisHtml = renderSynopsisSections(c.synopsisSections);
  } else if (c.synopsisRaw) {
    synopsisHtml = renderSynopsisRaw(c.synopsisRaw);
  }

  const descParagraphs = (c.description || '').split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  const descHtml = descParagraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n        ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script>${FOUC_SCRIPT}</script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(descTrunc)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="https://mergecombinator.com/companies/${slug}">
  <meta property="og:title" content="${escapeHtml(c.name)} — Merge Combinator">
  <meta property="og:description" content="${escapeHtml(descTrunc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://mergecombinator.com/companies/${slug}">
  <meta property="og:image" content="${getLogoUrl(c) || `${CF_IMAGES_BASE}/logo-arrows-2/public`}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(c.name)} — Merge Combinator">
  <meta name="twitter:description" content="${escapeHtml(descTrunc)}">
  <meta name="twitter:image" content="${getLogoUrl(c) || `${CF_IMAGES_BASE}/logo-arrows-2/public`}">
  <title>${escapeHtml(c.name)} — Merge Combinator</title>

  <link rel="icon" type="image/png" sizes="32x32" href="https://imagedelivery.net/9Lsa8lkCUz_we5KeaTm7fw/logo-arrows-2/public">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/styles/company.css">
  <link rel="stylesheet" href="/styles/light-theme.css">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "${escapeJsonLd(c.name)}",
    "url": "https://mergecombinator.com/companies/${slug}",
    "description": "${escapeJsonLd(c.description || '')}",
    "knowsAbout": [${c.missionArea ? `"${escapeJsonLd(c.missionArea)}"` : ''}],
    "memberOf": {
      "@type": "Organization",
      "name": "Merge Combinator — The Combine ${escapeJsonLd(cohortOrPool)}"
    }
  }
  </script>
</head>
<body>
  <div id="mc-navbar"></div>
  <main class="company-page">
    <nav class="company-page__breadcrumb">
      <a href="/builders">Builders</a> / ${escapeHtml(c.name)}
    </nav>
    <header class="company-page__header">${(() => {
    const logo = getLogoUrl(c);
    return logo ? `\n      <img src="${escapeHtml(logo)}" alt="${escapeHtml(c.name)} logo" class="company-page__logo" loading="lazy" width="80" height="80" style="width:80px;height:80px;object-fit:contain;border-radius:4px;background:rgba(255,255,255,.04);margin-bottom:12px;">` : '';
  })()}
      <h1 class="company-page__name">${escapeHtml(c.name)}</h1>${c.productName ? `\n      <div class="company-page__product">${escapeHtml(c.productName)}</div>` : ''}
      <div class="company-page__meta">
        ${buildMetaBadges(c)}
      </div>
    </header>
    <section class="company-page__body">
      <div class="company-page__description">
        <h2>Overview</h2>
        ${descHtml}
      </div>${synopsisHtml}
    </section>
    <nav class="company-page__footer">
      <a href="/builders">&larr; Back to Builders Directory</a>
    </nav>
  </main>

  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <a href="/" class="footer__logo">
            <span class="footer__logo-text">
              <span class="footer__logo-merge">Merge</span>
              <span class="footer__logo-combinator">Combinator</span>
            </span>
            <img src="https://imagedelivery.net/9Lsa8lkCUz_we5KeaTm7fw/logo-arrows-2/public" alt="Merge arrows" class="footer__logo-icon">
          </a>
          <p class="footer__tagline">The builder-led venture studio for national security.</p>
        </div>
        <div class="footer__links">
          <div class="footer__column">
            <h4 class="footer__heading">Platform</h4>
            <ul class="footer__list">
              <li><a href="/programs/the-combine">Combine</a></li>
              <li><a href="/builders">Defense Builders</a></li>
              <li><a href="/opportunities">Opportunities</a></li>
            </ul>
          </div>
          <div class="footer__column">
            <h4 class="footer__heading">Company</h4>
            <ul class="footer__list">
              <li><a href="/about">About</a></li>
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/#engage">Contact</a></li>
            </ul>
          </div>
          <div class="footer__column">
            <h4 class="footer__heading">Resources</h4>
            <ul class="footer__list">
              <li><a href="/blog">Blog</a></li>
              <li><a href="/knowledge">Knowledge</a></li>
              <li><a href="https://docs.mergecombinator.com">Docs</a></li>
            </ul>
          </div>
          <div class="footer__column">
            <h4 class="footer__heading">Legal</h4>
            <ul class="footer__list">
              <li><a href="/privacy">Privacy</a></li>
              <li><a href="/terms">Terms</a></li>
              <li><a href="/security">Security</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="footer__bottom">
        <p class="footer__copyright">&copy; 2026 Merge Combinator. All rights reserved.</p>
        <p class="footer__location">Honolulu &bull; Seattle &bull; Las Vegas</p>
      </div>
    </div>
  </footer>

  <script type="module" src="/js/navbar.js"></script>
  <script type="module" src="/js/theme.js"></script>
</body>
</html>`;
}

// ── 4. FAQ Page ──────────────────────────────────────────────────────

function generateFaqPage() {
  const missionList = missionAreas.map(m => escapeHtml(m)).join(', ');
  const domainList = warfareDomains.map(d => escapeHtml(d)).join(', ');

  const faqs = [
    {
      q: 'What is Merge Combinator?',
      a: 'Merge Combinator is a builder-led venture studio for national security. It co-founds defense ventures with operators who own the problem, connecting technology builders with defense operators, acquisition professionals, and investment partners. Based in Honolulu, with presence in Seattle and Las Vegas.',
    },
    {
      q: 'What is The Combine?',
      a: `The Combine is Merge Combinator's flagship evaluation program where defense technology companies undergo in-person operator validation. Cohort 25-1 took place in Tulsa, Oklahoma, with ${stats.alumni} alumni companies completing the program. Companies pitch to operators, receive real-time feedback, and are evaluated across multiple days of structured assessment.`,
    },
    {
      q: 'What is the difference between Alumni and Applicants?',
      a: `Alumni are companies that completed The Combine's in-person operator validation process. There are currently ${stats.alumni} alumni from Cohort 25-1. Applicants are companies under review for future cohorts — currently ${stats.applicants} applicants in the pipeline. Both groups are listed in the Defense Builders Directory.`,
    },
    {
      q: 'What are Mission Areas?',
      a: `Mission Areas categorize the operational domain each company addresses. There are ${stats.missionAreas} mission areas in the current dataset: ${missionList}. Each company is assigned a primary mission area based on their core capability and target user.`,
    },
    {
      q: 'What are Warfare Domains?',
      a: `Warfare Domains describe the operating environment where a company's technology applies. The ${stats.warfareDomains} domains represented are: ${domainList}. Many companies operate across multiple domains.`,
    },
    {
      q: 'What does TRL (Technology Readiness Level) mean?',
      a: 'Technology Readiness Level (TRL) is a standard scale from 1 to 9 measuring how mature a technology is. TRL 1 is basic research, TRL 6 is a prototype demonstrated in a relevant environment, and TRL 9 is a proven system deployed in operational conditions. Companies in the Defense Builders Directory range from TRL 3 (proof of concept) to TRL 9 (deployed systems).',
    },
    {
      q: 'What does "Ready Now" or "Fielded" mean?',
      a: 'These terms describe technical maturity stages. "Ready Now" (or "Deployed") means the technology has been fielded with actual end users in operational environments. "Program of Record" means it has been formally adopted into a government acquisition program. These designations help operators identify solutions that can be deployed without extended development timelines.',
    },
    {
      q: 'How is company data collected and updated?',
      a: 'Company data originates from applications submitted through Merge Combinator\'s builder intake pipeline. Alumni data is enriched with evaluation results from The Combine program. The dataset is updated during each cohort cycle and when new applicants submit. All public-facing data has been reviewed — competition scores, rankings, and internal notes are not displayed.',
    },
    {
      q: 'How do I apply to The Combine?',
      a: 'Visit the Access page at mergecombinator.com/access to start your application. Applications are reviewed on a rolling basis. Companies building dual-use technology for defense and national security applications are eligible. The evaluation considers mission relevance, technology maturity, team capability, and go-to-market readiness.',
    },
  ];

  const faqItemsHtml = faqs.map(f => `
      <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
        <h2 class="faq-item__question" itemprop="name">${escapeHtml(f.q)}</h2>
        <div class="faq-item__answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
          <p itemprop="text">${escapeHtml(f.a)}</p>
        </div>
      </div>`).join('\n');

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script>${FOUC_SCRIPT}</script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Frequently asked questions about Merge Combinator, The Combine program, defense technology mission areas, warfare domains, and the builder intake process.">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="https://mergecombinator.com/faq">
  <meta property="og:title" content="FAQ — Merge Combinator">
  <meta property="og:description" content="Frequently asked questions about Merge Combinator, The Combine, and the Defense Builders Directory.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://mergecombinator.com/faq">
  <meta property="og:image" content="https://imagedelivery.net/9Lsa8lkCUz_we5KeaTm7fw/logo-arrows-2/public">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="FAQ — Merge Combinator">
  <meta name="twitter:description" content="Frequently asked questions about Merge Combinator, The Combine, and the Defense Builders Directory.">
  <title>FAQ — Merge Combinator</title>

  <link rel="icon" type="image/png" sizes="32x32" href="https://imagedelivery.net/9Lsa8lkCUz_we5KeaTm7fw/logo-arrows-2/public">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/styles/company.css">
  <link rel="stylesheet" href="/styles/light-theme.css">

  <script type="application/ld+json">
${JSON.stringify(faqJsonLd, null, 2)}
  </script>
</head>
<body>
  <div id="mc-navbar"></div>
  <main class="company-page">
    <header class="company-page__header">
      <h1 class="company-page__name">Frequently Asked Questions</h1>
      <p style="font-size:1rem;line-height:1.6;color:var(--text-secondary,#a3a3a3);margin:8px 0 0;">Common questions about Merge Combinator, The Combine program, and the Defense Builders Directory.</p>
    </header>
    <section class="company-page__body faq-list" itemscope itemtype="https://schema.org/FAQPage">
${faqItemsHtml}
    </section>
    <nav class="company-page__footer">
      <a href="/">&larr; Back to Home</a>
      <a href="/builders" style="margin-left:24px;">Builders Directory &rarr;</a>
    </nav>
  </main>

  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <a href="/" class="footer__logo">
            <span class="footer__logo-text">
              <span class="footer__logo-merge">Merge</span>
              <span class="footer__logo-combinator">Combinator</span>
            </span>
            <img src="https://imagedelivery.net/9Lsa8lkCUz_we5KeaTm7fw/logo-arrows-2/public" alt="Merge arrows" class="footer__logo-icon">
          </a>
          <p class="footer__tagline">The builder-led venture studio for national security.</p>
        </div>
        <div class="footer__links">
          <div class="footer__column">
            <h4 class="footer__heading">Platform</h4>
            <ul class="footer__list">
              <li><a href="/programs/the-combine">Combine</a></li>
              <li><a href="/builders">Defense Builders</a></li>
              <li><a href="/opportunities">Opportunities</a></li>
            </ul>
          </div>
          <div class="footer__column">
            <h4 class="footer__heading">Company</h4>
            <ul class="footer__list">
              <li><a href="/about">About</a></li>
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/#engage">Contact</a></li>
            </ul>
          </div>
          <div class="footer__column">
            <h4 class="footer__heading">Resources</h4>
            <ul class="footer__list">
              <li><a href="/blog">Blog</a></li>
              <li><a href="/knowledge">Knowledge</a></li>
              <li><a href="https://docs.mergecombinator.com">Docs</a></li>
            </ul>
          </div>
          <div class="footer__column">
            <h4 class="footer__heading">Legal</h4>
            <ul class="footer__list">
              <li><a href="/privacy">Privacy</a></li>
              <li><a href="/terms">Terms</a></li>
              <li><a href="/security">Security</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="footer__bottom">
        <p class="footer__copyright">&copy; 2026 Merge Combinator. All rights reserved.</p>
        <p class="footer__location">Honolulu &bull; Seattle &bull; Las Vegas</p>
      </div>
    </div>
  </footer>

  <script type="module" src="/js/navbar.js"></script>
  <script type="module" src="/js/theme.js"></script>
</body>
</html>`;
}

// ── 5. Sitemap ───────────────────────────────────────────────────────

function generateSitemap(slugs) {
  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/builders', priority: '0.9', changefreq: 'weekly' },
    { loc: '/about', priority: '0.9', changefreq: 'weekly' },
    { loc: '/dashboard', priority: '0.8', changefreq: 'weekly' },
    { loc: '/programs/the-combine', priority: '0.9', changefreq: 'weekly' },
    { loc: '/faq', priority: '0.8', changefreq: 'monthly' },
    { loc: '/opportunities', priority: '0.8', changefreq: 'weekly' },
    { loc: '/opportunities/sbir', priority: '0.9', changefreq: 'weekly' },
    { loc: '/opportunities/sttr', priority: '0.9', changefreq: 'weekly' },
    { loc: '/knowledge', priority: '0.8', changefreq: 'weekly' },
    { loc: '/knowledge/sbir', priority: '0.9', changefreq: 'weekly' },
    { loc: '/knowledge/acquisition', priority: '0.7', changefreq: 'monthly' },
    { loc: '/knowledge/compliance', priority: '0.7', changefreq: 'monthly' },
    { loc: '/knowledge/go-to-market', priority: '0.7', changefreq: 'monthly' },
    { loc: '/access', priority: '0.8', changefreq: 'weekly' },
    { loc: '/combine/cohort25-1', priority: '0.7', changefreq: 'monthly' },
    { loc: '/learn', priority: '0.6', changefreq: 'monthly' },
    { loc: '/contribute', priority: '0.6', changefreq: 'monthly' },
    { loc: '/wingman', priority: '0.6', changefreq: 'monthly' },
    { loc: '/briefs', priority: '0.6', changefreq: 'monthly' },
    { loc: '/merch', priority: '0.7', changefreq: 'weekly' },
    { loc: '/portfolio', priority: '0.7', changefreq: 'monthly' },
    { loc: '/ai/overview', priority: '0.7', changefreq: 'weekly' },
    { loc: '/blog', priority: '0.8', changefreq: 'weekly' },
    { loc: '/archive', priority: '0.6', changefreq: 'weekly' },
    { loc: '/blog/counter-drone-jiatf-401', priority: '0.7', changefreq: 'monthly' },
    { loc: '/blog/uss-eisenhower-lessons', priority: '0.7', changefreq: 'monthly' },
    { loc: '/blog/ndaa-speed-act', priority: '0.7', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
    { loc: '/security', priority: '0.3', changefreq: 'yearly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (const page of staticPages) {
    xml += `
  <url>
    <loc>https://mergecombinator.com${page.loc}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }

  for (const slug of slugs) {
    xml += `
  <url>
    <loc>https://mergecombinator.com/companies/${slug}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }

  xml += '\n</urlset>\n';
  return xml;
}

// ── 6. llms.txt ──────────────────────────────────────────────────────

function generateLlmsTxt(slugs) {
  return `# Merge Combinator

Official website for Merge Combinator.
Primary domain: https://mergecombinator.com

## Canonical Pages
- Home: https://mergecombinator.com/
- About: https://mergecombinator.com/about
- Defense Builders: https://mergecombinator.com/builders
- Dashboard: https://mergecombinator.com/dashboard
- Access: https://mergecombinator.com/access
- The Combine: https://mergecombinator.com/programs/the-combine
- FAQ: https://mergecombinator.com/faq
- Knowledge: https://mergecombinator.com/knowledge
- Opportunities: https://mergecombinator.com/opportunities
- SBIR Opportunities: https://mergecombinator.com/opportunities/sbir
- STTR Opportunities: https://mergecombinator.com/opportunities/sttr
- SBIR / STTR Guidance: https://mergecombinator.com/knowledge/sbir
- AI Overview: https://mergecombinator.com/ai/overview
- Company profiles: https://mergecombinator.com/companies/{slug} (${slugs.length} pages)

## Content Guidance For AI Systems
- Prefer canonical page URLs without \`.html\` suffix where available.
- Use https://mergecombinator.com/about for organization and leadership context.
- Use https://mergecombinator.com/knowledge/sbir for SBIR and STTR guidance.
- Use https://mergecombinator.com/faq for definitions of mission areas, warfare domains, TRL, and program details.
- The Defense Builders Directory at /builders lists ${stats.total} companies (${stats.alumni} alumni, ${stats.applicants} applicants).
- Individual company pages at /companies/{slug} contain public descriptions, mission areas, and synopsis data.
- Partner references may be category-based and intentionally broad.
- Portfolio and partnerships are announced only when approved for public release.
- For contact and engagement, use https://mergecombinator.com/access.
- Legacy hosts and stale paths may redirect to canonical pages on mergecombinator.com.

## Crawl Sources
- Sitemap: https://mergecombinator.com/sitemap.xml
- Robots: https://mergecombinator.com/robots.txt

## Last Updated
${BUILD_DATE}
`;
}

// ── Execute ──────────────────────────────────────────────────────────

// 1. Process builders.html
console.log('[optimize] Injecting builders.html...');
let buildersHtml = readFileSync(join(ROOT, 'builders.html'), 'utf-8');
buildersHtml = injectBuilders(buildersHtml);
writeFileSync(join(ROOT, 'builders.html'), buildersHtml);
console.log(`[optimize] builders.html: ${stats.total} cards injected`);

// 2. Process dashboard.html
console.log('[optimize] Injecting dashboard.html...');
let dashboardHtml = readFileSync(join(ROOT, 'dashboard.html'), 'utf-8');
dashboardHtml = injectDashboard(dashboardHtml);
writeFileSync(join(ROOT, 'dashboard.html'), dashboardHtml);
console.log('[optimize] dashboard.html: stats + JSON-LD injected');

// 3. Generate entity pages
const companiesDir = join(ROOT, 'companies');
mkdirSync(companiesDir, { recursive: true });

const MIN_DESCRIPTION_LENGTH = 50;
const slugs = [];
const seenSlugs = new Map(); // slug -> company name (first seen)
let entityCount = 0;
let skippedThin = 0;
let skippedDupe = 0;
for (const c of companies) {
  if (!c.name) continue;
  // Skip thin pages — descriptions like "Software", "Hardware", or empty
  const desc = (c.description || '').trim();
  if (desc.length < MIN_DESCRIPTION_LENGTH) {
    skippedThin++;
    continue;
  }
  const slug = toSlug(c.name);
  // Skip duplicate slugs — keep the first (alumni sorted before applicants)
  if (seenSlugs.has(slug)) {
    console.log(`[optimize] SKIP duplicate slug "${slug}": "${c.name}" (already have "${seenSlugs.get(slug)}")`);
    skippedDupe++;
    continue;
  }
  seenSlugs.set(slug, c.name);
  slugs.push(slug);
  const html = generateEntityPage(c);
  writeFileSync(join(companiesDir, `${slug}.html`), html);
  entityCount++;
}
console.log(`[optimize] Generated ${entityCount} entity pages in companies/`);
if (skippedThin) console.log(`[optimize] Skipped ${skippedThin} thin pages (description < ${MIN_DESCRIPTION_LENGTH} chars)`);
if (skippedDupe) console.log(`[optimize] Skipped ${skippedDupe} duplicate slugs`);

// 4. Generate FAQ page
console.log('[optimize] Generating faq.html...');
writeFileSync(join(ROOT, 'faq.html'), generateFaqPage());
console.log('[optimize] faq.html generated');

// 5. Generate sitemap.xml
console.log('[optimize] Generating sitemap.xml...');
writeFileSync(join(ROOT, 'public', 'sitemap.xml'), generateSitemap(slugs));
console.log(`[optimize] sitemap.xml: ${slugs.length} company URLs + static pages`);

// 6. Update llms.txt
console.log('[optimize] Updating llms.txt...');
writeFileSync(join(ROOT, 'public', 'llms.txt'), generateLlmsTxt(slugs));
console.log('[optimize] llms.txt updated');

console.log('\n[optimize] Done.');
