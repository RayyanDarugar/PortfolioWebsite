import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { Laptop } from '../Laptop'
import type { Intro } from '../useIntro'

/**
 * A stub is enough. None of these values are read for their motion here — they
 * are handed straight to style props that jsdom never animates — and the thing
 * under test is *when the effect fires*, not what it renders.
 */
const stubIntro = {
  resting: true,
  scene: 'none',
  clip: 'none',
  camera: 'none',
  pixelScreen: 'none',
  pixelOpacity: 1,
  sceneBox: { width: 100, height: 100 },
} as unknown as Intro

describe('the ambient clip', () => {
  let play: ReturnType<typeof vi.fn>
  let pause: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // jsdom implements no media playback at all, so the methods have to be
    // stubbed before they can be observed.
    play = vi.fn(() => Promise.resolve())
    pause = vi.fn()
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause)
  })

  afterEach(() => { vi.restoreAllMocks() })

  /**
   * The regression this exists for.
   *
   * `phase` starts `live` on the server and on the first client render — that
   * is the hydration contract — and `Laptop` renders no video at all in that
   * branch. So the element does not exist when the effect first runs. It
   * appears on the *second* render, once a layout effect has resolved the
   * phase, and an effect keyed only on `resting` does not re-run for that:
   * `resting` was true the whole time.
   *
   * The symptom was that the room sat frozen until you scrolled down and back
   * up, because that was the first thing that actually changed `resting` and
   * so the first thing that ran the effect while the element existed.
   */
  it('starts playing when the video appears, not only when resting changes', () => {
    const { rerender } = render(
      <Laptop intro={stubIntro} inert={false} live><div /></Laptop>,
    )
    expect(play).not.toHaveBeenCalled() // no element yet, nothing to play

    rerender(<Laptop intro={stubIntro} inert={false} live={false}><div /></Laptop>)
    expect(play).toHaveBeenCalled()
  })

  it('pauses once the camera starts moving, and resumes at rest', () => {
    const moving = { ...stubIntro, resting: false } as unknown as Intro
    const { rerender } = render(
      <Laptop intro={moving} inert={false} live={false}><div /></Laptop>,
    )
    expect(pause).toHaveBeenCalled()
    expect(play).not.toHaveBeenCalled()

    rerender(<Laptop intro={stubIntro} inert={false} live={false}><div /></Laptop>)
    expect(play).toHaveBeenCalled()
  })
})
