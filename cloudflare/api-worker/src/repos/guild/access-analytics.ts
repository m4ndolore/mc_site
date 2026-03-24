import type pg from 'pg'

interface AccessEventPayload {
  event: string
  data?: Record<string, unknown>
  page?: string
}

let schemaReady = false

async function ensureSchema(pool: InstanceType<typeof pg.Pool>) {
  if (schemaReady) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "access_analytics_events" (
      id BIGSERIAL PRIMARY KEY,
      event_name TEXT NOT NULL,
      context TEXT,
      source TEXT,
      referrer_host TEXT,
      return_bucket TEXT,
      step TEXT,
      stage TEXT,
      verified TEXT,
      legacy TEXT,
      role TEXT,
      product_count INTEGER,
      page_path TEXT,
      request_origin TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  await pool.query(`CREATE INDEX IF NOT EXISTS access_analytics_events_created_at_idx ON "access_analytics_events" (created_at DESC);`)
  await pool.query(`CREATE INDEX IF NOT EXISTS access_analytics_events_event_name_idx ON "access_analytics_events" (event_name);`)
  await pool.query(`CREATE INDEX IF NOT EXISTS access_analytics_events_source_idx ON "access_analytics_events" (source);`)
  schemaReady = true
}

function pickString(input: unknown, max = 120): string | null {
  if (typeof input !== 'string') return null
  const v = input.trim()
  if (!v) return null
  return v.slice(0, max)
}

function pickCount(input: unknown): number | null {
  if (typeof input === 'number' && Number.isFinite(input) && input >= 0) return Math.floor(input)
  return null
}

export async function writeAccessEvent(
  pool: InstanceType<typeof pg.Pool>,
  payload: AccessEventPayload,
  meta: { origin: string | null; userAgent: string | null }
) {
  await ensureSchema(pool)

  const data = payload.data || {}
  const eventName = pickString(payload.event, 64)
  if (!eventName) throw new Error('Invalid event name')

  await pool.query(
    `
      INSERT INTO "access_analytics_events" (
        event_name,
        context,
        source,
        referrer_host,
        return_bucket,
        step,
        stage,
        verified,
        legacy,
        role,
        product_count,
        page_path,
        request_origin,
        user_agent
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
      )
    `,
    [
      eventName,
      pickString(data.context),
      pickString(data.source),
      pickString(data.referrerHost),
      pickString(data.return_bucket || data.returnBucket),
      pickString(data.step, 24),
      pickString(data.stage, 64),
      pickString(data.verified, 12),
      pickString(data.legacy, 12),
      pickString(data.role, 40),
      pickCount(data.count),
      pickString(payload.page, 256),
      pickString(meta.origin, 256),
      pickString(meta.userAgent, 512),
    ]
  )
}

export async function fetchAccessSummary(
  pool: InstanceType<typeof pg.Pool>,
  lookbackDays = 7
) {
  await ensureSchema(pool)

  const days = Math.max(1, Math.min(lookbackDays, 30))

  const totalsResult = await pool.query(
    `
      SELECT
        COUNT(*) FILTER (WHERE event_name = 'access_entry')::int AS access_entries,
        COUNT(*) FILTER (WHERE event_name = 'access_submit_success')::int AS access_submit_success,
        COUNT(*) FILTER (WHERE event_name = 'access_journey_select')::int AS journey_selects
      FROM "access_analytics_events"
      WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
    `,
    [days]
  )

  const sourceResult = await pool.query(
    `
      SELECT
        COALESCE(source, 'none') AS source,
        COUNT(*)::int AS entries
      FROM "access_analytics_events"
      WHERE event_name = 'access_entry'
        AND created_at >= NOW() - ($1::int * INTERVAL '1 day')
      GROUP BY 1
      ORDER BY entries DESC
      LIMIT 10
    `,
    [days]
  )

  const returnBucketResult = await pool.query(
    `
      SELECT
        COALESCE(return_bucket, 'unknown') AS return_bucket,
        COUNT(*)::int AS entries
      FROM "access_analytics_events"
      WHERE event_name = 'access_entry'
        AND created_at >= NOW() - ($1::int * INTERVAL '1 day')
      GROUP BY 1
      ORDER BY entries DESC
      LIMIT 10
    `,
    [days]
  )

  const entries = totalsResult.rows[0]?.access_entries ?? 0
  const conversions = totalsResult.rows[0]?.access_submit_success ?? 0
  const conversionRate = entries > 0 ? Number(((conversions / entries) * 100).toFixed(2)) : 0

  return {
    lookback_days: days,
    totals: {
      access_entries: entries,
      access_submit_success: conversions,
      journey_selects: totalsResult.rows[0]?.journey_selects ?? 0,
      conversion_rate_pct: conversionRate,
    },
    by_source: sourceResult.rows,
    by_return_bucket: returnBucketResult.rows,
  }
}
