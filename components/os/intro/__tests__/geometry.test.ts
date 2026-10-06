import { describe, it, expect } from 'vitest'
import {
  SCENE_ASPECT, SCREEN_L, SCREEN_T, camera, clip, hole, isDownwardWheel, isUpwardWheel,
  pixelFade, roomUiFade, scene, window01,
} from '../geometry'

const VW = 1512
const VH = 950

describe('window01', () => {
  it('normalises into its own window and clamps outside it', () => {
    expect(window01(0.5, 0, 1)).toBe(0.5)
    expect(window01(0.25, 0.5, 1)).toBe(0)
    expect(window01(2, 0.5, 1)).toBe(1)
  })
})

describe('the scene', () => {
  it('covers the viewport at rest, like any hero image', () => {
    const s = scene(0, VW, VH)
    expect(s.w).toBeGreaterThanOrEqual(VW)
    expect(s.h).toBeGreaterThanOrEqual(VH)
    expect(s.w / s.h).toBeCloseTo(SCENE_ASPECT, 4)
    expect(s.x).toBeLessThanOrEqual(0)
    expect(s.x + s.w).toBeGreaterThanOrEqual(VW)
  })

  it('is scaled so its screen is the viewport at z = 1', () => {
    const s = scene(1, VW, VH)
    expect(s.x + SCREEN_L * s.w).toBeCloseTo(0, 6)
    expect(s.y + SCREEN_T * s.h).toBeCloseTo(0, 6)
  })
})

describe('the screen hole', () => {
  // Low enough to stay clear of the name card in the top corner, and fully in frame.
  it('sits on the desk, below the top of the room, at rest', () => {
    const r = hole(0, VW, VH)
    expect(r.y).toBeGreaterThan(VH * 0.4)
    expect(r.y + r.h).toBeLessThan(VH)
  })

  it('is exactly the viewport at z = 1', () => {
    const r = hole(1, VW, VH)
    expect(r.x).toBeCloseTo(0, 6)
    expect(r.y).toBeCloseTo(0, 6)
    expect(r.w).toBeCloseTo(VW, 6)
    expect(r.h).toBeCloseTo(VH, 6)
  })

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
  it('fits the desktop inside the drawn screen at every point', () => {
    for (let i = 0; i <= 20; i += 1) {
      const z = i / 20
      const c = camera(z, VW, VH)
      const r = hole(z, VW, VH)
      expect(VW * c.scale).toBeLessThanOrEqual(r.w + 1e-6)
      expect(VH * c.scale).toBeLessThanOrEqual(r.h + 1e-6)
    }
  })

  // The landed desktop is unscaled and unmoved, so every getBoundingClientRect()
  // in it (the dock tiles, the window launch origins) is true.
  it('is identity at z = 1', () => {
    const c = camera(1, VW, VH)
    expect(c.scale).toBeCloseTo(1, 9)
    expect(c.x).toBeCloseTo(0, 9)
    expect(c.y).toBeCloseTo(0, 9)
  })
})

describe('clip', () => {
  it('cuts the desktop down to the hole at rest and is no clip at z = 1', () => {
    const rest = clip(0, VW, VH)
    expect(Math.min(rest.top, rest.right, rest.bottom, rest.left)).toBeGreaterThan(0)
    const landed = clip(1, VW, VH)
    expect(landed.top).toBeCloseTo(0, 9)
    expect(landed.right).toBeCloseTo(0, 9)
    expect(landed.bottom).toBeCloseTo(0, 9)
    expect(landed.left).toBeCloseTo(0, 9)
  })
})

describe('fades', () => {
  it('shows the drawn screen at rest and hands over well before landing', () => {
    expect(pixelFade(0)).toBe(1)
    expect(pixelFade(0.6)).toBe(0)
  })

  it('takes the room copy away early in the flight', () => {
    expect(roomUiFade(0)).toBe(1)
    expect(roomUiFade(0.3)).toBe(0)
  })
})

describe('isDownwardWheel', () => {
  it('takes one notch, and ignores a resting hand and upward scrolls', () => {
    expect(isDownwardWheel(4)).toBe(true)
    expect(isDownwardWheel(1)).toBe(false)
    expect(isDownwardWheel(-40)).toBe(false)
  })

  it('reads upward scrolls the same way', () => {
    expect(isUpwardWheel(-4)).toBe(true)
    expect(isUpwardWheel(-1)).toBe(false)
    expect(isUpwardWheel(40)).toBe(false)
  })
})
