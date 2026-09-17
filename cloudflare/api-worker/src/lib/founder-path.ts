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

/**
 * The founder's copy. This is the first thing Merge Combinator sends a
 * founder, so it has to earn a reply: their own words back, one honest
 * observation for their stage, one next step, and a plain account of what
 * happens now. No pitch, no sequence.
 */
interface StageNote {
  label: string
  observation: string
  nextStep: string
  nextUrl: string
  nextLabel: string
}

const CURRICULUM = 'https://mergecombinator.com/curriculum'
const CALL_URL = 'https://calendar.app.google/caYkEhTngEyUEgDn7'

const STAGE_NOTES: Record<string, StageNote> = {
  'visionary-no-problem': {
    label: 'CEO without a problem yet',
    observation: 'This is the most common way a defense company starts and the most common way one stalls. The fix is a named operator wound: one person, one command, one thing that breaks on a Tuesday.',
    nextStep: 'Before you build anything, learn who buys and how. Start at Preflight in the curriculum.',
    nextUrl: `${CURRICULUM}#stage-preflight`,
    nextLabel: 'Preflight',
  },
  curious: {
    label: 'Curious, not committed',
    observation: 'Curiosity is the right starting point. The people who end up building here usually spent a few months reading before they committed, and the reading is free.',
    nextStep: 'Start at Preflight in the curriculum. Two hours there will tell you whether this is your fight.',
    nextUrl: `${CURRICULUM}#stage-preflight`,
    nextLabel: 'Preflight',
  },
  'operator-with-problem': {
    label: 'Operator with a problem, no team',
    observation: 'You hold the rarest asset in this market: a problem you lived. Most technical founders are searching for exactly that and cannot find it.',
    nextStep: 'Name the problem owner and the budget line it sits under, then start at Spot in the curriculum. That is where the team-finding paths are.',
    nextUrl: `${CURRICULUM}#stage-spot`,
    nextLabel: 'Spot',
  },
  'builder-no-problem': {
    label: 'Technical builder looking for a problem',
    observation: 'Velocity without a wound points at nothing. The builders who make it here found one operator with a real problem and went and sat with them before writing code.',
    nextStep: 'Start at Spot in the curriculum. The Hacking for Defense, AFWERX, and DIU entry points are listed there.',
    nextUrl: `${CURRICULUM}#stage-spot`,
    nextLabel: 'Spot',
  },
  'team-with-prototype': {
    label: 'Small team with a working prototype',
    observation: 'This is where funded prototypes die. The work from here is transition: a program of record, an appropriation that can legally buy what you sell, and a champion who will not rotate out before it lands.',
    nextStep: 'Read Crossing the Valley of Death, then start at Ready for Launch in the curriculum.',
    nextUrl: `${CURRICULUM}#stage-ready`,
    nextLabel: 'Ready for Launch',
  },
  scaling: {
    label: 'Scaling',
    observation: 'Program pull-through and color of money decide the next eighteen months more than product does. Most teams at this stage are one budget cycle from either a line item or a stall.',
    nextStep: 'Read The Color of Money, then start at Tension in the curriculum.',
    nextUrl: `${CURRICULUM}#stage-tension`,
    nextLabel: 'Tension',
  },
}

const DEFAULT_NOTE: StageNote = {
  label: 'Founder',
  observation: 'Every company that makes it here started with a named operator problem and a person who owned it. The rest is transition work.',
  nextStep: 'Start at Preflight in the curriculum.',
  nextUrl: `${CURRICULUM}#stage-preflight`,
  nextLabel: 'Preflight',
}

export function stageNote(stage: string | null): StageNote {
  return (stage && STAGE_NOTES[stage]) || DEFAULT_NOTE
}

export function renderFounderPathCopyEmail(sub: FounderPathSubmission): RenderedEmail {
  const note = stageNote(sub.stage)
  const greeting = sub.name ? `${sub.name},` : 'Hi,'
  const subject = `Your triage: ${note.label.toLowerCase()}`

  const whatNow = 'A person on the team reads this within two business days. If your triage fits what we are building right now, we reply with a specific next step. If it does not, we still reply and say so. Reply to this email any time; it reaches a person, not a queue.'
  const call = 'If you would rather talk it through, there is a free 30-minute call on the calendar.'
  const signoff = '— Paul Garcia, Merge Combinator'

  const text = [
    greeting,
    '',
    `You told us you are: ${note.label}.`,
    '',
    note.observation,
    '',
    `Next step: ${note.nextStep}`,
    note.nextUrl,
    '',
    'What happens now',
    whatNow,
    '',
    `${call} ${CALL_URL}`,
    '',
    signoff,
    '',
    '----------------------------------------',
    'Your triage, as you built it',
    '',
    reportBlock(sub),
  ].join('\n')

  const html = `
    <div style="font-family:-apple-system,'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#111;">
      <p style="font-size:15px;margin:0 0 16px;">${escapeHtml(greeting)}</p>
      <p style="font-size:15px;line-height:1.55;margin:0 0 16px;">You told us you are: <strong>${escapeHtml(note.label)}</strong>.</p>
      <p style="font-size:15px;line-height:1.55;margin:0 0 16px;">${escapeHtml(note.observation)}</p>
      <p style="font-size:15px;line-height:1.55;margin:0 0 6px;"><strong>Next step.</strong> ${escapeHtml(note.nextStep)}</p>
      <p style="margin:0 0 24px;"><a href="${note.nextUrl}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 16px;border-radius:2px;">Open ${escapeHtml(note.nextLabel)}</a></p>
      <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;color:#3b82f6;margin:0 0 6px;">WHAT HAPPENS NOW</p>
      <p style="font-size:14px;line-height:1.55;color:#333;margin:0 0 16px;">${escapeHtml(whatNow)}</p>
      <p style="font-size:14px;line-height:1.55;color:#333;margin:0 0 24px;">${escapeHtml(call)} <a href="${CALL_URL}" style="color:#3b82f6;">Book 30 minutes</a>.</p>
      <p style="font-size:14px;color:#333;margin:0 0 32px;">${escapeHtml(signoff)}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:0 0 16px;" />
      <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;color:#999;margin:0 0 10px;">YOUR TRIAGE, AS YOU BUILT IT</p>
      <pre style="font-family:'Courier New',monospace;font-size:12.5px;color:#333;white-space:pre-wrap;margin:0;">${escapeHtml(reportBlock(sub))}</pre>
    </div>`

  return { subject, text, html }
}
