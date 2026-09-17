import { Hono } from 'hono'
import type { Env, AppVars } from '../types'
import { ok, err } from '../lib/envelope'
import { sendEmail } from '../lib/email'
import { getDb } from '../lib/db'
import {
  parseFounderPathBody,
  renderFounderPathCopyEmail,
  renderFounderPathTeamEmail,
} from '../lib/founder-path'

const founderPath = new Hono<{ Bindings: Env; Variables: AppVars }>()

// ── /start triage submission ──────────────────────────────────────────────────
// The /start page posted here from the day it shipped, but no handler existed
// and the request fell through to the legacy proxy (404). Every lead was lost
// while the page showed "We've got it." This is the handler.
founderPath.post('/triage', async (c) => {
  const requestId = c.get('requestId')
  let raw: unknown

  try {
    raw = await c.req.json()
  } catch {
    return c.json(err('INVALID_INPUT', 'Invalid JSON body', { request_id: requestId }), 400)
  }

  const parsed = parseFounderPathBody(raw)
  if (!parsed.ok) {
    return c.json(err('INVALID_INPUT', parsed.message, { request_id: requestId }), 400)
  }
  const sub = parsed.value

  // No email: a completed triage, nothing promised, nothing to send.
  if (!sub.email) {
    return c.json(ok({ received: true, lead: false }, { request_id: requestId }), 201)
  }

  const emailConfig = {
    from: c.env.OTP_FROM_EMAIL || 'access@mergecombinator.com',
    apiKey: c.env.RESEND_API_KEY,
    provider: (c.env.RESEND_API_KEY ? 'resend' : 'mailchannels') as 'resend' | 'mailchannels',
  }
  const inbox = c.env.CATECHISM_INBOX || 'build@mergecombinator.com'

  const team = renderFounderPathTeamEmail(sub)
  const teamResult = await sendEmail(emailConfig, {
    to: inbox,
    replyTo: sub.email,
    subject: team.subject,
    text: team.text,
    html: team.html,
  })
  if (!teamResult.sent) {
    console.error('Founder Path team email failed:', teamResult.error)
    return c.json(err('EMAIL_FAILED', 'Could not deliver your triage. Nothing was sent.', {
      request_id: requestId,
    }), 502)
  }

  const copy = renderFounderPathCopyEmail(sub)
  const copyResult = await sendEmail(emailConfig, {
    to: sub.email,
    replyTo: inbox,
    subject: copy.subject,
    text: copy.text,
    html: copy.html,
  })
  if (!copyResult.sent) {
    console.error('Founder Path copy email failed:', copyResult.error)
  }

  // Lead ledger: one row per email per surface. Non-fatal; the email is the
  // delivery path, this is the queryable record.
  let recorded = false
  try {
    const { prisma } = getDb(c.env.HYPERDRIVE)
    await prisma.waitlistEntry.upsert({
      where: { email_surface: { email: sub.email, surface: 'founder-path' } },
      create: { email: sub.email, surface: 'founder-path', source: sub.source },
      update: {},
    })
    recorded = true
  } catch (e) {
    console.error('Founder Path lead record failed:', e)
  }

  return c.json(ok({
    received: true,
    lead: true,
    copySent: copyResult.sent,
    recorded,
  }, { request_id: requestId }), 201)
})

export { founderPath as founderPathRouter }
