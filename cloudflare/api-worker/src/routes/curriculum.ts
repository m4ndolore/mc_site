import { Hono } from 'hono'
import type { Env, AppVars } from '../types'
import { ok, err } from '../lib/envelope'
import { verifyOidc } from '../middleware/verify-oidc'
import { getDb } from '../lib/db'
import { logCurriculumEvent, getUserProgress, updateUserProgress } from '../repos/curriculum'
import type { CurriculumEvent, UserCurriculumProgress } from '../types/curriculum'

const curriculum = new Hono<{ Bindings: Env; Variables: AppVars }>()

const INGEST_ALLOWED_ORIGINS = new Set([
  'https://mergecombinator.com',
  'https://www.mergecombinator.com',
])

const VALID_EVENTS = new Set([
  'triage_complete',
  'curriculum_view',
  'content_click',
  'content_engaged',
  'content_saved',
  'signup_prompt_shown',
  'signup_click',
  'advance_request',
  'advisory_prompt_shown',
  'advisory_click',
  'curriculum_return',
])

const VALID_RESOURCE_TYPES = new Set(['knowledge', 'learn', 'signal', 'external', 'gated'])

function requireOpsRole(c: { get: (k: string) => { roleLevel: number } }) {
  const user = c.get('user')
  return user.roleLevel >= 3
}

// ── POST /api/curriculum/events ─────────────────────────────────────────────────
// Log curriculum events (anonymous sessions + authenticated founders)
curriculum.post('/events', async (c) => {
  const requestId = c.get('requestId')
  const origin = c.req.header('Origin') || null

  if (!origin || !INGEST_ALLOWED_ORIGINS.has(origin)) {
    return c.json(err('FORBIDDEN', 'Origin not allowed', { request_id: requestId }), 403)
  }

  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json(err('INVALID_INPUT', 'Invalid JSON body', { request_id: requestId }), 400)
  }

  // Validate required fields
  const eventType = typeof body.event === 'string' ? body.event : ''
  if (!VALID_EVENTS.has(eventType)) {
    return c.json(err('INVALID_INPUT', `Invalid event type: ${eventType}`, { request_id: requestId }), 400)
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
  if (!sessionId) {
    return c.json(err('INVALID_INPUT', 'Missing required field: sessionId', { request_id: requestId }), 400)
  }

  const timestamp = typeof body.timestamp === 'string' ? body.timestamp.trim() : ''
  if (!timestamp) {
    return c.json(err('INVALID_INPUT', 'Missing required field: timestamp', { request_id: requestId }), 400)
  }

  // Validate optional resource type if provided
  const resourceType = body.resourceType ? String(body.resourceType) : undefined
  if (resourceType && !VALID_RESOURCE_TYPES.has(resourceType)) {
    return c.json(err('INVALID_INPUT', `Invalid resourceType: ${resourceType}`, { request_id: requestId }), 400)
  }

  try {
    const { pool } = getDb(c.env.HYPERDRIVE)
    const event: CurriculumEvent = {
      event: eventType as any,
      resourceId: body.resourceId ? String(body.resourceId) : undefined,
      resourceType: resourceType as any,
      stage: body.stage ? String(body.stage) : undefined,
      fromStage: body.fromStage ? String(body.fromStage) : undefined,
      toStage: body.toStage ? String(body.toStage) : undefined,
      reason: body.reason ? String(body.reason) : undefined,
      funderId: body.funderId ? String(body.funderId) : undefined,
      sessionId,
      timeSpent: body.timeSpent ? Number(body.timeSpent) : undefined,
      timestamp,
    }

    await logCurriculumEvent(pool, event)
    return c.json(ok({ accepted: true, stored: true }, { request_id: requestId }), 202)
  } catch (error) {
    // Never break UX because curriculum storage is unavailable
    console.error('curriculum event ingest failed', error)
    return c.json(ok({ accepted: true, stored: false }, {
      request_id: requestId,
      warning: 'curriculum_storage_unavailable',
    }), 202)
  }
})

// ── GET /api/curriculum/user-progress ───────────────────────────────────────────
// Retrieve user curriculum progress (requires Guild auth)
curriculum.use('/user-progress', verifyOidc)

curriculum.get('/user-progress', async (c) => {
  const requestId = c.get('requestId')
  const user = c.get('user')

  if (!user || !user.sub) {
    return c.json(err('UNAUTHORIZED', 'User not authenticated', { request_id: requestId }), 401)
  }

  try {
    const { pool } = getDb(c.env.HYPERDRIVE)
    const progress = await getUserProgress(pool, user.sub)

    if (!progress) {
      return c.json(ok({
        funderId: user.sub,
        currentStage: 'intake',
        engagedResources: [],
        completedResources: [],
        savedResources: [],
        triageResponses: {},
        advanceRequests: [],
        lastVisited: new Date().toISOString(),
      }, {
        request_id: requestId,
        new_user: true,
      }))
    }

    return c.json(ok(progress, {
      request_id: requestId,
      issued_at: new Date().toISOString(),
    }))
  } catch (error) {
    console.error('curriculum progress fetch failed', error)
    return c.json(err('INTERNAL', 'Failed to retrieve progress', {
      request_id: requestId,
    }), 500)
  }
})

// ── POST /api/curriculum/advance-request ────────────────────────────────────────
// Request curriculum stage advancement with reasoning
curriculum.use('/advance-request', verifyOidc)

curriculum.post('/advance-request', async (c) => {
  const requestId = c.get('requestId')
  const user = c.get('user')

  if (!user || !user.sub) {
    return c.json(err('UNAUTHORIZED', 'User not authenticated', { request_id: requestId }), 401)
  }

  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json(err('INVALID_INPUT', 'Invalid JSON body', { request_id: requestId }), 400)
  }

  const fromStage = typeof body.fromStage === 'string' ? body.fromStage.trim() : ''
  const toStage = typeof body.toStage === 'string' ? body.toStage.trim() : ''
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

  if (!fromStage || !toStage) {
    return c.json(err('INVALID_INPUT', 'Missing required fields: fromStage, toStage', { request_id: requestId }), 400)
  }

  try {
    const { pool } = getDb(c.env.HYPERDRIVE)

    // Log the advance request event
    const event: CurriculumEvent = {
      event: 'advance_request',
      fromStage,
      toStage,
      reason: reason || undefined,
      funderId: user.sub,
      sessionId: c.get('requestId'),
      timestamp: new Date().toISOString(),
    }

    await logCurriculumEvent(pool, event)

    // Retrieve current progress and record the request
    const progress = await getUserProgress(pool, user.sub)
    const currentProgress = progress || {
      funderId: user.sub,
      currentStage: 'intake',
      engagedResources: [],
      completedResources: [],
      savedResources: [],
      triageResponses: {},
      advanceRequests: [],
      lastVisited: new Date().toISOString(),
    }

    const advanceRecord = {
      from: fromStage,
      to: toStage,
      reason: reason || undefined,
      timestamp: new Date().toISOString(),
      allowed: false, // Admin review required
    }

    const updated = await updateUserProgress(pool, user.sub, {
      ...currentProgress,
      advanceRequests: [...(currentProgress.advanceRequests || []), advanceRecord],
    })

    return c.json(ok({
      request: advanceRecord,
      progress: updated,
    }, {
      request_id: requestId,
      message: 'Advance request recorded for admin review',
    }), 202)
  } catch (error) {
    console.error('advance request failed', error)
    return c.json(err('INTERNAL', 'Failed to process advance request', {
      request_id: requestId,
    }), 500)
  }
})

// ── GET /api/curriculum/metrics ─────────────────────────────────────────────────
// Admin metrics dashboard (ops role required)
curriculum.use('/metrics', verifyOidc)

curriculum.get('/metrics', async (c) => {
  const requestId = c.get('requestId')
  if (!requireOpsRole(c)) {
    return c.json(err('FORBIDDEN', 'Access restricted to ops role', { request_id: requestId }), 403)
  }

  try {
    const { pool } = getDb(c.env.HYPERDRIVE)

    // Fetch aggregate metrics
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_events,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT founder_id) as authenticated_users,
        event,
        COUNT(*) as event_count
      FROM curriculum_events
      WHERE timestamp > NOW() - INTERVAL '30 days'
      GROUP BY event
      ORDER BY event_count DESC`
    )

    const eventMetrics = result.rows || []

    // Fetch stage distribution
    const stageResult = await pool.query(
      `SELECT
        current_stage,
        COUNT(*) as user_count
      FROM curriculum_progress
      GROUP BY current_stage
      ORDER BY user_count DESC`
    )

    const stageDistribution = stageResult.rows || []

    // Fetch recent advance requests
    const requestsResult = await pool.query(
      `SELECT
        founder_id,
        advance_requests,
        last_visited
      FROM curriculum_progress
      WHERE (advance_requests::text != '[]' OR advance_requests IS NOT NULL)
      ORDER BY last_visited DESC
      LIMIT 50`
    )

    const pendingAdvances = requestsResult.rows || []

    return c.json(ok({
      summary: {
        totalEvents: eventMetrics.reduce((sum, m: any) => sum + parseInt(m.event_count), 0),
        uniqueSessions: eventMetrics.length > 0 ? eventMetrics[0].unique_sessions : 0,
        authenticatedUsers: eventMetrics.length > 0 ? eventMetrics[0].authenticated_users : 0,
      },
      eventMetrics,
      stageDistribution,
      pendingAdvances,
      periodDays: 30,
    }, {
      request_id: requestId,
      issued_at: new Date().toISOString(),
    }))
  } catch (error) {
    console.error('curriculum metrics fetch failed', error)
    return c.json(err('INTERNAL', 'Failed to retrieve metrics', {
      request_id: requestId,
    }), 500)
  }
})

export { curriculum as curriculumRouter }
