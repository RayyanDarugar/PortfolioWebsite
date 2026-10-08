import { describe, it, expect } from 'vitest'
import { RESUME } from '../resume'
import { ROLES, getRole, joinRoles } from '../roles'

describe('the roles', () => {
  it('cover every résumé entry, newest first', () => {
    expect(ROLES.map((r) => r.slug)).toEqual(['superset', 'kana', 'troylabs', 'btg', 'hemut', 'supervisor', 'deca'])
    expect(ROLES).toHaveLength(RESUME.experience.length + RESUME.leadership.length)
  })

  it('take their bullets from the résumé, so the two never disagree', () => {
    const kana = getRole('kana')!
    expect(kana.bullets).toBe(RESUME.experience.find((r) => r.org === 'Kana')!.bullets)
    expect(kana.title).toBe('GTM Engineer')
  })

  it('link super{set} to the TikTok platform it shipped', () => {
    expect(getRole('superset')!.project).toBe('tiktok')
  })

  it('fail loudly on an org the résumé does not have, or an unknown project', () => {
    expect(() => joinRoles([{ slug: 'x', org: 'Nowhere Inc', tags: [] }])).toThrow(/Nowhere Inc/)
    expect(() => joinRoles([{ slug: 'kana', org: 'Kana', tags: [], project: 'nope' }])).toThrow(/nope/)
  })
})

describe('org lines', () => {
  it('call California DECA an association, not a chapter (chapters are schools)', () => {
    expect(getRole('deca')!.orgLine).not.toMatch(/chapter/)
  })
})
