import { Hono } from 'hono'
import type { Env, AppVars } from './types'
import { err } from './lib/envelope'
import { requestId } from './middleware/request-id'
import { corsMiddleware } from './middleware/cors'
import { healthRouter } from './routes/health'
import { guildRouter } from './routes/guild'
import { buildersRouter } from './routes/builders'
import { resolveRoute, proxyToLegacy } from './lib/strangler'

const app = new Hono<{ Bindings: Env; Variables: AppVars }>()

app.use('*', requestId)
app.use('*', corsMiddleware)

app.route('/health', healthRouter)
app.route('/guild', guildRouter)
app.route('/builders', buildersRouter)

// Catch-all: strangler proxy or 404
app.all('*', async (c) => {
  const target = resolveRoute(c.req.method, c.req.path)
  if (target === 'proxy_legacy') {
    return proxyToLegacy(c)
  }
  if (target === 'native') {
    return c.json(err('INTERNAL', 'Route marked native but no handler mounted', {
      route: `${c.req.method} ${c.req.path}`,
      request_id: c.get('requestId'),
    }), 500)
  }
  return c.json(err('NOT_FOUND', `No route: ${c.req.method} ${c.req.path}`, {
    request_id: c.get('requestId'),
  }), 404)
})

export default app
