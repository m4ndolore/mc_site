/**
 * Heilmeier Catechism submissions.
 *
 * A founder fills in the eight questions on /knowledge/heilmeier-catechism
 * and sends them to the team. This module validates the body and renders
 * the email. Sending and routing live in routes/access.ts.
 */

export const CATECHISM_QUESTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'q1', label: 'What are you trying to do? Articulate your objectives using absolutely no jargon.' },
  { id: 'q2', label: 'How is it done today, and what are the limits of current practice?' },
  { id: 'q3', label: 'What is new in your approach and why do you think it will be successful?' },
  { id: 'q4', label: 'Who cares? If you are successful, what difference will it make?' },
  { id: 'q5', label: 'What are the risks?' },
  { id: 'q6', label: 'How much will it cost?' },
  { id: 'q7', label: 'How long will it take?' },
  { id: 'q8', label: 'What are the mid-term and final exams to check for success?' },
]

export const ANSWER_MAX_CHARS = 4000
const SHORT_MAX_CHARS = 200
const SOURCE_MAX_CHARS = 300
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface CatechismSubmission {
  name: string | null
  email: string
  organization: string | null
  answers: Record<string, string>
  answeredCount: number
  source: string | null
}

export type ParseResult =
  | { ok: true; value: CatechismSubmission }
  | { ok: false; code: 'INVALID_INPUT' | 'SPAM'; message: string }

function asTrimmedString(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

export function parseCatechismBody(body: unknown): ParseResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Body must be a JSON object' }
  }
  const b = body as Record<string, unknown>

  // Honeypot: real users never see or fill this field.
  if (asTrimmedString(b.website, 10)) {
    return { ok: false, code: 'SPAM', message: 'Honeypot filled' }
  }

  const email = asTrimmedString(b.email, SHORT_MAX_CHARS).toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Valid email is required' }
  }

  const rawAnswers = b.answers
  if (!rawAnswers || typeof rawAnswers !== 'object' || Array.isArray(rawAnswers)) {
    return { ok: false, code: 'INVALID_INPUT', message: 'answers must be an object keyed q1..q8' }
  }
  const answersIn = rawAnswers as Record<string, unknown>
  const answers: Record<string, string> = {}
  let answeredCount = 0
  for (const q of CATECHISM_QUESTIONS) {
    const text = asTrimmedString(answersIn[q.id], ANSWER_MAX_CHARS)
    answers[q.id] = text
    if (text) answeredCount += 1
  }
  if (answeredCount === 0) {
    return { ok: false, code: 'INVALID_INPUT', message: 'At least one answer is required' }
  }

  return {
    ok: true,
    value: {
      name: asTrimmedString(b.name, SHORT_MAX_CHARS) || null,
      email,
      organization: asTrimmedString(b.organization, SHORT_MAX_CHARS) || null,
      answers,
      answeredCount,
      source: asTrimmedString(b.source, SOURCE_MAX_CHARS) || null,
    },
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface RenderedEmail {
  subject: string
  text: string
  html: string
}

/** The email the team receives. */
export function renderTeamEmail(sub: CatechismSubmission): RenderedEmail {
  const who = sub.name ? `${sub.name} <${sub.email}>` : sub.email
  const org = sub.organization ? ` (${sub.organization})` : ''
  const subject = `Heilmeier answers from ${sub.name || sub.email}${org}`

  const textLines: string[] = [
    `HEILMEIER CATECHISM SUBMISSION`,
    `From: ${who}${org}`,
    `Answered: ${sub.answeredCount} of 8`,
    sub.source ? `Page: ${sub.source}` : '',
    '',
  ]
  const htmlBlocks: string[] = []
  CATECHISM_QUESTIONS.forEach((q, i) => {
    const n = String(i + 1).padStart(2, '0')
    const a = sub.answers[q.id] || '(blank)'
    textLines.push(`${n}  ${q.label}`, a, '')
    htmlBlocks.push(
      `<p style="margin:20px 0 4px;font-family:'Courier New',monospace;font-size:12px;color:#3b82f6;letter-spacing:.06em;">${n}</p>` +
      `<p style="margin:0 0 6px;font-size:14px;color:#555;font-style:italic;">${escapeHtml(q.label)}</p>` +
      `<p style="margin:0;font-size:15px;color:#111;white-space:pre-wrap;">${escapeHtml(a)}</p>`
    )
  })
  textLines.push(`Reply to this email to reach them directly.`)

  const html = `
    <div style="font-family:-apple-system,'Helvetica Neue',sans-serif;max-width:640px;margin:0 auto;padding:32px 20px;">
      <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;color:#3b82f6;margin:0 0 8px;">HEILMEIER CATECHISM SUBMISSION</p>
      <p style="font-size:15px;color:#333;margin:0;">From: ${escapeHtml(who)}${escapeHtml(org)}</p>
      <p style="font-size:13px;color:#777;margin:4px 0 0;">Answered ${sub.answeredCount} of 8${sub.source ? ` · ${escapeHtml(sub.source)}` : ''}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
      ${htmlBlocks.join('')}
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0 12px;" />
      <p style="font-size:12px;color:#999;margin:0;">Reply to this email to reach them directly.</p>
    </div>`

  return { subject, text: textLines.join('\n'), html }
}

/** The copy the founder receives. */
export function renderCopyEmail(sub: CatechismSubmission): RenderedEmail {
  const greeting = sub.name ? `Hi ${sub.name},` : 'Hi,'
  const subject = 'Your eight Heilmeier answers'
  const intro = `${greeting}\n\nHere is a copy of what you sent to Merge Combinator. Someone on the team reads every one of these. If we have something useful to say, we reply from this thread. Nothing else happens unless you ask.\n\n`

  const textLines: string[] = []
  const htmlBlocks: string[] = []
  CATECHISM_QUESTIONS.forEach((q, i) => {
    const n = String(i + 1).padStart(2, '0')
    const a = sub.answers[q.id] || '(blank)'
    textLines.push(`${n}  ${q.label}`, a, '')
    htmlBlocks.push(
      `<p style="margin:20px 0 4px;font-family:'Courier New',monospace;font-size:12px;color:#3b82f6;letter-spacing:.06em;">${n}</p>` +
      `<p style="margin:0 0 6px;font-size:14px;color:#555;font-style:italic;">${escapeHtml(q.label)}</p>` +
      `<p style="margin:0;font-size:15px;color:#111;white-space:pre-wrap;">${escapeHtml(a)}</p>`
    )
  })
  const outro = `The questions are George Heilmeier's, from DARPA, 1975: https://mergecombinator.com/knowledge/heilmeier-catechism\n\n— Merge Combinator`

  const html = `
    <div style="font-family:-apple-system,'Helvetica Neue',sans-serif;max-width:640px;margin:0 auto;padding:32px 20px;">
      <p style="font-size:15px;color:#333;">${escapeHtml(greeting)}</p>
      <p style="font-size:15px;color:#333;line-height:1.5;">Here is a copy of what you sent to Merge Combinator. Someone on the team reads every one of these. If we have something useful to say, we reply from this thread. Nothing else happens unless you ask.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
      ${htmlBlocks.join('')}
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0 12px;" />
      <p style="font-size:12px;color:#999;margin:0;">The questions are George Heilmeier's, from DARPA, 1975. <a href="https://mergecombinator.com/knowledge/heilmeier-catechism" style="color:#3b82f6;">Read the page</a>.</p>
      <p style="font-size:11px;color:#bbb;margin:16px 0 0;">Merge Combinator</p>
    </div>`

  return { subject, text: intro + textLines.join('\n') + '\n' + outro, html }
}
