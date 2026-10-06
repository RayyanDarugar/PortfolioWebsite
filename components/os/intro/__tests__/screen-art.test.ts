import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import path from 'node:path'
import { SCENE_PX_H, SCENE_PX_W, SCREEN_B, SCREEN_L, SCREEN_R, SCREEN_T } from '../geometry'
import { SCENE_SRC } from '../Laptop'

/**
 * The zoom pastes the live desktop into the laptop's drawn screen using
 * SCREEN_L/T/R/B. If the room art changes and these are not re-measured, the
 * desktop lands on the wall. This reads the actual file and checks that the
 * rectangle is the black screen, edge to edge.
 */
describe('the laptop screen in the room art', () => {
  it('is where geometry.ts says it is', async () => {
    const file = path.join(process.cwd(), 'public', SCENE_SRC)
    const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    expect([info.width, info.height]).toEqual([SCENE_PX_W, SCENE_PX_H])

    const x0 = Math.round(SCREEN_L * info.width), x1 = Math.round(SCREEN_R * info.width) - 1
    const y0 = Math.round(SCREEN_T * info.height), y1 = Math.round(SCREEN_B * info.height) - 1
    const dark = (x: number, y: number) => {
      const i = (y * info.width + x) * 3
      return data[i] < 30 && data[i + 1] < 30 && data[i + 2] < 30
    }
    let inside = 0, total = 0
    for (let y = y0; y <= y1; y += 3) for (let x = x0; x <= x1; x += 3) { total++; if (dark(x, y)) inside++ }
    expect(inside / total).toBeGreaterThan(0.98)
    // And it is the whole screen: just outside each edge is bezel, not screen.
    const mid = { x: (x0 + x1) >> 1, y: (y0 + y1) >> 1 }
    expect(dark(x0 - 4, mid.y)).toBe(false)
    expect(dark(x1 + 4, mid.y)).toBe(false)
    expect(dark(mid.x, y0 - 4)).toBe(false)
    expect(dark(mid.x, y1 + 4)).toBe(false)
  })
})
