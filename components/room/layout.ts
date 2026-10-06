import { SCENE_ASPECT, SCENE_PX_H, SCENE_PX_W, type Rect } from '@/components/os/intro/geometry'

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
  return { x: (vw - w) / 2, y: (vh - h) / 2, w, h }
}

/** How far the room may move either way from rest without showing past an edge. */
export function panRange(rest: Rect, vw: number): number {
  return Math.max(0, (rest.w - vw) / 2)
}

/** The pan offset for a pointer at `pointerX`: the left of the viewport shows
 *  the room's left edge, the right shows its right edge, linear between. */
export function panFor(pointerX: number, vw: number, rest: Rect): number {
  const f = vw > 0 ? Math.min(1, Math.max(0, pointerX / vw)) : 0.5
  return panRange(rest, vw) * (1 - 2 * f)
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
    left: `calc((100vw - ${w}) / 2)`,
    top: `calc((100vh - ${w} / ${SCENE_ASPECT}) / 2)`,
  }
}
