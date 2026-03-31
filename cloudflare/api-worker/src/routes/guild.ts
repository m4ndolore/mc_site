import { Hono } from 'hono'
import type { Env, AppVars } from '../types'
import { ok, err } from '../lib/envelope'
import { verifyOidc } from '../middleware/verify-oidc'
import { ensureGuildUser } from '../middleware/ensure-guild-user'
import { consoleSwitch, consoleRoleGate } from '../middleware/console-gate'
import { getDb } from '../lib/db'

const guild = new Hono<{ Bindings: Env; Variables: AppVars }>()

guild.use('*', consoleSwitch)
guild.use('*', verifyOidc)
guild.use('*', consoleRoleGate)
guild.use('/me', ensureGuildUser)

guild.get('/me', (c) => {
  const user = c.get('user')
  return c.json(ok({
    user: {
      guild_user_id: c.get('guildUserId'),
      issuer: user.issuer,
      sub: user.sub,
      email: user.email,
      name: user.name,
    },
    roles: user.roles,
    entitlements: {},
  }, {
    request_id: c.get('requestId'),
    role_level: user.roleLevel,
    issued_at: new Date().toISOString(),
  }), 200)
})

// Admin user management endpoints
guild.get('/users', async (c) => {
  const user = c.get('user')
  const requestId = c.get('requestId')
  if (user.roleLevel < 4) {
    return c.json(err('FORBIDDEN', 'Admin only', {
      request_id: requestId,
    }), 403)
  }

  try {
    const { prisma } = getDb(c.env.HYPERDRIVE)
    const users = await prisma.guildUser.findMany({
      include: { onboardingProfile: true },
      orderBy: { lastSeenAt: 'desc' },
    })

    return c.json(ok({ users }, {
      request_id: requestId,
      count: users.length,
    }), 200)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return c.json(err('DB_ERROR', `Failed to query users: ${message}`, {
      request_id: requestId,
    }), 503)
  }
})

guild.patch('/users/:id/role', async (c) => {
  const user = c.get('user')
  const requestId = c.get('requestId')
  if (user.roleLevel < 4) {
    return c.json(err('FORBIDDEN', 'Admin only', {
      request_id: requestId,
    }), 403)
  }

  const { id } = c.req.param()
  const body = await c.req.json<{ role: string }>()
  const validRoles = ['admin', 'trusted', 'industry', 'member', 'restricted']
  if (!body.role || !validRoles.includes(body.role)) {
    return c.json(err('BAD_REQUEST', `Invalid role. Must be one of: ${validRoles.join(', ')}`, {
      request_id: requestId,
    }), 400)
  }

  try {
    const { prisma } = getDb(c.env.HYPERDRIVE)
    const profile = await prisma.onboardingProfile.findFirst({
      where: { guildUserId: id },
    })
    if (!profile) {
      return c.json(err('NOT_FOUND', 'No onboarding profile for this user', {
        request_id: requestId,
      }), 404)
    }

    const updated = await prisma.onboardingProfile.update({
      where: { id: profile.id },
      data: { roleAssigned: body.role },
    })

    return c.json(ok({ profile: updated }, {
      request_id: requestId,
    }), 200)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return c.json(err('DB_ERROR', `Failed to update role: ${message}`, {
      request_id: requestId,
    }), 503)
  }
})

// ── Admin: Company Management ────────────────────────────────────────────────

// List all companies (admin)
guild.get('/companies', async (c) => {
  const user = c.get('user')
  const requestId = c.get('requestId')
  if (user.roleLevel < 4) {
    return c.json(err('FORBIDDEN', 'Admin only', { request_id: requestId }), 403)
  }

  try {
    const { prisma } = getDb(c.env.HYPERDRIVE)
    const companies = await prisma.company.findMany({
      orderBy: [{ pipelineStage: 'asc' }, { name: 'asc' }],
    })
    return c.json(ok({ companies }, { request_id: requestId, count: companies.length }), 200)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return c.json(err('DB_ERROR', `Failed to query companies: ${message}`, { request_id: requestId }), 503)
  }
})

// Update a company (admin, partial update)
guild.patch('/companies/:id', async (c) => {
  const user = c.get('user')
  const requestId = c.get('requestId')
  if (user.roleLevel < 4) {
    return c.json(err('FORBIDDEN', 'Admin only', { request_id: requestId }), 403)
  }

  const { id } = c.req.param()
  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json(err('INVALID_INPUT', 'Invalid JSON body', { request_id: requestId }), 400)
  }

  // Whitelist editable fields (Tier 1)
  const EDITABLE_FIELDS = [
    'name', 'productName', 'description', 'missionArea', 'warfareDomain',
    'technologyArea', 'productType', 'trlLevel', 'fundingStage', 'teamSize',
    'pipelineStage', 'ctas', 'location', 'website',
  ] as const

  const data: Record<string, unknown> = {}
  for (const field of EDITABLE_FIELDS) {
    if (field in body) {
      data[field] = body[field]
    }
  }

  if (Object.keys(data).length === 0) {
    return c.json(err('INVALID_INPUT', 'No editable fields provided', { request_id: requestId }), 400)
  }

  // Validate ctas if provided
  if (data.ctas) {
    const validCtas = ['AAI', 'BIO', 'LOG', 'Q-BID', 'SCADE', 'SHY']
    const ctas = data.ctas as string[]
    if (!Array.isArray(ctas) || !ctas.every(c => validCtas.includes(c))) {
      return c.json(err('INVALID_INPUT', `ctas must be an array of: ${validCtas.join(', ')}`, { request_id: requestId }), 400)
    }
  }

  // Validate trlLevel if provided
  if (data.trlLevel !== undefined && data.trlLevel !== null) {
    const trl = Number(data.trlLevel)
    if (isNaN(trl) || trl < 1 || trl > 9) {
      return c.json(err('INVALID_INPUT', 'trlLevel must be 1-9', { request_id: requestId }), 400)
    }
    data.trlLevel = trl
  }

  try {
    const { prisma } = getDb(c.env.HYPERDRIVE)
    const company = await prisma.company.update({
      where: { id },
      data,
    })
    return c.json(ok({ company }, { request_id: requestId }), 200)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    if (message.includes('Record to update not found')) {
      return c.json(err('NOT_FOUND', 'Company not found', { request_id: requestId }), 404)
    }
    return c.json(err('DB_ERROR', `Failed to update company: ${message}`, { request_id: requestId }), 503)
  }
})

export { guild as guildRouter }
