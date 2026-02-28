import { createMiddleware } from 'hono/factory'
import type { Env, AppVars } from '../types'
import { err } from '../lib/envelope'

function getRolloutMode(env: Env): 'off' | 'internal' | 'on' {
  const raw = (env.CONSOLE_ROLLOUT_MODE || 'off').trim().toLowerCase()
  if (raw === 'on' || raw === 'internal') return raw
  return 'off'
}

function getMinRoleLevel(env: Env): number {
  const parsed = Number(env.CONSOLE_MIN_ROLE_LEVEL || '3')
  return Number.isFinite(parsed) ? parsed : 3
}

export const consoleSwitch = createMiddleware<{ Bindings: Env; Variables: AppVars }>(
  async (c, next) => {
    if (getRolloutMode(c.env) === 'off') {
      return c.json(err('NOT_FOUND', 'No route', {
        request_id: c.get('requestId'),
      }), 404)
    }
    await next()
  }
)

export const consoleRoleGate = createMiddleware<{ Bindings: Env; Variables: AppVars }>(
  async (c, next) => {
    if (getRolloutMode(c.env) !== 'internal') {
      await next()
      return
    }

    const user = c.get('user')
    const minRoleLevel = getMinRoleLevel(c.env)
    if (user.roleLevel < minRoleLevel) {
      return c.json(err('FORBIDDEN', 'Console access restricted during rollout', {
        request_id: c.get('requestId'),
        required_role_level: minRoleLevel,
        role_level: user.roleLevel,
      }), 403)
    }

    await next()
  }
)
