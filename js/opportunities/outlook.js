/**
 * Monthly Outlook — fetches outlook.json and renders event cards
 */

const ARROW_SVG = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
  <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function formatDateRange(start, end) {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const opts = { month: 'short', day: 'numeric' };
  if (s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}, ${e.getFullYear()}`;
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderEvent(event) {
  const card = document.createElement('div');
  card.className = `outlook-card${event.priority === 'high' ? ' outlook-card--high' : ''}`;

  const dateRange = formatDateRange(event.dates.start, event.dates.end);

  const locationRows = event.locations
    .map(loc => {
      const date = formatShortDate(loc.date);
      const regLink = loc.register
        ? `<a href="${loc.register}" target="_blank" rel="noopener" class="outlook-location__register">Register ${ARROW_SVG}</a>`
        : '';
      return `<div class="outlook-location">
        <span class="outlook-location__city">${loc.city}</span>
        <span class="outlook-location__date">${date}</span>
        ${regLink}
      </div>`;
    })
    .join('');

  const tagChips = event.tags
    .map(tag => `<span class="outlook-tag">${tag}</span>`)
    .join('');

  const links = event.links
    .map(link => `<a href="${link.url}" target="_blank" rel="noopener" class="outlook-link">${link.label} ${ARROW_SVG}</a>`)
    .join('');

  card.innerHTML = `
    <div class="outlook-card__header">
      <span class="outlook-card__type">${event.type}</span>
      <span class="outlook-card__date">${dateRange}</span>
    </div>
    <h3 class="outlook-card__title">${event.title}</h3>
    <p class="outlook-card__org">${event.organizer}</p>
    <p class="outlook-card__desc">${event.description}</p>
    <div class="outlook-card__locations">${locationRows}</div>
    <div class="outlook-card__footer">
      <div class="outlook-card__tags">${tagChips}</div>
      <div class="outlook-card__links">${links}</div>
    </div>
  `;

  return card;
}

export async function initOutlook() {
  const container = document.getElementById('outlook-grid');
  if (!container) return;

  try {
    const res = await fetch('/data/outlook.json');
    const data = await res.json();

    const monthLabel = document.getElementById('outlook-month');
    if (monthLabel) monthLabel.textContent = data.month;

    if (!data.events || data.events.length === 0) {
      container.innerHTML = '<p class="outlook-empty">No events scheduled this month. Check back soon.</p>';
      return;
    }

    data.events.forEach(event => {
      container.appendChild(renderEvent(event));
    });
  } catch (err) {
    console.error('Failed to load outlook data:', err);
    container.innerHTML = '<p class="outlook-empty">Unable to load events.</p>';
  }
}

document.addEventListener('DOMContentLoaded', initOutlook);
