#!/usr/bin/env node
/**
 * Import companies from companies.json into Postgres.
 * Run once to seed the companies table.
 *
 * Usage:
 *   DATABASE_URL="postgres://..." node scripts/import-companies-to-db.mjs
 *
 * Or using .dev.vars:
 *   DATABASE_URL="$(grep DATABASE_URL .dev.vars | cut -d= -f2-)" node scripts/import-companies-to-db.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

// ── CTA assignment logic ──────────────────────────────────────────────────────
const CTA_RULES = {
  AAI: {
    tech: ['trusted ai', 'advanced computing'],
    mission: ['autonomy'],
  },
  BIO: {
    tech: ['biotechnology'],
    mission: [],
  },
  LOG: {
    tech: ['maritime'],
    mission: ['logistics', 'maintenance'],
  },
  'Q-BID': {
    tech: ['quantum', 'integrated sensing and cyber'],
    mission: ['intel and battlespace awareness', 'cyber', 'information', 'command and control', 'isr'],
  },
  SCADE: {
    tech: ['energy resilience'],
    mission: [],
  },
  SHY: {
    tech: ['hypersonics', 'aerospace', 'space technology', 'advanced materials'],
    mission: ['joint fires (offense)', 'fires'],
  },
};

function assignCTAs(company) {
  const ctas = [];
  const tech = (company.technologyArea || '').toLowerCase();
  const mission = (company.missionArea || '').toLowerCase();

  for (const [code, { tech: techTerms, mission: missionTerms }] of Object.entries(CTA_RULES)) {
    if (techTerms.some(t => tech.includes(t))) { ctas.push(code); continue; }
    if (missionTerms.some(m => mission.includes(m))) { ctas.push(code); }
  }
  return ctas;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const jsonPath = process.env.COMPANIES_JSON_PATH
    ? resolve(process.cwd(), process.env.COMPANIES_JSON_PATH)
    : resolve(__dirname, '../.private/data/companies.json');
  const { companies } = JSON.parse(readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${companies.length} companies from JSON`);

  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Check if table already has data
    const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) as count FROM companies');
    if (parseInt(count, 10) > 0) {
      console.log(`companies table already has ${count} rows. Truncating...`);
      await pool.query('TRUNCATE companies');
    }

    let inserted = 0;
    for (const c of companies) {
      const ctas = assignCTAs(c);

      await pool.query(`
        INSERT INTO companies (
          id, legacy_airtable_id, name, product_name, website, logo_url, cf_image_id,
          location, description, mission_area, warfare_domain, technology_area,
          product_type, trl_level, technical_maturity, funding_stage, team_size,
          pipeline_stage, ctas, cohort, cohort_id, cohort_label, tulsa_attended,
          combine_standout, badge_judges, pod_ranking, upvote_count,
          synopsis_sections, synopsis_raw, competition_scores
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
        )
      `, [
        c.id,
        c.legacyAirtableId || null,
        c.name,
        c.productName || null,
        c.website || null,
        c.logoUrl || null,
        c.cfImageId || null,
        c.location || null,
        c.description || null,
        c.missionArea || null,
        c.warfareDomain || null,
        c.technologyArea || null,
        c.productType || null,
        c.trlLevel || null,
        c.technicalMaturity || null,
        c.fundingStage || null,
        c.teamSize || null,
        c.pipelineStage || 'applicant',
        ctas,
        c.cohort || null,
        c.cohortId || null,
        c.cohortLabel || null,
        c.tulsaAttended || null,
        c.combineStandout || null,
        c.badgeJudges || null,
        c.podRanking || null,
        c.upvoteCount || 0,
        c.synopsisSections ? JSON.stringify(c.synopsisSections) : null,
        c.synopsisRaw || null,
        c.competitionScores ? JSON.stringify(c.competitionScores) : null,
      ]);
      inserted++;
    }

    // Report CTA distribution
    const { rows: ctaRows } = await pool.query(`
      SELECT unnest(ctas) as cta, COUNT(*) as count
      FROM companies
      WHERE array_length(ctas, 1) > 0
      GROUP BY cta
      ORDER BY count DESC
    `);

    console.log(`\nImported ${inserted} companies`);
    console.log('\nCTA distribution:');
    ctaRows.forEach(r => console.log(`  ${r.cta}: ${r.count}`));

    const { rows: [{ unassigned }] } = await pool.query(
      "SELECT COUNT(*) as unassigned FROM companies WHERE array_length(ctas, 1) IS NULL OR array_length(ctas, 1) = 0"
    );
    console.log(`  Unassigned: ${unassigned}`);

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
