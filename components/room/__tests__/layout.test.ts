import { describe, it, expect } from 'vitest'
import { SCENE_ASPECT, SCENE_PX_H, SCENE_PX_W } from '@/components/os/intro/geometry'
import { panFor, panRange, restCss, roomRect, toArt } from '../layout'

describe('roomRect', () => {
  // The room covers the whole screen, like a game; the hotbar floats over it.
  it('fills the height of a typical screen and overhangs both sides', () => {
    const r = roomRect(1440, 900)
    expect(r.h).toBeCloseTo(900, 6)
    expect(r.y).toBeCloseTo(0, 6)
    expect(r.w / r.h).toBeCloseTo(SCENE_ASPECT, 6)
    expect(r.x).toBeCloseTo((1440 - r.w) / 2, 6)
    expect(r.w).toBeGreaterThan(1440)
  })

  it('fills the width of a very wide screen, cropping top and bottom evenly', () => {
    const r = roomRect(2560, 1000)
    expect(r.w).toBeCloseTo(2560, 6)
    expect(r.h).toBeGreaterThanOrEqual(1000)
    expect(r.y).toBeCloseTo((1000 - r.h) / 2, 6)
  })

  it('never leaves a band on any side', () => {
    for (const [vw, vh] of [[1000, 680], [1200, 886], [1440, 900], [1920, 1080], [2560, 1080], [3440, 1440]]) {
      const r = roomRect(vw, vh)
      expect(r.x).toBeLessThanOrEqual(1e-6)
      expect(r.y).toBeLessThanOrEqual(1e-6)
      expect(r.x + r.w).toBeGreaterThanOrEqual(vw - 1e-6)
      expect(r.y + r.h).toBeGreaterThanOrEqual(vh - 1e-6)
    }
  })
})

describe('panFor', () => {
  const vw = 1440
  const rest = roomRect(vw, 900)

  it('rests at the centre and reaches each edge at each side', () => {
    expect(panFor(vw / 2, vw, rest)).toBeCloseTo(0, 6)
    expect(rest.x + panFor(0, vw, rest)).toBeCloseTo(0, 6) // left edge at the viewport's left
    expect(rest.x + rest.w + panFor(vw, vw, rest)).toBeCloseTo(vw, 6) // right edge at its right
  })

  it('never shows past either edge', () => {
    for (const x of [-500, -1, 0, 300, 720, 1439, 1440, 5000]) {
      const left = rest.x + panFor(x, vw, rest)
      expect(left).toBeLessThanOrEqual(1e-6)
      expect(left + rest.w).toBeGreaterThanOrEqual(vw - 1e-6)
    }
  })

  it('does not pan a room exactly as wide as the viewport', () => {
    const wide = roomRect(2560, 1000)
    expect(panRange(wide, 2560)).toBe(0)
    expect(panFor(0, 2560, wide)).toBe(0)
  })
})

describe('toArt', () => {
  const box = { left: -80, top: 50, width: 1600, height: 1600 / SCENE_ASPECT }

  it('maps the box onto the art, corner to corner', () => {
    expect(toArt(-80, 50, box)).toEqual({ u: 0, v: 0 })
    const mid = toArt(-80 + 800, 50 + box.height / 2, box)!
    expect(mid.u).toBeCloseTo(SCENE_PX_W / 2, 6)
    expect(mid.v).toBeCloseTo(SCENE_PX_H / 2, 6)
  })

  it('is null outside the room', () => {
    expect(toArt(-81, 60, box)).toBeNull()
    expect(toArt(100, 49, box)).toBeNull()
    expect(toArt(100, 50 + box.height + 1, box)).toBeNull()
  })
})

describe('restCss', () => {
  it('states the same cover rule in CSS', () => {
    const css = restCss()
    expect(css.width).toContain('100vw')
    expect(css.width).toContain(`100vh * ${SCENE_ASPECT}`)
    expect(css.height).toContain(`/ ${SCENE_ASPECT}`)
  })
})
