import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/books' }))
import { BackLink } from '../BackLink'
import { InAppLink } from '../InAppLink'
import { consumeOpenedInApp, markOverlayOpenedInApp, resetOverlayDepth } from '../history'

beforeEach(() => { resetOverlayDepth(); router.back.mockClear() })

// Cmd/Ctrl/Shift-click opens a new tab or window: this tab never moved, so it
// must not count a step that Esc would later "go back" through, off the site.
describe('modifier clicks', () => {
  it('on an in-app link do not count a step', () => {
    render(<InAppLink href="/books/x">Book</InAppLink>)
    for (const mod of ['metaKey', 'ctrlKey', 'shiftKey'] as const) fireEvent.click(screen.getByRole('link'), { [mod]: true })
    fireEvent.click(screen.getByRole('link'), { button: 1 })
    expect(consumeOpenedInApp()).toBe(false)
  })

  it('on a back link leave history alone', () => {
    markOverlayOpenedInApp()
    render(<BackLink href="/journal">Contents</BackLink>)
    fireEvent.click(screen.getByRole('link'), { metaKey: true })
    expect(router.back).not.toHaveBeenCalled()
    expect(consumeOpenedInApp()).toBe(true)
  })
})
