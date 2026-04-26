/**
 * Industry Intel — merges curated articles (intel.json) with live multi-source
 * RSS feeds, renders article cards with source badges and tag filtering,
 * and displays the GovBase "Today in Washington" briefing card.
 */

const INTEL_API = 'https://api.mergecombinator.com/api/intel/feed';
const BRIEFING_API = 'https://api.mergecombinator.com/api/intel/briefing';

const ARROW_SVG = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
  <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function formatDate(dateStr) {
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderArticleCard(article, sources) {
  const source = sources.find(s => s.id === article.source) || { name: article.source, color: '#6b7280' };
  const card = document.createElement('a');
  card.href = article.url;
  card.target = '_blank';
  card.rel = 'noopener';
  card.className = 'intel-card';
  card.dataset.tags = (article.tags || []).join(',').toLowerCase();

  const tags = (article.tags || [])
    .map(t => `<span class="intel-tag">${t}</span>`)
    .join('');

  card.innerHTML = `
    <div class="intel-card__header">
      <span class="intel-source" style="--source-color: ${source.color}">${source.name}</span>
      <span class="intel-date">${formatDate(article.date)}</span>
    </div>
    <h3 class="intel-card__title">${article.title} ${ARROW_SVG}</h3>
    <p class="intel-card__excerpt">${article.excerpt}</p>
    <div class="intel-card__tags">${tags}</div>
  `;

  return card;
}

function collectTags(articles) {
  const tagSet = new Set();
  articles.forEach(a => (a.tags || []).forEach(t => tagSet.add(t.toLowerCase())));
  return Array.from(tagSet).sort();
}

function renderTagFilters(tags, container, grid) {
  const allBtn = document.createElement('button');
  allBtn.className = 'intel-filter intel-filter--active';
  allBtn.textContent = 'All';
  allBtn.addEventListener('click', () => {
    container.querySelectorAll('.intel-filter').forEach(b => b.classList.remove('intel-filter--active'));
    allBtn.classList.add('intel-filter--active');
    grid.querySelectorAll('.intel-card').forEach(c => c.style.display = '');
  });
  container.appendChild(allBtn);

  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'intel-filter';
    btn.textContent = tag;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.intel-filter').forEach(b => b.classList.remove('intel-filter--active'));
      btn.classList.add('intel-filter--active');
      grid.querySelectorAll('.intel-card').forEach(card => {
        const cardTags = card.dataset.tags || '';
        card.style.display = cardTags.includes(tag.toLowerCase()) ? '' : 'none';
      });
    });
    container.appendChild(btn);
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

function renderBriefingCard(briefing, container) {
  if (!briefing) return;

  const card = document.createElement('a');
  card.href = briefing.url;
  card.target = '_blank';
  card.rel = 'noopener';
  card.className = 'intel-briefing';

  const categoriesHtml = (briefing.categories || [])
    .map(cat => {
      const countLabel = cat.count != null ? ` ${cat.count}` : '';
      return `<span class="intel-briefing__chip">${cat.name}${countLabel}</span>`;
    })
    .join('');

  const metaParts = ['via GovBase'];
  if (briefing.sources) metaParts.push(`${briefing.sources} sources`);
  if (briefing.updatedAgo) metaParts.push(`updated ${briefing.updatedAgo}`);

  card.innerHTML = `
    <div class="intel-briefing__header">
      <span class="intel-briefing__eyebrow">Today in Washington</span>
      <span class="intel-briefing__meta">${metaParts.join(' · ')}</span>
    </div>
    <p class="intel-briefing__summary">${briefing.summary}</p>
    ${categoriesHtml ? `<div class="intel-briefing__categories">${categoriesHtml}</div>` : ''}
    <span class="intel-briefing__link">Read full briefing on GovBase ${ARROW_SVG}</span>
  `;

  container.insertBefore(card, container.firstChild);
}

export async function initIntel() {
  const grid = document.getElementById('intel-grid');
  const filtersContainer = document.getElementById('intel-filters');
  if (!grid) return;

  try {
    const [jsonRes, rssArticles, briefing] = await Promise.all([
      fetch('/data/intel.json'),
      fetchRssFeed(),
      fetchBriefing()
    ]);
    const data = await jsonRes.json();
    const sources = data.sources || [];

    // Render briefing card at top of section (before filters)
    const section = grid.closest('.intel-section');
    if (section && briefing) {
      const header = section.querySelector('.intel-header');
      if (header) {
        renderBriefingCard(briefing, header.parentElement);
      }
    }

    // Merge curated + RSS, dedupe by title, sort by date desc
    const seen = new Set();
    const allArticles = [...(data.articles || []), ...rssArticles]
      .filter(a => {
        const key = a.title.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (allArticles.length === 0) {
      grid.innerHTML = '<p class="intel-empty">No articles available. Check back soon.</p>';
      return;
    }

    // Render tag filters
    if (filtersContainer) {
      const tags = collectTags(allArticles);
      renderTagFilters(tags, filtersContainer, grid);
    }

    // Render cards
    allArticles.forEach(article => {
      grid.appendChild(renderArticleCard(article, sources));
    });
  } catch (err) {
    console.error('Failed to load intel data:', err);
    grid.innerHTML = '<p class="intel-empty">Unable to load articles.</p>';
  }
}

document.addEventListener('DOMContentLoaded', initIntel);
