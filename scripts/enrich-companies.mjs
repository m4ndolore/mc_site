#!/usr/bin/env node
/**
 * Enrich companies.json from Airtable CSV exports.
 *
 * Sources (in priority order):
 *   1. Cohort 25-1 CSV  — attendees with scores, synopsis, application summaries
 *   2. Prod List CSV     — all applicants with descriptions
 *
 * Run: node scripts/enrich-companies.mjs [--dry-run]
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '..', 'public', 'data', 'companies.json');
const COHORT_CSV = join(__dirname, '..', 'assets', 'data', 'Cohort 25-1-Cohort 25-1.csv');
const PROD_CSV = join(__dirname, '..', 'assets', 'data', 'Prod List-Grid view.csv');

const dryRun = process.argv.includes('--dry-run');

// ── CSV Parser (handles quoted multi-line fields) ───────────────────
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(field.trim()); field = ''; }
      else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        row.push(field.trim()); field = '';
        if (ch === '\r') i++;
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else { field += ch; }
    }
  }
  if (field || row.length) { row.push(field.trim()); rows.push(row); }
  return rows;
}

function csvToObjects(text) {
  const rows = parseCSV(text);
  const headers = rows[0];
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i] || '');
    return obj;
  });
}

// ── Synopsis Parser ─────────────────────────────────────────────────
// Parses structured synopsis into individual fields.
// Section headers appear on their own line or at the start of a line.
const SECTION_PATTERNS = [
  { key: 'problem', patterns: ['Problem'] },
  { key: 'solution', patterns: ['Solution'] },
  { key: 'fieldValidation', patterns: ['Field Validation', 'Field validation'] },
  { key: 'technologyMaturity', patterns: ['Technology Maturity (TRL)', 'Technology Maturity', 'TRL'] },
  { key: 'strategicAdvantage', patterns: ['Strategic Advantage'] },
  { key: 'goToMarketAccess', patterns: ['Go-to-Market Access', 'Go-to-Market', 'Go to Market'] },
  { key: 'dualUsePotential', patterns: ['Dual-Use Potential', 'Dual-Use', 'Dual Use Potential', 'Dual Use'] },
  { key: 'team', patterns: ['Team'] },
  { key: 'competitiveLandscape', patterns: ['Competitive Landscape', 'Competition'] },
  { key: 'primaryUser', patterns: ['Primary User', 'Primary Users'] },
  { key: 'userCriticalProblem', patterns: ['User-Critical Problem', 'User Critical Problem', 'User Problem'] },
];

function parseSynopsis(text) {
  if (!text || text.length < 30) return null;

  // Build a regex that matches any section header at the start of a line
  const allPatterns = SECTION_PATTERNS.flatMap(s => s.patterns);
  // Sort by length descending so longer patterns match first
  allPatterns.sort((a, b) => b.length - a.length);

  const headerRegex = new RegExp(
    '^(' + allPatterns.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\s*(?:\\n|$)',
    'gm'
  );

  const matches = [...text.matchAll(headerRegex)];

  if (matches.length < 3) {
    // Not enough structure — return as freeform
    return { _freeform: text };
  }

  const sections = {};

  for (let i = 0; i < matches.length; i++) {
    const headerText = matches[i][1];
    const contentStart = matches[i].index + matches[i][0].length;
    const contentEnd = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const content = text.slice(contentStart, contentEnd).trim();

    // Map header text to canonical key
    const section = SECTION_PATTERNS.find(s =>
      s.patterns.some(p => p.toLowerCase() === headerText.toLowerCase())
    );
    if (section && content) {
      sections[section.key] = content;
    }
  }

  return Object.keys(sections).length > 0 ? sections : { _freeform: text };
}

// ── Normalize website ───────────────────────────────────────────────
function normalizeUrl(url) {
  if (!url) return null;
  const w = url.trim();
  if (!w || w === 'N/A' || w === 'n/a' || w === '-') return null;
  if (/^https?:\/\//i.test(w)) return w.toLowerCase();
  return `https://${w}`.toLowerCase();
}

// ── Load data ───────────────────────────────────────────────────────
const raw = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
const cohortRecords = csvToObjects(readFileSync(COHORT_CSV, 'utf-8'));
const prodRecords = csvToObjects(readFileSync(PROD_CSV, 'utf-8'));

console.log(`[enrich] Loaded ${raw.companies.length} PG companies`);
console.log(`[enrich] Loaded ${cohortRecords.length} Cohort CSV records`);
console.log(`[enrich] Loaded ${prodRecords.length} Prod List CSV records`);
console.log();

// ── Build lookups ───────────────────────────────────────────────────
const cohortByOrg = new Map();
cohortRecords.forEach(r => {
  const org = r.Organization?.toLowerCase().trim();
  if (org) cohortByOrg.set(org, r);
});

const prodByOrg = new Map();
const prodByProduct = new Map();
prodRecords.forEach(r => {
  const org = r.Organization?.toLowerCase().trim();
  const prod = r.Product_Name?.toLowerCase().trim();
  if (org) prodByOrg.set(org, r);
  if (prod) prodByProduct.set(prod, r);
});

// ── Enrich existing companies ───────────────────────────────────────
let stats = {
  cohortEnriched: 0,
  descriptionFixed: 0,
  synopsisParsed: 0,
  synopsisFreeform: 0,
  podRankingAdded: 0,
  scoresAdded: 0,
  websiteFixed: 0,
  pipelineSet: 0,
  prodEnriched: 0,
  applicantsAdded: 0,
};

for (const c of raw.companies) {
  const orgKey = c.name?.toLowerCase().trim();

  // Set pipeline stage for all existing companies
  if (c.tulsaAttended === 'Attended') {
    c.pipelineStage = 'alumni';
    c.cohortLabel = 'Cohort 25-1';
  } else {
    c.pipelineStage = 'applicant';
    c.cohortLabel = null;
  }
  stats.pipelineSet++;

  // Cohort CSV enrichment (attendees)
  const cr = cohortByOrg.get(orgKey);
  if (cr) {
    stats.cohortEnriched++;

    // Fix short/missing description from Summary from Application
    const summary = cr['Summary from Application'];
    if (summary && summary.length > 30 && (!c.description || c.description.length < 30)) {
      c.description = summary;
      stats.descriptionFixed++;
    }

    // Parse and store synopsis sections
    const synopsis = cr.Synopsis;
    if (synopsis && synopsis.length > 30) {
      const parsed = parseSynopsis(synopsis);
      if (parsed._freeform) {
        c.synopsisSections = null;
        c.synopsisRaw = parsed._freeform;
        stats.synopsisFreeform++;
      } else {
        c.synopsisSections = parsed;
        c.synopsisRaw = null;
        stats.synopsisParsed++;
      }
    }

    // Pod ranking
    if (cr['Pod Ranking']) {
      c.podRanking = parseInt(cr['Pod Ranking'], 10) || null;
      if (c.podRanking) stats.podRankingAdded++;
    }

    // Competition scores
    const totalBadges = parseInt(cr['Total Badges'], 10);
    if (!isNaN(totalBadges)) {
      c.competitionScores = {
        totalBadges,
        day1: parseFloat(cr['Points - Day 1']) || 0,
        day1Brief: parseFloat(cr['Points - Day 1 Brief']) || 0,
        day2: parseFloat(cr['Points - Day 2']) || 0,
        day2Brief: parseFloat(cr['Points - Day 2 Brief']) || 0,
        day3: parseFloat(cr['Points - Day 3']) || 0,
        day3Brief: parseFloat(cr['Points - Day 3 Brief']) || 0,
        day4: parseFloat(cr['Points - Day 4']) || 0,
        day4Brief: parseFloat(cr['Points - Day 4 Brief']) || 0,
      };
      stats.scoresAdded++;
    }

    // Fill missing website
    if (!c.website && cr['Company URL']) {
      c.website = normalizeUrl(cr['Company URL']);
      if (c.website) stats.websiteFixed++;
    }

    // Fill mission area from cohort if missing
    if (!c.missionArea && cr['Primary Mission']) {
      c.missionArea = cr['Primary Mission'];
    }

    // Warfare domain from cohort if missing
    if (!c.warfareDomain && cr['Warfare Domain']) {
      c.warfareDomain = cr['Warfare Domain'];
    }

    // What is it (hardware/software/both) — store properly
    if (cr['What is it']) {
      c.productType = cr['What is it'];
    }

    // Technology area
    if (cr['Technology Area']) {
      c.technologyArea = cr['Technology Area'];
    }
  }
}

// ── Bring back applicants from Prod List CSV ────────────────────────
// Only those with real descriptions (not one-word) that aren't already in the dataset.
// Use normalized name matching to catch "{Slug} Company" dupes of existing records.

function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/,?\s*(company|inc\.?|llc\.?|corp\.?|corporation|technologies|technology)\s*/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

const existingNames = new Set(raw.companies.map(c => c.name?.toLowerCase().trim()));
const existingNorm = new Set(raw.companies.map(c => normalizeName(c.name)));
const existingProductNorm = new Set(
  raw.companies.map(c => normalizeName(c.productName)).filter(Boolean)
);

let dupesSkipped = 0;

for (const pr of prodRecords) {
  const orgName = pr.Organization?.trim();
  const orgKey = orgName?.toLowerCase();

  // Skip if already exists (exact match), skip test data, skip empty
  if (!orgKey || existingNames.has(orgKey)) continue;
  if (orgName.includes('Merge Combinator')) continue;

  // Skip normalized duplicates (e.g., "Zeromark Company" vs "ZeroMark, Inc.")
  const normOrg = normalizeName(orgName);
  const normProduct = normalizeName(pr.Product_Name);
  if (existingNorm.has(normOrg) || existingProductNorm.has(normOrg) ||
      existingNorm.has(normProduct) || existingProductNorm.has(normProduct)) {
    dupesSkipped++;
    continue;
  }

  // Require a real description (not one-word)
  const desc = pr.Description?.trim();
  if (!desc || desc.length < 30) continue;

  const company = {
    id: `at-${pr.id || orgKey.replace(/\s+/g, '-')}`,
    legacyAirtableId: pr.id || null,
    name: orgName,
    productName: pr.Product_Name || null,
    website: normalizeUrl(pr.Company_URL),
    logoUrl: null,
    cfImageId: null,
    location: null,
    missionArea: pr.Primary_Mission || null,
    warfareDomain: pr.Warfare_Domain || null,
    description: desc,
    trlLevel: parseInt(pr.TRL_Level, 10) || null,
    technicalMaturity: pr.Technical_Maturity || null,
    fundingStage: pr.Funding_Stage || null,
    teamSize: pr.Team_Size || null,
    tulsaAttended: 'No',
    combineStandout: null,
    badgeJudges: null,
    upvoteCount: 0,
    cohort: 'Cohort 25-1',
    cohortId: '25-1',
    pipelineStage: 'applicant',
    cohortLabel: null,
    productType: pr.What_is_it || null,
  };

  raw.companies.push(company);
  existingNames.add(orgKey);
  existingNorm.add(normOrg);
  if (normProduct) existingProductNorm.add(normProduct);
  stats.applicantsAdded++;
}

// ── Sort: alumni first (by pod ranking), then applicants (by name) ──
raw.companies.sort((a, b) => {
  if (a.pipelineStage !== b.pipelineStage) {
    return a.pipelineStage === 'alumni' ? -1 : 1;
  }
  if (a.pipelineStage === 'alumni' && a.podRanking && b.podRanking) {
    return a.podRanking - b.podRanking;
  }
  return (a.name || '').localeCompare(b.name || '');
});

// ── Report ──────────────────────────────────────────────────────────
console.log('── Cohort Enrichment ──');
console.log(`Matched to Cohort CSV: ${stats.cohortEnriched}`);
console.log(`Descriptions fixed from application summary: ${stats.descriptionFixed}`);
console.log(`Synopsis parsed into sections: ${stats.synopsisParsed}`);
console.log(`Synopsis kept as freeform: ${stats.synopsisFreeform}`);
console.log(`Pod rankings added: ${stats.podRankingAdded}`);
console.log(`Competition scores added: ${stats.scoresAdded}`);
console.log(`Websites fixed: ${stats.websiteFixed}`);
console.log();
console.log('── Applicants ──');
console.log(`Applicants added from Prod List: ${stats.applicantsAdded}`);
console.log(`Near-duplicates skipped: ${dupesSkipped}`);
console.log();

const alumni = raw.companies.filter(c => c.pipelineStage === 'alumni');
const applicants = raw.companies.filter(c => c.pipelineStage === 'applicant');
console.log('── Final Dataset ──');
console.log(`Total: ${raw.companies.length}`);
console.log(`  Alumni (Cohort 25-1): ${alumni.length}`);
console.log(`  Applicants: ${applicants.length}`);

// ── Write ───────────────────────────────────────────────────────────
if (dryRun) {
  console.log('\n[enrich] DRY RUN — no changes written.');

  // Show a sample enriched alumni record
  const sample = raw.companies.find(c => c.synopsisSections && Object.keys(c.synopsisSections).length > 5);
  if (sample) {
    console.log('\n── Sample enriched record ──');
    console.log(JSON.stringify(sample, null, 2).slice(0, 2000));
  }
} else {
  const output = {
    ...raw,
    pagination: { ...raw.pagination, total: raw.companies.length },
    metadata: {
      ...raw.metadata,
      enrichedAt: new Date().toISOString(),
      enrichmentSources: ['Cohort 25-1-Cohort 25-1.csv', 'Prod List-Grid view.csv'],
    },
  };
  writeFileSync(DATA_PATH, JSON.stringify(output, null, 2));
  console.log(`\n[enrich] Written ${raw.companies.length} companies to ${DATA_PATH}`);
}
