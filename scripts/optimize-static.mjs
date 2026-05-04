#!/usr/bin/env node
/**
 * optimize-static.mjs — SEO & AI visibility build step.
 *
 * Reads rich-but-restricted public companies.json and:
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
  userCriticalProblem: 'User-Critical Problem',
};

function renderTextParagraphs(text) {
  if (!text) return '';
  return String(text)
    .split(/\n\n+/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
    .join('\n        ');
}

function renderSynopsisSectionsHtml(company) {
  if (!company.synopsisSections || typeof company.synopsisSections !== 'object') {
    return '';
  }

  const sections = Object.entries(company.synopsisSections)
    .filter(([, value]) => typeof value === 'string' && value.trim());

  if (sections.length === 0) {
    return '';
  }

  const sectionHtml = sections.map(([key, value]) => `
      <section class="company-page__section">
        <h2>${escapeHtml(SYNOPSIS_SECTION_LABELS[key] || key)}</h2>
        ${renderTextParagraphs(value)}
      </section>`).join('\n');

  return sectionHtml;
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

console.log('[optimize] Loading public companies.json...');
const raw = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
const companies = raw.companies;

const featuredCompanies = companies;
const missionAreas = getUniqueMissionAreas(companies);
const warfareDomains = getUniqueWarfareDomains(companies);
const cohorts = [...new Set(companies.map(c => c.cohortLabel).filter(Boolean))];
const recentCount = getRecentCount(companies);

const stats = {
  total: companies.length,
  cohortCompanies: featuredCompanies.length,
  missionAreas: missionAreas.length,
  warfareDomains: warfareDomains.length,
  cohorts: cohorts.length || 1,
  recent: recentCount,
};

console.log(`[optimize] ${stats.total} curated cohort companies`);
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
    ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(c.name)} logo" class="builder-card__logo" loading="lazy" width="48" height="48" style="width:48px;height:48px;object-fit:contain;border-radius:2px;background:rgba(15,23,42,.85);border:1px solid rgba(148,163,255,.12);padding:8px;flex-shrink:0;">`
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
    /(<span class="builders-stats__value" id="stat-builders">)\d+(<\/span>)/,
    `$1${stats.total}$2`
  );
  html = html.replace(
    /(<span class="builders-stats__value" id="stat-mission-areas">)\d+(<\/span>)/,
    `$1${stats.missionAreas}$2`
  );
  html = html.replace(
    /(<span class="builders-stats__value" id="stat-tech-areas">)\d+(<\/span>)/,
    `$1${stats.warfareDomains}$2`
  );
  // Cohort label is "25-1" in HTML — not a computed stat, skip replacement

  // 2b. Inject last refresh timestamp
  html = html.replace(
    /(<div class="rail-kv__value" id="builders-last-refresh">).*?(<\/div>)/,
    `$1Built ${BUILD_DATE}$2`
  );

  // 3. Grounding paragraph — insert before #builders-grid section (idempotent)
  const topMissions = missionAreas.slice(0, 4).join(', ');
  const groundingText = `<div class="builders-grounding" style="padding:0 0 20px;">
  <p style="font-size:0.95rem;line-height:1.6;color:var(--text-secondary,#a3a3a3);margin:0;">The Defense Builders Directory highlights ${stats.total} high-signal companies selected from Merge Combinator's in-person Defense Tech Combine cohort. Public profiles retain rich company narrative and technical metadata while withholding direct contact details, fundraising data, scores, badges, and internal evaluation outcomes.</p>
</div>`;

  // Strip any existing grounding blocks before re-injecting
  html = html.replace(/<div class="builders-grounding"[\s\S]*?<\/div>\s*/g, '');
  html = html.replace(
    '<!-- Builders Grid -->',
    `${groundingText}\n          <!-- Builders Grid -->`
  );

  // 4. Replace skeleton cards with static company cards
  const gridContent = featuredCompanies.map(buildCompanyCard).join('\n');

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
  const groundingText = `\n          <p class="dashboard__grounding" style="font-size:0.95rem;line-height:1.6;color:var(--text-secondary,#a3a3a3);margin:8px 0 0;">Operational view of ${stats.total} defense technology companies selected from Merge Combinator&rsquo;s in-person Defense Tech Combine cohort. Public records retain rich company narrative and technical metadata while withholding contact details, financial data, and evaluation outcomes.</p>`;

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

const FOUC_SCRIPT = `(function(){var t=localStorage.getItem('mc-theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'}if(t==='light'){document.documentElement.classList.add('light-theme','no-transitions');requestAnimationFrame(function(){requestAnimationFrame(function(){document.documentElement.classList.remove('no-transitions')})})}})();`;

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

  const overviewSource = c.description || c.problemStatement || c.synopsisRaw || '';
  const descHtml = renderTextParagraphs(overviewSource);
  const synopsisHtml = renderSynopsisSectionsHtml(c)
    || (c.synopsisRaw && c.synopsisRaw !== c.description
      ? `<section class="company-page__section">
        <h2>Profile</h2>
        ${renderTextParagraphs(c.synopsisRaw)}
      </section>`
      : '');

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
  <meta property="og:image" content="${getLogoUrl(c) || '/assets/logowhite.png'}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(c.name)} — Merge Combinator">
  <meta name="twitter:description" content="${escapeHtml(descTrunc)}">
  <meta name="twitter:image" content="${getLogoUrl(c) || '/assets/logowhite.png'}">
  <title>${escapeHtml(c.name)} — Merge Combinator</title>

  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png?v=2">

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
    return logo ? `\n      <img src="${escapeHtml(logo)}" alt="${escapeHtml(c.name)} logo" class="company-page__logo" loading="lazy" width="80" height="80" style="width:80px;height:80px;object-fit:contain;border-radius:2px;background:rgba(15,23,42,.85);border:1px solid rgba(148,163,255,.12);padding:12px;margin-bottom:12px;">` : '';
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
      </div>
      ${synopsisHtml}
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
            <img src="/assets/logowhite.png" alt="Merge Combinator" class="footer__logo-img">
          </a>
          <p class="footer__tagline">Venture studio for national security.</p>
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
      a: 'Merge Combinator is a venture studio for national security. We co-found defense ventures with operators who own the problem, connecting technology builders with defense operators, acquisition professionals, and investment partners. Based in Honolulu, with presence in Seattle and Las Vegas.',
    },
    {
      q: 'What is The Combine?',
      a: `The Combine is Merge Combinator's flagship evaluation program where defense technology companies undergo in-person operator validation. Cohort 25-1 took place in Tulsa, Oklahoma, with ${stats.total} companies completing the public cohort set. Companies pitch to operators, receive real-time feedback, and are evaluated across multiple days of structured assessment.`,
    },
    {
      q: 'Why does the public directory focus on curated cohort competitors?',
      a: `The public Defense Builders Directory currently highlights ${stats.total} curated cohort competitors from Cohort 25-1. Merge Combinator keeps richer company narrative and technical detail public while withholding in-process records, direct contact details, financial data, and evaluation outcomes.`,
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
      a: 'Company data originates from applications submitted through Merge Combinator\'s builder intake pipeline. Alumni data is enriched with richer narrative and technical metadata from The Combine program. The public dataset is curated to keep only the strongest cohort competitors while withholding direct contact information, fundraising data, scores, badges, and internal evaluation outcomes.',
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
  <meta property="og:image" content="/assets/logowhite.png">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="FAQ — Merge Combinator">
  <meta name="twitter:description" content="Frequently asked questions about Merge Combinator, The Combine, and the Defense Builders Directory.">
  <title>FAQ — Merge Combinator</title>

  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png?v=2">

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
            <img src="/assets/logowhite.png" alt="Merge Combinator" class="footer__logo-img">
          </a>
          <p class="footer__tagline">Venture studio for national security.</p>
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
    { loc: '/knowledge/defense-venture-studio', priority: '0.7', changefreq: 'monthly' },
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

## Machine-Readable Data
- Company directory (public): https://mergecombinator.com/data/companies-public.json (${stats.total} cohort competitors, rich profile metadata with restricted outcomes/contact fields withheld)
- Knowledge resources: https://mergecombinator.com/data/knowledge.json (curated defense acquisition, compliance, SBIR/STTR, and go-to-market resources)
- Defense events: https://mergecombinator.com/data/outlook.json (upcoming defense industry events)

## Content Guidance For AI Systems
- Prefer canonical page URLs without \`.html\` suffix where available.
- Use https://mergecombinator.com/about for organization and leadership context.
- Use https://mergecombinator.com/knowledge/sbir for SBIR and STTR guidance.
- Use https://mergecombinator.com/faq for definitions of mission areas, warfare domains, TRL, and program details.
- The Defense Builders Directory at /builders lists ${stats.total} curated cohort competitors from The Combine.
- Individual company pages at /companies/{slug} contain rich public company profiles while withholding direct contact details, fundraising data, and evaluation outcomes.
- The Opportunities section aggregates live SBIR, STTR, DARPA, DIU, SAM.gov, and Ratio Exchange solicitations for defense tech founders.
- Partner references may be category-based and intentionally broad.
- Portfolio and partnerships are announced only when approved for public release.
- For contact and engagement, use https://mergecombinator.com/access.
- Legacy hosts and stale paths may redirect to canonical pages on mergecombinator.com.

## Crawl Sources
- Sitemap: https://mergecombinator.com/sitemap.xml
- Robots: https://mergecombinator.com/robots.txt
- Blog RSS: https://mergecombinator.com/blog.rss
- Intel RSS: https://api.mergecombinator.com/api/intel.rss (defense OSINT, curated by IrregularChat)

## Last Updated
${BUILD_DATE}
`;
}

// ── 7. Public data export ───────────────────────────────────────────

function generatePublicCompaniesJson(companies) {
  const publicCompanies = companies
    .filter(c => c.name && (c.description || '').trim().length >= MIN_DESCRIPTION_LENGTH)
    .map(c => ({
      name: c.name,
      productName: c.productName || null,
      website: c.website || null,
      missionArea: c.missionArea || null,
      warfareDomain: c.warfareDomain || null,
      trlLevel: c.trlLevel || null,
      technicalMaturity: c.technicalMaturity || null,
      fundingStage: c.fundingStage || null,
      teamSize: c.teamSize || null,
      productType: c.productType || null,
      technologyArea: c.technologyArea || null,
      pipelineStage: c.pipelineStage || null,
      cohortLabel: c.cohortLabel || null,
      description: c.description || null,
    }));

  return JSON.stringify({
    _meta: {
      description: "Public directory of defense technology companies evaluated by Merge Combinator. Machine-readable export — see https://mergecombinator.com/builders for the full directory.",
      exported: BUILD_DATE,
      count: publicCompanies.length,
      fields: "Public classification data only. Contact information, financials, scores, badges, and internal IDs are excluded.",
      license: "This data is provided for informational purposes. See https://mergecombinator.com/terms for usage terms."
    },
    companies: publicCompanies
  }, null, 2);
}

// ── 8. Knowledge page injection ─────────────────────────────────────

function injectKnowledge(html) {
  const knowledgeData = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'knowledge.json'), 'utf-8'));

  let cardsHtml = '';
  for (const cat of knowledgeData.categories) {
    const resources = knowledgeData.resources.filter(r => r.category === cat.id);
    const publicResources = resources.filter(r => r.access === 'public');

    cardsHtml += `
        <a href="/knowledge/${escapeHtml(cat.id)}" class="category-card" style="--card-accent: ${escapeHtml(cat.color)}">
          <div class="category-card__icon"></div>
          <h2 class="category-card__title">${escapeHtml(cat.title)}</h2>
          <p class="category-card__description">${escapeHtml(cat.description)}</p>
          <div class="category-card__meta">
            <span class="category-card__count">${resources.length} resources</span>
            <span style="color: var(--gray-medium);">&bull;</span>
            <span>${publicResources.length} public</span>
          </div>
        </a>`;
  }

  // Resource summary for crawlers — visually hidden, content-accessible
  let resourceSummary = '\n      <!-- Static resource listing for crawlers -->\n';
  resourceSummary += '      <div class="sr-only">\n';
  for (const cat of knowledgeData.categories) {
    const publicResources = knowledgeData.resources.filter(r => r.category === cat.id && r.access === 'public');
    if (publicResources.length === 0) continue;
    resourceSummary += `        <h3>${escapeHtml(cat.title)} Resources</h3>\n        <ul>\n`;
    for (const r of publicResources) {
      resourceSummary += `          <li><a href="${escapeHtml(r.url)}">${escapeHtml(r.title)}</a> — ${escapeHtml(r.description)}</li>\n`;
    }
    resourceSummary += '        </ul>\n';
  }
  resourceSummary += '      </div>';

  html = html.replace(
    /(<div class="knowledge-categories__grid" id="categories-grid">)\s*<!--\s*Populated by JavaScript\s*-->/,
    `$1${cardsHtml}\n${resourceSummary}`
  );

  return html;
}

// ── 9. Blog RSS feed ────────────────────────────────────────────────

function generateBlogRss() {
  const articles = [
    {
      title: 'Inside JIATF 401: The Pentagon\'s New Counter-Drone Marketplace',
      slug: 'counter-drone-jiatf-401',
      date: '2025-12-22',
      category: 'Policy &amp; Acquisition',
      description: 'The Pentagon is building an app store for counter-drone solutions. JIATF 401 replaces the Joint Counter-small UAS Office with a streamlined approach — including an online marketplace for vetted systems and a common C2 framework targeted within 90 days.',
    },
    {
      title: '9 Months Under Fire: Combat Lessons from the USS Eisenhower',
      slug: 'uss-eisenhower-lessons',
      date: '2025-12-22',
      category: 'Combat Lessons',
      description: '770+ weapons expended, multiple combat firsts, and critical insights for defense tech companies from the most intense carrier deployment since WWII.',
    },
    {
      title: 'FY26 NDAA Decoded: What the SPEED Act Means for Your Defense Startup',
      slug: 'ndaa-speed-act',
      date: '2025-12-22',
      category: 'Policy &amp; Acquisition',
      description: 'The SPEED Act promises faster procurement. What is actually changing, implementation challenges ahead, and what defense tech companies should do now.',
    },
  ];

  const items = articles.map(a => `    <item>
      <title>${escapeHtml(a.title)}</title>
      <link>https://mergecombinator.com/blog/${a.slug}</link>
      <guid isPermaLink="true">https://mergecombinator.com/blog/${a.slug}</guid>
      <pubDate>${new Date(a.date).toUTCString()}</pubDate>
      <category>${a.category}</category>
      <description>${escapeHtml(a.description)}</description>
    </item>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Insights — Merge Combinator</title>
    <link>https://mergecombinator.com/blog</link>
    <description>Perspectives on defense innovation, operator-driven development, and the future of national security technology.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://mergecombinator.com/blog.rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>/assets/logowhite.png</url>
      <title>Merge Combinator</title>
      <link>https://mergecombinator.com</link>
    </image>
${items}
  </channel>
</rss>
`;
}

// ── 10. Opportunities static injection ──────────────────────────────

function injectOpportunities(html) {
  const staticContent = `
      <main class="opp-static" style="max-width: 900px; margin: 40px auto; padding: 0 16px; font-family: Inter, Arial, sans-serif; color: #e2e8f0;">
        <h1 style="font-size: 2rem; margin-bottom: 8px;">Defense Opportunities</h1>
        <p style="color: #94a3b8; margin-bottom: 24px;">Track solicitations, events, and market intelligence for national security builders. Updated hourly from multiple sources.</p>

        <h2 style="font-size: 1.25rem; margin-bottom: 12px;">Sources</h2>
        <ul style="color: #94a3b8; line-height: 1.8;">
          <li><strong style="color: #e2e8f0;">SBIR/STTR</strong> — Small Business Innovation Research and Small Business Technology Transfer solicitations from sbir.gov</li>
          <li><strong style="color: #e2e8f0;">DARPA</strong> — Defense Advanced Research Projects Agency broad agency announcements and open solicitations</li>
          <li><strong style="color: #e2e8f0;">DIU</strong> — Defense Innovation Unit commercial solutions openings</li>
          <li><strong style="color: #e2e8f0;">GoColosseum</strong> — Department of the Air Force innovation challenges and pitch events</li>
          <li><strong style="color: #e2e8f0;">Ratio Exchange</strong> — 261+ challenges from defense innovation hubs (DEFENSEWERX, SOFWERX, ERDCWERX, Tradewind, Doolittle Institute, HSWERX, FLEETWERX)</li>
          <li><strong style="color: #e2e8f0;">SAM.gov</strong> — Federal contract opportunities in defense and national security categories</li>
        </ul>

        <h2 style="font-size: 1.25rem; margin: 24px 0 12px;">Quick Links</h2>
        <ul style="line-height: 1.8;">
          <li><a href="/opportunities/sbir" style="color: #3b82f6;">SBIR Opportunities</a></li>
          <li><a href="/opportunities/sttr" style="color: #3b82f6;">STTR Opportunities</a></li>
          <li><a href="/knowledge/sbir" style="color: #3b82f6;">SBIR/STTR Guidance</a></li>
          <li><a href="/knowledge" style="color: #3b82f6;">Knowledge Base</a></li>
        </ul>
      </main>`;

  // Inject inside #root — React.render replaces all children on mount
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${staticContent}\n    </div>`
  );

  return html;
}

// ── Execute ──────────────────────────────────────────────────────────

// 1. Process builders.html
console.log('[optimize] Injecting builders.html...');
let buildersHtml = readFileSync(join(ROOT, 'builders.html'), 'utf-8');
buildersHtml = injectBuilders(buildersHtml);
writeFileSync(join(ROOT, 'builders.html'), buildersHtml);
console.log(`[optimize] builders.html: ${stats.total} cards injected`);

// 1b. Process knowledge.html
console.log('[optimize] Injecting knowledge.html...');
let knowledgeHtml = readFileSync(join(ROOT, 'knowledge.html'), 'utf-8');
knowledgeHtml = injectKnowledge(knowledgeHtml);
writeFileSync(join(ROOT, 'knowledge.html'), knowledgeHtml);
console.log('[optimize] knowledge.html: category cards + resource summary injected');

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
  // Skip duplicate slugs — keep the first occurrence from the curated public dataset
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

// 7. Generate public companies export
console.log('[optimize] Generating public companies export...');
const publicExportCount = companies.filter(c => c.name).length;
writeFileSync(join(ROOT, 'public', 'data', 'companies-public.json'), generatePublicCompaniesJson(companies));
console.log(`[optimize] companies-public.json: ${publicExportCount} companies exported`);

// 8. Generate blog RSS feed
console.log('[optimize] Generating blog.rss...');
writeFileSync(join(ROOT, 'public', 'blog.rss'), generateBlogRss());
console.log('[optimize] blog.rss generated');

// 9. Inject opportunities static content
const oppHtmlPath = join(ROOT, 'opportunities', 'index.html');
if (existsSync(oppHtmlPath)) {
  console.log('[optimize] Injecting opportunities static content...');
  let oppHtml = readFileSync(oppHtmlPath, 'utf-8');
  oppHtml = injectOpportunities(oppHtml);
  writeFileSync(oppHtmlPath, oppHtml);
  console.log('[optimize] opportunities/index.html: static source summary injected');
}

console.log('\n[optimize] Done.');
