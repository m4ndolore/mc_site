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

export { guild as guildRouter }
