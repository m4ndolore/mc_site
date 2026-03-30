#!/usr/bin/env node
/**
 * Data quality scrub for companies.json
 *
 * Removes junk records, deduplicates, normalizes fields.
 * Run: node scripts/scrub-companies.mjs [--dry-run]
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '..', 'public', 'data', 'companies.json');

const dryRun = process.argv.includes('--dry-run');

// ── Load ────────────────────────────────────────────────────────────
const raw = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
const before = raw.companies.length;
console.log(`[scrub] Loaded ${before} companies\n`);

// ── 1. Remove non-cohort test records ───────────────────────────────
const testNames = ['Merge Combinator, LLC', 'Optimized Optics'];
const removed = { test: [], sparse: [], duplicate: [] };

let companies = raw.companies.filter((c) => {
  if (!c.cohort && testNames.includes(c.name)) {
    removed.test.push(c.name);
    return false;
  }
  // Also catch any Merge Combinator with no cohort
  if (!c.cohort && c.name?.includes('Merge Combinator')) {
    removed.test.push(c.name);
    return false;
  }
  if (!c.cohort) {
    removed.test.push(c.name);
    return false;
  }
  return true;
});

// ── 2. Remove no-show + sparse records ──────────────────────────────
const KEY_FIELDS = ['website', 'logoUrl', 'location', 'missionArea', 'warfareDomain'];

companies = companies.filter((c) => {
  if (c.tulsaAttended === 'Attended') return true;

  const nullCount = KEY_FIELDS.filter(
    (f) => c[f] === null || c[f] === undefined || c[f] === '' || c[f] === 'N/A'
  ).length;

  // Short or missing description counts as sparse too
  const descSparse =
    !c.description || c.description.length < 20;

  if (nullCount >= 4 || (nullCount >= 3 && descSparse)) {
    removed.sparse.push(`${c.name} (nulls: ${nullCount}, desc: ${c.description?.length || 0} chars)`);
    return false;
  }

  return true;
});

// ── 3. Deduplicate Anuma Aerospace Corporation ──────────────────────
const anumaRecords = companies.filter(
  (c) => c.name === 'Anuma Aerospace Corporation'
);
if (anumaRecords.length > 1) {
  // Keep the one with the longer description
  const keeper = anumaRecords.reduce((a, b) =>
    (a.description?.length || 0) >= (b.description?.length || 0) ? a : b
  );
  keeper.tulsaAttended = 'Attended';

  const removedIds = new Set(
    anumaRecords.filter((c) => c.id !== keeper.id).map((c) => c.id)
  );
  companies = companies.filter(
    (c) => c.name !== 'Anuma Aerospace Corporation' || !removedIds.has(c.id)
  );
  removed.duplicate.push(
    `Anuma Aerospace Corporation (kept ${keeper.id}, removed ${removedIds.size} stub(s))`
  );
}

// ── 4. Normalize websites ───────────────────────────────────────────
let websitesFixed = 0;
let websitesNulled = 0;

for (const c of companies) {
  if (!c.website) continue;

  const w = c.website.trim();

  if (w === 'N/A' || w === 'n/a' || w === 'NA' || w === '-' || w === '') {
    c.website = null;
    websitesNulled++;
    continue;
  }

  if (!/^https?:\/\//i.test(w)) {
    c.website = `https://${w.replace(/^www\./i, 'www.')}`.toLowerCase();
    websitesFixed++;
  }
}

// ── 5. Flag "Company" names for manual review ───────────────────────
const companyNameFlags = companies.filter(
  (c) => /\bCompany$/i.test(c.name?.trim())
);

// ── Report ──────────────────────────────────────────────────────────
console.log('── Removals ──');
console.log(`Test/no-cohort records removed: ${removed.test.length}`);
removed.test.forEach((n) => console.log(`  - ${n}`));

console.log(`\nSparse no-show records removed: ${removed.sparse.length}`);
removed.sparse.forEach((n) => console.log(`  - ${n}`));

console.log(`\nDuplicates resolved: ${removed.duplicate.length}`);
removed.duplicate.forEach((n) => console.log(`  - ${n}`));

console.log('\n── Fixes ──');
console.log(`Websites normalized (added https://): ${websitesFixed}`);
console.log(`Websites nulled (was N/A or empty): ${websitesNulled}`);

console.log('\n── Manual Review Needed ──');
console.log(`Companies with "Company" in name (${companyNameFlags.length}):`);
companyNameFlags.forEach((c) =>
  console.log(`  - "${c.name}" (attended: ${c.tulsaAttended}, desc: ${c.description?.slice(0, 40)}...)`)
);

const after = companies.length;
console.log(`\n── Summary ──`);
console.log(`Before: ${before} → After: ${after} (removed ${before - after})`);

// ── Write ───────────────────────────────────────────────────────────
if (dryRun) {
  console.log('\n[scrub] DRY RUN — no changes written.');
} else {
  const output = {
    ...raw,
    companies,
    pagination: {
      ...raw.pagination,
      total: after,
    },
    metadata: {
      ...raw.metadata,
      scrubbedAt: new Date().toISOString(),
    },
  };
  writeFileSync(DATA_PATH, JSON.stringify(output, null, 2));
  console.log(`\n[scrub] Written ${after} companies to ${DATA_PATH}`);
}
