import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { OSWindow } from '../OSWindow'

describe('OSWindow', () => {
  it('has no close button unless it can be closed', () => {
    render(<OSWindow title="Résumé"><p>body</p></OSWindow>)
    expect(screen.getByText('Résumé')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Close window' })).toBeNull()
  })

  it('makes the red light a real close button', () => {
    const onClose = vi.fn()
    render(<OSWindow title="Résumé" onClose={onClose}><p>body</p></OSWindow>)
    fireEvent.click(screen.getByRole('button', { name: 'Close window' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
