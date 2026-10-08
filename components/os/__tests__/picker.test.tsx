import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { Picker } from '../picker/Picker'
import { APPS } from '../registry'

describe('Picker', () => {
  it('shows every app as a tile that says what it is', () => {
    render(<Picker apps={APPS} headlines={[]} onOpen={() => {}} />)
    const home = screen.getByRole('region', { name: 'Mission Control' })
    for (const app of APPS) {
      const tile = within(home).getByRole('button', { name: new RegExp(`^${app.name}`) })
      expect(tile.textContent).toContain(app.blurb)
    }
  })

  it('opens the app a tile names', () => {
    const onOpen = vi.fn()
    render(<Picker apps={APPS} headlines={[]} onOpen={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: /^Agent Dynamo/ }))
    expect(onOpen).toHaveBeenCalledWith('dynamo')
  })

  it('a tile with no preview shows its glyph, not a broken image', () => {
    const { container } = render(<Picker apps={APPS.filter((a) => a.id === 'digest')} headlines={[]} onOpen={() => {}} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('lists headline numbers that open their app, and hides the strip with none', () => {
    const onOpen = vi.fn()
    const { rerender } = render(<Picker apps={APPS} headlines={[{ value: '~20,000', label: 'TikTok views in a week', app: 'tiktok' }]} onOpen={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: /~20,000 TikTok views/ }))
    expect(onOpen).toHaveBeenCalledWith('tiktok')
    rerender(<Picker apps={APPS} headlines={[]} onOpen={onOpen} />)
    expect(screen.queryByRole('list', { name: 'Highlights' })).toBeNull()
  })
})
