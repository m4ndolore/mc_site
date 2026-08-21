/**
 * Momentum Ledger — renders /data/momentum.json as a reverse-chronological,
 * month-grouped public record with type filtering. Builder company count is
 * read live from the public directory export so the header never goes stale.
 */

const TYPE_META = {
  milestone: { label: 'Milestone' },
  field: { label: 'Field Ops' },
  program: { label: 'Programs' },
  ecosystem: { label: 'Ecosystem' },
  signal: { label: 'Signals' },
  builder: { label: 'Builder News' },
  press: { label: 'Press' },
  partner: { label: 'Partner' },
};

const ARROW_SVG = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" aria-hidden="true">
  <path d="M4 12L12 4M12 4H6M12 4V10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const EXTERNAL_SVG = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="11" height="11" aria-hidden="true">
  <path d="M6.5 3H3v10h10V9.5M9 3h4v4M13 3L7 9" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function parseDate(dateStr) {
  return new Date(dateStr + 'T00:00:00');
}

function formatDay(dateStr) {
  return parseDate(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

function formatMonth(dateStr) {
  return parseDate(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function relativeDays(dateStr) {
  const days = Math.floor((Date.now() - parseDate(dateStr).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 31) return `${days} days ago`;
  return parseDate(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderEntry(entry) {
  const isReshare = entry.origin === 'reshare';
  const href = isReshare ? entry.source_url : entry.link;
  const el = document.createElement(href ? 'a' : 'div');
  if (href) {
    el.href = href;
    if (isReshare) {
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    }
  }
  el.className = `ledger-entry ledger-entry--${entry.type}${isReshare ? ' ledger-entry--reshare' : ''}`;

  const sourceBadge = isReshare && entry.source_name
    ? `<span class="ledger-entry__source">${entry.source_name}</span>`
    : '';
  const arrow = isReshare
    ? `<span class="ledger-entry__arrow">${EXTERNAL_SVG}</span>`
    : (entry.link ? `<span class="ledger-entry__arrow">${ARROW_SVG}</span>` : '');
  const why = isReshare && entry.why
    ? `<p class="ledger-entry__why"><span class="ledger-entry__why-label">Why it's here:</span> ${entry.why}</p>`
    : '';

  el.innerHTML = `
    <div class="ledger-entry__date">${formatDay(entry.date)}</div>
    <div class="ledger-entry__marker" aria-hidden="true"></div>
    <div class="ledger-entry__content">
      <div class="ledger-entry__meta">
        <span class="ledger-entry__type">${TYPE_META[entry.type]?.label || entry.type}</span>
        ${sourceBadge}
      </div>
      <h3 class="ledger-entry__title">${entry.title}${arrow}</h3>
      <p class="ledger-entry__detail">${entry.detail || ''}</p>
      ${why}
    </div>
  `;
  return el;
}

function renderFeed(entries, activeType) {
  const feed = document.getElementById('ledger-feed');
  feed.innerHTML = '';

  const visible = activeType
    ? entries.filter((e) => e.type === activeType)
    : entries;

  if (!visible.length) {
    feed.innerHTML = '<p class="ledger__empty">No entries of this type yet.</p>';
    return;
  }

  let currentMonth = null;
  let group = null;
  for (const entry of visible) {
    const month = formatMonth(entry.date);
    if (month !== currentMonth) {
      currentMonth = month;
      group = document.createElement('div');
      group.className = 'ledger-group';
      group.innerHTML = `<h2 class="ledger-group__month">${month}</h2>`;
      feed.appendChild(group);
    }
    group.appendChild(renderEntry(entry));
  }
}

function renderFilters(entries, onChange) {
  const container = document.getElementById('ledger-filters');
  const typesPresent = [...new Set(entries.map((e) => e.type))];
  const filters = [{ type: null, label: 'All' }].concat(
    Object.keys(TYPE_META)
      .filter((t) => typesPresent.includes(t))
      .map((t) => ({ type: t, label: TYPE_META[t].label }))
  );

  filters.forEach((f, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ledger__filter' + (i === 0 ? ' is-active' : '');
    btn.textContent = f.label;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.ledger__filter').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      onChange(f.type);
    });
    container.appendChild(btn);
  });
}

function setField(name, value) {
  const el = document.querySelector(`[data-field="${name}"]`);
  if (el) el.textContent = value;
}

async function init() {
  let momentum;
  try {
    const res = await fetch('/data/momentum.json');
    momentum = await res.json();
  } catch {
    document.getElementById('ledger-feed').innerHTML =
      '<p class="ledger__empty">Ledger data unavailable. Try again shortly.</p>';
    return;
  }

  const entries = (momentum.entries || [])
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  setField('last-entry', entries.length ? relativeDays(entries[0].date) : '—');
  setField('entry-count', String(entries.length));

  renderFilters(entries, (type) => renderFeed(entries, type));
  renderFeed(entries, null);

  // Live builder count from the public directory export — non-blocking.
  fetch('/data/companies-public.json')
    .then((res) => res.json())
    .then((data) => {
      const count = data?._meta?.count || (data?.companies || []).length;
      if (count) setField('company-count', String(count));
    })
    .catch(() => {});
}

init();
