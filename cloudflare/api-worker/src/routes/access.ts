import { Hono } from 'hono'
import type { Env, AppVars } from '../types'
import { ok, err } from '../lib/envelope'
import { verifyTurnstile } from '../lib/turnstile'
import { provisionUser, ProvisionError } from '../lib/authentik'
import { createOnboardingProfile } from '../repos/guild/onboarding'
import { createOtpChallenge, verifyOtp } from '../lib/otp'
import { sendOtpEmail } from '../lib/email'
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

// ── Send OTP ──────────────────────────────────────────────────────────────────
access.post('/otp/send', async (c) => {
  const requestId = c.get('requestId')
  let body: { email: string; name?: string }

  try {
    body = await c.req.json()
  } catch {
    return c.json(err('INVALID_INPUT', 'Invalid JSON body', { request_id: requestId }), 400)
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    return c.json(err('INVALID_INPUT', 'Valid email is required', { request_id: requestId }), 400)
  }

  const { prisma } = getDb(c.env.HYPERDRIVE)
  const { code } = await createOtpChallenge(prisma, email)

  const emailResult = await sendOtpEmail(
    {
      from: c.env.OTP_FROM_EMAIL || 'noreply@mergecombinator.com',
      apiKey: c.env.RESEND_API_KEY,
      provider: c.env.RESEND_API_KEY ? 'resend' : 'mailchannels',
    },
    { to: email, code, name: body.name }
  )

  if (!emailResult.sent) {
    console.error('OTP email send failed:', emailResult.error)
    return c.json(err('EMAIL_FAILED', 'Failed to send verification email. Please try again.', {
      request_id: requestId,
    }), 502)
  }

  return c.json(ok({
    sent: true,
    email,
    expiresInSeconds: 600,
  }, { request_id: requestId }))
})

// ── Verify OTP and provision account ──────────────────────────────────────────
access.post('/otp/verify', async (c) => {
  const requestId = c.get('requestId')
  let body: ProvisionBody & { code: string }

  try {
    body = await c.req.json()
  } catch {
    return c.json(err('INVALID_INPUT', 'Invalid JSON body', { request_id: requestId }), 400)
  }

  const email = body.email?.trim().toLowerCase()
  const name = body.name?.trim()
  const code = body.code?.trim()

  if (!email || !EMAIL_RE.test(email)) {
    return c.json(err('INVALID_INPUT', 'Valid email is required', { request_id: requestId }), 400)
  }
  if (!name) {
    return c.json(err('INVALID_INPUT', 'Name is required', { request_id: requestId }), 400)
  }
  if (!code || code.length !== 6) {
    return c.json(err('INVALID_INPUT', 'Valid 6-digit code is required', { request_id: requestId }), 400)
  }

  const { prisma } = getDb(c.env.HYPERDRIVE)

  // Verify OTP
  const result = await verifyOtp(prisma, email, code)

  if (!result.valid) {
    const messages: Record<string, string> = {
      not_found: 'No active verification code found. Please request a new one.',
      expired: 'Verification code has expired. Please request a new one.',
      invalid: 'Incorrect code. Please try again.',
      max_attempts: 'Too many attempts. Please request a new code.',
    }
    return c.json(err('OTP_INVALID', messages[result.reason], {
      request_id: requestId,
      reason: result.reason,
    }), 400)
  }

  // OTP verified — provision VIA account
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
    console.error('Failed to save onboarding profile:', e)
    profileId = 'pending'
  }

  // Build the sign-in URL: prefer recovery link for instant auth, fall back to login page
  const guildUrl = 'https://guild.mergecombinator.com/'
  const loginUrl = provision.recoveryLink
    ? `${provision.recoveryLink}?redirect=${encodeURIComponent(guildUrl)}`
    : `${c.env.MC_PUBLIC_URL}/auth/login?returnTo=${encodeURIComponent(guildUrl)}`

  return c.json(ok({
    provisioned: true,
    verified: true,
    role: provision.role,
    profileId,
    autoPromoted: provision.role !== 'restricted',
    loginUrl,
    instantAuth: !!provision.recoveryLink,
  }, {
    request_id: requestId,
  }), 201)
})

// ── Original provision endpoint (kept for backwards compatibility) ─────────
access.post('/provision', async (c) => {
  const requestId = c.get('requestId')
  let body: ProvisionBody

  try {
    body = await c.req.json<ProvisionBody>()
  } catch {
    return c.json(err('INVALID_INPUT', 'Invalid JSON body', { request_id: requestId }), 400)
  }

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
