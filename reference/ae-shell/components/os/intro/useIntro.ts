'use client'
import {
  useMotionTemplate, useMotionValueEvent, useScroll, useTransform,
  type MotionValue,
} from 'framer-motion'
import { useState } from 'react'
import { useIsoLayoutEffect } from '../useIsoLayoutEffect'
import * as G from './geometry'

export interface Intro {
  /** `intro` while the machine is on the desk, `live` once the page is itself. */
  phase: G.Phase
  /** True while the camera has not started moving — the hero at rest. The
   *  ambient video plays only here, so nothing is decoding a 720p loop while
   *  the page is also scaling a full-viewport transform. */
  resting: boolean
  /** `translate(..px, ..px) scale(..)` for the desktop. */
  camera: MotionValue<string>
  /** `inset(..px ..px ..px ..px)` clipping the desktop to the screen hole. */
  clip: MotionValue<string>
  /** `translate(..px, ..px) scale(.., ..)` for the room. */
  scene: MotionValue<string>
  /** `translate(..px, ..px) scale(.., ..)` placing the drawn screen on the
   *  screen hole. Separate from {@link camera} on purpose — see `Laptop`. */
  pixelScreen: MotionValue<string>
  /** The drawn screen's opacity: 1 at rest, 0 once the live UI is legible. */
  pixelOpacity: MotionValue<number>
  /** The room's un-transformed box — its size at z = 1, which everything else
   *  is expressed relative to. Depends only on the viewport, so it is plain
   *  numbers: it changes on resize, not on scroll. */
  sceneBox: { width: number; height: number }
  heroOpacity: MotionValue<number>
  /** Pixels of upward drift as the hero leaves. */
  heroLift: MotionValue<number>
  /** `auto` or `none`. A hero at zero opacity that still swallows clicks is a
   *  dock nobody can press. */
  heroPointer: MotionValue<string>
  arrowOpacity: MotionValue<number>
}

/** How far the hero copy drifts up as it goes, in px. */
const HERO_LIFT = 48

/**
 * Scroll position to every value the intro needs.
 *
 * **Nothing here re-renders React per frame.** Framer's motion values write
 * styles directly to the DOM outside React's render cycle, so a scroll that
 * moves sixty times a second moves sixty styles and zero components. The only
 * React state is `phase`, which changes at most twice per crossing, and the
 * viewport, which changes only on resize.
 *
 * The viewport is held in state rather than read inside the transforms because
 * a transform re-reading `window.innerHeight` on every frame is a forced
 * synchronous layout sixty times a second — the single most reliable way to
 * make a scroll-driven page stutter.
 */
export function useIntro(os: boolean): Intro {
  const { scrollY } = useScroll()
  const [vp, setVp] = useState({ w: 0, h: 0 })
  const [phase, setPhase] = useState<G.Phase>('live')
  const [resting, setResting] = useState(true)

  useIsoLayoutEffect(() => {
    const read = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])

  const t = useTransform(scrollY, (y) => G.progress(y, vp.h))

  /**
   * The mount decision, and the only place the intro is ever *entered* from
   * outside a scroll event.
   *
   * `nextPhase` is asked the same question the scroll handler asks, seeded with
   * `intro`, so a visitor at the top starts on the desk and a visitor whose
   * browser restored a scroll position deep in the page starts landed rather
   * than stranded mid-flight. Leaving the desktop mode always resolves to
   * `live`, because a stacked page has no laptop to be inside of.
   */
  useIsoLayoutEffect(() => {
    if (!os) { setPhase('live'); return }
    setPhase(G.nextPhase('intro', G.progress(window.scrollY, window.innerHeight), true))
  }, [os])

  useMotionValueEvent(t, 'change', (v) => {
    setPhase((was) => G.nextPhase(was, v, os))
    // A boolean, not a number: this flips twice per crossing, so it costs two
    // renders rather than sixty a second.
    setResting(G.zoom(v) < 0.02)
  })

  const camScale = useTransform(t, (v) => G.camera(G.zoom(v), vp.w, vp.h).scale)
  const camX = useTransform(t, (v) => G.camera(G.zoom(v), vp.w, vp.h).x)
  const camY = useTransform(t, (v) => G.camera(G.zoom(v), vp.w, vp.h).y)
  const camera = useMotionTemplate`translate(${camX}px, ${camY}px) scale(${camScale})`

  const clipT = useTransform(t, (v) => G.clip(G.zoom(v), vp.w, vp.h).top)
  const clipR = useTransform(t, (v) => G.clip(G.zoom(v), vp.w, vp.h).right)
  const clipB = useTransform(t, (v) => G.clip(G.zoom(v), vp.w, vp.h).bottom)
  const clipL = useTransform(t, (v) => G.clip(G.zoom(v), vp.w, vp.h).left)
  const clip = useMotionTemplate`inset(${clipT}px ${clipR}px ${clipB}px ${clipL}px)`

  // The room is drawn at its z = 1 size and transformed down, so nothing here
  // animates width or height — a resize on one absolutely-positioned element
  // every frame is layout work sixty times a second, and this element wraps an
  // image the size of several viewports.
  const boxW = vp.w > 0 ? vp.w / G.HOLE_W : 0
  const boxH = vp.h > 0 ? vp.h / G.HOLE_H : 0
  const scX = useTransform(t, (v) => G.scene(G.zoom(v), vp.w, vp.h).x)
  const scY = useTransform(t, (v) => G.scene(G.zoom(v), vp.w, vp.h).y)
  const scSX = useTransform(t, (v) => (boxW > 0 ? G.scene(G.zoom(v), vp.w, vp.h).w / boxW : 1))
  const scSY = useTransform(t, (v) => (boxH > 0 ? G.scene(G.zoom(v), vp.w, vp.h).h / boxH : 1))
  const scene = useMotionTemplate`translate(${scX}px, ${scY}px) scale(${scSX}, ${scSY})`

  // The drawn screen is placed from the same hole rect as everything else, but
  // it is a *small* bitmap scaled up rather than a viewport-sized one scaled
  // down — which is the whole reason it is a separate transform from `camera`.
  const pxX = useTransform(t, (v) => G.hole(G.zoom(v), vp.w, vp.h).x)
  const pxY = useTransform(t, (v) => G.hole(G.zoom(v), vp.w, vp.h).y)
  const pxSX = useTransform(t, (v) => G.hole(G.zoom(v), vp.w, vp.h).w / G.PIXEL_SCREEN_W)
  const pxSY = useTransform(t, (v) => G.hole(G.zoom(v), vp.w, vp.h).h / G.PIXEL_SCREEN_H)
  const pixelScreen = useMotionTemplate`translate(${pxX}px, ${pxY}px) scale(${pxSX}, ${pxSY})`
  const pixelOpacity = useTransform(t, G.pixelFade)

  const heroOpacity = useTransform(t, G.heroFade)
  const heroLift = useTransform(t, (v) => -(1 - G.heroFade(v)) * HERO_LIFT)
  const heroPointer = useTransform(t, (v): string => (G.heroFade(v) > 0.05 ? 'auto' : 'none'))
  const arrowOpacity = useTransform(t, G.arrowFade)

  return {
    phase,
    resting,
    camera,
    clip,
    scene,
    sceneBox: { width: boxW, height: boxH },
    pixelScreen,
    pixelOpacity,
    heroOpacity,
    heroLift,
    heroPointer,
    arrowOpacity,
  }
}
