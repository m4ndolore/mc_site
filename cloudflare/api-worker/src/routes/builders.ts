import { Hono } from 'hono'
import type { Env, AppVars } from '../types'
import { ok, err } from '../lib/envelope'
import { verifyOidc } from '../middleware/verify-oidc'
import { consoleSwitch, consoleRoleGate } from '../middleware/console-gate'
import { proxyToLegacy } from '../lib/strangler'

const builders = new Hono<{ Bindings: Env; Variables: AppVars }>()

builders.use('*', consoleSwitch)
builders.use('*', verifyOidc)
builders.use('*', consoleRoleGate)

builders.get('/companies', async (c) => {
  // Keep Guild company browse aligned with the SigmaBlox catalog until the
  // native company schema is fully converged and backfilled.
  return proxyToLegacy(c)
})

builders.get('/companies/:id/details', async (c) => {
  return proxyToLegacy(c)
})

builders.get('/companies/:id/share-links', async (c) => {
  return proxyToLegacy(c)
})

builders.post('/companies/:id/share-links', async (c) => {
  return proxyToLegacy(c)
})

builders.post('/companies/:id/interest', async (c) => {
  return proxyToLegacy(c)
})

builders.get('/companies/:id', async (c) => {
  return proxyToLegacy(c)
})

builders.get('/coaches', async (c) => {
  // The native coach schema is still on the older raw-SQL path. Proxy list
  // reads to the legacy catalog until the worker-side schema is converged.
  return proxyToLegacy(c)
})

builders.get('/coaches/:id', async (c) => {
  return proxyToLegacy(c)
})

builders.post('/share-links/:id/revoke', async (c) => {
  return proxyToLegacy(c)
})

export { builders as buildersRouter }
