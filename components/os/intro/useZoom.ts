'use client'
import {
  animate, useMotionTemplate, useMotionValue, useMotionValueEvent, useTransform,
  type MotionValue,
} from 'framer-motion'
import { useEffect, useState } from 'react'
import { useIsoLayoutEffect } from '../useIsoLayoutEffect'
import * as G from './geometry'

/** Slow enough to read as travel into the machine, quick enough not to be a wait. */
export const ZOOM_SECONDS = 1.1

export interface Zoom {
  /** `desktop` only once the camera has landed; `room` the moment it leaves. */
  phase: G.Phase
  /** The camera has not moved. The ambient video plays only then. */
  resting: boolean
  /** The viewport has been read. False on the server and the first client render. */
  measured: boolean
  /** The laptop's screen at rest, in viewport px: the click target. */
  hit: G.Rect | null
  camera: MotionValue<string>
  clip: MotionValue<string>
  scene: MotionValue<string>
  pixelScreen: MotionValue<string>
  pixelOpacity: MotionValue<number>
  roomUi: MotionValue<number>
  /** The room's un-transformed box: its size at z = 1. Changes on resize only. */
  sceneBox: { width: number; height: number }
}

/**
 * Animates camera progress `z` toward the URL's answer and derives every style
 * the zoom needs from it.
 *
 * Nothing here re-renders React per frame: the styles are motion values written
 * straight to the DOM. The only React state is the viewport and two booleans
 * that flip at the ends of a flight. `phase` is derived from where `z` actually
 * is, not from a completion callback, so a flight reversed halfway never
 * reports a landing it did not make.
 */
export function useZoom(zoomed: boolean, reduced: boolean): Zoom {
  const z = useMotionValue(zoomed ? 1 : 0)
  const [vp, setVp] = useState({ w: 0, h: 0 })
  const [arrived, setArrived] = useState(zoomed)
  const [resting, setResting] = useState(!zoomed)

  useIsoLayoutEffect(() => {
    const read = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])

  useMotionValueEvent(z, 'change', (v) => {
    setArrived(v >= 1)
    setResting(v < 0.02)
  })

  useEffect(() => {
    const target = zoomed ? 1 : 0
    if (reduced) {
      z.set(target)
      return
    }
    const controls = animate(z, target, { duration: ZOOM_SECONDS, ease: 'easeInOut' })
    return () => controls.stop()
  }, [zoomed, reduced, z])

  const { w: vw, h: vh } = vp

  const camScale = useTransform(z, (v) => G.camera(v, vw, vh).scale)
  const camX = useTransform(z, (v) => G.camera(v, vw, vh).x)
  const camY = useTransform(z, (v) => G.camera(v, vw, vh).y)
  const camera = useMotionTemplate`translate(${camX}px, ${camY}px) scale(${camScale})`

  const clipT = useTransform(z, (v) => G.clip(v, vw, vh).top)
  const clipR = useTransform(z, (v) => G.clip(v, vw, vh).right)
  const clipB = useTransform(z, (v) => G.clip(v, vw, vh).bottom)
  const clipL = useTransform(z, (v) => G.clip(v, vw, vh).left)
  const clip = useMotionTemplate`inset(${clipT}px ${clipR}px ${clipB}px ${clipL}px)`

  // The room is drawn at its z = 1 size and transformed down, so no frame of
  // the flight touches layout.
  const boxW = vw > 0 ? vw / G.HOLE_W : 0
  const boxH = vh > 0 ? vh / G.HOLE_H : 0
  const scX = useTransform(z, (v) => G.scene(v, vw, vh).x)
  const scY = useTransform(z, (v) => G.scene(v, vw, vh).y)
  const scSX = useTransform(z, (v) => (boxW > 0 ? G.scene(v, vw, vh).w / boxW : 1))
  const scSY = useTransform(z, (v) => (boxH > 0 ? G.scene(v, vw, vh).h / boxH : 1))
  const scene = useMotionTemplate`translate(${scX}px, ${scY}px) scale(${scSX}, ${scSY})`

  // The drawn screen is a small bitmap scaled *up* onto the hole, which is why
  // it has its own transform rather than sharing the camera's.
  const pxX = useTransform(z, (v) => G.hole(v, vw, vh).x)
  const pxY = useTransform(z, (v) => G.hole(v, vw, vh).y)
  const pxSX = useTransform(z, (v) => G.hole(v, vw, vh).w / G.PIXEL_SCREEN_W)
  const pxSY = useTransform(z, (v) => G.hole(v, vw, vh).h / G.PIXEL_SCREEN_H)
  const pixelScreen = useMotionTemplate`translate(${pxX}px, ${pxY}px) scale(${pxSX}, ${pxSY})`
  const pixelOpacity = useTransform(z, G.pixelFade)
  const roomUi = useTransform(z, G.roomUiFade)

  const measured = vw > 0
  return {
    phase: zoomed && arrived ? 'desktop' : 'room',
    resting,
    measured,
    hit: measured ? G.hole(0, vw, vh) : null,
    camera,
    clip,
    scene,
    pixelScreen,
    pixelOpacity,
    roomUi,
    sceneBox: { width: boxW, height: boxH },
  }
}
