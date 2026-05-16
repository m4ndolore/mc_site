# Content Reorganization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate Learn/Signals/Knowledge into two pages: unified Feed (`/signals` rework) and Launch (`/launch` new page).

**Architecture:** Static HTML + vanilla ES modules. Feed page merges MC original articles with RSS intel into one chronological stream. Launch page is a staged progression (carrier-themed) with public/gated resource links. Both pages follow existing C2UX design system.

**Tech Stack:** Vite 6, vanilla JS (ES modules), CSS custom properties, existing intel.js API integration, new `signals.json` manifest.

---

## Task 1: Create `signals.json` Manifest

**Files:**
- Create: `public/data/signals.json`

**Step 1: Create the signals article manifest**

Build a JSON file containing metadata for all 10 MC original articles (extracted from `signals.html` hardcoded content and the `/signals/*.html` pages).

```json
{
  "articles": [
    {
      "id": "army-rewriting-acquisition",
      "title": "The Army Is Rewriting How It Buys Technology",
      "excerpt": "By Pete Harlan, Missionized Tech Resident. The Army is restructuring acquisition around software velocity and operational feedback loops.",
      "url": "/signals/army-rewriting-acquisition",
      "date": "2026-05-12",
      "category": "Acquisition",
      "author": "Pete Harlan",
      "image": null,
      "featured": true
    },
    {
      "id": "mchmr-african-lion-26",
      "title": "MCHMR Delivers Tactical Edge Dominance During African Lion 26",
      "excerpt": "Real-time Arabic-to-English AI translation over MPU5 radios. Allied and partner sensors feeding a shared common operational picture.",
      "url": "/signals/mchmr-african-lion-26",
      "date": "2026-05-10",
      "category": "Field Notes",
      "author": "Merge Combinator",
      "image": "/assets/signals/african-lion-mchmr-1.jpg",
      "featured": true
    },
    {
      "id": "vc-defense-alignment-problem",
      "title": "The $16B Alignment Problem",
      "excerpt": "$16 billion in defense VC. The question isn't money. It's whether the system can absorb it.",
      "url": "/signals/vc-defense-alignment-problem",
      "date": "2026-05-01",
      "category": "Analysis",
      "author": "Merge Combinator",
      "image": "/assets/signals/vc-alignment.jpg",
      "featured": true
    },
    {
      "id": "dawg-54-billion-problem",
      "title": "DAWG's $54.6B Problem",
      "excerpt": "A 24,000% budget increase doesn't fix a broken acquisition system. It amplifies it.",
      "url": "/signals/dawg-54-billion-problem",
      "date": "2026-04-28",
      "category": "Analysis",
      "author": "Merge Combinator",
      "image": "/assets/signals/dawg.jpg",
      "featured": false
    },
    {
      "id": "ulysses-combine-to-series-a",
      "title": "From Combine to Series A: Ulysses",
      "excerpt": "29th of 83 companies. Then $46M from a16z. What operator-validated formation actually produces.",
      "url": "/signals/ulysses-combine-to-series-a",
      "date": "2026-04-24",
      "category": "Case Study",
      "author": "Merge Combinator",
      "image": null,
      "featured": false
    },
    {
      "id": "interceptor-stockpile-crisis",
      "title": "The Interceptor Math Is Broken",
      "excerpt": "25% of the stockpile, gone in 12 days. The Indo-Pacific math is worse.",
      "url": "/signals/interceptor-stockpile-crisis",
      "date": "2026-04-21",
      "category": "Analysis",
      "author": "Merge Combinator",
      "image": "/assets/signals/interceptors.jpg",
      "featured": false
    },
    {
      "id": "missionized-tech-residency",
      "title": "Missionized Tech Residency",
      "excerpt": "Embedding acquisition professionals inside industry for six months. In partnership with the US Army and DAU.",
      "url": "/signals/missionized-tech-residency",
      "date": "2026-05-02",
      "category": "Programs",
      "author": "Merge Combinator",
      "image": "/assets/signals/residency.jpg",
      "featured": false
    },
    {
      "id": "counter-drone-jiatf-401",
      "title": "Inside JIATF 401: The Counter-Drone Marketplace",
      "excerpt": "The Pentagon is building an \"app store\" for counter-drone solutions. Here's what it takes to get listed.",
      "url": "/signals/counter-drone-jiatf-401",
      "date": "2025-12-22",
      "category": "Policy & Acquisition",
      "author": "Merge Combinator",
      "image": null,
      "featured": false
    },
    {
      "id": "uss-eisenhower-lessons",
      "title": "9 Months Under Fire: USS Eisenhower",
      "excerpt": "770+ weapons expended. The most intense carrier combat since WWII.",
      "url": "/signals/uss-eisenhower-lessons",
      "date": "2025-12-22",
      "category": "Combat Lessons",
      "author": "Merge Combinator",
      "image": null,
      "featured": false
    },
    {
      "id": "ndaa-speed-act",
      "title": "FY26 NDAA: What the SPEED Act Means",
      "excerpt": "Faster procurement doesn't mean more money. Here's what actually changes.",
      "url": "/signals/ndaa-speed-act",
      "date": "2025-12-22",
      "category": "Policy & Acquisition",
      "author": "Merge Combinator",
      "image": null,
      "featured": false
    }
  ]
}
```

**Step 2: Commit**

```bash
git add public/data/signals.json
git commit -m "Add signals.json manifest for MC original articles"
```

---

## Task 2: Build the Unified Feed JS Module

**Files:**
- Create: `js/signals/feed.js`

**Step 1: Create the feed module**

This module merges MC original articles (`signals.json`) with aggregated intel articles (from the existing intel API + `intel.json`), renders them in a unified stream with filters.

```javascript
/**
 * Unified Feed — merges MC original articles (signals.json) with
 * aggregated intel (intel API + intel.json), renders chronological
 * feed with topic filtering and source toggle.
 */

const INTEL_API = 'https://api.mergecombinator.com/api/intel/feed';
const BRIEFING_API = 'https://api.mergecombinator.com/api/intel/briefing';

const ARROW_SVG = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
  <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const FILTER_GROUPS = [
  { label: 'Latest', match: null },
  { label: 'AI & Autonomy', keywords: ['ai', 'artificial intelligence', 'machine learning', 'autonomy', 'autonomous'] },
  { label: 'Drones & C-UAS', keywords: ['drone', 'uas', 'c-uas', 'cuas', 'counter-drone', 'unmanned', 'suas'] },
  { label: 'Cyber', keywords: ['cyber', 'infosec', 'malware', 'vulnerability', 'ransomware', 'zero-day'] },
  { label: 'Policy', keywords: ['ndaa', 'legislation', 'congress', 'policy', 'regulation', 'executive order', 'sbir', 'sttr'] },
  { label: 'Acquisition', keywords: ['acquisition', 'procurement', 'contracting', 'ota', 'far', 'dfars', 'rfp', 'solicitation'] },
  { label: 'Space', keywords: ['space', 'satellite', 'orbit', 'launch', 'ussf'] },
  { label: 'Indo-Pacific', keywords: ['china', 'taiwan', 'indo-pacific', 'pacom', 'indopacom', 'pacific', 'japan', 'korea', 'australia'] },
];

function formatDate(dateStr) {
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function articleMatchesFilter(article, keywords) {
  const text = `${article.title} ${article.excerpt} ${(article.tags || []).join(' ')} ${article.category || ''}`.toLowerCase();
  return keywords.some(kw => text.includes(kw));
}

function renderMCCard(article) {
  const card = document.createElement('a');
  card.href = article.url;
  card.className = 'feed-card feed-card--mc';
  card.dataset.tags = (article.tags || [article.category]).join(',').toLowerCase();
  card.dataset.title = article.title.toLowerCase();
  card.dataset.excerpt = (article.excerpt || '').toLowerCase();
  card.dataset.source = 'mc';

  const imageHtml = article.image
    ? `<div class="feed-card__image"><img src="${article.image}" alt="" loading="lazy"></div>`
    : '';

  card.innerHTML = `
    ${imageHtml}
    <div class="feed-card__content">
      <div class="feed-card__header">
        <span class="feed-card__source feed-card__source--mc">MC Original</span>
        <span class="feed-card__date">${formatDate(article.date)}</span>
      </div>
      <h3 class="feed-card__title">${article.title}</h3>
      <p class="feed-card__excerpt">${article.excerpt}</p>
      <span class="feed-card__category">${article.category}</span>
    </div>
  `;

  return card;
}

function renderIntelCard(article, sources) {
  const source = sources.find(s => s.id === article.source) || { name: article.source, color: '#6b7280' };
  const card = document.createElement('a');
  card.href = article.url;
  card.target = '_blank';
  card.rel = 'noopener';
  card.className = 'feed-card feed-card--intel';
  card.dataset.tags = (article.tags || []).join(',').toLowerCase();
  card.dataset.title = article.title.toLowerCase();
  card.dataset.excerpt = (article.excerpt || '').toLowerCase();
  card.dataset.source = 'intel';

  const tags = (article.tags || [])
    .slice(0, 3)
    .map(t => `<span class="feed-card__tag">${t}</span>`)
    .join('');

  card.innerHTML = `
    <div class="feed-card__content">
      <div class="feed-card__header">
        <span class="feed-card__source" style="--source-color: ${source.color}">${source.name}</span>
        <span class="feed-card__date">${formatDate(article.date)}</span>
      </div>
      <h3 class="feed-card__title">${article.title} ${ARROW_SVG}</h3>
      <p class="feed-card__excerpt">${article.excerpt}</p>
      <div class="feed-card__tags">${tags}</div>
    </div>
  `;

  return card;
}

function renderBriefingCard(briefing) {
  if (!briefing) return null;

  const card = document.createElement('a');
  card.href = briefing.url;
  card.target = '_blank';
  card.rel = 'noopener';
  card.className = 'feed-briefing';

  const categoriesHtml = (briefing.categories || [])
    .map(cat => {
      const countLabel = cat.count != null ? ` ${cat.count}` : '';
      return `<span class="feed-briefing__chip">${cat.name}${countLabel}</span>`;
    })
    .join('');

  const metaParts = ['via GovBase'];
  if (briefing.sources) metaParts.push(`${briefing.sources} sources`);
  if (briefing.updatedAgo) metaParts.push(`updated ${briefing.updatedAgo}`);

  card.innerHTML = `
    <div class="feed-briefing__header">
      <span class="feed-briefing__eyebrow">Today in Washington</span>
      <span class="feed-briefing__meta">${metaParts.join(' · ')}</span>
    </div>
    <p class="feed-briefing__summary">${briefing.summary}</p>
    ${categoriesHtml ? `<div class="feed-briefing__categories">${categoriesHtml}</div>` : ''}
    <span class="feed-briefing__link">Read full briefing ${ARROW_SVG}</span>
  `;

  return card;
}

function renderFilters(articles, container, grid) {
  // Source toggle
  const sourceToggle = document.createElement('div');
  sourceToggle.className = 'feed-source-toggle';
  sourceToggle.innerHTML = `
    <button class="feed-source-btn feed-source-btn--active" data-source="all">All Sources</button>
    <button class="feed-source-btn" data-source="mc">MC Original</button>
  `;
  container.appendChild(sourceToggle);

  // Topic filters
  const topicBar = document.createElement('div');
  topicBar.className = 'feed-topic-filters';

  FILTER_GROUPS.forEach((group, i) => {
    if (group.keywords) {
      const count = articles.filter(a => articleMatchesFilter(a, group.keywords)).length;
      if (count === 0) return;
    }

    const btn = document.createElement('button');
    btn.className = 'feed-filter' + (i === 0 ? ' feed-filter--active' : '');
    btn.textContent = group.label;
    btn.dataset.index = i;
    topicBar.appendChild(btn);
  });

  container.appendChild(topicBar);

  // Filter logic
  let activeSource = 'all';
  let activeTopicIndex = 0;

  function applyFilters() {
    const group = FILTER_GROUPS[activeTopicIndex];
    grid.querySelectorAll('.feed-card').forEach(card => {
      let visible = true;

      // Source filter
      if (activeSource !== 'all' && card.dataset.source !== activeSource) {
        visible = false;
      }

      // Topic filter
      if (visible && group && group.keywords) {
        const text = `${card.dataset.title || ''} ${card.dataset.excerpt || ''} ${card.dataset.tags || ''}`;
        if (!group.keywords.some(kw => text.includes(kw))) {
          visible = false;
        }
      }

      card.style.display = visible ? '' : 'none';
    });
  }

  sourceToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.feed-source-btn');
    if (!btn) return;
    sourceToggle.querySelectorAll('.feed-source-btn').forEach(b => b.classList.remove('feed-source-btn--active'));
    btn.classList.add('feed-source-btn--active');
    activeSource = btn.dataset.source;
    applyFilters();
  });

  topicBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.feed-filter');
    if (!btn) return;
    topicBar.querySelectorAll('.feed-filter').forEach(b => b.classList.remove('feed-filter--active'));
    btn.classList.add('feed-filter--active');
    activeTopicIndex = parseInt(btn.dataset.index);
    applyFilters();
  });
}

async function fetchRssFeed() {
  try {
    const res = await fetch(INTEL_API);
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles || [];
  } catch {
    return [];
  }
}

async function fetchBriefing() {
  try {
    const res = await fetch(BRIEFING_API);
    if (!res.ok) return null;
    const data = await res.json();
    return data.briefing || null;
  } catch {
    return null;
  }
}

export async function initFeed() {
  const grid = document.getElementById('feed-grid');
  const filtersContainer = document.getElementById('feed-filters');
  const featuredSlot = document.getElementById('feed-featured');
  const briefingSlot = document.getElementById('feed-briefing');
  if (!grid) return;

  try {
    const [signalsRes, intelRes, rssArticles, briefing] = await Promise.all([
      fetch('/data/signals.json'),
      fetch('/data/intel.json'),
      fetchRssFeed(),
      fetchBriefing()
    ]);

    const signalsData = await signalsRes.json();
    const intelData = await intelRes.json();
    const sources = intelData.sources || [];

    // Render briefing
    if (briefingSlot && briefing) {
      const briefingCard = renderBriefingCard(briefing);
      if (briefingCard) briefingSlot.appendChild(briefingCard);
    }

    // Render featured MC article
    const featured = signalsData.articles.find(a => a.featured);
    if (featuredSlot && featured) {
      featuredSlot.innerHTML = `
        <a href="${featured.url}" class="feed-featured">
          ${featured.image ? `<div class="feed-featured__image"><img src="${featured.image}" alt="" loading="lazy"></div>` : ''}
          <div class="feed-featured__content">
            <span class="feed-card__source feed-card__source--mc">MC Original</span>
            <h2 class="feed-featured__title">${featured.title}</h2>
            <p class="feed-featured__excerpt">${featured.excerpt}</p>
            <span class="feed-featured__meta">${featured.author} · ${formatDate(featured.date)}</span>
          </div>
        </a>
      `;
    }

    // Merge all articles, dedupe, sort by date
    const seen = new Set();
    const mcArticles = signalsData.articles
      .filter(a => !a.featured) // exclude the featured one from the stream
      .map(a => ({ ...a, _type: 'mc' }));

    const allIntel = [...(intelData.articles || []), ...rssArticles]
      .map(a => ({ ...a, _type: 'intel' }));

    const allArticles = [...mcArticles, ...allIntel]
      .filter(a => {
        const key = a.title.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render filters
    if (filtersContainer) {
      renderFilters(allArticles, filtersContainer, grid);
    }

    // Render cards
    allArticles.forEach(article => {
      if (article._type === 'mc') {
        grid.appendChild(renderMCCard(article));
      } else {
        grid.appendChild(renderIntelCard(article, sources));
      }
    });

  } catch (err) {
    console.error('Failed to load feed:', err);
    grid.innerHTML = '<p class="feed-empty">Unable to load feed.</p>';
  }
}

document.addEventListener('DOMContentLoaded', initFeed);
```

**Step 2: Commit**

```bash
git add js/signals/feed.js
git commit -m "Add unified feed module merging MC articles with intel"
```

---

## Task 3: Create Feed Page CSS

**Files:**
- Create: `styles/feed.css`

**Step 1: Create feed styles**

Follows existing C2UX patterns — dark background, 2px radius, monospace labels, hover lifts.

```css
/* ── Feed Page ── */
.feed-hero {
  padding: calc(var(--nav-height) + 40px) 0 0;
  background: var(--black);
}

.feed-hero__header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.feed-hero__badge {
  display: inline-block;
  padding: 10px 28px;
  background: rgba(42, 127, 219, 0.1);
  border: 1px solid rgba(42, 127, 219, 0.2);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 600;
  color: var(--blue);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.feed-hero__subtitle {
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  font-size: 15px;
  max-width: 480px;
}

/* ── Briefing Card ── */
.feed-briefing {
  display: block;
  text-decoration: none;
  background: rgba(6, 182, 212, 0.04);
  border: 1px solid rgba(6, 182, 212, 0.15);
  border-left: 3px solid #06b6d4;
  border-radius: 6px;
  padding: 24px 28px;
  margin-bottom: 24px;
  transition: all var(--transition-base);
}

.feed-briefing:hover {
  background: rgba(6, 182, 212, 0.07);
  transform: translateY(-1px);
}

.feed-briefing__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.feed-briefing__eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #06b6d4;
  font-weight: 600;
}

.feed-briefing__meta {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.feed-briefing__summary {
  margin: 0 0 12px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.feed-briefing__categories {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.feed-briefing__chip {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  padding: 4px 8px;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 2px;
  color: rgba(6, 182, 212, 0.85);
}

.feed-briefing__link {
  font-size: 13px;
  color: #06b6d4;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* ── Featured Article ── */
.feed-featured {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 32px;
  transition: all var(--transition-base);
}

.feed-featured:hover {
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-2px);
  border-color: rgba(59, 130, 246, 0.3);
}

.feed-featured__image {
  aspect-ratio: 16/9;
  overflow: hidden;
}

.feed-featured__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.feed-featured__content {
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.feed-featured__title {
  margin: 12px 0;
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  font-weight: 600;
  color: var(--white);
  line-height: 1.25;
}

.feed-featured__excerpt {
  margin: 0 0 16px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.feed-featured__meta {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

/* ── Filters ── */
.feed-filters {
  margin-bottom: 24px;
}

.feed-source-toggle {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.feed-source-btn {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.feed-source-btn:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.06);
}

.feed-source-btn--active {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  color: var(--blue);
}

.feed-topic-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.feed-filter {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.feed-filter:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.06);
}

.feed-filter--active {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
  color: #a78bfa;
}

/* ── Feed Grid ── */
.feed-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

/* ── Feed Cards (shared base) ── */
.feed-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  overflow: hidden;
  transition: all var(--transition-base);
}

.feed-card:hover {
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.12);
}

/* MC Original cards get a subtle blue left accent */
.feed-card--mc {
  border-left: 2px solid var(--blue);
}

.feed-card--mc:hover {
  border-color: rgba(59, 130, 246, 0.4);
  border-left-color: var(--blue);
}

.feed-card__image {
  height: 160px;
  overflow: hidden;
}

.feed-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.feed-card__content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.feed-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.feed-card__source {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--source-color, #6b7280) 15%, transparent);
  color: var(--source-color, #6b7280);
  border: 1px solid color-mix(in srgb, var(--source-color, #6b7280) 25%, transparent);
}

.feed-card__source--mc {
  --source-color: var(--blue);
}

.feed-card__date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.feed-card__title {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--white);
  line-height: 1.35;
}

.feed-card__title svg {
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.feed-card:hover .feed-card__title svg {
  opacity: 1;
}

.feed-card__excerpt {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.feed-card__category {
  margin-top: 12px;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
}

.feed-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 12px;
}

.feed-card__tag {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  color: rgba(255, 255, 255, 0.45);
}

.feed-empty {
  grid-column: 1 / -1;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 48px 0;
}

/* ── Launch CTA in sidebar ── */
.feed-cta {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 24px;
  margin-top: 32px;
}

.feed-cta__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--white);
  margin: 0 0 8px;
}

.feed-cta__text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
  margin: 0 0 16px;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .feed-grid {
    grid-template-columns: 1fr;
  }

  .feed-featured {
    grid-template-columns: 1fr;
  }

  .feed-featured__image {
    aspect-ratio: 2/1;
  }

  .feed-source-toggle {
    flex-wrap: wrap;
  }
}
```

**Step 2: Commit**

```bash
git add styles/feed.css
git commit -m "Add feed page styles following C2UX design system"
```

---

## Task 4: Build the Feed HTML Page

**Files:**
- Modify: `signals.html` (full rewrite)

**Step 1: Rewrite signals.html with unified feed structure**

Replace the current static signals page with the new feed layout. Keep the same URL (`/signals`) for SEO continuity.

The page includes:
- Briefing slot at top
- Featured MC article
- Filter bar (source toggle + topic filters)
- Unified feed grid
- Sidebar CTA linking to `/launch`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script>
    (function(){var t=localStorage.getItem('mc-theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'}if(t==='light'){document.documentElement.classList.add('light-theme','no-transitions');requestAnimationFrame(function(){requestAnimationFrame(function(){document.documentElement.classList.remove('no-transitions')})})}})();
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Defense tech intelligence and analysis from Merge Combinator. Multi-source feed covering AI, drones, acquisition, policy, and national security innovation.">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="https://mergecombinator.com/signals">
  <link rel="alternate" type="application/rss+xml" title="Signals — Merge Combinator" href="https://mergecombinator.com/signals.rss">
  <meta name="keywords" content="defense tech, national security, AI, drones, acquisition, policy, venture studio, signals, intel">

  <!-- Open Graph -->
  <meta property="og:title" content="Signals — Merge Combinator">
  <meta property="og:description" content="Defense tech intelligence and analysis. Multi-source feed from industry leaders and MC original research.">
  <meta property="og:type" content="website">
  <meta property="og:image" content="/assets/logowhite.png">
  <meta property="og:url" content="https://mergecombinator.com/signals">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Signals — Merge Combinator">
  <meta name="twitter:description" content="Defense tech intelligence and analysis. Multi-source feed from industry leaders and MC original research.">
  <meta name="twitter:image" content="/assets/logowhite.png">

  <title>Signals — Merge Combinator</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">

  <!-- Styles -->
  <style>body{opacity:0;background:#0a0a0a}body.page-ready{opacity:1;transition:opacity .15s ease-in}</style>
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="styles/feed.css">
  <link rel="stylesheet" href="styles/light-theme.css">
  <link rel="icon" href="favicon.ico" type="image/x-icon">
</head>
<body>
  <div id="mc-navbar"></div>

  <!-- Header -->
  <section class="feed-hero">
    <div class="container">
      <div class="feed-hero__header">
        <span class="feed-hero__badge">Signals</span>
        <p class="feed-hero__subtitle">Analysis, market intelligence, and operational ground truth from inside the defense ecosystem.</p>
      </div>

      <!-- Briefing slot -->
      <div id="feed-briefing"></div>

      <!-- Featured MC article -->
      <div id="feed-featured"></div>

      <!-- Filters -->
      <div id="feed-filters" class="feed-filters"></div>

      <!-- Feed grid -->
      <div id="feed-grid" class="feed-grid"></div>
    </div>
  </section>

  <!-- Footer -->
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
              <li><a href="/programs/the-combine">The Combine</a></li>
              <li><a href="/builders">Defense Builders</a></li>
              <li><a href="/opportunities">Opportunities</a></li>
            </ul>
          </div>
          <div class="footer__column">
            <h4 class="footer__heading">Company</h4>
            <ul class="footer__list">
              <li><a href="/about">About</a></li>
              <li><a href="/about#faq">FAQ</a></li>
              <li><a href="/access">Contact</a></li>
            </ul>
          </div>
          <div class="footer__column">
            <h4 class="footer__heading">Resources</h4>
            <ul class="footer__list">
              <li><a href="/signals">Signals</a></li>
              <li><a href="/launch">Launch</a></li>
              <li><a href="/knowledge">Knowledge</a></li>
              <li><a href="https://docs.mergecombinator.com">Docs</a></li>
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

  <script type="module" src="script.js"></script>
  <script type="module" src="js/navbar.js"></script>
  <script type="module" src="js/signals/feed.js"></script>
</body>
</html>
```

**Step 2: Commit**

```bash
git add signals.html
git commit -m "Rebuild signals page as unified feed (MC articles + intel)"
```

---

## Task 5: Build the Launch Page CSS

**Files:**
- Create: `styles/launch.css`

**Step 1: Create launch page styles**

Carrier-themed progression page. Uses gold accent (like `/start` page) for stage markers, blue for interactive elements. Clean, precise — flight deck status board aesthetic.

```css
/* ── Launch Page ── */
.launch-page {
  background: var(--black);
}

.launch-hero {
  padding: calc(var(--nav-height) + 72px) 0 64px;
  background:
    linear-gradient(135deg, rgba(59, 130, 246, 0.08), transparent 40%),
    linear-gradient(225deg, rgba(201, 160, 99, 0.06), transparent 35%),
    var(--black);
}

.launch-hero__content {
  max-width: 720px;
}

.launch-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--blue);
  margin-bottom: 16px;
}

.launch-hero__eyebrow::before {
  content: '';
  width: 8px;
  height: 8px;
  background: var(--blue);
  border-radius: 1px;
}

.launch-hero__title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  color: var(--white);
  line-height: 1.1;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
}

.launch-hero__subtitle {
  font-size: 17px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin: 0 0 28px;
  max-width: 580px;
}

.launch-hero__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* ── Stage Progression ── */
.launch-stages {
  padding: 0 0 80px;
  background: var(--black);
}

.launch-stage {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 48px 0;
}

.launch-stage__header {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 20px;
  align-items: start;
  margin-bottom: 28px;
}

.launch-stage__number {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  background: rgba(201, 160, 99, 0.08);
  border: 1px solid rgba(201, 160, 99, 0.2);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--gold, #c9a063);
}

.launch-stage__title {
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  font-weight: 700;
  color: var(--white);
  margin: 0 0 4px;
  line-height: 1.2;
}

.launch-stage__subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  font-style: italic;
}

.launch-stage__description {
  color: rgba(255, 255, 255, 0.65);
  font-size: 15px;
  line-height: 1.65;
  max-width: 640px;
  margin: 0 0 24px;
  padding-left: 84px;
}

/* ── Resource Grid ── */
.launch-resources {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  padding-left: 84px;
}

.launch-resource {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.launch-resource:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.launch-resource__icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
}

.launch-resource__text {
  flex: 1;
  min-width: 0;
}

.launch-resource__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--white);
  margin: 0 0 4px;
  line-height: 1.3;
}

.launch-resource__meta {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.4;
}

/* Gated resources */
.launch-resource--gated {
  opacity: 0.75;
}

.launch-resource--gated .launch-resource__title::after {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-left: 6px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Crect x='3' y='11' width='18' height='11' rx='2' ry='2'/%3E%3Cpath d='M7 11V7a5 5 0 0 1 10 0v4'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  vertical-align: middle;
}

.launch-resource__gate {
  font-family: var(--font-mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 4px;
}

/* External link arrow */
.launch-resource--external .launch-resource__title::after {
  content: ' ↗';
  color: rgba(255, 255, 255, 0.3);
}

/* ── Stage CTA (appears in later stages) ── */
.launch-stage-cta {
  margin-top: 24px;
  padding-left: 84px;
}

.launch-stage-cta__card {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: rgba(59, 130, 246, 0.06);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  text-decoration: none;
  color: var(--blue);
  font-size: 14px;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.launch-stage-cta__card:hover {
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

/* ── Bottom CTA ── */
.launch-bottom-cta {
  padding: 64px 0;
  background: var(--charcoal);
  text-align: center;
}

.launch-bottom-cta__title {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 700;
  color: var(--white);
  margin: 0 0 12px;
}

.launch-bottom-cta__text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 15px;
  margin: 0 0 28px;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

/* ── Triage shortcut ── */
.launch-triage {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: rgba(201, 160, 99, 0.06);
  border: 1px solid rgba(201, 160, 99, 0.2);
  border-radius: 4px;
  text-decoration: none;
  color: var(--gold, #c9a063);
  font-size: 14px;
  transition: all var(--transition-fast);
}

.launch-triage:hover {
  background: rgba(201, 160, 99, 0.1);
  transform: translateY(-1px);
}

.launch-triage__icon {
  width: 16px;
  height: 16px;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .launch-stage__header {
    grid-template-columns: 48px 1fr;
    gap: 14px;
  }

  .launch-stage__number {
    width: 48px;
    height: 48px;
    font-size: 15px;
  }

  .launch-stage__description,
  .launch-resources,
  .launch-stage-cta {
    padding-left: 0;
  }

  .launch-resources {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .launch-hero {
    padding-top: calc(var(--nav-height) + 44px);
  }
}
```

**Step 2: Commit**

```bash
git add styles/launch.css
git commit -m "Add launch page styles with carrier-themed stage progression"
```

---

## Task 6: Build the Launch HTML Page

**Files:**
- Create: `launch.html`

**Step 1: Create the launch page**

Full implementation of the 5-stage progression page with carrier theming. Resources pulled from the existing Knowledge base categories, reorganized by stage.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script>
    (function(){var t=localStorage.getItem('mc-theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'}if(t==='light'){document.documentElement.classList.add('light-theme','no-transitions');requestAnimationFrame(function(){requestAnimationFrame(function(){document.documentElement.classList.remove('no-transitions')})})}})();
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="The Defense Tech Toolkit. A structured path from idea to contract for founders building national security technology. Pre-Flight through Launch.">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <link rel="canonical" href="https://mergecombinator.com/launch">

  <meta property="og:title" content="Launch — Merge Combinator">
  <meta property="og:description" content="From idea to contract. A structured path for defense tech founders.">
  <meta property="og:type" content="website">
  <meta property="og:image" content="/assets/logowhite.png">
  <meta property="og:url" content="https://mergecombinator.com/launch">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Launch — Merge Combinator">
  <meta name="twitter:description" content="From idea to contract. A structured path for defense tech founders.">
  <meta name="twitter:image" content="/assets/logowhite.png">

  <title>Launch — Merge Combinator</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">

  <style>body{opacity:0;background:#0a0a0a}body.page-ready{opacity:1;transition:opacity .15s ease-in}</style>
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="styles/launch.css">
  <link rel="stylesheet" href="styles/light-theme.css">
  <link rel="icon" href="favicon.ico" type="image/x-icon">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Launch — Defense Tech Toolkit",
    "url": "https://mergecombinator.com/launch",
    "description": "A structured path from idea to contract for founders building national security technology.",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Merge Combinator",
      "url": "https://mergecombinator.com"
    }
  }
  </script>
</head>
<body class="launch-page">
  <div id="mc-navbar"></div>

  <!-- Hero -->
  <section class="launch-hero">
    <div class="container launch-hero__content">
      <span class="launch-hero__eyebrow">Defense Tech Toolkit</span>
      <h1 class="launch-hero__title">From idea to contract.</h1>
      <p class="launch-hero__subtitle">
        Everything you need to build a defense technology company. Organized by stage, from first orientation to operational scale.
      </p>
      <div class="launch-hero__actions">
        <a href="/founder-path" class="launch-triage">
          <svg class="launch-triage__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          Not sure where to start? Find your stage
        </a>
      </div>
    </div>
  </section>

  <!-- Stages -->
  <section class="launch-stages">
    <div class="container">

      <!-- Stage 1: Pre-Flight -->
      <div class="launch-stage" id="pre-flight">
        <div class="launch-stage__header">
          <div class="launch-stage__number">01</div>
          <div>
            <h2 class="launch-stage__title">Pre-Flight</h2>
            <p class="launch-stage__subtitle">Understand the landscape</p>
          </div>
        </div>
        <p class="launch-stage__description">
          Before anything else, learn how the system works. Who buys, how they buy, and where the money flows. This stage builds the mental model that keeps everything else from being wasted motion.
        </p>
        <div class="launch-resources">
          <a href="https://www.dau.edu/tools/t/Contracting-Cone" target="_blank" rel="noopener" class="launch-resource launch-resource--external">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 7v10M12 7v10M16 7v10"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Contracting Cone</p>
              <p class="launch-resource__meta">Visual guide to contract types and dollar thresholds — DAU</p>
            </div>
          </a>
          <a href="https://www.acquisition.gov/browse/index/far" target="_blank" rel="noopener" class="launch-resource launch-resource--external">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">FAR for Startups</p>
              <p class="launch-resource__meta">Federal Acquisition Regulation — the rules governing DoD procurement</p>
            </div>
          </a>
          <a href="https://www.dau.edu/tools/t/Contract-Type-Comparison" target="_blank" rel="noopener" class="launch-resource launch-resource--external">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Contract Types Explained</p>
              <p class="launch-resource__meta">FFP, T&amp;M, CPFF, CPIF — when to use each and what they mean</p>
            </div>
          </a>
          <a href="https://acqnotes.com/acqnote/acquisitions/ppbe-overview" target="_blank" rel="noopener" class="launch-resource launch-resource--external">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Understanding PPBE</p>
              <p class="launch-resource__meta">Planning, Programming, Budgeting, and Execution cycle</p>
            </div>
          </a>
          <a href="/signals" class="launch-resource">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Signals Feed</p>
              <p class="launch-resource__meta">Live intel from Breaking Defense, ExecutiveGov, and MC analysis</p>
            </div>
          </a>
          <div class="launch-resource launch-resource--gated">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Defense Ecosystem Map</p>
              <p class="launch-resource__meta">Interactive map of commands, agencies, and innovation units</p>
              <p class="launch-resource__gate">Guild — Free</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Stage 2: Spot -->
      <div class="launch-stage" id="spot">
        <div class="launch-stage__header">
          <div class="launch-stage__number">02</div>
          <div>
            <h2 class="launch-stage__title">Spot</h2>
            <p class="launch-stage__subtitle">Find your position on the deck</p>
          </div>
        </div>
        <p class="launch-stage__description">
          Identify the mission problem you solve and the acquisition pathway that fits. Match your technology to active demand signals — SBIR topics, CSOs, OTAs, or direct engagement with problem sponsors.
        </p>
        <div class="launch-resources">
          <a href="https://www.dau.edu/tools/t/Problem-Sponsor" target="_blank" rel="noopener" class="launch-resource launch-resource--external">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Finding Problem Sponsors</p>
              <p class="launch-resource__meta">DAU guide to identifying and engaging problem sponsors in DoD</p>
            </div>
          </a>
          <a href="https://afwerx.com/divisions/" target="_blank" rel="noopener" class="launch-resource launch-resource--external">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">AFWERX Engagement Pathways</p>
              <p class="launch-resource__meta">Air Force innovation pathways: Spark, Prime, and Ventures</p>
            </div>
          </a>
          <a href="https://www.diu.mil/work-with-us" target="_blank" rel="noopener" class="launch-resource launch-resource--external">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">DIU Commercial Solutions Opening</p>
              <p class="launch-resource__meta">How to engage Defense Innovation Unit through CSO process</p>
            </div>
          </a>
          <a href="https://aaf.dau.edu/aaf/ota/" target="_blank" rel="noopener" class="launch-resource launch-resource--external">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Other Transaction Authority Guide</p>
              <p class="launch-resource__meta">OTA vs traditional FAR-based contracts — DAU</p>
            </div>
          </a>
          <a href="/opportunities" class="launch-resource">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Opportunities Board</p>
              <p class="launch-resource__meta">Live solicitations from SBIR, DARPA, DIU, SAM.gov, and more</p>
            </div>
          </a>
          <a href="https://www.sbir.gov/topics" target="_blank" rel="noopener" class="launch-resource launch-resource--external">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">SBIR Topic Search</p>
              <p class="launch-resource__meta">Find open SBIR/STTR topics across all federal agencies</p>
            </div>
          </a>
          <div class="launch-resource launch-resource--gated">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Pricing Strategies for Government Contracts</p>
              <p class="launch-resource__meta">How to structure pricing for FFP, T&amp;M, and CPFF contracts</p>
              <p class="launch-resource__gate">Defense Builders</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Stage 3: Hook Up -->
      <div class="launch-stage" id="hook-up">
        <div class="launch-stage__header">
          <div class="launch-stage__number">03</div>
          <div>
            <h2 class="launch-stage__title">Hook Up</h2>
            <p class="launch-stage__subtitle">Connect to the catapult</p>
          </div>
        </div>
        <p class="launch-stage__description">
          Land your first contract vehicle. Get compliant, write proposals that win, and connect your solution to the acquisition system. This is where most startups stall — the bureaucratic interface between innovation and procurement.
        </p>
        <div class="launch-resources">
          <a href="https://www.sbir.gov/tutorials/preparing-proposals/tutorial-1" target="_blank" rel="noopener" class="launch-resource launch-resource--external">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Phase I Proposal Guide</p>
              <p class="launch-resource__meta">SBIR.gov official tutorial on writing winning proposals</p>
            </div>
          </a>
          <a href="https://dodcio.defense.gov/CMMC/" target="_blank" rel="noopener" class="launch-resource launch-resource--external">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">CMMC 2.0 Requirements</p>
              <p class="launch-resource__meta">Official DoD CMMC program overview and maturity levels</p>
            </div>
          </a>
          <a href="https://www.pmddtc.state.gov/ddtc_public/ddtc_public?id=ddtc_public_portal_itar_landing" target="_blank" rel="noopener" class="launch-resource launch-resource--external">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">ITAR Basics for Startups</p>
              <p class="launch-resource__meta">State Department ITAR portal — registration and compliance basics</p>
            </div>
          </a>
          <a href="https://www.archives.gov/cui/registry/cui-handbook" target="_blank" rel="noopener" class="launch-resource launch-resource--external">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">CUI Marking Handbook</p>
              <p class="launch-resource__meta">NARA guide to marking and handling Controlled Unclassified Information</p>
            </div>
          </a>
          <a href="https://www.dcsa.mil/is/security-clearance-faqs/" target="_blank" rel="noopener" class="launch-resource launch-resource--external">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Security Clearance Process</p>
              <p class="launch-resource__meta">DCSA FAQ on obtaining and maintaining clearances</p>
            </div>
          </a>
          <div class="launch-resource launch-resource--gated">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Proposal Writing Playbook</p>
              <p class="launch-resource__meta">MC framework for structuring winning SBIR/OTA proposals</p>
              <p class="launch-resource__gate">Defense Builders</p>
            </div>
          </div>
        </div>
        <div class="launch-stage-cta">
          <a href="/programs/the-combine" class="launch-stage-cta__card">
            Ready to pressure-test? Apply to The Combine →
          </a>
        </div>
      </div>

      <!-- Stage 4: Tension -->
      <div class="launch-stage" id="tension">
        <div class="launch-stage__header">
          <div class="launch-stage__number">04</div>
          <div>
            <h2 class="launch-stage__title">Tension</h2>
            <p class="launch-stage__subtitle">Build to full power</p>
          </div>
        </div>
        <p class="launch-stage__description">
          You have a contract. Now survive the Valley of Death — the gap between prototype and production where most defense startups die. Build the relationships, evidence base, and operational proof that gets you to scale.
        </p>
        <div class="launch-resources">
          <a href="/learn/read?src=/content/web_small.pdf" class="launch-resource">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Valley of Death Survival Guide</p>
              <p class="launch-resource__meta">John Ferry — 351 pages, read online. The foundational playbook for crossing the valley.</p>
            </div>
          </a>
          <a href="https://www.sbir.gov/sites/default/files/SBA_SBIR_Phase_III_Guide.pdf" target="_blank" rel="noopener" class="launch-resource launch-resource--external">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Phase III Transition Strategies</p>
              <p class="launch-resource__meta">SBA guide to transitioning SBIR tech to production contracts</p>
            </div>
          </a>
          <a href="/signals/interceptor-stockpile-crisis" class="launch-resource">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">The Interceptor Math Is Broken</p>
              <p class="launch-resource__meta">MC Analysis — why affordable mass matters for your production story</p>
            </div>
          </a>
          <div class="launch-resource launch-resource--gated">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Valley of Death Navigator</p>
              <p class="launch-resource__meta">Interactive decision framework for prototype-to-production transitions</p>
              <p class="launch-resource__gate">Defense Builders</p>
            </div>
          </div>
          <div class="launch-resource launch-resource--gated">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Operator Validation Toolkit</p>
              <p class="launch-resource__meta">Templates and frameworks for building warfighter evidence</p>
              <p class="launch-resource__gate">Guild — Free</p>
            </div>
          </div>
        </div>
        <div class="launch-stage-cta">
          <a href="/access?context=founder" class="launch-stage-cta__card">
            Stuck in the valley? Talk to MC →
          </a>
        </div>
      </div>

      <!-- Stage 5: Launch -->
      <div class="launch-stage" id="launch">
        <div class="launch-stage__header">
          <div class="launch-stage__number">05</div>
          <div>
            <h2 class="launch-stage__title">Launch</h2>
            <p class="launch-stage__subtitle">Go operational</p>
          </div>
        </div>
        <p class="launch-stage__description">
          Production contracts, follow-on awards, prime teaming, and building the company that scales with mission demand. At this stage, the right co-builder changes everything.
        </p>
        <div class="launch-resources">
          <a href="/signals/ulysses-combine-to-series-a" class="launch-resource">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">From Combine to Series A: Ulysses</p>
              <p class="launch-resource__meta">MC Case Study — what operator-validated formation actually produces</p>
            </div>
          </a>
          <a href="/signals/vc-defense-alignment-problem" class="launch-resource">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">The $16B Alignment Problem</p>
              <p class="launch-resource__meta">MC Analysis — whether the system can absorb the capital flowing in</p>
            </div>
          </a>
          <div class="launch-resource launch-resource--gated">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Production Contract Playbook</p>
              <p class="launch-resource__meta">Strategies for follow-on, sole-source justification, and teaming</p>
              <p class="launch-resource__gate">Defense Builders</p>
            </div>
          </div>
          <div class="launch-resource launch-resource--gated">
            <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <div class="launch-resource__text">
              <p class="launch-resource__title">Prime Teaming &amp; Subcontractor Strategy</p>
              <p class="launch-resource__meta">How to structure partnerships that scale</p>
              <p class="launch-resource__gate">Defense Builders</p>
            </div>
          </div>
        </div>
        <div class="launch-stage-cta">
          <a href="/access?context=founder" class="launch-stage-cta__card">
            Going operational with a co-builder? Talk to MC →
          </a>
        </div>
      </div>

    </div>
  </section>

  <!-- Bottom CTA -->
  <section class="launch-bottom-cta">
    <div class="container">
      <h2 class="launch-bottom-cta__title">Building something that matters?</h2>
      <p class="launch-bottom-cta__text">
        We go deeper than advice. Merge Combinator builds alongside a small number of companies trading equity for founder-grade expertise.
      </p>
      <a href="/programs/the-combine" class="btn btn--primary btn--glow">Learn about The Combine</a>
    </div>
  </section>

  <!-- Footer -->
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
              <li><a href="/programs/the-combine">The Combine</a></li>
              <li><a href="/builders">Defense Builders</a></li>
              <li><a href="/opportunities">Opportunities</a></li>
            </ul>
          </div>
          <div class="footer__column">
            <h4 class="footer__heading">Company</h4>
            <ul class="footer__list">
              <li><a href="/about">About</a></li>
              <li><a href="/about#faq">FAQ</a></li>
              <li><a href="/access">Contact</a></li>
            </ul>
          </div>
          <div class="footer__column">
            <h4 class="footer__heading">Resources</h4>
            <ul class="footer__list">
              <li><a href="/signals">Signals</a></li>
              <li><a href="/launch">Launch</a></li>
              <li><a href="/knowledge">Knowledge</a></li>
              <li><a href="https://docs.mergecombinator.com">Docs</a></li>
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

  <script type="module" src="script.js"></script>
  <script type="module" src="js/navbar.js"></script>
</body>
</html>
```

**Step 2: Commit**

```bash
git add launch.html
git commit -m "Add launch page — 5-stage carrier-themed defense tech toolkit"
```

---

## Task 7: Update Navigation

**Files:**
- Modify: `public/data/navigation.json`

**Step 1: Add Launch to navigation**

Add `/launch` link in the nav. The exact placement depends on the navigation.json structure — add it to the resources/footer section.

**Step 2: Commit**

```bash
git add public/data/navigation.json
git commit -m "Add launch page to site navigation"
```

---

## Task 8: Update RSS Feed

**Files:**
- Modify: `public/signals.rss`

**Step 1: Expand the RSS feed to include all MC original articles**

Currently only has 3 items. Update to include all 10 articles from signals.json with proper metadata.

**Step 2: Commit**

```bash
git add public/signals.rss
git commit -m "Expand signals RSS feed to include all 10 MC articles"
```

---

## Task 9: Verify Build

**Step 1: Run the dev server and verify both pages load**

```bash
npm run dev
```

Visit:
- `http://localhost:3000/signals` — verify feed loads with intel + MC articles
- `http://localhost:3000/launch` — verify all 5 stages render correctly

**Step 2: Run production build**

```bash
npm run build
```

Verify no build errors.

**Step 3: Final commit if any adjustments needed**

---

## Execution Order

Tasks 1-6 can be executed in two parallel tracks:
- **Track A (Feed):** Task 1 → Task 2 → Task 3 → Task 4
- **Track B (Launch):** Task 5 → Task 6

Task 7 and 8 depend on both tracks completing.
Task 9 is final verification.
