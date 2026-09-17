/**
 * Founder Path triage submissions (/start).
 *
 * The client posts its triage state plus a plain-text report. Email is
 * optional on the form, so a submission without one is a completed triage
 * with nothing to send; a submission with one is a lead that gets emailed
 * to the team, copied to the founder, and recorded in waitlist_entries.
 *
 * The founder's copy is composed here from what they told us (stage, what
 * they bring, what they are missing, company shape). It never echoes the
 * page's internal report; that goes to the team only.
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

// ── Vocabulary the page uses, in plain words ─────────────────────────────────

const SITE = 'https://mergecombinator.com'
const CALL_URL = 'https://calendar.app.google/caYkEhTngEyUEgDn7'

const BRINGS_LABEL: Record<string, string> = {
  domain: 'operator domain expertise',
  technical: 'technical building',
  acquisition: 'acquisition fluency',
  capital: 'capital or an investor network',
  time: 'full-time availability',
  access: 'unfair access to specific operators or programs',
  commercial: 'commercial and business-development chops',
  security: 'a cleared background',
}

const COMPANY_LABEL: Record<string, string> = {
  'defense-first': 'mission tech for warfighters, defense first',
  'dual-use': 'dual-use, civilian and defense',
  'commercial-first': 'civilian first, open to defense later',
  unsure: 'company shape still open',
}

interface StageRead {
  label: string
  subject: string
  read: string
  defaults: string[]
}

const STAGES: Record<string, StageRead> = {
  'visionary-no-problem': {
    label: 'a CEO with conviction and no problem yet',
    subject: 'Your triage: conviction first, wound next',
    read: 'Companies that start with conviction and no wound spend their first year building for a customer who does not exist, then pivot into an SBIR that pays for a demo nobody transitions. That is a lost year, and the money that funded it does not come back. The wound has to come first: one operator, one command, one thing that broke last Tuesday and who had to fix it.',
    defaults: ['problem', 'tech-cofounder', 'operator-access'],
  },
  'operator-with-problem': {
    label: 'an operator who lived the problem, without a team yet',
    subject: 'Your triage: you own the problem',
    read: 'You hold the rarest asset in this market. Most technical founders spend a year looking for exactly what you already have and never find it. Operators in your position lose the window one of two ways: they try to build it alone and ship too slowly, or they hand it to a prime and watch it die in requirements. The window is roughly eighteen months before the champion rotates or the budget line moves.',
    defaults: ['tech-cofounder', 'capital', 'acquisition'],
  },
  'builder-no-problem': {
    label: 'a technical builder looking for a problem',
    subject: 'Your triage: velocity needs a wound',
    read: 'Builders who pick a problem from a solicitation instead of an operator build the wrong thing fast. The default outcome is a demo that impresses an innovation cell and never reaches a program office, and it costs a year. The builders who make it here found one operator with a real problem and went and sat with them before writing code.',
    defaults: ['problem-owner', 'operator-access', 'domain-cofounder'],
  },
  'team-with-prototype': {
    label: 'a small team with a working prototype',
    subject: 'Your triage: transition is the work now',
    read: 'This is where funded prototypes die. A Phase II ends, the program office that liked the demo has no line item, and the champion rotates before the next budget cycle. Transition is the work from here, and it has to start before the current money runs out, because a program of record takes two cycles to open and nobody opens one for a company that has already gone quiet.',
    defaults: ['validation', 'contract-vehicle', 'capital'],
  },
  scaling: {
    label: 'a company crossing into scale',
    subject: 'Your triage: pull-through decides the next 18 months',
    read: 'At this stage product matters less than pull-through. The teams that stall treated the program of record as a sales problem when it is a budget-cycle problem: which appropriation can legally buy what you sell, who owns that line, and when it next opens. Most teams here are one cycle from either a line item or a stall, and the difference is usually whether they knew the color of the money.',
    defaults: ['capital', 'contract-vehicle', 'acquisition'],
  },
  curious: {
    label: 'curious, not committed',
    subject: 'Your triage: curiosity before conviction',
    read: 'Most people who are curious about this space never talk to an operator, and they stay curious. The ones who do usually decide within a month, one way or the other, and either outcome is a good one. The reading is free and the first conversation is the whole test.',
    defaults: ['problem', 'operator-access', 'validation'],
  },
}

const DEFAULT_STAGE: StageRead = {
  label: 'a founder',
  subject: 'Your triage',
  read: 'Every company that makes it here started with a named operator problem and a person who owned it. The rest is transition work, and transition work starts earlier than anyone expects.',
  defaults: ['problem', 'problem-owner', 'operator-access'],
}

interface Move {
  title: string
  action: string
  url: string
  linkLabel: string
}

const MOVES: Record<string, Move> = {
  problem: {
    title: 'Find the wound.',
    action: 'Spend the next thirty days in rooms with operators, not in a deck. Ask what broke last week and who had to fix it. A problem you can name by person and command is worth more than any market size.',
    url: `${SITE}/knowledge/go-to-market`,
    linkLabel: 'Customer discovery for defense founders',
  },
  'problem-owner': {
    title: 'Name the owner.',
    action: 'Write down the one person whose budget line breaks when this fails, and the command they sit in. If you cannot name them yet, you have a topic, not a problem, and the next thirty days are for fixing that.',
    url: `${SITE}/knowledge/go-to-market`,
    linkLabel: 'Finding problem sponsors',
  },
  'tech-cofounder': {
    title: 'Get velocity.',
    action: 'You need someone who can ship a first prototype in ninety days, not a contractor on a statement of work. The Missionized Tech Residency embeds technical residents with operator-founders for exactly this.',
    url: `${SITE}/programs/residency`,
    linkLabel: 'Missionized Tech Residency',
  },
  'domain-cofounder': {
    title: 'Get the wound in the room.',
    action: 'Pair with someone who lived the problem and owns the customer relationship. Interviews are a substitute for a co-founder only until the first hard product call, and then they are not.',
    url: `${SITE}/programs/the-combine`,
    linkLabel: 'The Combine',
  },
  capital: {
    title: 'Match the money to the stage.',
    action: 'Defense sales cycles are long, so raise for patience. Before you raise anything, know which appropriation can legally buy what you sell; investors who know this market will ask.',
    url: `${SITE}/knowledge/color-of-money`,
    linkLabel: 'The Color of Money',
  },
  'operator-access': {
    title: 'Structured operator contact, repeated.',
    action: 'One conversation is a story. Ten are a pattern. The Combine puts funded technology in front of warfighters before you scale the wrong thing, and the pattern is what you are after.',
    url: `${SITE}/programs/the-combine`,
    linkLabel: 'The Combine',
  },
  acquisition: {
    title: 'Learn how the Department buys before you try to sell to it.',
    action: 'Other Transaction agreements, SBIR and STTR, authority to operate, color of money. Two hours of reading now saves a year of chasing the wrong vehicle.',
    url: `${SITE}/knowledge/acquisition`,
    linkLabel: 'How DoD actually buys',
  },
  cohort: {
    title: 'Move with other founders.',
    action: 'Solo founders compound stress; cohort founders compound learning. Eight weeks alongside operators and acquisition professionals is the fastest calibration available.',
    url: `${SITE}/programs/the-combine`,
    linkLabel: 'The Combine cohort',
  },
  validation: {
    title: 'Get five operators to say it in their own words.',
    action: 'Before you raise, hire, or quit your job, get five operators to say "I would use that today" without prompting. Write down the exact words; they become your first requirement.',
    url: `${SITE}/knowledge/go-to-market`,
    linkLabel: 'Customer discovery for defense founders',
  },
  'contract-vehicle': {
    title: 'Get the first defense dollar.',
    action: 'A Phase I, an Other Transaction, or a customer with discretionary funds. The first dollar de-risks the next ten. The opportunities radar is filtered for what is winnable this quarter.',
    url: `${SITE}/opportunities`,
    linkLabel: 'Opportunities radar',
  },
}

export function stageRead(stage: string | null): StageRead {
  return (stage && STAGES[stage]) || DEFAULT_STAGE
}

/** Up to three moves: the founder's own constraints first, then the stage defaults. */
export function pickMoves(sub: FounderPathSubmission): Move[] {
  const keys: string[] = []
  for (const k of sub.constraints) if (MOVES[k] && !keys.includes(k)) keys.push(k)
  for (const k of stageRead(sub.stage).defaults) {
    if (keys.length >= 3) break
    if (MOVES[k] && !keys.includes(k)) keys.push(k)
  }
  return keys.slice(0, 3).map(k => MOVES[k])
}

function joinPlain(items: string[]): string {
  if (items.length <= 1) return items.join('')
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

/** One sentence that proves we read what they said. */
export function whatYouToldUs(sub: FounderPathSubmission): string {
  const parts: string[] = [`you are ${stageRead(sub.stage).label}`]
  const brings = sub.brings.map(b => BRINGS_LABEL[b]).filter(Boolean)
  if (brings.length) parts.push(`you bring ${joinPlain(brings)}`)
  const company = sub.company ? COMPANY_LABEL[sub.company] : null
  if (company) parts.push(`you are building ${company}`)
  const s = parts.join('; ')
  return s.charAt(0).toUpperCase() + s.slice(1) + '.'
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
    `Brings: ${sub.brings.join(', ') || 'none'} · Missing: ${sub.constraints.join(', ') || 'none'}`,
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
      <p style="font-size:13px;color:#777;margin:4px 0 0;">Brings: ${escapeHtml(sub.brings.join(', ') || 'none')} · Missing: ${escapeHtml(sub.constraints.join(', ') || 'none')}</p>
      ${sub.context ? `<p style="font-size:14px;color:#555;font-style:italic;margin:16px 0 0;white-space:pre-wrap;">${escapeHtml(sub.context)}</p>` : ''}
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
      <pre style="font-family:'Courier New',monospace;font-size:13px;color:#111;white-space:pre-wrap;margin:0;">${escapeHtml(reportBlock(sub))}</pre>
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0 12px;" />
      <p style="font-size:12px;color:#999;margin:0;">Reply to this email to reach them directly.</p>
    </div>`
  return { subject, text, html }
}

/**
 * The founder's copy. First thing Merge Combinator sends them, so it has to
 * be worth reading on its own: proof we read what they said, a straight
 * account of how founders in their position lose the next year, three
 * moves for the next ninety days, and what happens now. No pitch, no
 * sequence, no internal report.
 */
export function renderFounderPathCopyEmail(sub: FounderPathSubmission): RenderedEmail {
  const stage = stageRead(sub.stage)
  const moves = pickMoves(sub)
  const greeting = sub.name ? `${sub.name},` : 'Hi,'
  const told = whatYouToldUs(sub)
  const whatNow = 'A person on the team reads this within two business days. If your position fits what we are building right now, we reply with a specific next step. If it does not, we still reply and say so. Reply to this email any time; it reaches a person, not a queue.'
  const call = 'If you would rather argue it out with a human, there is a free 30-minute call on the calendar.'
  const signoff = '— Paul Garcia, Merge Combinator'
  const inTheirWords = sub.context ? `You added: "${sub.context}"` : ''

  const textMoves = moves.map((m, i) => `${i + 1}. ${m.title} ${m.action}\n   ${m.linkLabel}: ${m.url}`).join('\n\n')
  const text = [
    greeting,
    '',
    told,
    inTheirWords,
    '',
    stage.read,
    '',
    'THE NEXT NINETY DAYS',
    textMoves,
    '',
    'WHAT HAPPENS NOW',
    whatNow,
    '',
    `${call} ${CALL_URL}`,
    '',
    signoff,
    '',
    `Written from your answers at ${SITE}/start. Still early here; we are learning alongside the founders we work with.`,
  ].filter(l => l !== undefined).join('\n').replace(/\n{3,}/g, '\n\n')

  const htmlMoves = moves.map((m, i) => `
      <tr>
        <td style="vertical-align:top;padding:0 14px 18px 0;font-family:'Courier New',monospace;font-size:13px;color:#3b82f6;font-weight:700;">${String(i + 1).padStart(2, '0')}</td>
        <td style="vertical-align:top;padding:0 0 18px;">
          <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#111;">${escapeHtml(m.title)}</p>
          <p style="margin:0 0 6px;font-size:14px;line-height:1.55;color:#333;">${escapeHtml(m.action)}</p>
          <a href="${m.url}" style="font-size:13px;color:#3b82f6;">${escapeHtml(m.linkLabel)} &rarr;</a>
        </td>
      </tr>`).join('')

  const html = `
    <div style="font-family:-apple-system,'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#111;">
      <p style="font-size:15px;margin:0 0 16px;">${escapeHtml(greeting)}</p>
      <p style="font-size:15px;line-height:1.55;margin:0 0 ${inTheirWords ? '8' : '16'}px;">${escapeHtml(told)}</p>
      ${inTheirWords ? `<p style="font-size:14px;line-height:1.55;color:#555;font-style:italic;margin:0 0 16px;">${escapeHtml(inTheirWords)}</p>` : ''}
      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">${escapeHtml(stage.read)}</p>
      <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;color:#3b82f6;margin:0 0 12px;">THE NEXT NINETY DAYS</p>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 8px;">${htmlMoves}</table>
      <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;color:#3b82f6;margin:8px 0 6px;">WHAT HAPPENS NOW</p>
      <p style="font-size:14px;line-height:1.55;color:#333;margin:0 0 16px;">${escapeHtml(whatNow)}</p>
      <p style="font-size:14px;line-height:1.55;color:#333;margin:0 0 24px;">${escapeHtml(call)} <a href="${CALL_URL}" style="color:#3b82f6;">Book 30 minutes</a>.</p>
      <p style="font-size:14px;color:#333;margin:0 0 28px;">${escapeHtml(signoff)}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:0 0 12px;" />
      <p style="font-size:12px;color:#999;line-height:1.5;margin:0;">Written from your answers at <a href="${SITE}/start" style="color:#999;">mergecombinator.com/start</a>. Still early here; we are learning alongside the founders we work with.</p>
    </div>`

  return { subject: stage.subject, text, html }
}
