import { Hono } from 'hono'
import type { Env, AppVars } from '../types'
import { ok } from '../lib/envelope'
import { verifyOidc } from '../middleware/verify-oidc'
import { ensureGuildUser } from '../middleware/ensure-guild-user'
import { consoleSwitch, consoleRoleGate } from '../middleware/console-gate'

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

export { guild as guildRouter }
