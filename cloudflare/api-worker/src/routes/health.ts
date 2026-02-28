import { Hono } from 'hono'
import type { Env, AppVars } from '../types'
import { ok } from '../lib/envelope'

const health = new Hono<{ Bindings: Env; Variables: AppVars }>()

health.get('/', (c) => {
  return c.json(ok({
    status: 'ok',
    service: 'mc-api',
    timestamp: new Date().toISOString(),
  }, {
    request_id: c.get('requestId'),
  }), 200)
})

export { health as healthRouter }
