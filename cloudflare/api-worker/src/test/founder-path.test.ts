import { describe, it, expect } from 'vitest'
import {
  parseFounderPathBody,
  renderFounderPathCopyEmail,
  renderFounderPathTeamEmail,
} from '../lib/founder-path'

const valid = {
  schema_version: 'founder_path_v1',
  sessionId: 'fp-123',
  source: 'founder-path',
  stage: 'operator',
  brings: ['domain', 'team'],
  constraints: ['clearance'],
  company: 'pre-company',
  name: 'Ada',
  email: 'Ada@Example.com',
  context: 'Coming out of a squadron, want to build a maintenance tool.',
  report: 'MERGE COMBINATOR · FOUNDER PATH TRIAGE\nStage: Operator',
}

describe('parseFounderPathBody', () => {
  it('normalizes a full submission', () => {
    const r = parseFounderPathBody(valid)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.email).toBe('ada@example.com')
    expect(r.value.brings).toEqual(['domain', 'team'])
    expect(r.value.report).toContain('Stage: Operator')
  })

  it('accepts a submission with no email as a non-lead', () => {
    const r = parseFounderPathBody({ ...valid, email: '' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.email).toBeNull()
  })

  it('rejects a malformed email', () => {
    expect(parseFounderPathBody({ ...valid, email: 'nope' }).ok).toBe(false)
  })

  it('rejects a non-object body', () => {
    expect(parseFounderPathBody(null).ok).toBe(false)
    expect(parseFounderPathBody([]).ok).toBe(false)
  })

  it('drops non-string list items and caps lists', () => {
    const r = parseFounderPathBody({ ...valid, brings: ['a', 3, null, 'b'] })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.brings).toEqual(['a', 'b'])
  })
})

describe('renderFounderPathTeamEmail', () => {
  it('names the sender and stage, includes context and report, escapes HTML', () => {
    const r = parseFounderPathBody({ ...valid, context: '<b>hi</b>' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const mail = renderFounderPathTeamEmail(r.value)
    expect(mail.subject).toBe('Founder Path triage: Ada · operator')
    expect(mail.text).toContain('From: Ada <ada@example.com>')
    expect(mail.text).toContain('Stage: Operator')
    expect(mail.html).toContain('&lt;b&gt;hi&lt;/b&gt;')
  })

  it('falls back to a structured summary when the client sent no report', () => {
    const r = parseFounderPathBody({ ...valid, report: undefined })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const mail = renderFounderPathTeamEmail(r.value)
    expect(mail.text).toContain('Brings: domain, team')
    expect(mail.text).toContain('Constraints: clearance')
  })
})

describe('renderFounderPathCopyEmail', () => {
  it('plays back what they said, reads their stage, and gives three moves', () => {
    const r = parseFounderPathBody({ ...valid, stage: 'operator-with-problem', company: 'defense-first', constraints: ['tech-cofounder', 'problem-owner'] })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const mail = renderFounderPathCopyEmail(r.value)
    expect(mail.subject).toBe('Your triage: you own the problem')
    expect(mail.text.startsWith('Ada,')).toBe(true)
    // "team" is not a page option, so only the real one is played back.
    expect(mail.text).toContain('You are an operator who lived the problem, without a team yet; you bring operator domain expertise; you are building mission tech for warfighters, defense first.')
    expect(mail.text).toContain('You added: "Coming out of a squadron')
    expect(mail.text).toContain('rarest asset in this market')
    // Their constraints first, then a stage default to make three.
    expect(mail.text).toContain('1. Get velocity.')
    expect(mail.text).toContain('2. Name the owner.')
    expect(mail.text).toContain('3. Match the money to the stage.')
    expect(mail.text).toContain('within two business days')
    // The page's internal report never reaches the founder.
    expect(mail.text).not.toContain('MERGE COMBINATOR · FOUNDER PATH TRIAGE')
    expect(mail.html).not.toContain('FOUNDER PATH TRIAGE')
    expect(mail.html).toContain('Missionized Tech Residency')
  })

  it('falls back sensibly for an unknown stage and no name', () => {
    const r = parseFounderPathBody({ ...valid, stage: 'something-new', name: '', constraints: [], brings: [], company: undefined, context: undefined })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const mail = renderFounderPathCopyEmail(r.value)
    expect(mail.subject).toBe('Your triage')
    expect(mail.text.startsWith('Hi,')).toBe(true)
    expect(mail.text).toContain('You are a founder.')
    expect(mail.text).toContain('1. Find the wound.')
    expect(mail.text).not.toContain('You added:')
  })

  it('uses stage defaults when no constraints were picked', () => {
    const a = parseFounderPathBody({ ...valid, stage: 'team-with-prototype', constraints: [] })
    const b = parseFounderPathBody({ ...valid, stage: 'scaling', constraints: [] })
    expect(a.ok && b.ok).toBe(true)
    if (!a.ok || !b.ok) return
    const ma = renderFounderPathCopyEmail(a.value).text
    const mb = renderFounderPathCopyEmail(b.value).text
    expect(ma).toContain('funded prototypes die')
    expect(ma).toContain('1. Get five operators to say it in their own words.')
    expect(mb).toContain('color of the money')
    expect(mb).toContain('knowledge/color-of-money')
  })

  it('caps at three moves and ignores unknown constraints', () => {
    const r = parseFounderPathBody({ ...valid, constraints: ['capital', 'cohort', 'validation', 'acquisition', 'made-up'] })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const text = renderFounderPathCopyEmail(r.value).text
    expect(text).toContain('3. Get five operators')
    expect(text).not.toContain('4. ')
  })
})
