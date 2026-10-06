import { describe, it, expect } from 'vitest'
import { SCENE_ASPECT, SCENE_PX_H, SCENE_PX_W } from '@/components/os/intro/geometry'
import { HOTBAR_BAND, OVERSCAN, panFor, panRange, restCss, roomRect, toArt } from '../layout'

describe('roomRect', () => {
  it('is 110.9% of the viewport wide, centred, above the hotbar band', () => {
    const r = roomRect(1440, 900)
    expect(r.w).toBeCloseTo(1440 * OVERSCAN, 6)
    expect(r.w / r.h).toBeCloseTo(SCENE_ASPECT, 6)
    expect(r.x).toBeCloseTo((1440 - r.w) / 2, 6)
    expect(r.y).toBeGreaterThanOrEqual(0)
    expect(r.y + r.h).toBeLessThanOrEqual(900 - HOTBAR_BAND + 1e-6)
  })

  it('is limited by height on short viewports, and then centred', () => {
    const r = roomRect(1440, 700)
    expect(r.h).toBeCloseTo(700 - HOTBAR_BAND, 6)
    expect(r.w / r.h).toBeCloseTo(SCENE_ASPECT, 6)
    expect(r.x).toBeCloseTo((1440 - r.w) / 2, 6)
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

  it('does not pan a room narrower than the viewport', () => {
    const narrow = roomRect(1440, 600)
    expect(panRange(narrow, 1440)).toBe(0)
    expect(panFor(0, 1440, narrow)).toBe(0)
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
  it('states the same rule in CSS, from the same constants', () => {
    const css = restCss()
    expect(css.height).toContain('110.90vw')
    expect(css.height).toContain(`${HOTBAR_BAND}px`)
    expect(css.width).toContain(String(SCENE_ASPECT))
  })
})
