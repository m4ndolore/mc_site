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
  it('matches the next step to the stage and keeps the two-business-day promise', () => {
    const r = parseFounderPathBody({ ...valid, stage: 'operator-with-problem' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const mail = renderFounderPathCopyEmail(r.value)
    expect(mail.subject).toBe('Your triage: operator with a problem, no team')
    expect(mail.text).toContain('within two business days')
    expect(mail.text).toContain('curriculum#stage-spot')
    expect(mail.text).toContain('Stage: Operator')
    expect(mail.text.startsWith('Ada,')).toBe(true)
    expect(mail.html).toContain('Open Spot')
  })

  it('falls back to Preflight for an unknown stage', () => {
    const r = parseFounderPathBody({ ...valid, stage: 'something-new', name: '' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const mail = renderFounderPathCopyEmail(r.value)
    expect(mail.subject).toBe('Your triage: founder')
    expect(mail.text.startsWith('Hi,')).toBe(true)
    expect(mail.text).toContain('curriculum#stage-preflight')
  })

  it('sends prototype teams to Ready for Launch and scaling teams to Tension', () => {
    const a = parseFounderPathBody({ ...valid, stage: 'team-with-prototype' })
    const b = parseFounderPathBody({ ...valid, stage: 'scaling' })
    expect(a.ok && b.ok).toBe(true)
    if (!a.ok || !b.ok) return
    expect(renderFounderPathCopyEmail(a.value).text).toContain('curriculum#stage-ready')
    expect(renderFounderPathCopyEmail(b.value).text).toContain('curriculum#stage-tension')
  })
})
