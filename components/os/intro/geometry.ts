/**
 * The laptop zoom, as pure functions of one number.
 *
 * `z` is camera progress: 0 is the laptop on the desk, 1 is its desktop
 * full-bleed. `useZoom` animates it on a click; everything here is a lookup on
 * it, which is what makes the zoom reversible mid-flight for free. Nothing
 * here holds state, reads the DOM or knows what React is.
 *
 * Adapted from the AE shell's intro (reference/ae-shell/components/os/intro/),
 * where the same number came from the scroll position.
 */

export type Phase = 'room' | 'desktop'

/**
 * Where the black screen rectangle sits inside `public/hero/scene-ambient.png`,
 * as fractions of the image. Measured from the file (the largest connected
 * black region), not estimated: an eyeballed value shows up at once as the
 * desktop overlapping the bezel or a black seam around it. Re-measure if the
 * picture is redrawn.
 */
export const SCREEN_L = 0.2420
export const SCREEN_T = 0.5547
export const SCREEN_R = 0.4099
export const SCREEN_B = 0.7357

/** The scene file's pixel size. The fractions above are of a rectangle. */
export const SCENE_PX_W = 1376
export const SCENE_PX_H = 768
export const SCENE_ASPECT = SCENE_PX_W / SCENE_PX_H

/** The drawn screen bitmap's pixel size: small on purpose, so it is near its
 *  native size at rest and gets chunkier, not blurrier, as the camera closes. */
export const PIXEL_SCREEN_W = 344
export const PIXEL_SCREEN_H = 192

/** The screen hole's size as a fraction of the scene. */
export const HOLE_W = SCREEN_R - SCREEN_L
export const HOLE_H = SCREEN_B - SCREEN_T

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/** Normalise `t` into a [start, end] sub-window, clamped at both ends. */
export function window01(t: number, start: number, end: number): number {
  if (end <= start) return t >= end ? 1 : 0
  return clamp01((t - start) / (end - start))
}

/** The drawn screen's opacity. It hands over to the live desktop early, while
 *  both are still too small to read, so nobody sees the swap. */
export function pixelFade(z: number): number {
  return 1 - window01(z, 0.02, 0.48)
}

/** The room's own copy (name, Résumé link) leaves as soon as the camera moves. */
export function roomUiFade(z: number): number {
  return 1 - window01(z, 0, 0.25)
}

export interface Rect { x: number; y: number; w: number; h: number }

/**
 * Where the scene picture sits, in viewport pixels. At z = 0 it covers the
 * viewport, centred; at z = 1 it is scaled so its screen hole is the viewport.
 * Centred is not a default: the room is drawn with content hard against its
 * right edge, so any sideways offset pulls a seam into frame.
 */
export function scene(z: number, vw: number, vh: number): Rect {
  const w0 = Math.max(vw, vh * SCENE_ASPECT)
  const h0 = w0 / SCENE_ASPECT
  const x0 = (vw - w0) / 2
  const y0 = (vh - h0) / 2

  const w1 = vw / HOLE_W
  const h1 = vh / HOLE_H
  const x1 = -SCREEN_L * w1
  const y1 = -SCREEN_T * h1

  return {
    x: x0 + (x1 - x0) * z,
    y: y0 + (y1 - y0) * z,
    w: w0 + (w1 - w0) * z,
    h: h0 + (h1 - h0) * z,
  }
}

/** The drawn screen, in viewport pixels. Derived from {@link scene}, so the
 *  picture and the live desktop cannot drift apart. */
export function hole(z: number, vw: number, vh: number): Rect {
  const s = scene(z, vw, vh)
  return {
    x: s.x + SCREEN_L * s.w,
    y: s.y + SCREEN_T * s.h,
    w: HOLE_W * s.w,
    h: HOLE_H * s.h,
  }
}

/** The desktop's transform: rendered at viewport size and scaled *down* to fit
 *  the hole (fit, not cover, so no menu bar or icon is cropped). Identity at 1. */
export function camera(z: number, vw: number, vh: number): { scale: number; x: number; y: number } {
  const r = hole(z, vw, vh)
  return {
    scale: Math.min(r.w / vw, r.h / vh),
    x: r.x + r.w / 2 - vw / 2,
    y: r.y + r.h / 2 - vh / 2,
  }
}

/** The desktop's clip, as `inset()` edges in viewport pixels. All 0 at z = 1. */
export function clip(z: number, vw: number, vh: number): {
  top: number; right: number; bottom: number; left: number
} {
  const r = hole(z, vw, vh)
  return { top: r.y, right: vw - r.x - r.w, bottom: vh - r.y - r.h, left: r.x }
}

/** The smallest wheel delta that counts as a deliberate downward scroll. Two
 *  pixels ignores the noise a trackpad makes under a resting hand. */
export const WHEEL_FLOOR = 2

export function isDownwardWheel(deltaY: number): boolean {
  return deltaY > WHEEL_FLOOR
}
