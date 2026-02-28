import { cors as honoCors } from 'hono/cors'
import type { Env, AppVars } from '../types'
import { createMiddleware } from 'hono/factory'

export const corsMiddleware = createMiddleware<{ Bindings: Env; Variables: AppVars }>(
  async (c, next) => {
    const allowedRaw = c.env.CORS_ALLOWED_ORIGINS || ''
    const allowedOrigins = allowedRaw.split(',').map(s => s.trim()).filter(Boolean)

    const handler = honoCors({
      origin: (origin) => {
        if (allowedOrigins.includes(origin)) return origin
        return ''
      },
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
      maxAge: 86400,
    })

    return handler(c, next)
  }
)
