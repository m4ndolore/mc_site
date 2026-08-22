#!/usr/bin/env node
/**
 * verify-company-slugs.mjs — guard against company page URLs silently moving.
 *
 * Every /companies/{slug} page is generated from `toSlug(company.name)` in
 * optimize-static.mjs. That makes 83 live URLs, the sitemap, and llms.txt all
 * downstream of one string field on the seed feed. If the upstream source ever
 * changes how it spells a company name — a different legal suffix, a fixed
 * typo, a new provider entirely — those URLs move, and nothing in the build
 * fails. The pages regenerate happily under new names and the old ones 404.
 *
 * This compares the slugs the CURRENT feed would produce against the company
 * pages already committed in companies/, and exits non-zero on any drift.
 *
 * Usage:
 *   node scripts/verify-company-slugs.mjs              # against public/data/companies.json
 *   node scripts/verify-company-slugs.mjs --live       # fetch the API directly
 *
 * Run it after `npm run seed` (companies.json is regenerated there), or with
 * --live to check the API without touching the working tree.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_PATH = join(ROOT, 'public', 'data', 'companies.json');
const PAGES_DIR = join(ROOT, 'companies');
const API_BASE = process.env.MC_COMPANY_API_BASE || 'https://www.sigmablox.com';

// Must stay byte-identical to toSlug() in optimize-static.mjs — that is the
// function that actually names the files.
function toSlug(name) {
  return String(name || '')
    .replace(/,?\s*(Inc\.?|LLC\.?|Corporation|Corp\.?|Technologies|Technology)\s*/gi, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

async function loadCompanies() {
  if (process.argv.includes('--live')) {
    const url = new URL('/api/public/companies', API_BASE);
    url.searchParams.set('limit', '200');
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`${url} returned ${res.status}`);
    const data = await res.json();
    return { companies: data.companies || [], source: url.toString() };
  }
  if (!existsSync(DATA_PATH)) {
    throw new Error('public/data/companies.json not found — run `npm run seed` first, or pass --live');
  }
  const data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  return { companies: data.companies || [], source: 'public/data/companies.json' };
}

const { companies, source } = await loadCompanies();

if (companies.length === 0) {
  console.error('[verify-slugs] ERROR: no companies in the feed — refusing to compare against an empty set');
  process.exit(1);
}

const feedSlugs = new Map();
for (const c of companies) {
  const slug = toSlug(c.name);
  if (!slug) {
    console.error(`[verify-slugs] ERROR: "${c.name}" produces an empty slug`);
    process.exit(1);
  }
  if (feedSlugs.has(slug)) {
    console.error(`[verify-slugs] ERROR: "${c.name}" and "${feedSlugs.get(slug)}" both slug to "${slug}" — one page would overwrite the other`);
    process.exit(1);
  }
  feedSlugs.set(slug, c.name);
}

const pageSlugs = new Set(
  readdirSync(PAGES_DIR)
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    .map((f) => f.replace(/\.html$/, '')),
);

const missing = [...pageSlugs].filter((s) => !feedSlugs.has(s)).sort();
const added = [...feedSlugs.keys()].filter((s) => !pageSlugs.has(s)).sort();

console.log(`[verify-slugs] source: ${source}`);
console.log(`[verify-slugs] ${feedSlugs.size} companies in feed, ${pageSlugs.size} pages on disk`);

if (missing.length === 0 && added.length === 0) {
  console.log('[verify-slugs] ✓ every company page keeps its URL');
  process.exit(0);
}

// A page with no company behind it is the dangerous case. It stays on disk and
// keeps serving, but nothing regenerates it, so it silently goes stale — and if
// the company was renamed, its real page now lives at a different URL while the
// old one still ranks.
for (const s of missing) console.error(`[verify-slugs] ORPHAN: /companies/${s} — no company in the feed slugs to it; it will not regenerate`);
for (const s of added) console.log(`[verify-slugs] not yet generated: /companies/${s} (${feedSlugs.get(s)})`);

if (missing.length > 0) {
  console.error(`\n[verify-slugs] ${missing.length} orphaned page(s). If a company was renamed, delete the old page and add a redirect; otherwise the stale URL competes with the live one.`);
  process.exit(1);
}

console.log('\n[verify-slugs] only additions — no existing URL moves.');
process.exit(0);
