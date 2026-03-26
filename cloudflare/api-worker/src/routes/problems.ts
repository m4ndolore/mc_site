import { Hono } from 'hono'
import type { Env, AppVars } from '../types'
import { ok, err } from '../lib/envelope'
import { verifyOidc } from '../middleware/verify-oidc'
import { getDb } from '../lib/db'

const problems = new Hono<{ Bindings: Env; Variables: AppVars }>()

problems.use('*', verifyOidc)

const VALID_STATUSES = ['open', 'matched', 'in_progress', 'solved'] as const

problems.get('/', async (c) => {
  const requestId = c.get('requestId')
  try {
    const { prisma } = getDb(c.env.HYPERDRIVE)
    const status = c.req.query('status')
    const domain = c.req.query('domain')
    const search = c.req.query('search')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (domain) where.domain = domain
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const items = await prisma.problem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return c.json(ok({ problems: items }, {
      request_id: requestId,
      count: items.length,
    }), 200)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return c.json(err('DB_ERROR', `Failed to query problems: ${message}`, {
      request_id: requestId,
    }), 503)
  }
})

problems.get('/:id', async (c) => {
  const { id } = c.req.param()
  const requestId = c.get('requestId')
  try {
    const { prisma } = getDb(c.env.HYPERDRIVE)
    const problem = await prisma.problem.findUnique({ where: { id } })
    if (!problem) {
      return c.json(err('NOT_FOUND', 'Problem not found', {
        request_id: requestId,
      }), 404)
    }

    return c.json(ok({ problem }, {
      request_id: requestId,
    }), 200)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return c.json(err('DB_ERROR', `Failed to query problem: ${message}`, {
      request_id: requestId,
    }), 503)
  }
})

problems.post('/', async (c) => {
  const user = c.get('user')
  const requestId = c.get('requestId')
  const body = await c.req.json<{
    title: string
    description: string
    domain: string
    requirements?: string
    tags?: string[]
  }>()

  if (!body.title || !body.description || !body.domain) {
    return c.json(err('BAD_REQUEST', 'title, description, and domain are required', {
      request_id: requestId,
    }), 400)
  }

  try {
    const { prisma } = getDb(c.env.HYPERDRIVE)
    const problem = await prisma.problem.create({
      data: {
        title: body.title,
        description: body.description,
        domain: body.domain,
        requirements: body.requirements ?? null,
        tags: body.tags ?? [],
        ownerId: user.sub,
        ownerName: user.name ?? 'Unknown',
        ownerEmail: user.email,
      },
    })

    return c.json(ok({ problem }, {
      request_id: requestId,
    }), 201)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return c.json(err('DB_ERROR', `Failed to create problem: ${message}`, {
      request_id: requestId,
    }), 503)
  }
})

problems.patch('/:id', async (c) => {
  const { id } = c.req.param()
  const user = c.get('user')
  const requestId = c.get('requestId')

  try {
    const { prisma } = getDb(c.env.HYPERDRIVE)

    const existing = await prisma.problem.findUnique({ where: { id } })
    if (!existing) {
      return c.json(err('NOT_FOUND', 'Problem not found', {
        request_id: requestId,
      }), 404)
    }

    const isOwner = existing.ownerId === user.sub
    const isAdmin = user.roleLevel >= 4
    if (!isOwner && !isAdmin) {
      return c.json(err('FORBIDDEN', 'Only the owner or an admin can update this problem', {
        request_id: requestId,
      }), 403)
    }

    const body = await c.req.json<{
      title?: string
      description?: string
      domain?: string
      status?: string
      requirements?: string
      tags?: string[]
    }>()

    if (body.status && !VALID_STATUSES.includes(body.status as typeof VALID_STATUSES[number])) {
      return c.json(err('BAD_REQUEST', `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, {
        request_id: requestId,
      }), 400)
    }

    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.domain !== undefined) data.domain = body.domain
    if (body.status !== undefined) data.status = body.status
    if (body.requirements !== undefined) data.requirements = body.requirements
    if (body.tags !== undefined) data.tags = body.tags

    const updated = await prisma.problem.update({
      where: { id },
      data,
    })

    return c.json(ok({ problem: updated }, {
      request_id: requestId,
    }), 200)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return c.json(err('DB_ERROR', `Failed to update problem: ${message}`, {
      request_id: requestId,
    }), 503)
  }
})

problems.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const user = c.get('user')
  const requestId = c.get('requestId')

  try {
    const { prisma } = getDb(c.env.HYPERDRIVE)

    const existing = await prisma.problem.findUnique({ where: { id } })
    if (!existing) {
      return c.json(err('NOT_FOUND', 'Problem not found', {
        request_id: requestId,
      }), 404)
    }

    const isOwner = existing.ownerId === user.sub
    const isAdmin = user.roleLevel >= 4
    if (!isOwner && !isAdmin) {
      return c.json(err('FORBIDDEN', 'Only the owner or an admin can delete this problem', {
        request_id: requestId,
      }), 403)
    }

    await prisma.problem.delete({ where: { id } })

    return c.json(ok({ deleted: true }, {
      request_id: requestId,
    }), 200)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return c.json(err('DB_ERROR', `Failed to delete problem: ${message}`, {
      request_id: requestId,
    }), 503)
  }
})

export { problems as problemsRouter }
