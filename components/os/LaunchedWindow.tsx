'use client'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { windowChromeVars, type Box } from './chrome'
import {
  STAGE_GUARD_BOTTOM, STAGE_GUARD_SIDE, STAGE_GUARD_TOP, clamp,
  type WindowFrame,
} from './stage'
import { useIsoLayoutEffect } from './useIsoLayoutEffect'

interface Transform { x: number; y: number; scale: number }

/** Used until the dock has been measured — on the server, and for the frame
 *  or two before the first layout effect runs. It never plays as an
 *  animation, because nothing is animating yet at that point; it only has to
 *  be somewhere off-stage and invisible. */
const FALLBACK: Transform = { x: 0, y: 140, scale: 0.86 }

/**
 * Opening overshoots. A spring rather than a tween because the overshoot has
 * to be a property of the motion rather than a keyframe bolted onto the end
 * of it — a window that springs past its resting size and settles reads as
 * something with mass, which is the entire difference between this and a
 * fade-in.
 */
const OPEN = {
  type: 'spring' as const,
  stiffness: 168,
  damping: 17,
  mass: 0.92,
  opacity: { duration: 0.2, ease: 'easeOut' as const },
}

/**
 * Closing does not. A minimise is a fast accelerating drop into the dock,
 * and springing on the way down would read as the window bouncing off the
 * bottom of the screen. The opacity is held for the first third so the
 * window is still visible while it is travelling, and gone before it
 * arrives — otherwise it lands as a visible speck on top of its own icon.
 */
const CLOSE = {
  duration: 0.42,
  ease: [0.5, 0, 0.75, 0] as [number, number, number, number],
  opacity: { duration: 0.26, delay: 0.12 },
}

interface Placed {
  /** Onto this window's own dock tile, at that tile's size. */
  closed: Transform
  /** Off dead centre, by this window's frame, clamped into the free space. */
  open: { x: number; y: number }
}

/**
 * One window on the stage.
 *
 * Two destinations, both computed from the same measured box so they cannot
 * disagree with each other:
 *
 *  - **Closed.** The launch origin is measured, not assumed: `icon` is the
 *    live viewport box of this app's dock tile, handed down by the OS root,
 *    and the closed transform maps this window's centre onto that tile's
 *    centre at that tile's width. Hardcoding the dock's position would put
 *    the origin in the right place at exactly one viewport width and visibly
 *    wrong at every other.
 *  - **Open.** Dead centre plus this app's frame offset — the thing that
 *    stops seven windows being the same box in the same place. The offset is
 *    clamped against the free space the stage's own padding leaves, so a
 *    frame cannot push a window under the dock or behind the menu bar however
 *    short the viewport gets.
 *
 * The window's own box is read from `offsetLeft/offsetTop/offsetWidth`, not
 * from `getBoundingClientRect()`. The rect is the *transformed* box, and this
 * element is under a transform for most of its life, so measuring it that way
 * would feed each frame's animation back into the next frame's origin. The
 * stage's box is read from the parent's rect, which is untransformed.
 */
export function LaunchedWindow({
  active, icon, frame, stageInset,
  delay = 0, behind = false, children,
}: {
  active: boolean
  icon: Box | null
  frame: WindowFrame
  /** Menu bar, dock, and the breathing room either side, in px. */
  stageInset: number
  /** Seconds to hold before opening. Used by the companion windows. */
  delay?: number
  /** Sits under the frontmost window rather than over it. A supporting window
   *  that covers the one it is supporting is not supporting it, and on a Mac
   *  the window you are talking to is the one on top. */
  behind?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [placed, setPlaced] = useState<Placed | null>(null)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const parent = el.offsetParent as HTMLElement | null
    if (!parent) return
    const base = parent.getBoundingClientRect()
    const w = el.offsetWidth
    const h = el.offsetHeight
    if (!w || !h) return

    const left = el.offsetLeft
    const top = el.offsetTop

    // The free space the flex centring has left on each side. Offsetting into
    // more than this is what would clip a window against the chrome.
    const roomLeft = Math.max(left - STAGE_GUARD_SIDE, 0)
    const roomRight = Math.max(parent.clientWidth - left - w - STAGE_GUARD_SIDE, 0)
    const roomUp = Math.max(top - STAGE_GUARD_TOP, 0)
    const roomDown = Math.max(parent.clientHeight - top - h - STAGE_GUARD_BOTTOM, 0)

    const open = {
      x: clamp(base.width * frame.dx, -roomLeft, roomRight),
      y: clamp(base.height * frame.dy, -roomUp, roomDown),
    }

    setPlaced({
      open,
      closed: icon
        ? {
          x: icon.x + icon.w / 2 - (base.left + left + w / 2),
          y: icon.y + icon.h / 2 - (base.top + top + h / 2),
          // Floored so a very wide window does not scale to a sub-pixel
          // speck, which some browsers rasterise as nothing at all part-way
          // through the travel — the window appears to vanish rather than to
          // shrink.
          scale: Math.max(icon.w / w, 0.05),
        }
        : FALLBACK,
    })
  }, [icon, frame.dx, frame.dy])

  useIsoLayoutEffect(() => { measure() }, [measure])

  // The window's own height changes with its content — the ad-load slider
  // moves a line of text in System Settings, and a font swap moves all of
  // them. Re-measuring on resize alone would leave the origin computed
  // against a height the window no longer has.
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  const rest = placed?.closed ?? FALLBACK

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-[clamp(16px,2.6vw,52px)] pb-[112px] pt-[56px]">
      <motion.div
        ref={ref}
        data-os-window
        className={`flex w-full flex-col ${active ? 'pointer-events-auto' : ''}`}
        // The chrome variables ride on the wrapper rather than being drilled
        // through seven app components: the launcher is the one place that
        // already knows which window is frontmost, so it is the one place that
        // should decide how brightly it is lit.
        style={{
          maxWidth: frame.w,
          maxHeight: `calc((100vh - ${stageInset}px) * ${frame.h})`,
          zIndex: active ? (behind ? 25 : 30) : 20,
          ...windowChromeVars(active),
        }}
        inert={!active}
        aria-hidden={!active}
        initial={false}
        animate={active
          ? { x: placed?.open.x ?? 0, y: placed?.open.y ?? 0, scale: 1, opacity: 1 }
          : { x: rest.x, y: rest.y, scale: rest.scale, opacity: 0 }}
        transition={active ? { ...OPEN, delay } : CLOSE}
      >
        {children}
      </motion.div>
    </div>
  )
}
