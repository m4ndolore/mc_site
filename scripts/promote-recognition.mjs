#!/usr/bin/env node
/**
 * promote-recognition.mjs — merge an mc-content recognition handoff artifact
 * into this site's recognition ledger.
 *
 * Sibling to promote-signal.mjs. Same posture, different payload:
 *   promote-signal.mjs      markdown draft  → a /signals article
 *   promote-recognition.mjs recognition JSON → public/data/recognition.json
 *
 * DIRECTION OF TRAVEL: mc_site PULLS. mc-content never pushes here, and this
 * script never writes to mc-content — it only reads the artifact as plain
 * input. See docs/plans/2026-08-21-cohort-recognition-promoter.md.
 *
 * Recognition lives in its own ledger rather than in companies.json because
 * `npm run seed` regenerates companies.json wholesale from the upstream API.
 * Anything hand-written into that file is destroyed on the next build.
 *
 * Usage:
 *   node scripts/promote-recognition.mjs --in <entry.json> [--dry-run] [--force]
 *   node scripts/promote-recognition.mjs --verify
 *
 * Flags:
 *   --in <path>   the handoff artifact to merge (required unless --verify)
 *   --dry-run     print what would change; write nothing
 *   --force       allow replacing an existing record with the same id
 *   --verify      re-validate every record already in the ledger and exit
 *
 * The artifact must resolve to a company already present in companies.json —
 * this script never invents a company. A record that cannot be matched is a
 * hard failure, not a silent skip.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const COMPANIES_PATH = join(ROOT, 'public', 'data', 'companies.json');
const LEDGER_PATH = join(ROOT, 'public', 'data', 'recognition.json');

// ── arg parsing ──────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { dryRun: false, force: false, verify: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--force') out.force = true;
    else if (a === '--verify') out.verify = true;
    else if (a === '--in') out.in = argv[++i];
    else fail(`unknown argument: ${a}`);
  }
  return out;
}

function fail(msg) {
  console.error(`[promote-recognition] ERROR: ${msg}`);
  process.exit(1);
}

function warn(msg) {
  console.warn(`[promote-recognition] WARN: ${msg}`);
}

// ── company matching ─────────────────────────────────────────────────────────
function normalizeCompanyKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/,?\s*(inc\.?|llc\.?|corporation|corp\.?)\s*$/i, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

/**
 * Resolve a record to a real company. Prefers the stable id; falls back to a
 * normalized name so a re-seed that reissues ids is a warning, not data loss.
 */
function resolveCompany(record, companies) {
  if (record.companyId) {
    const byId = companies.find(c => c.id === record.companyId);
    if (byId) return { company: byId, matchedBy: 'id' };
  }
  if (record.companyName) {
    const key = normalizeCompanyKey(record.companyName);
    const byName = companies.filter(c => normalizeCompanyKey(c.name) === key);
    if (byName.length === 1) return { company: byName[0], matchedBy: 'name' };
    if (byName.length > 1) {
      fail(`"${record.companyName}" matches ${byName.length} companies — disambiguate with companyId`);
    }
  }
  return { company: null, matchedBy: null };
}

// ── validation ───────────────────────────────────────────────────────────────
const REQUIRED_FIELDS = ['id', 'companyName', 'category', 'awarder', 'announcedDate'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Every published claim needs a source. An award with no verifiable link is
 * exactly the kind of thing that should not reach the site.
 */
function validateRecord(record, companies, { strictSources = true } = {}) {
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (!record[field] || String(record[field]).trim() === '') {
      errors.push(`missing required field: ${field}`);
    }
  }

  if (record.announcedDate && !ISO_DATE.test(record.announcedDate)) {
    errors.push(`announcedDate must be YYYY-MM-DD, got "${record.announcedDate}"`);
  }
  if (record.verifiedOn && !ISO_DATE.test(record.verifiedOn)) {
    errors.push(`verifiedOn must be YYYY-MM-DD, got "${record.verifiedOn}"`);
  }

  const sources = Array.isArray(record.sources) ? record.sources : [];
  if (strictSources) {
    if (sources.length === 0) {
      errors.push('at least one source is required — an unsourced award is not publishable');
    }
    for (const [i, s] of sources.entries()) {
      if (!s || !s.url) {
        errors.push(`sources[${i}] is missing a url`);
      } else if (!/^https:\/\//i.test(s.url)) {
        errors.push(`sources[${i}].url must be https, got "${s.url}"`);
      }
    }
  }

  // The posture that makes this publishable at all: MC did not grant the award.
  if (record.attribution && record.attribution !== 'independent') {
    errors.push(`attribution must be "independent" — this ledger is for third-party recognition only (got "${record.attribution}")`);
  }

  const { company, matchedBy } = resolveCompany(record, companies);
  if (!company) {
    errors.push(`no company in companies.json matches companyId="${record.companyId || ''}" / companyName="${record.companyName || ''}"`);
  }

  return { errors, company, matchedBy };
}

/** Fields the site renders. Anything else in the artifact is dropped. */
function normalizeRecord(record, company) {
  const out = {
    id: record.id,
    companyId: company.id,
    companyName: company.name,
    kind: record.kind || 'award',
    product: record.product || company.productName || undefined,
    category: record.category,
    awarder: record.awarder,
    program: record.program || undefined,
    edition: record.edition || undefined,
    year: record.year || Number(record.announcedDate.slice(0, 4)),
    announcedDate: record.announcedDate,
    badgeLabel: record.badgeLabel || `${record.awarder} ${record.announcedDate.slice(0, 4)}`,
    badgeTitle: record.badgeTitle || [record.category, record.program].filter(Boolean).join(' — '),
    summary: record.summary || undefined,
    attribution: 'independent',
    attributionNote: record.attributionNote
      || `Selected by the ${record.awarder} program. Merge Combinator had no role in the nomination or selection.`,
    sources: (record.sources || []).map(s => ({
      title: s.title || undefined,
      url: s.url,
      publisher: s.publisher || undefined,
      date: s.date || undefined,
      primary: Boolean(s.primary),
    })),
    verifiedOn: record.verifiedOn || undefined,
    handoff: record.handoff || undefined,
  };
  // Drop undefined so the committed JSON stays clean.
  return JSON.parse(JSON.stringify(out));
}

function loadLedger() {
  if (!existsSync(LEDGER_PATH)) {
    return {
      schemaVersion: 1,
      description: 'Third-party recognition earned by Combine companies. Merge Combinator does not select, sponsor, or judge these awards and claims no credit for them.',
      maintainedBy: 'scripts/promote-recognition.mjs',
      recognitions: [],
    };
  }
  const ledger = JSON.parse(readFileSync(LEDGER_PATH, 'utf-8'));
  if (!Array.isArray(ledger.recognitions)) ledger.recognitions = [];
  return ledger;
}

function describe(record, matchedBy) {
  return [
    `  id:        ${record.id}`,
    `  company:   ${record.companyName} (${record.companyId}) [matched by ${matchedBy}]`,
    `  award:     ${record.category}`,
    `  awarder:   ${record.awarder}${record.program ? ` — ${record.program}` : ''}`,
    `  announced: ${record.announcedDate}`,
    `  badge:     ${record.badgeLabel}`,
    `  sources:   ${record.sources.map(s => s.url).join('\n             ')}`,
  ].join('\n');
}

// ── main ─────────────────────────────────────────────────────────────────────
const args = parseArgs(process.argv.slice(2));

if (!existsSync(COMPANIES_PATH)) {
  fail('public/data/companies.json not found — run `npm run seed` first');
}
const companies = JSON.parse(readFileSync(COMPANIES_PATH, 'utf-8')).companies || [];

// --verify: re-check what is already committed. Intended for CI and for the
// hand-back check after a re-seed reissues company ids.
if (args.verify) {
  const ledger = loadLedger();
  let bad = 0;
  for (const record of ledger.recognitions) {
    const { errors, matchedBy } = validateRecord(record, companies);
    if (errors.length) {
      bad++;
      console.error(`✗ ${record.id}`);
      errors.forEach(e => console.error(`    ${e}`));
    } else {
      console.log(`✓ ${record.id} — ${record.companyName} [matched by ${matchedBy}]`);
    }
  }
  console.log(`\n${ledger.recognitions.length - bad}/${ledger.recognitions.length} record(s) valid`);
  process.exit(bad ? 1 : 0);
}

if (!args.in) fail('--in <entry.json> is required (or use --verify)');
if (!existsSync(args.in)) fail(`artifact not found: ${args.in}`);

let artifact;
try {
  artifact = JSON.parse(readFileSync(args.in, 'utf-8'));
} catch (err) {
  fail(`could not parse ${args.in} as JSON: ${err.message}`);
}

// Accept a bare record or a { recognitions: [...] } envelope.
const incoming = Array.isArray(artifact.recognitions) ? artifact.recognitions : [artifact];
if (incoming.length === 0) fail('artifact contains no recognition records');

const ledger = loadLedger();
const staged = [];

for (const record of incoming) {
  const { errors, company, matchedBy } = validateRecord(record, companies);
  if (errors.length) {
    console.error(`[promote-recognition] rejected record "${record.id || '(no id)'}":`);
    errors.forEach(e => console.error(`    - ${e}`));
    fail('artifact failed validation — nothing written');
  }

  const normalized = normalizeRecord(record, company);
  if (matchedBy === 'name') {
    warn(`"${normalized.companyName}" matched by name, not id — companyId rewritten to ${company.id}`);
  }

  const existingIndex = ledger.recognitions.findIndex(r => r.id === normalized.id);
  if (existingIndex !== -1 && !args.force) {
    fail(`recognition "${normalized.id}" already exists — pass --force to replace it`);
  }

  staged.push({ normalized, existingIndex, matchedBy });
}

console.log('\n── STAGED ──');
for (const { normalized, existingIndex, matchedBy } of staged) {
  console.log(`${existingIndex === -1 ? 'ADD' : 'REPLACE'}:`);
  console.log(describe(normalized, matchedBy));
  console.log('');
}

if (args.dryRun) {
  console.log('--- DRY RUN: nothing written ---');
  process.exit(0);
}

for (const { normalized, existingIndex } of staged) {
  if (existingIndex === -1) ledger.recognitions.push(normalized);
  else ledger.recognitions[existingIndex] = normalized;
}

// Newest announcement first — stable ordering keeps diffs readable.
ledger.recognitions.sort((a, b) => String(b.announcedDate).localeCompare(String(a.announcedDate)));

writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2) + '\n');
console.log(`✓ wrote public/data/recognition.json (${ledger.recognitions.length} record(s))`);

console.log('\n── FINISH BY HAND ──');
console.log('1. Re-read the source link and confirm every rendered claim matches it.');
console.log('2. node scripts/optimize-static.mjs   — regenerates companies/<slug>.html with the badge.');
console.log('3. Check the card on /combine/cohort25-1 and the company page in both themes.');
console.log('4. npm run lint && npm run build, then commit the ledger + regenerated pages together.');
console.log('5. Tell the partner it is live before any post goes out. Partner-first, always.');
