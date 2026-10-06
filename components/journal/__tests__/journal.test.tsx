import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/journal' }))
import { consumeOpenedInApp, markOverlayOpenedInApp, resetOverlayDepth } from '@/components/overlays/history'
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

// room → journal → entry → Contents → Esc must land in the room. Replacing the
// entry with /journal left a second /journal in history for Esc to go back to.
describe('Contents from an entry opened in the site', () => {
  it('steps back one level instead of stacking another /journal', () => {
    resetOverlayDepth()
    markOverlayOpenedInApp() // room → journal
    markOverlayOpenedInApp() // journal → entry
    render(<JournalEntry entry={entries[0]} prev={null} next={null} />)
    fireEvent.click(screen.getByRole('link', { name: /Contents/ }))
    expect(router.back).toHaveBeenCalledTimes(1)
    expect(consumeOpenedInApp()).toBe(true) // the room → journal step is still there for Esc
    expect(consumeOpenedInApp()).toBe(false)
  })
})
