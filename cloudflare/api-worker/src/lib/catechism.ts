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

/**
 * The founder's copy. First thing we send them, so it has to earn a reply:
 * their answers back, one honest read on what the blanks mean, one next
 * step, and a plain account of what happens now. No pitch, no sequence.
 */
const CALL_URL = 'https://calendar.app.google/caYkEhTngEyUEgDn7'
const FIVE_STEP_URL = 'https://mergecombinator.com/knowledge/first-principles-engineering'

export function renderCopyEmail(sub: CatechismSubmission): RenderedEmail {
  const greeting = sub.name ? `${sub.name},` : 'Hi,'
  const blanks = 8 - sub.answeredCount
  const subject = blanks === 0
    ? 'Your eight answers, all eight'
    : `Your eight answers (${sub.answeredCount} of 8)`

  const opener = blanks === 0
    ? 'You answered all eight. Most people stop at three, and the ones who finish usually find question eight is the one they had never written down before.'
    : `You answered ${sub.answeredCount} of eight. The ${blanks === 1 ? 'blank one is' : 'blanks are'} the useful part: each one is a conversation you have not had yet, usually with the person who owns the problem.`
  const useIt = 'Two things worth doing with these this week. Send them to one person who owns the problem and ask them to mark question four. Then run question two past someone who does the job today and see whether they recognize it.'
  const whatNow = 'A person on the team reads this within two business days. If your answers fit what we are building right now, we reply with a specific next step. If they do not, we still reply and say so. Reply to this email any time; it reaches a person, not a queue.'
  const call = 'If you would rather talk it through, there is a free 30-minute call on the calendar.'
  const signoff = '— Paul Garcia, Merge Combinator'

  const textLines: string[] = []
  const htmlBlocks: string[] = []
  CATECHISM_QUESTIONS.forEach((q, i) => {
    const n = String(i + 1).padStart(2, '0')
    const a = sub.answers[q.id] || '(blank)'
    textLines.push(`${n}  ${q.label}`, a, '')
    htmlBlocks.push(
      `<p style="margin:18px 0 4px;font-family:'Courier New',monospace;font-size:12px;color:#3b82f6;letter-spacing:.06em;">${n}</p>` +
      `<p style="margin:0 0 6px;font-size:13.5px;color:#666;font-style:italic;">${escapeHtml(q.label)}</p>` +
      `<p style="margin:0;font-size:14.5px;color:#111;white-space:pre-wrap;">${escapeHtml(a)}</p>`
    )
  })

  const text = [
    greeting,
    '',
    opener,
    '',
    useIt,
    '',
    `Pair the questions with the 5-Step Design Process: ${FIVE_STEP_URL}`,
    '',
    'What happens now',
    whatNow,
    '',
    `${call} ${CALL_URL}`,
    '',
    signoff,
    '',
    '----------------------------------------',
    'Your answers, as you wrote them',
    '',
    ...textLines,
    'The questions are George Heilmeier\'s, from DARPA, 1975: https://mergecombinator.com/knowledge/heilmeier-catechism',
  ].join('\n')

  const html = `
    <div style="font-family:-apple-system,'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#111;">
      <p style="font-size:15px;margin:0 0 16px;">${escapeHtml(greeting)}</p>
      <p style="font-size:15px;line-height:1.55;margin:0 0 16px;">${escapeHtml(opener)}</p>
      <p style="font-size:15px;line-height:1.55;margin:0 0 16px;">${escapeHtml(useIt)}</p>
      <p style="margin:0 0 24px;"><a href="${FIVE_STEP_URL}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 16px;border-radius:2px;">Pair it with the 5-Step Design Process</a></p>
      <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;color:#3b82f6;margin:0 0 6px;">WHAT HAPPENS NOW</p>
      <p style="font-size:14px;line-height:1.55;color:#333;margin:0 0 16px;">${escapeHtml(whatNow)}</p>
      <p style="font-size:14px;line-height:1.55;color:#333;margin:0 0 24px;">${escapeHtml(call)} <a href="${CALL_URL}" style="color:#3b82f6;">Book 30 minutes</a>.</p>
      <p style="font-size:14px;color:#333;margin:0 0 32px;">${escapeHtml(signoff)}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:0 0 4px;" />
      <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.14em;color:#999;margin:12px 0 0;">YOUR ANSWERS, AS YOU WROTE THEM</p>
      ${htmlBlocks.join('')}
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0 12px;" />
      <p style="font-size:12px;color:#999;margin:0;">The questions are George Heilmeier's, from DARPA, 1975. <a href="https://mergecombinator.com/knowledge/heilmeier-catechism" style="color:#3b82f6;">Read the page</a>.</p>
    </div>`

  return { subject, text, html }
}
