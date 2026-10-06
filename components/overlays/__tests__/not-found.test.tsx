import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }), usePathname: () => '/journal/on-beuty' }))
import NotFound from '@/app/not-found'

// /journal/on-beuty is a 404 that the OS still reads as an overlay path, so it
// freezes the room. The 404 must be an overlay itself: Esc closes it to the room.
describe('a mistyped link', () => {
  it('opens a closable overlay that points back to the room', () => {
    render(<NotFound />)
    expect(screen.getByRole('dialog', { name: 'Not found' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /room/i }).getAttribute('href')).toBe('/')
  })
})
