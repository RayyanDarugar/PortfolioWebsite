import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { HOTBAR } from '@/content/room'
import { Hotbar } from '../Hotbar'
import { RoomBar } from '../RoomBar'

describe('Hotbar', () => {
  it('shows the nine slots in order, labelled', () => {
    render(<Hotbar onHighlight={() => {}} onActivate={() => {}} />)
    const names = within(screen.getByRole('navigation', { name: 'Hotbar' }))
      .getAllByRole('button').map((b) => b.getAttribute('aria-label'))
    expect(names).toEqual(HOTBAR.map((s) => `${s.slot}: ${s.label}`))
  })

  it('lights its objects on hover and focus, and lets go after', () => {
    const onHighlight = vi.fn()
    render(<Hotbar onHighlight={onHighlight} onActivate={() => {}} />)
    const photos = screen.getByRole('button', { name: '9: Photos' })
    fireEvent.mouseEnter(photos)
    expect(onHighlight).toHaveBeenLastCalledWith(['photo-dog', 'photo-beach'])
    fireEvent.mouseLeave(photos)
    expect(onHighlight).toHaveBeenLastCalledWith(null)
    fireEvent.focus(photos)
    expect(onHighlight).toHaveBeenLastCalledWith(['photo-dog', 'photo-beach'])
  })

  it('opens its slot on click', () => {
    const onActivate = vi.fn()
    render(<Hotbar onHighlight={() => {}} onActivate={onActivate} />)
    fireEvent.click(screen.getByRole('button', { name: '1: Work' }))
    expect(onActivate).toHaveBeenCalledWith(HOTBAR[0])
  })
})

describe('RoomBar', () => {
  it('links the résumé', () => {
    render(<RoomBar />)
    expect(screen.getByRole('link', { name: 'Résumé' }).getAttribute('href')).toBe('/work/resume')
  })
})
