import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { RECORDS } from '@/content/records'
import { NowPlayingProvider } from '../NowPlaying'
import { RecordCrate } from '../RecordCrate'

afterEach(() => vi.restoreAllMocks())

describe('RecordCrate', () => {
  it('fans out every record as a sleeve', () => {
    render(<NowPlayingProvider><RecordCrate records={RECORDS} /></NowPlayingProvider>)
    for (const r of RECORDS) expect(screen.getByRole('button', { name: `${r.song}, ${r.artist}` })).toBeTruthy()
  })

  it('puts a picked record on the platter and plays it', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    render(<NowPlayingProvider><RecordCrate records={RECORDS} /></NowPlayingProvider>)
    const sleeve = screen.getByRole('button', { name: `${RECORDS[2].song}, ${RECORDS[2].artist}` })
    await act(async () => { fireEvent.click(sleeve) })
    expect(play).toHaveBeenCalled()
    expect(sleeve.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByTestId('platter').textContent).toContain(RECORDS[2].song)
  })

  it('lists every song in the server HTML', () => {
    const html = renderToString(<NowPlayingProvider><RecordCrate records={RECORDS} /></NowPlayingProvider>)
    for (const r of RECORDS) expect(html).toContain(r.artist)
  })
})

// The chip sits under the overlay's backdrop, so inside the record player the
// platter is the only place to pause; a click on the chip closed the overlay.
describe('the platter', () => {
  it('pauses and resumes the record on it', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const { container } = render(<NowPlayingProvider><RecordCrate records={RECORDS} /></NowPlayingProvider>)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: `${RECORDS[0].song}, ${RECORDS[0].artist}` })) })
    act(() => { container.querySelector('audio')!.dispatchEvent(new Event('play')) })
    fireEvent.click(within(screen.getByTestId('platter')).getByRole('button', { name: 'Pause' }))
    expect(pause).toHaveBeenCalled()
  })
})

