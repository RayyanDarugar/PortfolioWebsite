'use client'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef } from 'react'
import { GLASS } from './chrome'
import type { AppDef } from './registry'

const TILE = 58

/**
 * Magnification. How far along the dock an icon still feels the pointer, how
 * much the icon directly under it grows, and how far it rises to grow into.
 *
 * These are deliberately below the real Dock's defaults. macOS magnifies to
 * roughly double because its icons are a target you have to hit; here they
 * are a table of contents you are reading, and a tile that doubles under the
 * pointer stops being chrome and starts being a party trick.
 */
const INFLUENCE = 118
const MAX_GROWTH = 0.3
const MAX_LIFT = 9

/** Tracking the pointer wants no easing at all; letting go of it does. */
const EASE_TRACK = 'transform 90ms ease-out'
const EASE_SETTLE = 'transform 260ms cubic-bezier(.22,.86,.28,1)'

/** Smoothstep, so the falloff has no corner at either end. */
function falloff(distance: number): number {
  const t = Math.max(0, Math.min(1, 1 - distance / INFLUENCE))
  return t * t * (3 - 2 * t)
}

/**
 * The assemble, played once when an account logs in.
 *
 * The dock is mounted the whole time — it is behind the login window, and
 * rendering it there is what keeps the page's content in the server HTML. So
 * "the desktop assembles" is not a mount; it is this animation, applied to
 * the tiles for the length of the login window's fade and staggered along the
 * row so the dock builds left to right rather than appearing all at once.
 *
 * Declared as an inline stylesheet for the same reason the menu bar's swap is:
 * a keyframe is not expressible as a utility class, and this is the only
 * thing on the site that uses it.
 */
const ASSEMBLE_CSS = `
@keyframes ax-dock-in {
  from { opacity: 0; transform: translateY(26px) scale(.86); }
  to   { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .ax-dock-in { animation: none !important; }
}
`
const ASSEMBLE_MS = 520
const ASSEMBLE_STAGGER_MS = 45

/**
 * The dock. It is the page's table of contents as well as its chrome: every
 * icon is a real button that scrolls to that app's section, which is what
 * makes the whole page navigable without a mouse and without the scroll
 * position being the only way to reach anything.
 *
 * `registerTile` hands the tile element back up to the OS root, which
 * measures it. The launch animation has to originate from where the icon
 * actually is — hardcoding a coordinate would put the origin in the right
 * place at exactly one viewport width and visibly wrong at every other.
 *
 * ### Three transforms, three elements
 *
 * A tile is under three independent animations at once and they must not
 * write to the same `transform`, so each gets its own element:
 *
 * | element | owner | what it does |
 * |---|---|---|
 * | press wrapper | React state | the depress under the drifting cursor |
 * | magnify wrapper | direct DOM writes in a rAF | the pointer ripple |
 * | tile | framer-motion | the approved launch bounce |
 *
 * The magnification is written straight to `style.transform` rather than
 * through state because it changes on every pointer move: routing that
 * through React would re-render seven buttons sixty times a second to move
 * something the compositor can do on its own.
 *
 * The dock only exists in the desktop mode, which a reduced-motion visitor
 * never reaches — so magnification is inert for them by construction. The
 * explicit check is there anyway, because the day someone changes that gate
 * is the day it stops being true silently.
 */
export function Dock({
  apps, active, pressed = -1, assembling = false, onSelect, registerTile,
}: {
  apps: readonly AppDef[]
  active: number
  /** The tile the drifting cursor is currently clicking, or −1. */
  pressed?: number
  /** True for the half-second after an account logs in, which is when the
   *  dock builds itself. Never true on first paint, so it costs a visitor who
   *  arrived with an account already chosen nothing at all. */
  assembling?: boolean
  onSelect: (index: number) => void
  registerTile: (index: number, el: HTMLElement | null) => void
}) {
  const magnifiers = useRef<(HTMLSpanElement | null)[]>([])
  /** Untransformed tile centres, cached on pointer entry. Reading them live
   *  would feed each frame's scale back into the next frame's distance. */
  const centres = useRef<number[]>([])
  const pointerX = useRef<number | null>(null)
  const frame = useRef(0)

  const paint = useCallback(() => {
    frame.current = 0
    const x = pointerX.current
    magnifiers.current.forEach((el, i) => {
      if (!el) return
      if (x === null) {
        el.style.transition = EASE_SETTLE
        el.style.transform = 'translate3d(0,0,0) scale(1)'
        return
      }
      const centre = centres.current[i]
      if (centre === undefined || !Number.isFinite(centre)) return
      const e = falloff(Math.abs(x - centre))
      el.style.transition = EASE_TRACK
      el.style.transform = `translate3d(0,${(-MAX_LIFT * e).toFixed(2)}px,0) scale(${(1 + MAX_GROWTH * e).toFixed(4)})`
    })
  }, [])

  const schedule = useCallback(() => {
    if (frame.current) return
    frame.current = requestAnimationFrame(paint)
  }, [paint])

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (centres.current.length === 0) return
    pointerX.current = event.clientX
    schedule()
  }, [schedule])

  const onPointerEnter = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Measured here rather than on mount because here is the one moment the
    // tiles are guaranteed to be at their resting size.
    centres.current = magnifiers.current.map((el) => {
      if (!el) return Number.NaN
      const r = el.getBoundingClientRect()
      return r.left + r.width / 2
    })
    pointerX.current = event.clientX
    schedule()
  }, [schedule])

  const onPointerLeave = useCallback(() => {
    pointerX.current = null
    centres.current = []
    schedule()
  }, [schedule])

  useEffect(() => () => { if (frame.current) cancelAnimationFrame(frame.current) }, [])

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[60] flex justify-center pb-[18px]">
      <nav
        aria-label="Sections"
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="pointer-events-auto flex max-w-[calc(100vw-32px)] items-end gap-[10px] overflow-visible rounded-[22px] px-[12px] pb-[10px] pt-[9px]"
        style={{
          ...GLASS,
          background: 'linear-gradient(rgba(255,255,255,.30),rgba(255,255,255,.16))',
          border: '1px solid rgba(255,255,255,.42)',
          boxShadow: [
            'inset 0 1px 0 rgba(255,255,255,.65)',
            '0 2px 4px rgba(6,8,24,.28)',
            '0 26px 60px -18px rgba(6,8,24,.75)',
          ].join(','),
        }}
      >
        <style>{ASSEMBLE_CSS}</style>

        {apps.map((app, i) => {
          const on = i === active
          return (
            <button
              key={app.id}
              type="button"
              onClick={() => onSelect(i)}
              aria-current={on ? 'true' : undefined}
              className={`group relative flex flex-col items-center rounded-[16px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-white ${
                assembling ? 'ax-dock-in' : ''
              }`}
              style={assembling ? {
                animation: `ax-dock-in ${ASSEMBLE_MS}ms cubic-bezier(.2,.9,.3,1) ${i * ASSEMBLE_STAGGER_MS}ms both`,
              } : undefined}
            >
              {/* Tooltip. Shown on hover and on keyboard focus, because a dock
                  whose labels only exist on hover is a dock a keyboard user
                  navigates blind. */}
              <span
                className="pointer-events-none absolute bottom-[calc(100%+12px)] whitespace-nowrap rounded-[7px] px-[10px] py-[5px] text-[12px] font-bold opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                style={{
                  fontFamily: 'var(--font-ui)',
                  background: 'rgba(28,20,42,.86)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,.16)',
                  boxShadow: '0 10px 24px rgba(0,0,0,.4)',
                }}
              >
                {app.name}
              </span>

              {/* The depress, under the drifting cursor's click. */}
              <span
                className="block origin-bottom transition-transform duration-150 ease-out"
                style={{ transform: `scale(${i === pressed ? 0.88 : 1})` }}
              >
                {/* Magnification. */}
                <span
                  ref={(el) => { magnifiers.current[i] = el }}
                  className="block origin-bottom"
                  style={{ transformOrigin: 'bottom center' }}
                >
                  <motion.span
                    ref={(el) => { registerTile(i, el) }}
                    className="relative block"
                    style={{
                      width: TILE, height: TILE, borderRadius: 15,
                      background: app.tile,
                      padding: app.inset,
                      boxShadow: [
                        'inset 0 1px 0 rgba(255,255,255,.55)',
                        'inset 0 0 0 .5px rgba(255,255,255,.28)',
                        '0 2px 3px rgba(6,8,24,.35)',
                        '0 10px 20px -6px rgba(6,8,24,.6)',
                      ].join(','),
                    }}
                    initial={false}
                    animate={{ y: on ? [0, -17, 0] : 0 }}
                    transition={{ duration: 0.66, times: [0, 0.36, 1], ease: [0.28, 0.9, 0.32, 1] }}
                  >
                    <app.Glyph />
                    {/* The gloss. A real dock icon has a highlight across the
                        top third; without it the tiles read as flat swatches. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-[1px] top-[1px] h-[42%]"
                      style={{
                        borderRadius: '14px 14px 40% 40%',
                        background: 'linear-gradient(rgba(255,255,255,.42),rgba(255,255,255,.04))',
                      }}
                    />
                  </motion.span>
                </span>
              </span>

              {/* Running indicator */}
              <span
                aria-hidden
                className="mt-[5px] block h-[4px] w-[4px] rounded-full transition-opacity duration-200"
                style={{
                  background: '#fff',
                  boxShadow: '0 0 5px rgba(255,255,255,.85)',
                  opacity: on ? 1 : 0,
                }}
              />
            </button>
          )
        })}
      </nav>
    </div>
  )
}
