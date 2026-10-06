import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { PROFILE } from '@/content/profile'

const nav = vi.hoisted(() => {
  const push = vi.fn()
  return { pathname: '/', push, router: { push, back: () => {}, replace: () => {}, prefetch: () => {} } }
})

vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => nav.router,
}))

import { OS } from '../OS'

function at(pathname: string) {
  nav.pathname = pathname
}

const PUSH_OPTS = { scroll: false }

beforeEach(() => {
  nav.push.mockClear()
  at('/')
})

afterEach(() => { vi.unstubAllGlobals() })

describe('the room', () => {
  it('introduces him and puts the Résumé one click away', () => {
    render(<OS />)
    expect(screen.getByRole('heading', { level: 1, name: PROFILE.name })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Résumé' }).getAttribute('href')).toBe('/work/resume')
  })

  it('opens the laptop on click', () => {
    render(<OS />)
    fireEvent.click(screen.getByRole('button', { name: 'Open the laptop' }))
    expect(nav.push).toHaveBeenCalledWith('/work', PUSH_OPTS)
  })

  // It is hidden from assistive tech (the named button is the same action), so
  // it must never take focus: a focused aria-hidden element is a dead end.
  it('the laptop hit area opens the laptop and cannot take focus', () => {
    render(<OS />)
    const hit = document.querySelector<HTMLElement>('[title="Open the laptop"]')!
    hit.focus()
    expect(document.activeElement).not.toBe(hit)
    fireEvent.click(hit)
    expect(nav.push).toHaveBeenCalledWith('/work', PUSH_OPTS)
  })

  // The Résumé link keeps focus after a click while the room fades; it must not
  // end up inside an aria-hidden subtree (browsers block that and warn).
  it('never hides the focused Résumé link from assistive tech', () => {
    const { rerender } = render(<OS />)
    screen.getByRole('link', { name: 'Résumé' }).focus()
    at('/work/resume')
    rerender(<OS />)
    expect(document.activeElement?.closest('[aria-hidden="true"]')).toBeNull()
  })

  it('a burst of wheel events navigates once', () => {
    render(<OS />)
    for (let i = 0; i < 5; i += 1) fireEvent.wheel(window, { deltaY: 40 })
    expect(nav.push).toHaveBeenCalledTimes(1)
    expect(nav.push).toHaveBeenCalledWith('/work', PUSH_OPTS)
  })

  it('ignores an upward wheel and Esc', () => {
    render(<OS />)
    fireEvent.wheel(window, { deltaY: -40 })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(nav.push).not.toHaveBeenCalled()
  })

  it('falls back to the room on an unknown path', () => {
    at('/work/nope')
    render(<OS />)
    expect(screen.getByRole('button', { name: 'Open the laptop' })).toBeTruthy()
  })
})

describe('the laptop', () => {
  it('opens an app from the dock', () => {
    at('/work')
    render(<OS />)
    const dock = screen.getByRole('navigation', { name: 'Apps' })
    fireEvent.click(within(dock).getByRole('button', { name: 'Contact' }))
    expect(nav.push).toHaveBeenCalledWith('/work/contact', PUSH_OPTS)
  })

  it('shows only the open app, and closes it with its red light', () => {
    at('/work/resume')
    render(<OS />)
    const close = screen.getAllByRole('button', { name: 'Close window' })
    expect(close).toHaveLength(1)
    fireEvent.click(close[0])
    expect(nav.push).toHaveBeenCalledWith('/work', PUSH_OPTS)
  })

  it('steps out one level per Esc', () => {
    at('/work/resume')
    const { unmount } = render(<OS />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(nav.push).toHaveBeenLastCalledWith('/work', PUSH_OPTS)
    unmount()

    at('/work')
    render(<OS />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(nav.push).toHaveBeenLastCalledWith('/', PUSH_OPTS)
  })

  it('Esc in Spotlight closes only Spotlight', () => {
    at('/work')
    render(<OS />)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    const search = screen.getByRole('dialog', { name: 'Search' })
    fireEvent.keyDown(within(search).getByRole('textbox'), { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Search' })).toBeNull()
    expect(nav.push).not.toHaveBeenCalled()
  })
})

describe('getting back out of the laptop', () => {
  it('scrolling up on the desktop zooms out, once per flick', () => {
    at('/work')
    render(<OS />)
    for (let i = 0; i < 5; i += 1) fireEvent.wheel(window, { deltaY: -40 })
    expect(nav.push).toHaveBeenCalledTimes(1)
    expect(nav.push).toHaveBeenCalledWith('/', PUSH_OPTS)
  })

  it('scrolling down on the desktop does nothing', () => {
    at('/work')
    render(<OS />)
    fireEvent.wheel(window, { deltaY: 40 })
    expect(nav.push).not.toHaveBeenCalled()
  })

  // A long résumé scrolls inside its window; that must not leave the laptop.
  it('scrolling up inside an open window scrolls the window, not the camera', () => {
    at('/work/resume')
    render(<OS />)
    fireEvent.wheel(screen.getByText('University of Southern California'), { deltaY: -40 })
    expect(nav.push).not.toHaveBeenCalled()
  })
})

describe('Esc while something else is in flight', () => {
  // Clicking the panel's padding moves focus to <body>, so Esc never reaches
  // Spotlight's own handler.
  it('closes only Spotlight even when focus has left it', () => {
    at('/work')
    render(<OS />)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeTruthy()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Search' })).toBeNull()
    expect(nav.push).not.toHaveBeenCalled()
  })

  // The corner Résumé link starts a flight to /work/resume; one Esc before it
  // lands should reverse it, not land on an empty desktop.
  it('reverses a flight that has not landed back to the room', () => {
    const { rerender } = render(<OS />)
    at('/work/resume')
    rerender(<OS />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(nav.push).toHaveBeenCalledWith('/', PUSH_OPTS)
  })
})

describe('small viewports', () => {
  it('stack the apps under the room, with one h1 and no dock', () => {
    vi.stubGlobal('innerWidth', 375)
    vi.stubGlobal('innerHeight', 740)
    render(<OS />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText('University of Southern California')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Say hello.' })).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Apps' })).toBeNull()
  })
})

describe('server-rendered HTML', () => {
  it('puts the name and the Résumé link in the room', () => {
    at('/')
    const html = renderToString(<OS />)
    expect(html).toContain(PROFILE.name)
    expect(html).toContain('href="/work/resume"')
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })

  it('puts the résumé text in /work/resume', () => {
    at('/work/resume')
    const html = renderToString(<OS />)
    expect(html).toContain('University of Southern California')
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })
})
