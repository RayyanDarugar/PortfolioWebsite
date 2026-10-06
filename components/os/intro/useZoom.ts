'use client'
import {
  animate, useMotionTemplate, useMotionValue, useMotionValueEvent, useTransform,
  type MotionValue,
} from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { roomRect } from '@/components/room/layout'
import { useIsoLayoutEffect } from '../useIsoLayoutEffect'
import * as G from './geometry'

/** Slow enough to read as travel into the machine, quick enough not to be a wait. */
export const ZOOM_SECONDS = 1.1

export interface Zoom {
  /** `desktop` only once the camera has landed; `room` the moment it leaves. */
  phase: G.Phase
  /** The camera has not moved. */
  resting: boolean
  /** The viewport has been read. False on the server and the first client render. */
  measured: boolean
  /** The room at rest, unpanned, in viewport px. Null until measured. */
  rest: G.Rect | null
  /** The laptop's screen at rest, in viewport px (unpanned). Removed with RoomChrome. */
  hit: G.Rect | null
  /** The pan, faded out by the zoom: `pan × (1 − z)`, so landing is never offset. */
  roomX: MotionValue<number>
  camera: MotionValue<string>
  clip: MotionValue<string>
  scene: MotionValue<string>
  pixelScreen: MotionValue<string>
  pixelOpacity: MotionValue<number>
  roomUi: MotionValue<number>
  /** The room box's size: the room at rest. The scene transform scales it from there. */
  sceneBox: { width: number; height: number }
}

export function useZoom(zoomed: boolean, reduced: boolean, pan?: MotionValue<number>): Zoom {
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

  const rest = useMemo(() => (vw > 0 ? roomRect(vw, vh) : null), [vw, vh])
  const R = rest ?? { x: 0, y: 0, w: 1, h: 1 }

  const fallbackPan = useMotionValue(0)
  const panValue = pan ?? fallbackPan
  const roomX = useTransform([panValue, z], ([p, v]) => (p as number) * (1 - (v as number)))

  const camScale = useTransform(z, (v) => G.camera(v, vw, vh, R).scale)
  const camX = useTransform(z, (v) => G.camera(v, vw, vh, R).x)
  const camY = useTransform(z, (v) => G.camera(v, vw, vh, R).y)
  const camera = useMotionTemplate`translate(${camX}px, ${camY}px) scale(${camScale})`

  const clipT = useTransform(z, (v) => G.clip(v, vw, vh, R).top)
  const clipR = useTransform(z, (v) => G.clip(v, vw, vh, R).right)
  const clipB = useTransform(z, (v) => G.clip(v, vw, vh, R).bottom)
  const clipL = useTransform(z, (v) => G.clip(v, vw, vh, R).left)
  const clip = useMotionTemplate`inset(${clipT}px ${clipR}px ${clipB}px ${clipL}px)`

  // The room box is laid out at its rest size and scaled up from there, so at
  // rest it is drawn 1:1 and crisp; the art is pixel art, so the upscale in
  // flight is drawn nearest-neighbour and stays crisp too.
  const scX = useTransform(z, (v) => G.scene(v, vw, vh, R).x)
  const scY = useTransform(z, (v) => G.scene(v, vw, vh, R).y)
  const scSX = useTransform(z, (v) => G.scene(v, vw, vh, R).w / R.w)
  const scSY = useTransform(z, (v) => G.scene(v, vw, vh, R).h / R.h)
  const scene = useMotionTemplate`translate(${scX}px, ${scY}px) scale(${scSX}, ${scSY})`

  const pxX = useTransform(z, (v) => G.hole(v, vw, vh, R).x)
  const pxY = useTransform(z, (v) => G.hole(v, vw, vh, R).y)
  const pxSX = useTransform(z, (v) => G.hole(v, vw, vh, R).w / G.PIXEL_SCREEN_W)
  const pxSY = useTransform(z, (v) => G.hole(v, vw, vh, R).h / G.PIXEL_SCREEN_H)
  const pixelScreen = useMotionTemplate`translate(${pxX}px, ${pxY}px) scale(${pxSX}, ${pxSY})`
  const pixelOpacity = useTransform(z, G.pixelFade)
  const roomUi = useTransform(z, G.roomUiFade)

  const measured = vw > 0
  return {
    phase: zoomed && arrived ? 'desktop' : 'room',
    resting,
    measured,
    rest,
    hit: rest ? G.hole(0, vw, vh, rest) : null,
    roomX,
    camera,
    clip,
    scene,
    pixelScreen,
    pixelOpacity,
    roomUi,
    sceneBox: { width: R.w, height: R.h },
  }
}
