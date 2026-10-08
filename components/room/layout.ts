import { SCENE_ASPECT, SCENE_PX_H, SCENE_PX_W, type Rect } from '@/components/os/intro/geometry'
import sprites from '@/public/room/sprites.json'

const board = sprites.sprites.find((s) => s.id === 'whiteboard')!

/** Where the first screen is centred, as a fraction of the art's width: the
 *  whiteboard, which carries the intro. The art's own middle left it off to
 *  the left. */
export const FOCUS_X = (board.x + board.w / 2) / sprites.width

/**
 * Where the room sits, and how it pans. Pure: every number here is a
 * function of the viewport and the pointer.
 *
 * The room covers the whole screen, like a game, with the hotbar floating over
 * it. (The spec asked for ≈110.9% of the width with the rest of the screen
 * filled around it; Rayyan found the bands odd and asked for it closer.) The
 * art is 21:9, so on most screens it fills the height and overhangs the sides,
 * and the cursor pans the sides into view; on very wide screens it fills the
 * width and loses a sliver top and bottom.
 */

export function roomRect(vw: number, vh: number): Rect {
  const w = Math.max(vw, vh * SCENE_ASPECT)
  const h = w / SCENE_ASPECT
  // The whiteboard at the centre, as near as the room's edges allow.
  const x = Math.min(0, Math.max(vw - w, vw / 2 - FOCUS_X * w))
  return { x, y: (vh - h) / 2, w, h }
}

/** How far the room may move either way from rest without showing past an edge. */
export function panRange(rest: Rect, vw: number): number {
  return Math.max(0, (rest.w - vw) / 2)
}

/** The pan offset for a pointer at `pointerX`: the left of the viewport shows
 *  the room's left edge, the right its right edge, and the centre the room at
 *  rest. Rest is not the room's middle (it is the whiteboard), so each half of
 *  the screen has its own stretch. */
export function panFor(pointerX: number, vw: number, rest: Rect): number {
  if (rest.w <= vw) return 0 // nothing overhangs: nothing to pan
  const f = vw > 0 ? Math.min(1, Math.max(0, pointerX / vw)) : 0.5
  const toLeftEdge = -rest.x
  const toRightEdge = vw - rest.w - rest.x
  return f < 0.5 ? toLeftEdge * (1 - 2 * f) : toRightEdge * (2 * f - 1)
}

/** A viewport point → a pixel of the art, given the room's on-screen box
 *  (its `getBoundingClientRect()`, which already includes any pan or zoom). */
export function toArt(
  clientX: number,
  clientY: number,
  box: { left: number; top: number; width: number; height: number },
): { u: number; v: number } | null {
  if (box.width <= 0 || box.height <= 0) return null
  const u = ((clientX - box.left) / box.width) * SCENE_PX_W
  const v = ((clientY - box.top) / box.height) * SCENE_PX_H
  if (u < 0 || v < 0 || u >= SCENE_PX_W || v >= SCENE_PX_H) return null
  return { u, v }
}

/**
 * `roomRect` as CSS, for the server render and the first client render,
 * which have no viewport to measure. Same rule, so the room does not move when
 * the measured layout takes over.
 */
export function restCss(): { left: string; top: string; width: string; height: string } {
  const w = `max(100vw, 100vh * ${SCENE_ASPECT})`
  return {
    width: w,
    height: `calc(${w} / ${SCENE_ASPECT})`,
    left: `clamp(calc(100vw - ${w}), calc(50vw - ${w} * ${FOCUS_X}), 0px)`,
    top: `calc((100vh - ${w} / ${SCENE_ASPECT}) / 2)`,
  }
}
