#!/usr/bin/env node
/**
 * momentum-curate.mjs — pull a candidate entry for the /momentum ledger from
 * a URL into a review queue. NOT an auto-publisher: this only ever writes to
 * scripts/data/momentum-queue.json. A human runs momentum-approve.mjs to
 * promote a queued entry into the live public/data/momentum.json.
 *
 * Reshares are content Merge Combinator did not write — a builder company's
 * own announcement, industry/press coverage, or an institutional partner's
 * update. They render on the ledger muted and compact, always attributed
 * and linked back to the original (see js/momentum/ledger.js).
 *
 * Usage:
 *   node scripts/momentum-curate.mjs <url> --type builder|press|partner [options]
 *
 * Options:
 *   --type <t>     builder | press | partner        (required)
 *   --why "..."    one line: why this belongs on the ledger
 *                  REQUIRED for --type partner (institutional partner news
 *                  needs a stated reason, not just "they mentioned us")
 *   --date YYYY-MM-DD   override the extracted/published date
 *   --title "..."       override the extracted title
 *   --detail "..."      override the extracted excerpt
 *   --source "..."      override the extracted site name
 *
 * Nothing here touches public/data/momentum.json.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUEUE_PATH = join(__dirname, 'data', 'momentum-queue.json');

const VALID_TYPES = ['builder', 'press', 'partner'];

function fail(msg) {
  console.error(`[momentum-curate] ERROR: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--type') out.type = argv[++i];
    else if (a === '--why') out.why = argv[++i];
    else if (a === '--date') out.date = argv[++i];
    else if (a === '--title') out.title = argv[++i];
    else if (a === '--detail') out.detail = argv[++i];
    else if (a === '--source') out.source = argv[++i];
    else positional.push(a);
  }
  out.url = positional[0];
  return out;
}

function extractMeta(html, property) {
  const propRe = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  const m = html.match(propRe);
  if (m) return m[1].trim();
  const revRe = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i');
  const rev = html.match(revRe);
  return rev?.[1]?.trim() ?? '';
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extractDate(html) {
  const iso = extractMeta(html, 'article:published_time') || extractMeta(html, 'datePublished') || extractMeta(html, 'date');
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  return null;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

async function fetchMeta(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MergeCombinator-MomentumCurator/1.0 (https://mergecombinator.com)' },
  });
  if (!res.ok) fail(`fetch failed: ${res.status} ${res.statusText} — ${url}`);
  const html = await res.text();
  return {
    title: decodeEntities(extractMeta(html, 'og:title') || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || ''),
    detail: decodeEntities(extractMeta(html, 'og:description') || extractMeta(html, 'description') || '').slice(0, 240),
    date: extractDate(html),
    siteName: decodeEntities(extractMeta(html, 'og:site_name') || ''),
  };
}

const args = parseArgs(process.argv.slice(2));
if (!args.url) fail('a URL is required: node scripts/momentum-curate.mjs <url> --type builder|press|partner');
if (!args.type || !VALID_TYPES.includes(args.type)) fail(`--type must be one of: ${VALID_TYPES.join(', ')}`);
if (args.type === 'partner' && !args.why) {
  fail('--type partner requires --why "..." — one line on why this institutional update belongs on the ledger');
}
try {
  new URL(args.url);
} catch {
  fail(`invalid URL: ${args.url}`);
}

const meta = await fetchMeta(args.url);

const title = args.title || meta.title;
if (!title) fail('could not extract a title — pass one with --title "..."');

const date = args.date || meta.date || new Date().toISOString().split('T')[0];
const sourceName = args.source || meta.siteName || new URL(args.url).hostname.replace(/^www\./, '');

const entry = {
  id: `${args.type}-${slugify(title)}`,
  date,
  type: args.type,
  origin: 'reshare',
  title,
  detail: args.detail || meta.detail || '',
  source_name: sourceName,
  source_url: args.url,
  ...(args.why ? { why: args.why } : {}),
};

const queue = existsSync(QUEUE_PATH) ? JSON.parse(readFileSync(QUEUE_PATH, 'utf-8')) : { pending: [] };
if (queue.pending.some((e) => e.id === entry.id || e.source_url === entry.source_url)) {
  fail(`already queued: ${entry.id}`);
}
queue.pending.push(entry);
writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n');

console.log(`\n✓ queued ${entry.id}`);
console.log(JSON.stringify(entry, null, 2));
console.log('\nReview scripts/data/momentum-queue.json, then:');
console.log(`  node scripts/momentum-approve.mjs ${entry.id}`);
console.log('or to discard:');
console.log(`  node scripts/momentum-approve.mjs ${entry.id} --reject`);
