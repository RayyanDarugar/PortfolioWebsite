import { describe, it, expect } from 'vitest'
import { PROJECTS, headlineMetrics, validateProjects, type Project } from '../projects'

const base: Project = { slug: 'x', name: 'X', tagline: 'An x.', order: 1, icon: 'bolt', tile: 'linear-gradient(#000,#111)' }

describe('the projects', () => {
  it('are Dynamo, TikTok and the Digest, in dock order', () => {
    expect(PROJECTS.map((p) => p.slug)).toEqual(['dynamo', 'tiktok', 'digest'])
  })

  it('only claim numbers the résumé supports', () => {
    const tiktok = PROJECTS.find((p) => p.slug === 'tiktok')!
    expect(tiktok.metrics?.map((m) => m.value)).toEqual(['~20,000', '~600'])
    expect(PROJECTS.find((p) => p.slug === 'dynamo')!.metrics).toBeUndefined()
    expect(PROJECTS.find((p) => p.slug === 'digest')!.metrics).toBeUndefined()
  })

  it('feed the picker headline strip from flagged metrics', () => {
    expect(headlineMetrics()).toEqual([{ value: '~20,000', label: 'TikTok views in a week', app: 'tiktok' }])
    expect(headlineMetrics([base])).toEqual([])
  })
})

describe('validateProjects', () => {
  it('sorts by order', () => {
    const list = validateProjects([{ ...base, slug: 'b', order: 2 }, { ...base, slug: 'a', order: 1 }])
    expect(list.map((p) => p.slug)).toEqual(['a', 'b'])
  })

  it('rejects a missing name, a bad slug and a duplicate', () => {
    expect(() => validateProjects([{ ...base, name: '' }])).toThrow(/x: needs a name/)
    expect(() => validateProjects([{ ...base, slug: 'Bad Slug' }])).toThrow(/slug/)
    expect(() => validateProjects([base, { ...base, order: 2 }])).toThrow(/duplicate/)
  })
})

// Recruiter-facing claims stay within their sources: the MIT study measured
// return on generative-AI pilots, not losses.
describe('claims', () => {
  it('cite the MIT study for what it found, and nothing unproven', () => {
    const text = PROJECTS.flatMap((p) => [...(p.problem ?? []), ...(p.built ?? [])]).join(' ')
    expect(text).not.toMatch(/billion lost|high chance|no one in the loop/)
  })
})
