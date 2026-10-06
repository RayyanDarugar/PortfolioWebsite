'use client'
import { useEffect, useRef, useState } from 'react'
import type { Box } from './chrome'
import { useReducedMotion } from './useReducedMotion'

/** How long after the frontmost app settles before the pointer sets off for
 *  the next icon. Long enough that the arrival reads as deliberate rather
 *  than as the cursor being dragged along by the scroll. */
const DWELL = 1150
/** The drift itself. Slow — this is a pointer being moved by a hand, and a
 *  200ms hop reads as a teleport. */
const TRAVEL = 1300
/** Correcting course when the visitor scrolls somewhere the pointer was not
 *  already heading. */
const CORRECT = 260
/** How long the visitor's own pointer has to be still before ours comes back. */
const IDLE = 2600

const CLICK_CSS = `
@keyframes ax-cursor-click {
  from { opacity: .55; transform: scale(.35); }
  to   { opacity: 0;   transform: scale(1.9); }
}
`

function centreOf(box: Box): { x: number; y: number } {
  // Offset a little up and left of dead centre: a real pointer clicks with its
  // tip, and the tip is the top-left corner of the glyph.
  return { x: box.x + box.w / 2 - 5, y: box.y + box.h / 2 - 7 }
}

/**
 * A pointer that moves on its own.
 *
 * Between sections it drifts to the dock icon of the app that is coming next,
 * waits there, and clicks as that window opens. It leads rather than follows:
 * the window's own launch timing is untouched, so what the visitor sees is a
 * pointer arriving, pressing, and the window coming up under it — without the
 * page having delayed anything to arrange that.
 *
 * The rules it obeys, all of which are non-negotiable:
 *
 *  - `pointer-events: none`, always. It is a drawing, and it must never be
 *    able to eat a click meant for the thing underneath it.
 *  - It hides the instant the visitor moves their own mouse, and comes back
 *    only after {@link IDLE} of stillness. Two pointers on screen at once is
 *    not charming, it is a bug report.
 *  - Nothing under `prefers-reduced-motion`. The desktop mode is already gated
 *    on that, and this checks again, because a drifting cursor is the single
 *    most motion-sick-making thing on the page.
 */
export function GhostCursor({
  icons, active, onPress,
}: {
  /** Live viewport boxes of the dock tiles, in app order. */
  icons: readonly (Box | null)[]
  active: number
  /** Called when the pointer clicks tile `index`, so the dock can depress it. */
  onPress: (index: number) => void
}) {
  const allowed = !useReducedMotion()
  const [at, setAt] = useState<{ x: number; y: number } | null>(null)
  const [duration, setDuration] = useState(CORRECT)
  const [awake, setAwake] = useState(true)
  /** Bumped on every click so the ripple element remounts and replays. */
  const [click, setClick] = useState(0)

  const direction = useRef(1)
  const previous = useRef(active)
  /** The tile we have already clicked. The dock is re-measured on every
   *  resize, which hands this effect a new `icons` array — without this, a
   *  window resize would replay the click on a window that is already open. */
  const landed = useRef(-1)

  /* The visitor's own pointer always wins. */
  useEffect(() => {
    if (!allowed) return
    let timer = 0
    const onMove = () => {
      setAwake(false)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setAwake(true), IDLE)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.clearTimeout(timer)
    }
  }, [allowed])

  /* Land, click, then set off for the next one. */
  useEffect(() => {
    if (!allowed) return
    const from = previous.current
    previous.current = active
    if (from !== active) direction.current = active > from ? 1 : -1

    const here = icons[active]
    if (!here) return

    const arriving = landed.current !== active
    landed.current = active
    setDuration(arriving ? CORRECT : 0)
    setAt(centreOf(here))
    if (arriving) {
      setClick((n) => n + 1)
      onPress(active)
    }

    const timer = window.setTimeout(() => {
      const next = icons[Math.min(Math.max(active + direction.current, 0), icons.length - 1)]
      if (!next || next === here) return
      setDuration(TRAVEL)
      setAt(centreOf(next))
    }, DWELL)
    return () => window.clearTimeout(timer)
  }, [allowed, active, icons, onPress])

  if (!allowed || !at) return null

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[80] overflow-hidden">
      <style>{CLICK_CSS}</style>
      <div
        className="absolute left-0 top-0 transition-opacity duration-300"
        style={{
          transform: `translate3d(${at.x.toFixed(1)}px,${at.y.toFixed(1)}px,0)`,
          transition: `transform ${duration}ms cubic-bezier(.36,.02,.16,1), opacity 300ms ease-out`,
          opacity: awake ? 1 : 0,
        }}
      >
        <span
          key={click}
          className="absolute left-[3px] top-[5px] block h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle,rgba(255,255,255,.9) 0%,rgba(255,255,255,0) 70%)',
            animation: 'ax-cursor-click .5s ease-out both',
          }}
        />
        {/* The Mac arrow: a black body with a white keyline, which is what
            keeps it legible over a bright wallpaper and a dark dock alike. */}
        <svg viewBox="0 0 24 24" className="relative block h-[23px] w-[23px]"
             style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.45))' }}>
          <path
            d="M5 2.6 5 19.2 9.35 15.1 12.1 21.4 15.1 20.1 12.45 13.95 18.3 13.4 Z"
            fill="#14161C"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}
