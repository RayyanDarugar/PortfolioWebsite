import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { PROFILE } from '@/content/profile'
import { HOTBAR } from '@/content/room'
import { consumeOpenedInApp } from '@/components/overlays/history'

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
  it('introduces him on the whiteboard and puts the Résumé one click away', () => {
    render(<OS />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(PROFILE.name)
    expect(screen.getByRole('link', { name: 'Résumé' }).getAttribute('href')).toBe('/work/resume')
  })

  it('opens the laptop from the laptop', () => {
    render(<OS />)
    fireEvent.click(screen.getByRole('button', { name: /^Laptop:/ }))
    expect(nav.push).toHaveBeenCalledWith('/work', PUSH_OPTS)
  })

  it('opens a game card from an object, marked as opened in the site', () => {
    consumeOpenedInApp()
    render(<OS />)
    fireEvent.click(screen.getByRole('button', { name: 'Photo: My dog' }))
    expect(nav.push).toHaveBeenCalledWith('/cards/dog', PUSH_OPTS)
    expect(consumeOpenedInApp()).toBe(true)
  })

  it('has hotbar slots that act exactly like their objects', () => {
    render(<OS />)
    fireEvent.click(screen.getByRole('button', { name: '1: Work' }))
    expect(nav.push).toHaveBeenLastCalledWith('/work', PUSH_OPTS)
    fireEvent.click(screen.getByRole('button', { name: '7: Schools' }))
    expect(nav.push).toHaveBeenLastCalledWith('/cards/school-usc', PUSH_OPTS)
  })

  it('lights the objects a hotbar slot names', () => {
    const { container } = render(<OS />)
    fireEvent.mouseEnter(screen.getByRole('button', { name: '9: Photos' }))
    const lit = [...container.querySelectorAll('img[data-lit="true"]')].map((i) => i.getAttribute('data-sprite'))
    expect(lit.sort()).toEqual(['photo-beach', 'photo-dog'])
  })

  it('number keys pick hotbar slots', () => {
    render(<OS />)
    fireEvent.keyDown(window, { key: '2' })
    expect(nav.push).toHaveBeenCalledWith('/cards/journal', PUSH_OPTS)
    expect(HOTBAR[1].objects).toEqual(['journal'])
  })

  it('number keys with a modifier are left to the browser', () => {
    render(<OS />)
    fireEvent.keyDown(window, { key: '1', metaKey: true })
    fireEvent.keyDown(window, { key: '1', ctrlKey: true })
    fireEvent.keyDown(window, { key: '1', altKey: true })
    expect(nav.push).not.toHaveBeenCalled()
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

  it('never hides the focused Résumé link from assistive tech', () => {
    const { rerender } = render(<OS />)
    screen.getByRole('link', { name: 'Résumé' }).focus()
    at('/work/resume')
    rerender(<OS />)
    expect(document.activeElement?.closest('[aria-hidden="true"]')).toBeNull()
  })

  it('falls back to the room on an unknown path', () => {
    at('/work/nope')
    render(<OS />)
    expect(screen.getByRole('button', { name: /^Laptop:/ })).toBeTruthy()
  })

  // Leaving the laptop flies the camera out for about a second; a scroll during
  // that flight must not throw it straight back in.
  it('ignores the wheel while the camera is still flying out', () => {
    at('/work')
    const { rerender } = render(<OS />)
    at('/')
    rerender(<OS />)
    fireEvent.wheel(window, { deltaY: 40 })
    expect(nav.push).not.toHaveBeenCalled()
  })

  it('hotbar keys do nothing on the desktop', () => {
    at('/work')
    render(<OS />)
    fireEvent.keyDown(window, { key: '2' })
    expect(nav.push).not.toHaveBeenCalled()
  })
})

describe('a card over the room', () => {
  it('keeps the room still: no wheel, no hotbar keys, no object input', () => {
    at('/cards/dog')
    const { container } = render(<OS />)
    fireEvent.wheel(window, { deltaY: 40 })
    fireEvent.keyDown(window, { key: '1' })
    expect(nav.push).not.toHaveBeenCalled()
    expect(container.querySelector('[data-room-object="laptop"]')?.closest('[inert]')).not.toBeNull()
  })

  it('returns focus to the object that opened it', () => {
    const { rerender } = render(<OS />)
    const dog = screen.getByRole('button', { name: 'Photo: My dog' })
    dog.focus()
    fireEvent.click(dog)
    at('/cards/dog')
    rerender(<OS />)
    dog.blur() // the card took focus
    expect(document.activeElement).not.toBe(dog)
    at('/')
    rerender(<OS />)
    expect(document.activeElement).toBe(dog)
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
