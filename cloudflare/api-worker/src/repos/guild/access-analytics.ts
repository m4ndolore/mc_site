import type pg from 'pg'

interface AccessEventPayload {
  event: string
  data?: Record<string, unknown>
  page?: string
}

interface NormalizedAccessEvent {
  eventName: string
  schemaVersion: string
  sessionId: string
  journeyId: string
  context: string | null
  source: string | null
  referrerHost: string | null
  returnBucket: string | null
  step: string | null
  stage: string | null
  verified: string | null
  legacy: string | null
  role: string | null
  productCount: number | null
  eventTs: Date
  pagePath: string | null
  requestOrigin: string | null
  userAgent: string | null
  payload: Record<string, unknown>
}

let schemaReady = false

async function ensureSchema(pool: InstanceType<typeof pg.Pool>) {
  if (schemaReady) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "access_analytics_raw_events" (
      id BIGSERIAL PRIMARY KEY,
      event_name TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      session_id TEXT NOT NULL,
      journey_id TEXT NOT NULL,
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
      event_ts TIMESTAMPTZ NOT NULL,
      payload JSONB,
      received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "access_analytics_sessions" (
      session_id TEXT PRIMARY KEY,
      schema_version TEXT NOT NULL,
      journey_id TEXT NOT NULL,
      first_seen_at TIMESTAMPTZ NOT NULL,
      last_seen_at TIMESTAMPTZ NOT NULL,
      context TEXT,
      source TEXT,
      referrer_host TEXT,
      intended_destination_bucket TEXT,
      entry_count INTEGER NOT NULL DEFAULT 0,
      step_view_count INTEGER NOT NULL DEFAULT 0,
      journey_select_count INTEGER NOT NULL DEFAULT 0,
      submit_success_count INTEGER NOT NULL DEFAULT 0,
      provision_success_count INTEGER NOT NULL DEFAULT 0,
      products_done_count INTEGER NOT NULL DEFAULT 0,
      last_step TEXT,
      last_stage TEXT,
      last_role TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`CREATE INDEX IF NOT EXISTS access_analytics_raw_events_event_ts_idx ON "access_analytics_raw_events" (event_ts DESC);`)
  await pool.query(`CREATE INDEX IF NOT EXISTS access_analytics_raw_events_event_name_idx ON "access_analytics_raw_events" (event_name);`)
  await pool.query(`CREATE INDEX IF NOT EXISTS access_analytics_raw_events_source_idx ON "access_analytics_raw_events" (source);`)

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

function parseEventTs(input: unknown): Date {
  if (typeof input !== 'string') return new Date()
  const ts = new Date(input)
  if (Number.isNaN(ts.getTime())) return new Date()
  return ts
}

function normalizeEvent(
  payload: AccessEventPayload,
  meta: { origin: string | null; userAgent: string | null }
): NormalizedAccessEvent {
  const data = payload.data || {}

  const eventName = pickString(payload.event, 64)
  if (!eventName) throw new Error('Invalid event name')

  const schemaVersion = pickString(data.schema_version, 32)
  const sessionId = pickString(data.session_id, 64)
  const journeyId = pickString(data.journey_id, 64)

  if (!schemaVersion || !sessionId || !journeyId) {
    throw new Error('Missing required ontology fields: schema_version, session_id, journey_id')
  }

  return {
    eventName,
    schemaVersion,
    sessionId,
    journeyId,
    context: pickString(data.context, 40),
    source: pickString(data.source, 80),
    referrerHost: pickString(data.referrerHost || data.referrer_host, 120),
    returnBucket: pickString(data.return_bucket || data.returnBucket, 40),
    step: pickString(data.step, 24),
    stage: pickString(data.stage, 64),
    verified: pickString(data.verified, 12),
    legacy: pickString(data.legacy, 12),
    role: pickString(data.role, 40),
    productCount: pickCount(data.count),
    eventTs: parseEventTs(data.event_ts),
    pagePath: pickString(payload.page, 256),
    requestOrigin: pickString(meta.origin, 256),
    userAgent: pickString(meta.userAgent, 512),
    payload: data,
  }
}

export async function writeAccessEvent(
  pool: InstanceType<typeof pg.Pool>,
  payload: AccessEventPayload,
  meta: { origin: string | null; userAgent: string | null }
) {
  await ensureSchema(pool)
  const n = normalizeEvent(payload, meta)

  await pool.query(
    `
      INSERT INTO "access_analytics_raw_events" (
        event_name, schema_version, session_id, journey_id,
        context, source, referrer_host, return_bucket,
        step, stage, verified, legacy, role, product_count,
        page_path, request_origin, user_agent, event_ts, payload
      ) VALUES (
        $1,$2,$3,$4,
        $5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14,
        $15,$16,$17,$18,$19
      )
    `,
    [
      n.eventName,
      n.schemaVersion,
      n.sessionId,
      n.journeyId,
      n.context,
      n.source,
      n.referrerHost,
      n.returnBucket,
      n.step,
      n.stage,
      n.verified,
      n.legacy,
      n.role,
      n.productCount,
      n.pagePath,
      n.requestOrigin,
      n.userAgent,
      n.eventTs,
      JSON.stringify(n.payload),
    ]
  )

  const entryInc = n.eventName === 'access_entry' ? 1 : 0
  const stepViewInc = n.eventName === 'access_step_view' ? 1 : 0
  const journeySelectInc = n.eventName === 'access_journey_select' ? 1 : 0
  const submitSuccessInc = n.eventName === 'access_submit_success' ? 1 : 0
  const provisionSuccessInc = n.eventName === 'access_submit_success' && n.verified === 'yes' ? 1 : 0
  const productsDoneInc = n.eventName === 'access_products_done' ? 1 : 0

  await pool.query(
    `
      INSERT INTO "access_analytics_sessions" (
        session_id, schema_version, journey_id,
        first_seen_at, last_seen_at,
        context, source, referrer_host, intended_destination_bucket,
        entry_count, step_view_count, journey_select_count,
        submit_success_count, provision_success_count, products_done_count,
        last_step, last_stage, last_role, updated_at
      ) VALUES (
        $1, $2, $3,
        $4, $4,
        $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17, NOW()
      )
      ON CONFLICT (session_id) DO UPDATE SET
        schema_version = EXCLUDED.schema_version,
        journey_id = EXCLUDED.journey_id,
        last_seen_at = EXCLUDED.last_seen_at,
        context = COALESCE(EXCLUDED.context, "access_analytics_sessions".context),
        source = COALESCE(EXCLUDED.source, "access_analytics_sessions".source),
        referrer_host = COALESCE(EXCLUDED.referrer_host, "access_analytics_sessions".referrer_host),
        intended_destination_bucket = COALESCE(EXCLUDED.intended_destination_bucket, "access_analytics_sessions".intended_destination_bucket),
        entry_count = "access_analytics_sessions".entry_count + EXCLUDED.entry_count,
        step_view_count = "access_analytics_sessions".step_view_count + EXCLUDED.step_view_count,
        journey_select_count = "access_analytics_sessions".journey_select_count + EXCLUDED.journey_select_count,
        submit_success_count = "access_analytics_sessions".submit_success_count + EXCLUDED.submit_success_count,
        provision_success_count = "access_analytics_sessions".provision_success_count + EXCLUDED.provision_success_count,
        products_done_count = "access_analytics_sessions".products_done_count + EXCLUDED.products_done_count,
        last_step = COALESCE(EXCLUDED.last_step, "access_analytics_sessions".last_step),
        last_stage = COALESCE(EXCLUDED.last_stage, "access_analytics_sessions".last_stage),
        last_role = COALESCE(EXCLUDED.last_role, "access_analytics_sessions".last_role),
        updated_at = NOW()
    `,
    [
      n.sessionId,
      n.schemaVersion,
      n.journeyId,
      n.eventTs,
      n.context,
      n.source,
      n.referrerHost,
      n.returnBucket,
      entryInc,
      stepViewInc,
      journeySelectInc,
      submitSuccessInc,
      provisionSuccessInc,
      productsDoneInc,
      n.step,
      n.stage,
      n.role,
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
        COUNT(*) FILTER (WHERE event_name = 'access_journey_select')::int AS journey_selects,
        COUNT(*) FILTER (
          WHERE event_name = 'access_entry'
            AND context IN ('combine', 'builders', 'wingman', 'guild')
            AND return_bucket = context
        )::int AS context_destination_aligned,
        COUNT(*) FILTER (
          WHERE event_name = 'access_entry'
            AND context IN ('combine', 'builders', 'wingman', 'guild')
        )::int AS context_destination_eligible
      FROM "access_analytics_raw_events"
      WHERE event_ts >= NOW() - ($1::int * INTERVAL '1 day')
    `,
    [days]
  )

  const bySource = await pool.query(
    `
      SELECT COALESCE(source, 'none') AS source, COUNT(*)::int AS entries
      FROM "access_analytics_raw_events"
      WHERE event_name = 'access_entry'
        AND event_ts >= NOW() - ($1::int * INTERVAL '1 day')
      GROUP BY 1
      ORDER BY entries DESC
      LIMIT 10
    `,
    [days]
  )

  const byContext = await pool.query(
    `
      SELECT COALESCE(context, 'none') AS context, COUNT(*)::int AS entries
      FROM "access_analytics_raw_events"
      WHERE event_name = 'access_entry'
        AND event_ts >= NOW() - ($1::int * INTERVAL '1 day')
      GROUP BY 1
      ORDER BY entries DESC
      LIMIT 10
    `,
    [days]
  )

  const byReturnBucket = await pool.query(
    `
      SELECT COALESCE(return_bucket, 'unknown') AS return_bucket, COUNT(*)::int AS entries
      FROM "access_analytics_raw_events"
      WHERE event_name = 'access_entry'
        AND event_ts >= NOW() - ($1::int * INTERVAL '1 day')
      GROUP BY 1
      ORDER BY entries DESC
      LIMIT 10
    `,
    [days]
  )

  const entries = totalsResult.rows[0]?.access_entries ?? 0
  const conversions = totalsResult.rows[0]?.access_submit_success ?? 0
  const conversionRate = entries > 0 ? Number(((conversions / entries) * 100).toFixed(2)) : 0

  const aligned = totalsResult.rows[0]?.context_destination_aligned ?? 0
  const eligible = totalsResult.rows[0]?.context_destination_eligible ?? 0
  const alignmentRate = eligible > 0 ? Number(((aligned / eligible) * 100).toFixed(2)) : 0

  return {
    ontology: {
      version: 'v1',
      objects: ['access_session', 'referral_source', 'entry_context', 'destination_bucket', 'conversion_outcome'],
    },
    lookback_days: days,
    totals: {
      access_entries: entries,
      access_submit_success: conversions,
      journey_selects: totalsResult.rows[0]?.journey_selects ?? 0,
      conversion_rate_pct: conversionRate,
      context_destination_alignment_pct: alignmentRate,
    },
    by_source: bySource.rows,
    by_context: byContext.rows,
    by_return_bucket: byReturnBucket.rows,
  }
}
