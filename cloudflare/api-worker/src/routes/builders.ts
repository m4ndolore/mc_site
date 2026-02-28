import { Hono } from 'hono'
import type { Env, AppVars } from '../types'
import { ok, err } from '../lib/envelope'
import { verifyOidc } from '../middleware/verify-oidc'
import { getDb } from '../lib/db'
import { parsePagination } from '../lib/pagination'
import { listCompanies, getCompany } from '../repos/sigmablox/companies'
import { listCoaches, getCoach } from '../repos/sigmablox/coaches'
import { companyToDto, coachToDto } from '../lib/mappers'
import { consoleSwitch, consoleRoleGate } from '../middleware/console-gate'

const builders = new Hono<{ Bindings: Env; Variables: AppVars }>()

builders.use('*', consoleSwitch)
builders.use('*', verifyOidc)
builders.use('*', consoleRoleGate)

builders.get('/companies', async (c) => {
  const requestId = c.get('requestId')
  const query = c.req.query()

  const paginationResult = parsePagination(query)
  if ('error' in paginationResult) {
    return c.json(paginationResult.error, paginationResult.status as 400)
  }
  const { pagination } = paginationResult

  const filters = {
    search: query.search?.trim().slice(0, 100) || undefined,
    missionArea: query.missionArea || undefined,
    warfareDomain: query.warfareDomain || undefined,
    fundingStage: query.fundingStage || undefined,
  }

  try {
    const { pool } = getDb(c.env.HYPERDRIVE)
    const { rows, total } = await listCompanies(pool, filters, pagination)

    return c.json(ok(
      { companies: rows.map(companyToDto) },
      { request_id: requestId, total, limit: pagination.limit, offset: pagination.offset }
    ), 200)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return c.json(err('DB_ERROR', `Failed to query companies: ${message}`, {
      request_id: requestId,
    }), 503)
  }
})

builders.get('/companies/:id', async (c) => {
  const requestId = c.get('requestId')
  const id = c.req.param('id')

  try {
    const { pool } = getDb(c.env.HYPERDRIVE)
    const row = await getCompany(pool, id)

    if (!row) {
      return c.json(err('NOT_FOUND', `Company ${id} not found`, { request_id: requestId }), 404)
    }

    return c.json(ok(
      { company: companyToDto(row) },
      { request_id: requestId }
    ), 200)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return c.json(err('DB_ERROR', `Failed to query company: ${message}`, {
      request_id: requestId,
    }), 503)
  }
})

builders.get('/coaches', async (c) => {
  const requestId = c.get('requestId')
  const query = c.req.query()

  const paginationResult = parsePagination(query)
  if ('error' in paginationResult) {
    return c.json(paginationResult.error, paginationResult.status as 400)
  }
  const { pagination } = paginationResult

  const filters = {
    search: query.search?.trim().slice(0, 100) || undefined,
    domain: query.domain || undefined,
  }

  try {
    const { pool } = getDb(c.env.HYPERDRIVE)
    const { rows, total } = await listCoaches(pool, filters, pagination)

    return c.json(ok(
      { coaches: rows.map(coachToDto) },
      { request_id: requestId, total, limit: pagination.limit, offset: pagination.offset }
    ), 200)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return c.json(err('DB_ERROR', `Failed to query coaches: ${message}`, {
      request_id: requestId,
    }), 503)
  }
})

builders.get('/coaches/:id', async (c) => {
  const requestId = c.get('requestId')
  const id = c.req.param('id')

  try {
    const { pool } = getDb(c.env.HYPERDRIVE)
    const row = await getCoach(pool, id)

    if (!row) {
      return c.json(err('NOT_FOUND', `Coach ${id} not found`, { request_id: requestId }), 404)
    }

    return c.json(ok(
      { coach: coachToDto(row) },
      { request_id: requestId }
    ), 200)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return c.json(err('DB_ERROR', `Failed to query coach: ${message}`, {
      request_id: requestId,
    }), 503)
  }
})

export { builders as buildersRouter }
