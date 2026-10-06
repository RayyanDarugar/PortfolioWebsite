/**
 * The landing page's own chrome vocabulary.
 *
 * `components/desktop/Window.tsx` owns the chrome for the simulator — the
 * clutter windows on `/demo`, the ad unit, the interior pages' `WindowCard`.
 * That map is tuned for small objects rendered at scale inside a canvas. The
 * landing page renders one window at a time at 1000px+ across the whole
 * viewport, where a single 28px blur reads as flat, so it gets its own,
 * heavier set. Sharing one map would mean either the simulator's windows
 * growing shadows they cannot afford or these ones staying thin.
 *
 * Everything here is a plain string or a style object. No component in this
 * file, so app code can drop a value into any element.
 */
import type { CSSProperties } from 'react'

/** Aqua's 1px-on-4px highlight. Same geometry as the simulator's, restated
 *  here so this module has no import back into the simulator's chrome. */
export const PINSTRIPE =
  'repeating-linear-gradient(to bottom,rgba(255,255,255,.55) 0 1px,transparent 1px 4px)'

/** Window corner radius. Stated once, because the clip, the frame highlight
 *  and the title bar all have to agree or the hairline cuts the corner. */
export const WINDOW_RADIUS = 12

/**
 * Two shadows, never one blur.
 *
 * A single large blur is the flat-mockup look: it puts the same amount of
 * darkness everywhere and the window ends up floating on a grey smudge. A
 * real window casts two — a tight ambient right against the frame, which is
 * what seats it on the surface, and a wide diffuse one thrown well below it,
 * which is what gives it altitude. A hairline contact shadow rides with the
 * ambient so the outline stays legible against a bright wallpaper.
 */
export const WINDOW_SHADOW = [
  '0 1px 2px rgba(8,12,28,.20)',        // contact
  '0 6px 14px -4px rgba(8,12,28,.26)',  // tight ambient
  '0 40px 74px -26px rgba(4,6,20,.55)', // wide diffuse cast
].join(',')

/** The frontmost window. Deeper on both counts, and thrown further — the gap
 *  between this and the resting shadow is the whole reason you can tell which
 *  window you are actually talking to. */
export const WINDOW_SHADOW_ACTIVE = [
  '0 1px 2px rgba(8,12,28,.28)',
  '0 10px 24px -6px rgba(8,12,28,.34)',
  '0 66px 116px -32px rgba(4,6,20,.74)',
].join(',')

/**
 * The 1px frame, drawn as insets on an overlay rather than as a `border`, so
 * it can be lighter at the top than at the bottom: a white hairline along the
 * top edge that reads as the window catching the light, a darker one along the
 * bottom where it is in its own shade, and a half-pixel ring holding the whole
 * outline. Painted last-to-first, so the top highlight sits over the ring.
 */
export const WINDOW_FRAME = [
  'inset 0 1px 0 rgba(255,255,255,.55)',
  'inset 0 -1px 0 rgba(4,8,20,.28)',
  'inset 0 0 0 .5px rgba(10,16,34,.32)',
].join(',')

export const WINDOW_FRAME_ACTIVE = [
  'inset 0 1px 0 rgba(255,255,255,.88)',
  'inset 0 -1px 0 rgba(4,8,20,.36)',
  'inset 0 0 0 .5px rgba(10,16,34,.40)',
].join(',')

/** The same idea one step lower, for the objects that float beside a window
 *  rather than being one — the hero's demo display. */
export const PANEL_SHADOW = [
  '0 0 0 0.5px rgba(10,16,30,.30)',
  '0 2px 6px rgba(10,16,30,.18)',
  '0 34px 70px -20px rgba(6,8,24,.52)',
].join(',')

/**
 * The frontmost window's title bar is glass: the wallpaper blurs through it
 * and picks up its hue, which is the single cheapest thing that separates a
 * window from a painted panel. A resting window gets the opaque version — it
 * is invisible at that point anyway, and seven simultaneous `backdrop-filter`
 * surfaces on one scrolling page is a cost with nothing to show for it.
 */
const TITLE_BG_ACTIVE =
  'linear-gradient(rgba(255,255,255,.88) 0%,rgba(244,247,251,.79) 50%,rgba(224,231,240,.74) 100%)'
const TITLE_BG_REST =
  'linear-gradient(#FCFDFE 0%,#F1F4F8 50%,#DEE4EB 100%)'
const TITLE_BLUR = 'blur(20px) saturate(180%)'

/** Aqua title bar. Reads its fill and its blur from custom properties so the
 *  frontmost window can be brighter than a resting one without every app
 *  having to be told which it is. */
export const TITLE_BAR: CSSProperties = {
  background: `var(--os-title-bg, ${TITLE_BG_REST})`,
  backdropFilter: 'var(--os-title-blur, none)',
  WebkitBackdropFilter: 'var(--os-title-blur, none)',
  borderBottom: '1px solid rgba(20,26,34,.20)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.95)',
}

/**
 * The chrome custom properties for one window, set on its wrapper.
 *
 * Prop-drilling `active` through seven app components and into `OSWindow`
 * would mean touching every app to change how a window is lit. Four custom
 * properties on the wrapper the launcher already owns does the same job and
 * leaves the apps alone; anything rendered without a wrapper — the stacked
 * fallback — falls through to the resting values baked into `OSWindow`.
 */
export function windowChromeVars(active: boolean): CSSProperties {
  return {
    '--os-window-shadow': active ? WINDOW_SHADOW_ACTIVE : WINDOW_SHADOW,
    '--os-window-frame': active ? WINDOW_FRAME_ACTIVE : WINDOW_FRAME,
    '--os-title-bg': active ? TITLE_BG_ACTIVE : TITLE_BG_REST,
    '--os-title-blur': active ? TITLE_BLUR : 'none',
  } as CSSProperties
}

export const TITLE_INK: CSSProperties = {
  color: '#3B4756',
  textShadow: '0 1px 0 rgba(255,255,255,.9)',
  fontFamily: 'var(--font-ui)',
}

/** Translucent chrome: the menu bar and the dock. `saturate` is what stops a
 *  blurred wallpaper going grey behind them. */
export const GLASS: CSSProperties = {
  backdropFilter: 'blur(28px) saturate(190%)',
  WebkitBackdropFilter: 'blur(28px) saturate(190%)',
}

/**
 * Film grain. An feTurbulence tile inlined as a data URI — fixed seed, no
 * `Math.random()`, identical byte-for-byte on the server and the client.
 * Laid over the wallpaper at low opacity it removes the plastic banding a
 * pure CSS gradient always has at large sizes.
 */
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='4' stitchTiles='stitch' seed='7'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)'/%3E%3C/svg%3E\")"

/** A box that reads as a piece of glass sitting on the window's surface: an
 *  inset well rather than a raised card. Used for the app-specific insets —
 *  the settings pane, the calculator readout, the stocks list. */
export const WELL: CSSProperties = {
  background: 'linear-gradient(#F6F8FB,#EDF1F6)',
  border: '1px solid rgba(20,26,34,.13)',
  boxShadow: 'inset 0 1px 3px rgba(20,26,34,.10), 0 1px 0 rgba(255,255,255,.85)',
  borderRadius: 10,
}

/** The dark-app body — Calculator and Stocks are both black-glass apps on a
 *  real Mac, and rendering them white would lose the joke. */
export const DARK_BODY: CSSProperties = {
  background: 'linear-gradient(#26282E,#17181C)',
  color: '#F2F4F7',
}

/**
 * Type scale. Stated once so seven app windows cannot each invent their own
 * heading size, which is exactly how a page starts reading as a prototype.
 *
 * `subhead` is the step that was missing. Without it the hero went from a
 * 60px display straight to 18px `lead`, a jump of better than three to one,
 * and the sentence that actually explains the product read as fine print
 * under a poster. It is the size the line under a headline has to be to still
 * be part of the headline's argument.
 */
export const TYPE = {
  /**
   * The landing hero's headline, and only that.
   *
   * Modelled on cofounder.co's own scale, and the surprise in that scale is the
   * **weight**: their h1 is 46px at weight 400 with a 1.08 line-height. Not
   * bold. The version this replaces was 78px extrabold, which is the loudest
   * possible reading of "make the headline the hero" and also the most
   * recognisable tell of a generated landing page. A large headline at normal
   * weight is a publication; a large headline at 800 is a billboard.
   *
   * Tracking sits at zero rather than the tight negative the old scale used.
   * Squeezing letters together is a display-type habit that only reads as
   * craft above about 60px; at this size it just looks cramped.
   */
  hero: 'text-[clamp(32px,3.4vw,50px)] font-normal leading-[1.08] tracking-[0]',
  /**
   * The pixel label. Departure Mono, uppercase, and tracked out hard —
   * cofounder runs 7.8px of letter-spacing on a 26px size, which is enormous
   * and is exactly what makes it read as a machine label rather than as text.
   * Used for the wordmark and the scroll hint, where a bitmap face costs no
   * legibility because the strings are three words long.
   */
  pixelLabel: 'text-[12px] uppercase leading-[1.6] tracking-[0.24em]',
  /** The hero's body. Weight 460ish, 1.4 line-height, a hair of positive
   *  tracking — cofounder's body settings, which are noticeably looser and
   *  lighter than the ones this site uses inside its windows. */
  heroBody: 'text-[clamp(15px,1.15vw,17px)] font-medium leading-[1.45] tracking-[0.01em]',
  display: 'text-[clamp(34px,3.5vw,60px)] font-extrabold leading-[.96] tracking-[-.043em]',
  heading: 'text-[clamp(24px,2.1vw,36px)] font-extrabold leading-[1.03] tracking-[-.035em]',
  subhead: 'text-[clamp(18px,1.5vw,25px)] leading-[1.42] tracking-[-.016em]',
  sub: 'text-[clamp(17px,1.35vw,23px)] font-bold leading-[1.15] tracking-[-.022em]',
  lead: 'text-[clamp(15px,1.05vw,18px)] leading-[1.55]',
  body: 'text-[14.5px] leading-[1.55]',
  small: 'text-[12.5px] leading-[1.5]',
} as const

/**
 * The hero window's body.
 *
 * Every other window on this page is a flat panel under its chrome, which is
 * the right answer for a table or a settings pane and the wrong one for the
 * largest object on the page: `#FBFCFD` edge to edge next to the Stocks
 * window's black glass reads as the one surface nobody lit. So the hero gets
 * four passes rather than a fill — a broad key light off the top-left corner,
 * a faint acid cast in the opposite corner so the page's one accent colour is
 * present in the surface rather than only in the type, a cool vertical ramp,
 * and an inner shade along the bottom edge that seats the whole thing.
 *
 * All of it is paint. Nothing here is a second element, nothing animates, and
 * nothing forces a layout.
 */
export const HERO_BODY: CSSProperties = {
  background: [
    'radial-gradient(118% 88% at 6% -8%,rgba(255,255,255,.97),rgba(255,255,255,0) 58%)',
    'radial-gradient(76% 62% at 102% 4%,rgba(150,214,75,.15),rgba(150,214,75,0) 62%)',
    'linear-gradient(#FCFDFF 0%,#F4F7FC 46%,#E8EEF7 100%)',
  ].join(','),
  boxShadow: [
    'inset 0 1px 0 rgba(255,255,255,.95)',
    'inset 0 -34px 60px -44px rgba(18,30,54,.34)',
  ].join(','),
}

/** The recessed band the hero's figures sit in. A window's numbers belong in
 *  a footer of their own, not floating at the bottom of the prose — the rule
 *  and the change of surface are what make them read as a summary rather than
 *  as a fourth paragraph. */
export const HERO_FOOTER: CSSProperties = {
  background: 'linear-gradient(rgba(224,232,243,.62),rgba(206,218,234,.78))',
  borderTop: '1px solid rgba(20,26,34,.15)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9), inset 0 8px 18px -14px rgba(18,30,54,.35)',
}

export const INK = {
  body: '#46525F',
  dim: '#6C7889',
  strong: '#141A22',
} as const

/** Viewport coordinates as plain numbers. DOMRect is a live-ish object and
 *  putting one in state invites reading a stale layout; these are copies. */
export interface Box { x: number; y: number; w: number; h: number }
