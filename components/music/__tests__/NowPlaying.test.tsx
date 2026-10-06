import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { RECORDS } from '@/content/records'
import { NowPlayingProvider, useNowPlaying } from '../NowPlaying'

function Picker() {
  const { play } = useNowPlaying()
  return (
    <>
      <button type="button" onClick={() => play(RECORDS[0])}>first</button>
      <button type="button" onClick={() => play(RECORDS[1])}>second</button>
    </>
  )
}

let play: ReturnType<typeof vi.fn>
let pause: ReturnType<typeof vi.fn>
beforeEach(() => {
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause)
})
afterEach(() => vi.restoreAllMocks())

describe('NowPlaying', () => {
  it('shows nothing until something plays', () => {
    render(<NowPlayingProvider><Picker /></NowPlayingProvider>)
    expect(screen.queryByRole('region', { name: 'Now playing' })).toBeNull()
  })

  it('plays on click and shows the chip with attribution', async () => {
    const { container } = render(<NowPlayingProvider><Picker /></NowPlayingProvider>)
    await act(async () => { fireEvent.click(screen.getByText('first')) })
    expect(play).toHaveBeenCalled()
    expect(container.querySelector('audio')?.getAttribute('src')).toBe(RECORDS[0].previewUrl)
    const chip = screen.getByRole('region', { name: 'Now playing' })
    expect(chip.textContent).toContain(RECORDS[0].song)
    expect(screen.getByRole('link', { name: /Apple Music/ }).getAttribute('href')).toBe(RECORDS[0].appleMusicUrl)
  })

  it('switches tracks when another record is picked', async () => {
    const { container } = render(<NowPlayingProvider><Picker /></NowPlayingProvider>)
    await act(async () => { fireEvent.click(screen.getByText('first')) })
    await act(async () => { fireEvent.click(screen.getByText('second')) })
    expect(container.querySelector('audio')?.getAttribute('src')).toBe(RECORDS[1].previewUrl)
    expect(screen.getByRole('region', { name: 'Now playing' }).textContent).toContain(RECORDS[1].song)
  })

  it('pauses and stops from the chip', async () => {
    render(<NowPlayingProvider><Picker /></NowPlayingProvider>)
    await act(async () => { fireEvent.click(screen.getByText('first')) })
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(pause).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(screen.queryByRole('region', { name: 'Now playing' })).toBeNull()
  })
})
