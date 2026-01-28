// js/dashboard.js
// Ecosystem status console (REQ-C2UX-002)

import { fetchCompanies, extractCompanies, fetchFilterOptions } from './builders/api.js';
import { checkAuth } from './builders/auth.js';

const REFRESH_INTERVAL_MS = 60_000;
const RECENT_WINDOW_DAYS = 7;

const els = {
  lastUpdated: document.getElementById('dashboard-last-updated'),
  authState: document.getElementById('panel-auth-state'),
  metricBuilders: document.getElementById('metric-builders'),
  metricBuildersDelta: document.getElementById('metric-builders-delta'),
  metricMissions: document.getElementById('metric-missions'),
  metricDomains: document.getElementById('metric-domains'),
  metricRecent: document.getElementById('metric-recent'),
  activityList: document.getElementById('activity-list'),
  coverageList: document.getElementById('coverage-list')
};

function formatTime(date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  } catch (err) {
    console.warn('[Dashboard] Failed to format time:', err);
    return '--:--:--';
  }
}

function parseTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getMostRelevantTimestamp(company) {
  return parseTimestamp(company.createdAt) || parseTimestamp(company.updatedAt);
}

function getRecentCompanies(companies) {
  const now = Date.now();
  const windowStart = now - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const withTimestamps = companies
    .map((company) => {
      const ts = getMostRelevantTimestamp(company);
      return ts ? { company, ts } : null;
    })
    .filter(Boolean);

  if (withTimestamps.length === 0) {
    return {
      recent: companies.slice(0, 6).map((company) => ({ company, ts: null })),
      recentCount: 0,
      hasTimestamps: false
    };
  }

  const recent = withTimestamps
    .filter(({ ts }) => ts.getTime() >= windowStart)
    .sort((a, b) => b.ts.getTime() - a.ts.getTime())
    .slice(0, 6);

  return {
    recent,
    recentCount: recent.length,
    hasTimestamps: true
  };
}

function computeCoverage(companies) {
  const counts = new Map();
  companies.forEach((company) => {
    (company.missionAreas || []).forEach((mission) => {
      if (!mission) return;
      counts.set(mission, (counts.get(mission) || 0) + 1);
    });
  });

  const entries = Array.from(counts.entries())
    .map(([mission, count]) => ({ mission, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const maxCount = entries[0]?.count || 1;

  return entries.map((entry) => ({
    ...entry,
    percent: Math.max(8, Math.round((entry.count / maxCount) * 100))
  }));
}

function uniqueCount(values) {
  return new Set(values.filter(Boolean)).size;
}

function updateAuthState(auth) {
  if (!els.authState) return;
  const label = auth.authenticated ? 'authenticated' : 'anonymous';
  const actor = auth.user?.email || auth.user?.name || 'operator';
  els.authState.textContent = `Auth: ${label} (${actor})`;
}

function updateMetrics({ totalBuilders, missionsCount, domainsCount, recentCount, hasTimestamps }) {
  if (els.metricBuilders) els.metricBuilders.textContent = String(totalBuilders);
  if (els.metricMissions) els.metricMissions.textContent = String(missionsCount);
  if (els.metricDomains) els.metricDomains.textContent = String(domainsCount);
  if (els.metricRecent) els.metricRecent.textContent = String(recentCount);

  if (!els.metricBuildersDelta) return;
  const lastTotal = Number(localStorage.getItem('dashboard.lastTotalBuilders') || '0');
  const delta = totalBuilders - lastTotal;

  localStorage.setItem('dashboard.lastTotalBuilders', String(totalBuilders));

  const deltaLabel =
    delta > 0 ? `+${delta} vs last refresh` :
    delta < 0 ? `${delta} vs last refresh` :
    'No change';

  els.metricBuildersDelta.textContent = deltaLabel;
  els.metricBuildersDelta.classList.toggle('metric__delta--positive', delta > 0);
  els.metricBuildersDelta.classList.toggle('metric__delta--neutral', delta <= 0);

  if (!hasTimestamps && els.metricRecent) {
    els.metricRecent.title = 'Recent window requires created/updated timestamps from the API.';
  }
}

function updateActivity(recentResult) {
  if (!els.activityList) return;

  const { recent, hasTimestamps } = recentResult;

  if (!recent.length) {
    els.activityList.innerHTML = '<li class="activity-list__item activity-list__item--empty">No recent records.</li>';
    return;
  }

  const itemsHtml = recent.map(({ company, ts }) => {
    const timeText = ts ? formatTime(ts) : '--:--';
    const metaText = hasTimestamps && ts ? 'timestamped' : 'timestamp unavailable';
    const cohort = company.cohort ? ` · ${escapeHtml(company.cohort)}` : '';

    return `
      <li class="activity-list__item">
        <span class="activity-list__time">${escapeHtml(timeText)}</span>
        <span class="activity-list__name">${escapeHtml(company.displayName || company.name)}</span>
        <span class="activity-list__meta">${escapeHtml(metaText)}${cohort}</span>
      </li>
    `;
  }).join('');

  els.activityList.innerHTML = itemsHtml;
}

function updateCoverage(coverage) {
  if (!els.coverageList) return;

  if (!coverage.length) {
    els.coverageList.innerHTML = '<div class="coverage__row coverage__row--empty">Coverage pending data.</div>';
    return;
  }

  const html = coverage.map(({ mission, count, percent }) => `
    <div class="coverage__row">
      <div class="coverage__label">${escapeHtml(mission)}</div>
      <div class="coverage__value">${escapeHtml(String(count))} records</div>
      <div class="coverage__bar" role="img" aria-label="${escapeHtml(mission)} coverage ${escapeHtml(String(percent))}%">
        <div class="coverage__fill" style="width: ${percent}%"></div>
      </div>
    </div>
  `).join('');

  els.coverageList.innerHTML = html;
}

function updateLastRefresh(now = new Date()) {
  if (!els.lastUpdated) return;
  els.lastUpdated.textContent = formatTime(now);
}

function escapeHtml(value) {
  if (value == null) return '';
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}

async function refreshDashboard() {
  try {
    const [auth, companiesData, filters] = await Promise.all([
      checkAuth(),
      fetchCompanies({ limit: 200 }),
      fetchFilterOptions().catch(() => null)
    ]);

    updateAuthState(auth);

    const companies = extractCompanies(companiesData, { filterAttended: false });
    const totalBuilders = companiesData.total || companies.length;

    const missionsCount =
      filters?.missionAreas?.length ||
      uniqueCount(companies.flatMap((c) => c.missionAreas || []));

    const domainsCount =
      filters?.warfareDomains?.length ||
      uniqueCount(companies.map((c) => c.warfareDomain));

    const recentResult = getRecentCompanies(companies);
    const coverage = computeCoverage(companies);

    updateMetrics({
      totalBuilders,
      missionsCount,
      domainsCount,
      recentCount: recentResult.recentCount,
      hasTimestamps: recentResult.hasTimestamps
    });
    updateActivity(recentResult);
    updateCoverage(coverage);
    updateLastRefresh(new Date());
  } catch (error) {
    console.error('[Dashboard] Failed to refresh:', error);
    if (els.activityList) {
      els.activityList.innerHTML =
        '<li class="activity-list__item activity-list__item--empty">Data unavailable. Retry on next refresh.</li>';
    }
  }
}

function init() {
  if (!els.lastUpdated) return;
  refreshDashboard();
  window.setInterval(refreshDashboard, REFRESH_INTERVAL_MS);
}

init();

