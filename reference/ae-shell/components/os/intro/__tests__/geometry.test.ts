import { describe, it, expect } from 'vitest'
import {
  LAND, SCENE_ASPECT, SCREEN_L, SCREEN_T, UNLAND, ZOOM_END,
  COMMIT_AT, DOWNWARD_KEYS, arrowFade, camera, clamp01, clip, easeInOut, heroFade,
  hole, isDownwardWheel, nextPhase, progress, scene, shouldCommitCrossing,
  window01, zoom,
} from '../geometry'

const VW = 1512
const VH = 950

describe('progress', () => {
  it('is 0 at the top and 1 after one viewport', () => {
    expect(progress(0, 800)).toBe(0)
    expect(progress(800, 800)).toBe(1)
    expect(progress(400, 800)).toBeCloseTo(0.5)
  })

  it('clamps past both ends', () => {
    expect(progress(-200, 800)).toBe(0)
    expect(progress(5000, 800)).toBe(1)
  })

  // The viewport is 0 on the server and on the first client render, before the
  // resize listener has read it. Dividing by it would give Infinity, and the
  // first painted frame would be a landed page that jumps backwards.
  it('is 0 when the viewport has not been measured yet', () => {
    expect(progress(400, 0)).toBe(0)
  })
})

describe('window01', () => {
  it('normalises into its own window and clamps outside it', () => {
    expect(window01(0.3, 0.3, 0.6)).toBe(0)
    expect(window01(0.45, 0.3, 0.6)).toBeCloseTo(0.5)
    expect(window01(0.6, 0.3, 0.6)).toBe(1)
    expect(window01(0.1, 0.3, 0.6)).toBe(0)
    expect(window01(0.9, 0.3, 0.6)).toBe(1)
  })
})

describe('primitives', () => {
  it('are anchored at both ends', () => {
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(1)).toBe(1)
  })
  it('clamp01 pins outside [0,1]', () => {
    expect(clamp01(-3)).toBe(0)
    expect(clamp01(3)).toBe(1)
    expect(clamp01(0.4)).toBe(0.4)
  })
})

describe('the choreography', () => {
  it('starts on the desk with the hero up', () => {
    expect(zoom(0)).toBe(0)
    expect(heroFade(0)).toBe(1)
    expect(arrowFade(0)).toBe(1)
  })

  it('ends full-bleed with the hero gone', () => {
    expect(zoom(1)).toBe(1)
    expect(heroFade(1)).toBe(0)
    expect(arrowFade(1)).toBe(0)
  })

  // The landing slack. Everything the visitor can see has to be finished by
  // LAND, or somebody who stops scrolling there is stranded mid-transition.
  it('is visually complete by the phase-flip threshold', () => {
    expect(zoom(LAND)).toBe(1)
    expect(heroFade(LAND)).toBe(0)
    expect(ZOOM_END).toBeLessThanOrEqual(LAND)
  })

  it('is monotonic across the whole track', () => {
    for (let i = 0; i < 100; i += 1) {
      const a = i / 100
      const b = (i + 1) / 100
      expect(zoom(b)).toBeGreaterThanOrEqual(zoom(a))
      expect(heroFade(b)).toBeLessThanOrEqual(heroFade(a))
    }
  })
})

describe('the scene', () => {
  it('covers the viewport at rest, like any hero image', () => {
    const s = scene(0, VW, VH)
    expect(s.w).toBeGreaterThanOrEqual(VW)
    expect(s.h).toBeGreaterThanOrEqual(VH)
    expect(s.w / s.h).toBeCloseTo(SCENE_ASPECT, 4) // undistorted where it is seen
    expect(s.x).toBeLessThanOrEqual(0) // centred, so it overhangs equally
    expect(s.x + s.w).toBeGreaterThanOrEqual(VW)
  })

  it('is scaled so its screen is the viewport at z = 1', () => {
    const s = scene(1, VW, VH)
    expect(s.x + SCREEN_L * s.w).toBeCloseTo(0, 6)
    expect(s.y + SCREEN_T * s.h).toBeCloseTo(0, 6)
  })
})

describe('the screen hole', () => {
  it('stands on the desk, clear of the copy, at rest', () => {
    const r = hole(0, VW, VH)
    // The constraint that actually matters, rather than a coordinate that
    // moves every time the picture is redrawn: the machine must not overlap
    // the block of copy. Which axis does the separating depends on where the
    // laptop is drawn — one version cleared it horizontally by sitting right
    // of the text column, this one clears it vertically by sitting low — so
    // the test pins the vertical relationship, which holds either way. An
    // earlier picture had the screen running straight through the buttons.
    expect(r.y).toBeGreaterThan(VH * 0.5)
    // And it is standing on a surface, so its base is on the lower desk.
    expect(r.y + r.h).toBeGreaterThan(VH * 0.6)
    expect(r.y + r.h).toBeLessThan(VH)
  })

  it('is exactly the viewport at z = 1', () => {
    const r = hole(1, VW, VH)
    expect(r.x).toBeCloseTo(0, 6)
    expect(r.y).toBeCloseTo(0, 6)
    expect(r.w).toBeCloseTo(VW, 6)
    expect(r.h).toBeCloseTo(VH, 6)
  })

  // The drawing and the live UI are both derived from this one rect. If it
  // stopped moving monotonically they would visibly disagree mid-scroll.
  it('grows monotonically toward the viewport', () => {
    for (let i = 0; i < 40; i += 1) {
      const a = hole(i / 40, VW, VH)
      const b = hole((i + 1) / 40, VW, VH)
      expect(b.w).toBeGreaterThanOrEqual(a.w)
      expect(b.h).toBeGreaterThanOrEqual(a.h)
    }
  })
})

describe('camera', () => {
  it('fits the desktop inside the drawn screen rather than cropping it', () => {
    for (const z of [0, 0.25, 0.5, 0.75]) {
      const c = camera(z, VW, VH)
      const r = hole(z, VW, VH)
      // Scaled to fit, not to cover. Cover crops, and what it crops is the
      // left of the menu bar and the right-hand column of desktop icons —
      // losing the product's own chrome to tidy up a bezel.
      expect(c.scale).toBeLessThanOrEqual(r.w / VW + 1e-9)
      expect(c.scale).toBeLessThanOrEqual(r.h / VH + 1e-9)
      // And it fills one of the two axes exactly, so it is as large as it can
      // be without spilling — a fit, not an arbitrary shrink.
      const fills = Math.abs(c.scale - r.w / VW) < 1e-9 || Math.abs(c.scale - r.h / VH) < 1e-9
      expect(fills).toBe(true)
    }
  })

  it('leaves the whole desktop visible at every point in the scroll', () => {
    for (let i = 0; i <= 20; i += 1) {
      const z = i / 20
      const c = camera(z, VW, VH)
      const r = hole(z, VW, VH)
      // The desktop's painted size never exceeds the screen it is shown in,
      // which is the whole claim: nothing is cut off on any edge.
      expect(VW * c.scale).toBeLessThanOrEqual(r.w + 1e-6)
      expect(VH * c.scale).toBeLessThanOrEqual(r.h + 1e-6)
    }
  })

  // The assertion the whole phase design exists to protect: the landed page is
  // unscaled and unmoved, so every getBoundingClientRect() in the OS is true.
  it('is identity at z = 1', () => {
    const c = camera(1, VW, VH)
    expect(c.scale).toBeCloseTo(1, 9)
    expect(c.x).toBeCloseTo(0, 9)
    expect(c.y).toBeCloseTo(0, 9)
  })
})

describe('clip', () => {
  it('cuts the desktop down to the hole at rest', () => {
    const c = clip(0, VW, VH)
    expect(c.top).toBeGreaterThan(0)
    expect(c.right).toBeGreaterThan(0)
    expect(c.bottom).toBeGreaterThan(0)
    expect(c.left).toBeGreaterThan(0)
  })

  it('is no clip at all at z = 1', () => {
    const c = clip(1, VW, VH)
    expect(c.top).toBeCloseTo(0, 9)
    expect(c.right).toBeCloseTo(0, 9)
    expect(c.bottom).toBeCloseTo(0, 9)
    expect(c.left).toBeCloseTo(0, 9)
  })
})

describe('nextPhase', () => {
  it('is always live outside the desktop mode', () => {
    expect(nextPhase('intro', 0, false)).toBe('live')
    expect(nextPhase('live', 0, false)).toBe('live')
  })

  it('lands at or above LAND and returns at or below UNLAND', () => {
    expect(nextPhase('intro', LAND, true)).toBe('live')
    expect(nextPhase('intro', 1, true)).toBe('live')
    expect(nextPhase('live', UNLAND, true)).toBe('intro')
    expect(nextPhase('live', 0, true)).toBe('intro')
  })

  // Hysteresis. Without it a scroll that jitters across a single threshold
  // mounts and unmounts the login window and fourteen windows repeatedly.
  it('holds its current value inside the band', () => {
    const mid = (LAND + UNLAND) / 2
    expect(nextPhase('intro', mid, true)).toBe('intro')
    expect(nextPhase('live', mid, true)).toBe('live')
  })
})

describe('entering the machine', () => {
  it('takes one small notch, however few pixels it moved', () => {
    // The bug this replaced: committing on distance meant somebody scrolling
    // the way most people scroll — small repeated nudges — needed two or three
    // notches, because each moved the page only a handful of pixels. A wheel
    // event is a decision on its own, whatever distance it produced.
    expect(isDownwardWheel(4)).toBe(true)
    expect(isDownwardWheel(9)).toBe(true)
    expect(isDownwardWheel(120)).toBe(true)
  })

  it('ignores the noise a resting hand makes, and anything upward', () => {
    expect(isDownwardWheel(0)).toBe(false)
    expect(isDownwardWheel(1)).toBe(false)
    expect(isDownwardWheel(-40)).toBe(false)
  })

  it('treats the keyboard as just as deliberate as the wheel', () => {
    // Otherwise the keyboard route is the slow one, and the only visitors on
    // it are the ones who cannot use the fast one.
    for (const key of ['ArrowDown', 'PageDown', 'End', ' ']) {
      expect(DOWNWARD_KEYS.has(key)).toBe(true)
    }
    for (const key of ['ArrowUp', 'PageUp', 'Home', 'a']) {
      expect(DOWNWARD_KEYS.has(key)).toBe(false)
    }
  })
})

describe('the distance backstop', () => {
  // Not the mechanism — a fallback for input that announces itself no other
  // way, like a scrollbar drag.
  it('fires once the page has moved far enough on its own', () => {
    expect(shouldCommitCrossing(VH * COMMIT_AT, VH)).toBe(true)
    expect(shouldCommitCrossing(VH * 0.5, VH)).toBe(true)
  })

  it('leaves a nudge below the threshold alone', () => {
    expect(shouldCommitCrossing(0, VH)).toBe(false)
    expect(shouldCommitCrossing(VH * (COMMIT_AT / 2), VH)).toBe(false)
  })

  it('does not fire once the landing is reached', () => {
    expect(shouldCommitCrossing(VH, VH)).toBe(false)
    expect(shouldCommitCrossing(VH * 2, VH)).toBe(false)
  })

  it('is inert before the viewport has been measured', () => {
    expect(shouldCommitCrossing(500, 0)).toBe(false)
  })
})
