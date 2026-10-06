import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { Dock } from '../Dock'
import { OSMenuBar } from '../OSMenuBar'
import { Spotlight } from '../Spotlight'
import { APPS } from '../registry'

describe('OSMenuBar', () => {
  it('names the frontmost app and links home and to every app', () => {
    render(<OSMenuBar appName="Résumé" apps={APPS} />)
    expect(screen.getByText('Résumé', { selector: 'b' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to the room' }).getAttribute('href')).toBe('/')
    const menu = screen.getByRole('navigation', { name: 'Menu' })
    expect(within(menu).getByRole('link', { name: 'Contact' }).getAttribute('href')).toBe('/work/contact')
  })
})

describe('Dock', () => {
  it('selects a tile by index and marks the open app', () => {
    const onSelect = vi.fn()
    render(<Dock apps={APPS} active={0} onSelect={onSelect} registerTile={() => {}} />)
    const dock = screen.getByRole('navigation', { name: 'Apps' })
    fireEvent.click(within(dock).getByRole('button', { name: 'Contact' }))
    expect(onSelect).toHaveBeenCalledWith(1)
    expect(within(dock).getByRole('button', { name: 'Résumé' }).getAttribute('aria-current')).toBe('true')
  })
})

describe('Spotlight', () => {
  it('renders nothing while closed', () => {
    render(<Spotlight open={false} onClose={() => {}} onGoTo={() => {}} apps={APPS} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('filters by name and opens the chosen app on Enter', () => {
    const onClose = vi.fn()
    const onGoTo = vi.fn()
    render(<Spotlight open onClose={onClose} onGoTo={onGoTo} apps={APPS} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'con' } })
    expect(screen.queryByRole('button', { name: /Résumé/ })).toBeNull()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onClose).toHaveBeenCalled()
    expect(onGoTo).toHaveBeenCalledWith('contact')
  })

  it('matches without accents', () => {
    render(<Spotlight open onClose={() => {}} onGoTo={() => {}} apps={APPS} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'resume' } })
    expect(screen.getByRole('button', { name: /Résumé/ })).toBeTruthy()
  })

  it('closes on Escape and marks the key handled', () => {
    const onClose = vi.fn()
    render(<Spotlight open onClose={onClose} onGoTo={() => {}} apps={APPS} />)
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    screen.getByRole('textbox').dispatchEvent(event)
    expect(onClose).toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })
})
