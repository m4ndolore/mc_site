import { describe, it, expect } from 'vitest'
import {
  ANSWER_MAX_CHARS,
  CATECHISM_QUESTIONS,
  parseCatechismBody,
  renderCopyEmail,
  renderTeamEmail,
} from '../lib/catechism'

const valid = {
  name: 'Ada',
  email: 'Ada@Example.com ',
  organization: 'Skunk Works',
  source: 'https://mergecombinator.com/knowledge/heilmeier-catechism',
  answers: { q1: 'Build an aircraft radar cannot see.', q4: 'Every pilot in a SAM belt.' },
}

describe('parseCatechismBody', () => {
  it('accepts a partial submission and normalizes it', () => {
    const r = parseCatechismBody(valid)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.email).toBe('ada@example.com')
    expect(r.value.name).toBe('Ada')
    expect(r.value.organization).toBe('Skunk Works')
    expect(r.value.answeredCount).toBe(2)
    expect(Object.keys(r.value.answers)).toEqual(CATECHISM_QUESTIONS.map(q => q.id))
    expect(r.value.answers.q2).toBe('')
  })

  it('rejects a non-object body', () => {
    expect(parseCatechismBody(null).ok).toBe(false)
    expect(parseCatechismBody([]).ok).toBe(false)
    expect(parseCatechismBody('x').ok).toBe(false)
  })

  it('requires a valid email', () => {
    const r = parseCatechismBody({ ...valid, email: 'not-an-email' })
    expect(r).toMatchObject({ ok: false, code: 'INVALID_INPUT' })
  })

  it('requires at least one answer', () => {
    const r = parseCatechismBody({ ...valid, answers: { q1: '   ' } })
    expect(r).toMatchObject({ ok: false, code: 'INVALID_INPUT' })
  })

  it('requires answers to be an object', () => {
    const r = parseCatechismBody({ ...valid, answers: 'q1' })
    expect(r).toMatchObject({ ok: false, code: 'INVALID_INPUT' })
  })

  it('flags a filled honeypot as spam', () => {
    const r = parseCatechismBody({ ...valid, website: 'http://spam' })
    expect(r).toMatchObject({ ok: false, code: 'SPAM' })
  })

  it('ignores unknown answer keys and caps answer length', () => {
    const r = parseCatechismBody({
      ...valid,
      answers: { q1: 'x'.repeat(ANSWER_MAX_CHARS + 50), q99: 'nope' },
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.answers.q1.length).toBe(ANSWER_MAX_CHARS)
    expect('q99' in r.value.answers).toBe(false)
  })

  it('treats blank name and organization as null', () => {
    const r = parseCatechismBody({ ...valid, name: '  ', organization: undefined })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.name).toBeNull()
    expect(r.value.organization).toBeNull()
  })
})

describe('renderTeamEmail', () => {
  it('lists all eight questions, marks blanks, and escapes HTML', () => {
    const r = parseCatechismBody({ ...valid, answers: { q1: '<script>alert(1)</script>' } })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const mail = renderTeamEmail(r.value)
    expect(mail.subject).toBe('Heilmeier answers from Ada (Skunk Works)')
    expect(mail.text).toContain('Answered: 1 of 8')
    expect(mail.text).toContain('08  What are the mid-term and final exams')
    expect((mail.text.match(/\(blank\)/g) || []).length).toBe(7)
    expect(mail.html).toContain('&lt;script&gt;')
    expect(mail.html).not.toContain('<script>')
  })

  it('falls back to the email address when there is no name', () => {
    const r = parseCatechismBody({ ...valid, name: '', organization: '' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(renderTeamEmail(r.value).subject).toBe('Heilmeier answers from ada@example.com')
  })
})

describe('renderCopyEmail', () => {
  it('counts the blanks, says what happens next, and returns the answers', () => {
    const r = parseCatechismBody(valid)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const mail = renderCopyEmail(r.value)
    expect(mail.subject).toBe('Your eight answers (2 of 8)')
    expect(mail.text.startsWith('Ada,')).toBe(true)
    expect(mail.text).toContain('You answered 2 of eight.')
    expect(mail.text).toContain('The 6 blanks are questions you cannot answer yet')
    expect(mail.text).toContain('Merge Combinator will read this and respond if we think we can help.')
    expect(mail.text).not.toContain('business days')
    expect(mail.text).not.toContain('not a queue')
    expect(mail.text).toContain('book 30 minutes with me. https://')
    expect(mail.text).toContain('Build an aircraft radar cannot see.')
    expect(mail.text).toContain('first-principles-engineering')
  })

  it('congratulates a full set and singularizes one blank', () => {
    const all: Record<string, string> = {}
    for (let i = 1; i <= 8; i++) all[`q${i}`] = `answer ${i}`
    const full = parseCatechismBody({ ...valid, answers: all })
    expect(full.ok).toBe(true)
    if (!full.ok) return
    expect(renderCopyEmail(full.value).subject).toBe('Your eight answers, all eight')

    const seven = parseCatechismBody({ ...valid, answers: { ...all, q8: '' } })
    expect(seven.ok).toBe(true)
    if (!seven.ok) return
    expect(renderCopyEmail(seven.value).text).toContain('The blank one is a question you cannot answer yet')
  })
})
