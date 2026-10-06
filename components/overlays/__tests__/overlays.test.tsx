import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'

const nav = vi.hoisted(() => {
  const push = vi.fn()
  const replace = vi.fn()
  return { push, replace, router: { push, replace, back: () => {}, prefetch: () => {} } }
})
vi.mock('next/navigation', () => ({ useRouter: () => nav.router, usePathname: () => '/cards/x' }))

import { GameCard, type CardView } from '../GameCard'
import { Overlay } from '../Overlay'

const card: CardView = {
  id: 'school-hkust', tag: 'SCHOOL · HKUST · 2025', title: 'HKUST', photo: '/room/sprites/flags.png',
  stat: 'GPA 3.96', body: ['The second stop.', 'Hong Kong.'],
}

beforeEach(() => { nav.push.mockClear(); nav.replace.mockClear() })

describe('Overlay', () => {
  it('closes to the room on Esc and on a click outside', () => {
    render(<Overlay label="HKUST"><button type="button">inside</button></Overlay>)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(nav.push).toHaveBeenLastCalledWith('/', { scroll: false })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(nav.push).toHaveBeenCalledTimes(2)
  })

  it('takes focus and names itself', () => {
    render(<Overlay label="HKUST"><p>card</p></Overlay>)
    const dialog = screen.getByRole('dialog', { name: 'HKUST' })
    expect(document.activeElement).toBe(dialog)
  })
})

describe('GameCard', () => {
  it('shows the title, tag, story and stat', () => {
    render(<GameCard card={card} prev={null} next={null} />)
    expect(screen.getByRole('heading', { level: 2, name: 'HKUST' })).toBeTruthy()
    for (const text of [card.tag, ...card.body, card.stat!]) expect(screen.getByText(text)).toBeTruthy()
  })

  it('shows only the neighbours that exist', () => {
    const { rerender } = render(<GameCard card={card} prev={null} next="school-bocconi" />)
    expect(screen.queryByRole('link', { name: /Previous/ })).toBeNull()
    expect(screen.getByRole('link', { name: /Next/ }).getAttribute('href')).toBe('/cards/school-bocconi')
    rerender(<GameCard card={card} prev="school-usc" next={null} />)
    expect(screen.getByRole('link', { name: /Previous/ }).getAttribute('href')).toBe('/cards/school-usc')
    expect(screen.queryByRole('link', { name: /Next/ })).toBeNull()
  })

  it('steps through the set with the arrow keys, and not past the end', () => {
    render(<GameCard card={card} prev="school-usc" next={null} />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(nav.replace).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(nav.replace).toHaveBeenCalledWith('/cards/school-usc', { scroll: false })
  })

  it('is in the server HTML', () => {
    const html = renderToString(<GameCard card={card} prev={null} next={null} />)
    expect(html).toContain('The second stop.')
  })
})
