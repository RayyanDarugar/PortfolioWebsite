import { SCENE_ASPECT, SCENE_PX_H, SCENE_PX_W, type Rect } from '@/components/os/intro/geometry'

/**
 * Where the room sits, and how it pans. Pure: every number here is a
 * function of the viewport and the pointer.
 *
 * Spec §2: the canvas is ≈110.9% of the viewport width, so everything is
 * visible at rest and the cursor pans only the edge slivers into view. The
 * art is 21:9, so at that width it is shorter than most viewports. It sits
 * centred above a band kept for the hotbar, and the bands around it are
 * filled by `RoomBackdrop`. When the viewport is too short for that, the room
 * is limited by height instead (and pans further, or not at all).
 */

export const OVERSCAN = 1.109
/** Px kept clear at the bottom for the hotbar. */
export const HOTBAR_BAND = 112

export function roomRect(vw: number, vh: number): Rect {
  const avail = Math.max(0, vh - HOTBAR_BAND)
  let w = vw * OVERSCAN
  let h = w / SCENE_ASPECT
  if (h > avail) {
    h = avail
    w = h * SCENE_ASPECT
  }
  return { x: (vw - w) / 2, y: (avail - h) / 2, w, h }
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
 * which have no viewport to measure. Same constants, same rule, so the room
 * does not move when the measured layout takes over.
 */
export function restCss(): { left: string; top: string; width: string; height: string } {
  const h = `min(${(OVERSCAN * 100).toFixed(2)}vw / ${SCENE_ASPECT}, 100vh - ${HOTBAR_BAND}px)`
  return {
    width: `calc(${h} * ${SCENE_ASPECT})`,
    height: `calc(${h})`,
    left: `calc((100vw - ${h} * ${SCENE_ASPECT}) / 2)`,
    top: `calc((100vh - ${HOTBAR_BAND}px - ${h}) / 2)`,
  }
}
