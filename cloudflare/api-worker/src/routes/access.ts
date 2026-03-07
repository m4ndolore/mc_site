import { Hono } from 'hono'
import type { Env, AppVars } from '../types'
import { ok, err } from '../lib/envelope'
import { verifyTurnstile } from '../lib/turnstile'
import { provisionUser, ProvisionError } from '../lib/authentik'
import { createOnboardingProfile } from '../repos/guild/onboarding'
import { getDb } from '../lib/db'

const access = new Hono<{ Bindings: Env; Variables: AppVars }>()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ProvisionBody {
  name: string
  email: string
  organization?: string
  areas?: string[]
  outcomes?: string[]
  journeyStage?: string
  'cf-turnstile-response'?: string
  source?: string
}

access.post('/provision', async (c) => {
  const requestId = c.get('requestId')
  let body: ProvisionBody

  try {
    body = await c.req.json<ProvisionBody>()
  } catch {
    return c.json(err('INVALID_INPUT', 'Invalid JSON body', { request_id: requestId }), 400)
  }

  // Validate required fields
  const name = body.name?.trim()
  const email = body.email?.trim().toLowerCase()

  if (!name) {
    return c.json(err('INVALID_INPUT', 'Name is required', { request_id: requestId }), 400)
  }
  if (!email || !EMAIL_RE.test(email)) {
    return c.json(err('INVALID_INPUT', 'Valid email is required', { request_id: requestId }), 400)
  }

  // Verify Turnstile token
  const turnstileToken = body['cf-turnstile-response']
  if (c.env.TURNSTILE_SECRET_KEY && turnstileToken) {
    const remoteIp = c.req.header('CF-Connecting-IP') ?? undefined
    const turnstile = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET_KEY, remoteIp)
    if (!turnstile.valid) {
      return c.json(err('TURNSTILE_FAILED', 'Bot verification failed', {
        request_id: requestId,
        errors: turnstile.errors,
      }), 403)
    }
  }

  // Provision VIA account
  let provision
  try {
    provision = await provisionUser(
      {
        baseUrl: c.env.VIA_ISSUER_URL,
        apiToken: c.env.VIA_API_TOKEN,
        restrictedGroupId: c.env.VIA_RESTRICTED_GROUP_ID,
        trustedGroupId: c.env.VIA_TRUSTED_GROUP_ID,
        recoveryFlowSlug: c.env.VIA_RECOVERY_FLOW_SLUG,
      },
      { email, name }
    )
  } catch (e) {
    if (e instanceof ProvisionError && e.code === 'EMAIL_EXISTS') {
      return c.json(err('EMAIL_EXISTS', e.message, { request_id: requestId }), 409)
    }
    const message = e instanceof Error ? e.message : 'Unknown error'
    return c.json(err('PROVISION_FAILED', `Account provisioning failed: ${message}`, {
      request_id: requestId,
    }), 502)
  }

  // Store onboarding profile
  const { prisma } = getDb(c.env.HYPERDRIVE)
  let profileId: string
  try {
    profileId = await createOnboardingProfile(prisma, {
      email,
      name,
      organization: body.organization?.trim() || undefined,
      areas: body.areas ?? [],
      outcomes: body.outcomes ?? [],
      journeyStage: body.journeyStage,
      source: body.source,
      roleAssigned: provision.role,
      viaUserId: provision.userId,
    })
  } catch (e) {
    // User was created in VIA but profile save failed — log but don't fail the request
    console.error('Failed to save onboarding profile:', e)
    profileId = 'pending'
  }

  return c.json(ok({
    provisioned: true,
    role: provision.role,
    profileId,
    autoPromoted: provision.role !== 'restricted',
    loginUrl: `${c.env.MC_PUBLIC_URL}/auth/login?returnTo=${encodeURIComponent('https://guild.mergecombinator.com/')}`,
  }, {
    request_id: requestId,
  }), 201)
})

export { access as accessRouter }
