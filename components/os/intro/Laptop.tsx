'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useRef, type ReactNode } from 'react'
import { PIXEL_SCREEN_H, PIXEL_SCREEN_W } from './geometry'
import type { Zoom } from './useZoom'

/** The room. If you swap it, re-measure `SCREEN_L/T/R/B` in geometry.ts. */
export const SCENE_SRC = '/hero/scene-ambient.png'
/** The same room, breathing. The laptop must not move in it: it was measured
 *  to zero drift against the still. Re-measure if it is regenerated. */
export const SCENE_VIDEO_SRC = '/hero/scene-ambient.mp4'
/** The desktop drawn in the room's own pixel style, shown until the live one
 *  is large enough to read. */
export const SCREEN_PIXEL_SRC = '/hero/screen-pixel.png'

const PIXELATED = { imageRendering: 'pixelated' } as const

/**
 * The room, and the live desktop pasted into its drawn screen.
 *
 * One picture, with a black rectangle where the screen is; `geometry.ts` knows
 * that rectangle. The room, the clip and the desktop's transform all derive
 * from one interpolated rect, so the drawing and the live UI cannot drift
 * apart mid-flight. Once landed (`live`), the desktop renders with no
 * transform at all, so the dock's getBoundingClientRect() measurements are true.
 */
export function Laptop({
  zoom, inert, live, children,
}: { zoom: Zoom; inert: boolean; live: boolean; children: ReactNode }) {
  const video = useRef<HTMLVideoElement>(null)

  // `live` and `measured` decide whether the video element exists at all, so
  // they are dependencies: without them the room sits frozen after hydration.
  useEffect(() => {
    const el = video.current
    if (!el) return
    // play() returns a promise that rejects if the element goes away mid-call,
    // and nothing at all in older browsers.
    if (zoom.resting) Promise.resolve(el.play()).catch(() => {})
    else el.pause()
  }, [zoom.resting, zoom.measured, live])

  // Where the camera is: `flying` is the room with the desktop pasted into its
  // screen. Once landed there is no transform and no clip at all (`none`, not
  // `scale(1)`), so the dock's getBoundingClientRect() measurements are true.
  // Before the viewport is read (the server and the first client render) the
  // room at z = 0 is exactly a centred cover image, and the desktop stays out
  // of sight until it can be clipped to the screen.
  const flying = !live && zoom.measured
  const unmeasured = !live && !zoom.measured

  // One tree in every state. `children` always sits at the same position under
  // the same element types, so hydration, landing and take-off never remount
  // the desktop: its windows keep their state and spring from the dock.
  return (
    <div className="absolute inset-0 overflow-hidden">
      {unmeasured && (
        <Image src={SCENE_SRC} alt="" fill priority sizes="100vw"
               style={{ objectFit: 'cover', ...PIXELATED }} />
      )}

      {flying && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0"
          style={{
            width: zoom.sceneBox.width,
            height: zoom.sceneBox.height,
            transform: zoom.scene,
            transformOrigin: '0 0',
          }}
        >
          <Image src={SCENE_SRC} alt="" fill priority sizes="100vw"
                 style={{ objectFit: 'fill', ...PIXELATED }} />
          <video
            ref={video}
            src={SCENE_VIDEO_SRC}
            poster={SCENE_SRC}
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full"
            style={{ objectFit: 'fill', ...PIXELATED }}
          />
        </motion.div>
      )}

      {/* The desktop, cut to the drawn screen while flying. Black behind it,
          because the desktop is fitted rather than cropped and a sliver shows
          where the two shapes disagree: a lit screen with a hair of black at
          its edge. */}
      <motion.div
        className={`absolute inset-0 ${unmeasured ? 'invisible' : ''}`}
        style={flying
          ? { clipPath: zoom.clip, background: '#000' }
          : { clipPath: 'none', background: 'transparent' }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ transform: flying ? zoom.camera : 'none' }}
          inert={inert}
          aria-hidden={inert}
        >
          {children}
        </motion.div>

        {flying && (
          <motion.img
            aria-hidden
            src={SCREEN_PIXEL_SRC}
            alt=""
            width={PIXEL_SCREEN_W}
            height={PIXEL_SCREEN_H}
            className="pointer-events-none absolute left-0 top-0 max-w-none"
            style={{
              transform: zoom.pixelScreen,
              transformOrigin: '0 0',
              opacity: zoom.pixelOpacity,
              ...PIXELATED,
            }}
          />
        )}
      </motion.div>
    </div>
  )
}
