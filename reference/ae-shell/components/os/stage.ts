/**
 * Where the windows go.
 *
 * {@link WindowFrame} is one window's resting geometry — how wide it is
 * allowed to be, how much of the stage's height it may take, and how far off
 * dead centre it sits. It is expressed in fractions rather than pixels
 * wherever it can be, so nothing here has to be re-tuned when the viewport
 * changes. Seven identical centred boxes in sequence is the single thing that
 * made this page read as a slideshow wearing window chrome, and this is the
 * file that fixes it.
 *
 * Nothing in here is measured or animated. `LaunchedWindow` turns these into
 * pixels once per layout, against its own measured box, and clamps them so a
 * frame that would push a window under the dock or behind the menu bar
 * cannot.
 */

export interface WindowFrame {
  /** Maximum width on the stage, in px. */
  w: number
  /** Maximum height, as a fraction of the stage's usable height. */
  h: number
  /** Offset from dead centre, as a fraction of the stage's width. Positive is
   *  right. Clamped at runtime against the free space either side. */
  dx: number
  /** The same, vertically. Positive is down. */
  dy: number
}

/**
 * How much of the stage an offset window may never enter, measured from each
 * edge of the sticky layer itself rather than from the flex container's
 * padding — the padding is where a *centred* window rests, and these are the
 * hard limits an offset one is clamped to.
 *
 * The top is the 30px menu bar plus a hairline. The bottom is the dock: 18px
 * of pad, an 86px tile stack, and enough air that a window pushed as far down
 * as it may go still reads as sitting above the dock rather than tucked
 * behind it.
 */
export const STAGE_GUARD_TOP = 34
export const STAGE_GUARD_BOTTOM = 118
export const STAGE_GUARD_SIDE = 10

export function clamp(value: number, min: number, max: number): number {
  if (max < min) return 0
  return Math.min(Math.max(value, min), max)
}
