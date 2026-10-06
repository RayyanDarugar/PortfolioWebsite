'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { restCss } from '@/components/room/layout'
import { PIXEL_SCREEN_H, PIXEL_SCREEN_W } from './geometry'
import type { Zoom } from './useZoom'

/** The room, flattened (the master art). If it changes, re-measure
 *  `SCREEN_L/T/R/B` in geometry.ts; `screen-art.test.ts` fails until you do. */
export const SCENE_SRC = '/room/sunset.png'
/** The desktop drawn in the room's own pixel style, shown until the live one
 *  is large enough to read. */
export const SCREEN_PIXEL_SRC = '/hero/screen-pixel.png'

const PIXELATED = { imageRendering: 'pixelated' } as const

/** The room as one flattened picture: the default until `RoomScene` draws it in layers. */
function RoomPicture() {
  return <Image src={SCENE_SRC} alt="" fill priority sizes="112vw" style={{ objectFit: 'fill', ...PIXELATED }} />
}

/**
 * The room, and the live desktop pasted into its drawn screen.
 *
 * The room box is laid out at the room's rest size and moved by one
 * transform derived from the zoom, so the room, the screen hole and the
 * desktop's clip cannot drift apart mid-flight. The outer layer carries the
 * pan, faded out as the camera lands (`roomX`), so landing is exact.
 *
 * Before the viewport is measured (the server and the first client render)
 * the room box is placed by `restCss()`, the same rule in CSS, and the desktop
 * stays out of sight until it can be clipped to the screen. The room is drawn
 * in every state, hidden once landed, so its h1 is always in the HTML.
 */
export function Laptop({
  zoom, inert, live, room = <RoomPicture />, children,
}: { zoom: Zoom; inert: boolean; live: boolean; room?: ReactNode; children: ReactNode }) {
  const flying = !live && zoom.measured
  const unmeasured = !live && !zoom.measured
  const hidden = live ? 'hidden' : 'visible'

  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ x: zoom.roomX }}>
      <motion.div
        className="absolute"
        style={zoom.measured
          ? {
            left: 0, top: 0, width: zoom.sceneBox.width, height: zoom.sceneBox.height,
            transform: zoom.scene, transformOrigin: '0 0', visibility: hidden,
          }
          : { ...restCss(), visibility: hidden }}
      >
        {room}
      </motion.div>

      {/* The desktop, cut to the drawn screen while flying. Black behind it,
          because the desktop is fitted rather than cropped and a sliver shows
          where the two shapes disagree. */}
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
            style={{ transform: zoom.pixelScreen, transformOrigin: '0 0', opacity: zoom.pixelOpacity, ...PIXELATED }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}
