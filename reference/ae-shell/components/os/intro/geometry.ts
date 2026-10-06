/**
 * The intro's choreography, as pure functions of one number.
 *
 * Everything the laptop does — where it sits, how the camera flies into it,
 * how the hero fades — is a function of `t`, intro progress, which is a
 * function of scroll position. Nothing here holds state, reads the DOM or
 * knows what a React component is, which is what makes the whole transition
 * reversible for free: scroll back up and every value runs backwards because
 * it was never anything but a lookup.
 *
 * It is also the only file in the intro that is worth unit-testing, and it
 * carries the entire specification of what the transition looks like.
 */

export type Phase = 'intro' | 'live'

/* ------------------------------------------------------------------ *
 * The timeline, in units of `t`.
 *
 * There is no lid beat and no startup beat, and both went for the same
 * reason: they were time the visitor spent watching a machine instead of
 * watching the product.
 *
 * The lid went last, and it went because the laptop is now a drawing. A
 * bitmap cannot rotate in 3D without resampling into mush, so a machine
 * that opens has to be built out of CSS boxes — and a CSS box cannot draw
 * a silhouette. Three attempts at a hand-drawn-looking laptop failed on
 * that constraint before it was worth admitting the constraint was the
 * problem. The sprite is open from the start; the camera does the work.
 * ------------------------------------------------------------------ */

/** The camera flies in. It is the whole transition now. */
export const ZOOM_START = 0.06
export const ZOOM_END = 0.85
/** The hero copy fades and lifts away. */
export const HERO_END = 0.30
/** The scroll hint goes first — it has done its job the moment you scroll. */
export const ARROW_END = 0.14

/**
 * The phase thresholds, with a deliberate gap between them.
 *
 * `LAND` is where the page becomes itself. It is *below* 1.0 on purpose:
 * Lenis lerps toward its target, so a visitor who stops mid-gesture can come
 * to rest at t = 0.97, and if landing required 1.0 they would be stranded
 * looking at a nearly-full-bleed screen with no login window, forever. The
 * track above `LAND` is landing slack.
 *
 * `UNLAND` is where scrolling back up puts the room back. The band between
 * the two is hysteresis: without it a scroll that jitters across a single
 * threshold would mount and unmount the login window and fourteen app windows
 * over and over.
 */
export const LAND = 0.85
export const UNLAND = 0.80

/* ------------------------------------------------------------------ *
 * The scene
 * ------------------------------------------------------------------ */

/**
 * Where the black screen rectangle sits inside `public/hero/scene.png`, as
 * fractions of the image.
 *
 * **Measured from the file, not estimated.** These four numbers decide where
 * the live desktop is pasted into the drawing, and an eyeballed value shows up
 * immediately as either the desktop overlapping the bezel or a black seam
 * around it. They were found by decoding the PNG and locating the tallest
 * largest connected black *region* in it. The earlier run-width heuristic
 * stopped short of the screen's bottom edge, where the drawn bezel narrows,
 * and left a band of the picture's own black showing under the desktop.
 * Re-measure the same way if the picture is ever redrawn.
 */
export const SCREEN_L = 0.2420
export const SCREEN_T = 0.5547
export const SCREEN_R = 0.4099
export const SCREEN_B = 0.7357

/** The scene file's own pixel dimensions. Needed because the fractions above
 *  are fractions of a rectangle, not of a square — computing an aspect without
 *  them makes the drawing come out the wrong shape entirely. */
export const SCENE_PX_W = 1376
export const SCENE_PX_H = 768
export const SCENE_ASPECT = SCENE_PX_W / SCENE_PX_H

/**
 * The drawn screen's own pixel dimensions.
 *
 * It is deliberately small. A pixel-art image is only pixel art at roughly its
 * native size — scale it down and the grid disappears into a smear, which is
 * exactly what would happen if the drawn desktop were rendered at viewport size
 * and shrunk into the laptop like the live one is. At rest the screen hole is
 * around 230px across, so a source near that size lands close to 1:1, and the
 * pixels get *chunkier* as the camera closes in rather than finer.
 */
export const PIXEL_SCREEN_W = 344
export const PIXEL_SCREEN_H = 192

/** The screen hole's size as a fraction of the scene. */
export const HOLE_W = SCREEN_R - SCREEN_L
export const HOLE_H = SCREEN_B - SCREEN_T

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/**
 * Scroll offset to intro progress: one viewport of scrolling is the whole
 * intro.
 *
 * Guards `viewportH <= 0` because the viewport is 0 on the server and on the
 * first client render, before the resize listener has read it. Dividing by it
 * would produce Infinity, and the first painted frame would be a landed page
 * that then jumps backwards into a laptop.
 */
export function progress(scrollY: number, viewportH: number): number {
  if (viewportH <= 0) return 0
  return clamp01(scrollY / viewportH)
}

/** Normalise `t` into a [start, end] sub-window, clamped at both ends. */
export function window01(t: number, start: number, end: number): number {
  if (end <= start) return t >= end ? 1 : 0
  return clamp01((t - start) / (end - start))
}

/** Cubic ease-in-out, for the camera. A fly-in that starts abruptly reads as
 *  a cut. */
export function easeInOut(u: number): number {
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2
}

/* ------------------------------------------------------------------ *
 * The timeline, evaluated
 * ------------------------------------------------------------------ */

/** Camera progress: 0 is a laptop on a desk, 1 is the desktop full-bleed. */
export function zoom(t: number): number {
  return easeInOut(window01(t, ZOOM_START, ZOOM_END))
}

/** Hero copy opacity. */
export function heroFade(t: number): number {
  return 1 - window01(t, 0, HERO_END)
}

/**
 * The pixel screen's opacity: 1 at rest, 0 once the camera is close.
 *
 * The drawn desktop hands over to the live one *early* — well before the screen
 * fills the frame — because the point of the handover is that nobody sees it.
 * At rest the drawn screen is a hundred-odd pixels across and the real UI would
 * be an illegible smear; by 0.45 the screen is large enough that the real thing
 * is the better picture, and the room around it is still there to carry the
 * moment. Crossing over late, at the landing, would put the swap exactly where
 * the visitor is looking.
 */
export function pixelFade(t: number): number {
  return 1 - window01(t, 0.20, 0.45)
}

/** Scroll-hint opacity. */
export function arrowFade(t: number): number {
  return 1 - window01(t, 0, ARROW_END)
}

/* ------------------------------------------------------------------ *
 * The camera
 * ------------------------------------------------------------------ */

export interface Rect { x: number; y: number; w: number; h: number }

/**
 * Where the scene picture sits, in viewport pixels, at camera progress `z`.
 *
 * The laptop is **drawn into the room** rather than composited over it, so
 * there is one picture and one interpolation. Two separately generated assets
 * never share a light: the machine had no cast shadow on the desk, caught none
 * of the window's sunbeam, and read as a sticker no matter how carefully it was
 * aligned. Drawing it in solved the seam by removing it.
 *
 * At z = 0 the picture covers the viewport, the way any hero image would. At
 * z = 1 it is scaled so its *screen hole* is the viewport exactly — which puts
 * the rest of the room far outside the frame, and is what lets the landed page
 * be a true identity. In between, the camera pushes into the room.
 */
export function scene(z: number, vw: number, vh: number): Rect {
  // z = 0: cover the viewport, centred — and centred is not a default, it is
  // the only position that works. Sliding the picture sideways to reposition
  // the laptop was tried and reverted: the room is drawn with content hard
  // against its right edge, so any horizontal offset pulls that edge into
  // frame as a visible seam beside the window. The overhang is only slack for
  // the *bitmap*, not for the composition. If the machine needs to move, it
  // moves in the drawing.
  const w0 = Math.max(vw, vh * SCENE_ASPECT)
  const h0 = w0 / SCENE_ASPECT
  const x0 = (vw - w0) / 2
  const y0 = (vh - h0) / 2

  // z = 1: the hole is the viewport. The picture's own aspect is abandoned
  // here, which is free — by this point it is many times the size of the
  // screen and nothing but the hole is still in frame.
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

/**
 * The drawn screen, in viewport pixels, at camera progress `z`.
 *
 * Derived from {@link scene} rather than interpolated separately, which is the
 * whole reason the drawing and the live UI cannot drift apart: there is one
 * source of truth for where the screen is, and both the picture and the clip
 * read it.
 */
export function hole(z: number, vw: number, vh: number): Rect {
  const s = scene(z, vw, vh)
  return {
    x: s.x + SCREEN_L * s.w,
    y: s.y + SCREEN_T * s.h,
    w: HOLE_W * s.w,
    h: HOLE_H * s.h,
  }
}

/**
 * The transform for the desktop, which is rendered at full viewport size and
 * scaled *down* into the hole rather than rendered small and scaled up — so at
 * rest nothing is resampled and the landed page is pixel-exact.
 *
 * Scaled to **fit** inside the hole, not to cover it. Cover was the first
 * instinct — a screen that is meant to be switched on should not show bars —
 * but it crops, and what it crops is the edges of a desktop: the left of the
 * menu bar and the right-hand column of desktop icons. Losing the product's
 * own chrome to make a bezel look tidier is the wrong trade.
 *
 * The drawn screen and the viewport are close but not identical in shape, so
 * fitting leaves a sliver on two sides. That sliver is painted black behind
 * the desktop, which is what the inside of a switched-on screen looks like
 * anyway — so nothing of the room shows through and nothing of the desktop is
 * lost. At z = 1 both agree and the scale is exactly 1.
 */
export function camera(z: number, vw: number, vh: number): { scale: number; x: number; y: number } {
  const r = hole(z, vw, vh)
  return {
    scale: Math.min(r.w / vw, r.h / vh),
    x: r.x + r.w / 2 - vw / 2,
    y: r.y + r.h / 2 - vh / 2,
  }
}

/** The desktop's clip, as `inset()` edges in viewport pixels. All four are 0
 *  at z = 1, which is the landed page having no clip at all. */
export function clip(z: number, vw: number, vh: number): {
  top: number; right: number; bottom: number; left: number
} {
  const r = hole(z, vw, vh)
  return {
    top: r.y,
    right: vw - r.x - r.w,
    bottom: vh - r.y - r.h,
    left: r.x,
  }
}

/* ------------------------------------------------------------------ *
 * The first crossing
 * ------------------------------------------------------------------ */

/**
 * The smallest wheel delta that counts as a deliberate downward gesture.
 *
 * Two pixels. Its only job is to ignore the sub-pixel noise a trackpad emits
 * while a hand rests on it — anything a person actually meant clears it on the
 * first notch.
 */
export const WHEEL_FLOOR = 2

/**
 * A distance fallback, for inputs that produce no gesture event of their own:
 * dragging the scrollbar, or a scroll driven by something else entirely.
 * Deliberately small, because it is a backstop rather than the mechanism.
 */
export const COMMIT_AT = 0.02

/** Close enough to the landing to count as already arrived. */
export const LANDED_EPSILON = 2

/** Keys that scroll a page downward. Pressing one is as deliberate as a wheel
 *  notch and should enter the machine just as readily — otherwise the keyboard
 *  route is the slow one. */
export const DOWNWARD_KEYS: ReadonlySet<string> = new Set([
  'ArrowDown', 'PageDown', 'End', ' ', 'Spacebar',
])

/**
 * Whether a wheel event is a downward scroll the visitor meant.
 *
 * **This is the mechanism; the distance threshold below is only a backstop.**
 *
 * Committing on distance was measuring the wrong thing. Somebody who scrolls
 * the way most people scroll — small, repeated nudges rather than one long
 * flick — can move the page five or eight pixels at a time, so a threshold set
 * in pixels takes two or three notches to cross no matter how low it goes. And
 * it cannot go much lower: past a point it stops being able to tell a scroll
 * from a trackpad resting under a palm.
 *
 * A wheel event does not have that problem. One notch is one gesture, and one
 * gesture is a decision, whatever distance it happened to produce.
 */
export function isDownwardWheel(deltaY: number): boolean {
  return deltaY > WHEEL_FLOOR
}

/**
 * The backstop: whether the page has simply moved far enough to count.
 *
 * Reached by scrollbar drags and by anything else that moves the document
 * without announcing itself as a gesture first.
 */
export function shouldCommitCrossing(scrollY: number, viewportH: number): boolean {
  if (viewportH <= 0) return false
  if (scrollY >= viewportH - LANDED_EPSILON) return false
  return scrollY / viewportH >= COMMIT_AT
}

/**
 * The phase, given where the scroll is.
 *
 * One function rather than two rules: the mount decision and the steady-state
 * decision are the same question asked at different times, and expressing them
 * separately is how they drift apart.
 */
export function nextPhase(current: Phase, t: number, os: boolean): Phase {
  if (!os) return 'live'
  if (t >= LAND) return 'live'
  if (t <= UNLAND) return 'intro'
  return current
}
