/**
 * Momentum Ledger — renders /data/momentum.json as a reverse-chronological
 * public timeline with type filtering. Builder company count is
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
  return parseDate(dateStr).toLocaleDateString('en-US', { day: '2-digit' });
}

function formatMonth(dateStr) {
  return parseDate(dateStr).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

function formatYear(dateStr) {
  return parseDate(dateStr).getFullYear();
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
    ? `<p class="ledger-entry__why"><span class="ledger-entry__why-label">Why it’s here:</span> ${entry.why}</p>`
    : '';

  el.innerHTML = `
    <time class="ledger-entry__date" datetime="${entry.date}">
      <span class="ledger-entry__month">${formatMonth(entry.date)}</span>
      <span class="ledger-entry__day">${formatDay(entry.date)}</span>
      <span class="ledger-entry__year">${formatYear(entry.date)}</span>
    </time>
    <div class="ledger-entry__rail" aria-hidden="true"><span></span></div>
    <div class="ledger-entry__card">
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

function initials(name) {
  return name.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase();
}

function renderVoices(voices) {
  const grid = document.getElementById('ledger-voices');
  if (!grid) return;
  const ordered = voices.slice().sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));

  grid.innerHTML = ordered.map((voice) => {
    const tag = voice.profile_url ? 'a' : 'article';
    const link = voice.profile_url
      ? ` href="${voice.profile_url}" target="_blank" rel="noopener noreferrer"`
      : '';
    const portrait = voice.image
      ? `<img class="voice-card__image" src="${voice.image}" alt="${voice.image_alt || ''}" loading="lazy">`
      : `<span class="voice-card__monogram" aria-hidden="true">${initials(voice.name)}</span>`;
    const context = [voice.audience, voice.program].filter(Boolean).join(' · ') || 'From the field';

    return `
      <${tag} class="voice-card${voice.image ? ' voice-card--portrait' : ''}"${link}>
        <div class="voice-card__visual">${portrait}</div>
        <div class="voice-card__body">
          <span class="voice-card__context">${context}</span>
          <p class="voice-card__quote">“${voice.quote}”</p>
          <div class="voice-card__author">
            <div class="voice-card__info">
              <span class="voice-card__name">${voice.name}</span>
              <span class="voice-card__role">${voice.role}</span>
            </div>
            ${voice.profile_url ? `<span class="voice-card__arrow">${EXTERNAL_SVG}</span>` : ''}
          </div>
        </div>
      </${tag}>
    `;
  }).join('');
}

function renderUpcoming(events) {
  const section = document.getElementById('ledger-upcoming');
  const list = document.getElementById('ledger-upcoming-list');
  if (!section || !list) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = events
    .filter((event) => new Date(event.dates.end + 'T00:00:00') >= today)
    .sort((a, b) => a.dates.start.localeCompare(b.dates.start));

  if (!upcoming.length) return;
  section.hidden = false;
  list.innerHTML = upcoming.map((event) => `
    <a class="upcoming-card" href="/opportunities">
      <span class="upcoming-card__type">${event.type}</span>
      <h3 class="upcoming-card__title">${event.title}</h3>
      <p class="upcoming-card__org">${event.organizer}</p>
    </a>
  `).join('');
}

function renderMedia(appearances) {
  const section = document.getElementById('ledger-media-section');
  const row = document.getElementById('ledger-media-row');
  if (!section || !row || !appearances.length) return;

  section.hidden = false;
  row.innerHTML = appearances.map((appearance) => `
    <a class="media-card" href="${appearance.url}" target="_blank" rel="noopener noreferrer">
      ${appearance.thumbnail ? `<img class="media-card__thumb" src="${appearance.thumbnail}" alt="" loading="lazy">` : '<span class="media-card__thumb media-card__thumb--placeholder"></span>'}
      <span class="media-card__title">${appearance.title}</span>
      <span class="media-card__show">${appearance.show}</span>
    </a>
  `).join('');
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

  for (const entry of visible) {
    feed.appendChild(renderEntry(entry));
  }
}

function renderHighlights(entries) {
  const track = document.getElementById('ledger-highlights');
  if (!track) return;

  entries.filter((entry) => entry.featured !== false).slice(0, 4).forEach((entry, index) => {
    const isReshare = entry.origin === 'reshare';
    const href = isReshare ? entry.source_url : entry.link;
    const el = document.createElement(href ? 'a' : 'article');
    if (href) {
      el.href = href;
      if (isReshare) {
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
      }
    }
    el.className = 'ledger-highlight';
    el.innerHTML = `
      <span class="ledger-highlight__number">${String(index + 1).padStart(2, '0')}</span>
      <span class="ledger-highlight__meta">${formatMonth(entry.date)} ${formatDay(entry.date)} · ${TYPE_META[entry.type]?.label || entry.type}</span>
      <h3 class="ledger-highlight__title">${entry.title}</h3>
      ${href ? `<span class="ledger-highlight__arrow">${isReshare ? EXTERNAL_SVG : ARROW_SVG}</span>` : ''}
    `;
    track.appendChild(el);
  });
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
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    btn.addEventListener('click', () => {
      container.querySelectorAll('.ledger__filter').forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
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
  renderHighlights(entries);
  renderFilters(entries, (type) => renderFeed(entries, type));
  renderFeed(entries, null);

  // Live builder count from the public directory export — non-blocking.
  fetch('/data/companies-public.json')
    .then((res) => res.json())
    .then((data) => {
      const count = data?._meta?.count || (data?.companies || []).length;
      setField('company-count', `${Math.max(83, count || 0)}+`);
    })
    .catch(() => {});

  fetch('/data/voices.json')
    .then((res) => res.json())
    .then((data) => {
      const voices = data.voices || [];
      setField('voice-count', String(voices.length));
      renderVoices(voices);
    })
    .catch(() => {});

  fetch('/data/outlook.json')
    .then((res) => res.json())
    .then((data) => renderUpcoming(data.events || []))
    .catch(() => {});

  fetch('/data/media.json')
    .then((res) => res.json())
    .then((data) => renderMedia(data.appearances || []))
    .catch(() => {});
}

init();
