import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Laptop } from '../Laptop'
import type { Zoom } from '../useZoom'

/** Plain strings stand in for motion values: jsdom never animates them, and
 *  what is under test is which branch renders and when the video plays. */
const stub = {
  phase: 'room',
  resting: true,
  measured: true,
  hit: null,
  scene: 'none',
  clip: 'none',
  camera: 'none',
  pixelScreen: 'none',
  pixelOpacity: 1,
  roomUi: 1,
  sceneBox: { width: 100, height: 100 },
} as unknown as Zoom

describe('Laptop', () => {
  let play: ReturnType<typeof vi.fn>
  let pause: ReturnType<typeof vi.fn>

  beforeEach(() => {
    play = vi.fn(() => Promise.resolve())
    pause = vi.fn()
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause)
  })

  afterEach(() => { vi.restoreAllMocks() })

  it('renders the desktop untransformed once landed', () => {
    const { container } = render(<Laptop zoom={stub} inert={false} live><p>desk</p></Laptop>)
    expect(screen.getByText('desk')).toBeTruthy()
    expect(container.querySelector('video')).toBeNull()
  })

  it('before measuring, shows the room as a cover image and hides the desktop', () => {
    const unmeasured = { ...stub, measured: false } as Zoom
    const { container } = render(<Laptop zoom={unmeasured} inert live={false}><p>desk</p></Laptop>)
    expect(container.querySelector('video')).toBeNull()
    expect(screen.getByText('desk').closest('.invisible')).not.toBeNull()
  })

  // Regression from the AE shell: the video element only exists in the room
  // branch, so the play effect has to re-run when that branch appears.
  it('starts playing when the video appears, not only when resting changes', () => {
    const { rerender } = render(<Laptop zoom={stub} inert={false} live><div /></Laptop>)
    expect(play).not.toHaveBeenCalled()
    rerender(<Laptop zoom={stub} inert={false} live={false}><div /></Laptop>)
    expect(play).toHaveBeenCalled()
  })

  // Older browsers (and jsdom) return nothing from play() instead of a promise.
  it('survives a play() that returns no promise', () => {
    play.mockImplementation(() => undefined)
    expect(() => render(<Laptop zoom={stub} inert live={false}><div /></Laptop>)).not.toThrow()
    expect(play).toHaveBeenCalled()
  })

  it('pauses once the camera starts moving, and resumes at rest', () => {
    const moving = { ...stub, resting: false } as Zoom
    const { rerender } = render(<Laptop zoom={moving} inert live={false}><div /></Laptop>)
    expect(pause).toHaveBeenCalled()
    expect(play).not.toHaveBeenCalled()
    rerender(<Laptop zoom={stub} inert live={false}><div /></Laptop>)
    expect(play).toHaveBeenCalled()
  })
})
