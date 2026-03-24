import { Hono } from 'hono'
import type { Env, AppVars } from '../types'
import { ok, err } from '../lib/envelope'
import { verifyOidc } from '../middleware/verify-oidc'
import { getDb } from '../lib/db'
import { fetchAccessSummary, writeAccessEvent } from '../repos/guild/access-analytics'

const analytics = new Hono<{ Bindings: Env; Variables: AppVars }>()

const INGEST_ALLOWED_ORIGINS = new Set([
  'https://mergecombinator.com',
  'https://www.mergecombinator.com',
])

const ALLOWED_EVENTS = new Set([
  'access_entry',
  'access_step_view',
  'access_journey_select',
  'access_submit_success',
  'access_products_done',
])

function requireOpsRole(c: { get: (k: string) => { roleLevel: number } }) {
  const user = c.get('user')
  return user.roleLevel >= 3
}

analytics.post('/access/events', async (c) => {
  const requestId = c.get('requestId')
  const origin = c.req.header('Origin') || null

  if (!origin || !INGEST_ALLOWED_ORIGINS.has(origin)) {
    return c.json(err('FORBIDDEN', 'Origin not allowed', { request_id: requestId }), 403)
  }

  let body: { event?: string; data?: Record<string, unknown>; page?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json(err('INVALID_INPUT', 'Invalid JSON body', { request_id: requestId }), 400)
  }

  const eventName = typeof body.event === 'string' ? body.event : ''
  if (!ALLOWED_EVENTS.has(eventName)) {
    return c.json(err('INVALID_INPUT', 'Unsupported event', { request_id: requestId }), 400)
  }

  const { pool } = getDb(c.env.HYPERDRIVE)
  await writeAccessEvent(
    pool,
    { event: eventName, data: body.data || {}, page: body.page },
    { origin, userAgent: c.req.header('User-Agent') || null }
  )

  return c.json(ok({ accepted: true }, { request_id: requestId }), 202)
})

analytics.use('/access/summary', verifyOidc)

analytics.get('/access/summary', async (c) => {
  const requestId = c.get('requestId')
  if (!requireOpsRole(c)) {
    return c.json(err('FORBIDDEN', 'Access restricted', { request_id: requestId }), 403)
  }

  const daysRaw = c.req.query('days')
  const days = daysRaw ? Number(daysRaw) : 7
  const lookback = Number.isFinite(days) ? Math.floor(days) : 7

  const { pool } = getDb(c.env.HYPERDRIVE)
  const summary = await fetchAccessSummary(pool, lookback)

  return c.json(ok(summary, {
    request_id: requestId,
    issued_at: new Date().toISOString(),
  }))
})

export { analytics as analyticsRouter }
