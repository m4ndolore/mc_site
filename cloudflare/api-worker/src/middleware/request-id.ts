import { createMiddleware } from 'hono/factory'
import type { Env, AppVars } from '../types'

export const requestId = createMiddleware<{ Bindings: Env; Variables: AppVars }>(
  async (c, next) => {
    const id = c.req.header('X-Request-Id') ?? crypto.randomUUID()
    c.set('requestId', id)
    await next()
    c.header('X-Request-Id', id)
  }
)
