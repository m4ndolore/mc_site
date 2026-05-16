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
  { label: 'Latest', keywords: null },
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
        <span class="feed-card__source feed-card__source--mc">Merge Combinator</span>
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
      <span class="feed-briefing__meta">${metaParts.join(' \u00b7 ')}</span>
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
    <button class="feed-source-btn" data-source="mc">Merge Combinator</button>
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

    // Find featured MC article (most recent with featured flag, or just most recent)
    const sortedMC = [...signalsData.articles].sort((a, b) => new Date(b.date) - new Date(a.date));
    const featured = sortedMC.find(a => a.featured) || sortedMC[0];

    if (featuredSlot && featured) {
      const featuredImage = featured.image || '/assets/arrows-new.png';
      const imageHtml = `<div class="feed-featured__image"><img src="${featuredImage}" alt="" loading="lazy"></div>`;

      featuredSlot.innerHTML = `
        <a href="${featured.url}" class="feed-featured">
          ${imageHtml}
          <div class="feed-featured__content">
            <span class="feed-card__source feed-card__source--mc">Merge Combinator</span>
            <h2 class="feed-featured__title">${featured.title}</h2>
            <p class="feed-featured__excerpt">${featured.excerpt}</p>
            <span class="feed-featured__meta">${featured.author} \u00b7 ${formatDate(featured.date)}</span>
          </div>
        </a>
      `;
    }

    // Merge all articles, dedupe, sort by date
    const seen = new Set();
    if (featured) seen.add(featured.title.toLowerCase().trim());

    const mcArticles = signalsData.articles
      .filter(a => a !== featured)
      .map(a => ({ ...a, _type: 'mc', tags: a.tags || [a.category] }));

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
