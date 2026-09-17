/**
 * Founder Path triage submissions (/start).
 *
 * The client posts its triage state plus a plain-text report. Email is
 * optional on the form, so a submission without one is a completed triage
 * with nothing to send; a submission with one is a lead that gets emailed
 * to the team, copied to the founder, and recorded in waitlist_entries.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SHORT_MAX = 200
const CONTEXT_MAX = 2000
const REPORT_MAX = 8000
const LIST_MAX = 20

export interface FounderPathSubmission {
  sessionId: string | null
  stage: string | null
  company: string | null
  brings: string[]
  constraints: string[]
  name: string | null
  email: string | null
  context: string | null
  report: string | null
  source: string | null
}

export type FounderPathParseResult =
  | { ok: true; value: FounderPathSubmission }
  | { ok: false; message: string }

function str(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, max)
  return t || null
}

function list(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string').map(x => x.trim().slice(0, 64)).filter(Boolean).slice(0, LIST_MAX)
}

export function parseFounderPathBody(body: unknown): FounderPathParseResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, message: 'Body must be a JSON object' }
  }
  const b = body as Record<string, unknown>

  const rawEmail = str(b.email, SHORT_MAX)
  const email = rawEmail ? rawEmail.toLowerCase() : null
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, message: 'Email must be valid or omitted' }
  }

  return {
    ok: true,
    value: {
      sessionId: str(b.sessionId, 80),
      stage: str(b.stage, 40),
      company: str(b.company, 40),
      brings: list(b.brings),
      constraints: list(b.constraints),
      name: str(b.name, SHORT_MAX),
      email,
      context: str(b.context, CONTEXT_MAX),
      report: str(b.report, REPORT_MAX),
      source: str(b.source, 300),
    },
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export interface RenderedEmail {
  subject: string
  text: string
  html: string
}

function reportBlock(sub: FounderPathSubmission): string {
  if (sub.report) return sub.report
  return [
    `Stage: ${sub.stage || 'unknown'}`,
    `Company: ${sub.company || 'unknown'}`,
    `Brings: ${sub.brings.join(', ') || 'none'}`,
    `Constraints: ${sub.constraints.join(', ') || 'none'}`,
  ].join('\n')
}

export function renderFounderPathTeamEmail(sub: FounderPathSubmission): RenderedEmail {
  const who = sub.name ? `${sub.name} <${sub.email}>` : String(sub.email)
  const subject = `Founder Path triage: ${sub.name || sub.email} · ${sub.stage || 'unknown stage'}`
  const text = [
    'FOUNDER PATH TRIAGE (/start)',
    `From: ${who}`,
    `Stage: ${sub.stage || 'unknown'} · Company: ${sub.company || 'unknown'}`,
    sub.source ? `Page: ${sub.source}` : '',
    '',
    sub.context ? `In their words:\n${sub.context}\n` : '',
    reportBlock(sub),
    '',
    'Reply to this email to reach them directly.',
  ].filter(l => l !== '').join('\n')

  const html = `
    <div style="font-family:-apple-system,'Helvetica Neue',sans-serif;max-width:640px;margin:0 auto;padding:32px 20px;">
      <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;color:#3b82f6;margin:0 0 8px;">FOUNDER PATH TRIAGE (/START)</p>
      <p style="font-size:15px;color:#333;margin:0;">From: ${escapeHtml(who)}</p>
      <p style="font-size:13px;color:#777;margin:4px 0 0;">Stage: ${escapeHtml(sub.stage || 'unknown')} · Company: ${escapeHtml(sub.company || 'unknown')}</p>
      ${sub.context ? `<p style="font-size:14px;color:#555;font-style:italic;margin:16px 0 0;white-space:pre-wrap;">${escapeHtml(sub.context)}</p>` : ''}
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
      <pre style="font-family:'Courier New',monospace;font-size:13px;color:#111;white-space:pre-wrap;margin:0;">${escapeHtml(reportBlock(sub))}</pre>
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0 12px;" />
      <p style="font-size:12px;color:#999;margin:0;">Reply to this email to reach them directly.</p>
    </div>`
  return { subject, text, html }
}

export function renderFounderPathCopyEmail(sub: FounderPathSubmission): RenderedEmail {
  const greeting = sub.name ? `Hi ${sub.name},` : 'Hi,'
  const subject = 'Your Founder Path triage'
  const intro = `${greeting}\n\nHere is the triage you built at mergecombinator.com/start. Someone on the team reads every one of these and we will be in touch within two business days. Reply to this email if you want to add anything.\n\n`
  const outro = `\n\nWhen you are ready for the next step: https://mergecombinator.com/curriculum\n\n— Merge Combinator`
  const html = `
    <div style="font-family:-apple-system,'Helvetica Neue',sans-serif;max-width:640px;margin:0 auto;padding:32px 20px;">
      <p style="font-size:15px;color:#333;">${escapeHtml(greeting)}</p>
      <p style="font-size:15px;color:#333;line-height:1.5;">Here is the triage you built at mergecombinator.com/start. Someone on the team reads every one of these and we will be in touch within two business days. Reply to this email if you want to add anything.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
      <pre style="font-family:'Courier New',monospace;font-size:13px;color:#111;white-space:pre-wrap;margin:0;">${escapeHtml(reportBlock(sub))}</pre>
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0 12px;" />
      <p style="font-size:12px;color:#999;margin:0;">When you are ready for the next step: <a href="https://mergecombinator.com/curriculum" style="color:#3b82f6;">the curriculum</a>.</p>
      <p style="font-size:11px;color:#bbb;margin:16px 0 0;">Merge Combinator</p>
    </div>`
  return { subject, text: intro + reportBlock(sub) + outro, html }
}
