import { describe, it, expect } from 'vitest'
import { getEntries, getEntry } from '../journal'

describe('the journal', () => {
  it('parses every entry, newest first, with a real date', () => {
    const entries = getEntries()
    expect(entries.length).toBeGreaterThan(0)
    for (const e of entries) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(e.title && e.summary).toBeTruthy()
      expect(e.body.length).toBeGreaterThan(0)
    }
    const dates = entries.map((e) => e.date)
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it('finds an entry by slug', () => {
    expect(getEntry('on-beauty')?.title).toBe('What I mean by beautiful')
  })
})
