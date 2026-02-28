import { createMiddleware } from 'hono/factory'
import type { Env, AppVars } from '../types'
import { getDb } from '../lib/db'
import { upsertGuildUser } from '../repos/guild/users'

export const ensureGuildUser = createMiddleware<{ Bindings: Env; Variables: AppVars }>(
  async (c, next) => {
    const user = c.get('user')
    const { prisma } = getDb(c.env.HYPERDRIVE)

    const guildUserId = await upsertGuildUser(prisma, {
      issuer: user.issuer,
      subject: user.sub,
      email: user.email,
      name: user.name,
    })

    c.set('guildUserId', guildUserId)
    await next()
  }
)
