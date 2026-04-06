import type pg from 'pg'

function pickString(input: unknown, max = 120): string | null {
  if (typeof input !== 'string') return null
  const v = input.trim()
  if (!v) return null
  return v.slice(0, max)
}

export async function writeOutboundClick(
  pool: InstanceType<typeof pg.Pool>,
  companySlug: unknown,
  sourcePage: unknown
) {
  const slug = pickString(companySlug, 120)
  if (!slug) return

  const source = pickString(sourcePage, 120) ?? 'unknown'

  await pool.query(
    `
      INSERT INTO "outbound_click_aggregates" (company_slug, source_page, click_date, click_count)
      VALUES ($1, $2, CURRENT_DATE, 1)
      ON CONFLICT (company_slug, source_page, click_date)
      DO UPDATE SET click_count = "outbound_click_aggregates".click_count + 1
    `,
    [slug, source]
  )
}

export async function fetchOutboundSummary(
  pool: InstanceType<typeof pg.Pool>,
  lookbackDays = 30
) {
  const days = Math.max(1, Math.min(lookbackDays, 90))

  const totalResult = await pool.query(
    `
      SELECT COALESCE(SUM(click_count), 0)::int AS total_clicks
      FROM "outbound_click_aggregates"
      WHERE click_date >= CURRENT_DATE - ($1::int - 1)
    `,
    [days]
  )

  const byCompany = await pool.query(
    `
      SELECT company_slug, SUM(click_count)::int AS total_clicks
      FROM "outbound_click_aggregates"
      WHERE click_date >= CURRENT_DATE - ($1::int - 1)
      GROUP BY company_slug
      ORDER BY total_clicks DESC
      LIMIT 50
    `,
    [days]
  )

  const bySource = await pool.query(
    `
      SELECT source_page, SUM(click_count)::int AS total_clicks
      FROM "outbound_click_aggregates"
      WHERE click_date >= CURRENT_DATE - ($1::int - 1)
      GROUP BY source_page
      ORDER BY total_clicks DESC
    `,
    [days]
  )

  const byCompanyAndSource = await pool.query(
    `
      SELECT company_slug, source_page, SUM(click_count)::int AS total_clicks
      FROM "outbound_click_aggregates"
      WHERE click_date >= CURRENT_DATE - ($1::int - 1)
      GROUP BY company_slug, source_page
      ORDER BY total_clicks DESC
      LIMIT 100
    `,
    [days]
  )

  return {
    lookback_days: days,
    total_clicks: totalResult.rows[0]?.total_clicks ?? 0,
    by_company: byCompany.rows,
    by_source: bySource.rows,
    by_company_and_source: byCompanyAndSource.rows,
  }
}
