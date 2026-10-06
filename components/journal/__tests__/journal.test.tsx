import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }), usePathname: () => '/journal' }))
import { getEntries } from '@/content/journal'
import { JournalContents, JournalEntry } from '../Journal'

const entries = getEntries()

describe('JournalContents', () => {
  it('lists every entry, dated, linking to it', () => {
    render(<JournalContents entries={entries} />)
    for (const e of entries) {
      expect(screen.getByRole('link', { name: new RegExp(e.title) }).getAttribute('href')).toBe(`/journal/${e.slug}`)
    }
  })
})

describe('JournalEntry', () => {
  it('shows the entry and a way back to the contents', () => {
    render(<JournalEntry entry={entries[0]} prev={null} next={null} />)
    expect(screen.getByRole('heading', { level: 2, name: entries[0].title })).toBeTruthy()
    expect(screen.getByText(entries[0].body[0])).toBeTruthy()
    expect(screen.getByRole('link', { name: /Contents/ }).getAttribute('href')).toBe('/journal')
  })
})
