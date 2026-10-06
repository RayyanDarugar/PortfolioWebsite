'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useRef, type ReactNode } from 'react'
import { PIXEL_SCREEN_H, PIXEL_SCREEN_W } from './geometry'
import type { Intro } from './useIntro'

/**
 * **Swap this one line to change the hero's picture.** If you do, re-measure
 * the screen rectangle: `SCREEN_L/T/R/B` in `geometry.ts` are read off this
 * exact file, and nothing else in the tree knows where the screen is.
 */
export const SCENE_SRC = '/hero/scene-ambient.png'

/**
 * The same room, breathing: steam off the mug, the trailing plant swaying, dust
 * in the sunbeam, the sunset shifting. Rendered from {@link SCENE_SRC} itself,
 * so the two are the same picture and swapping between them is invisible.
 *
 * **The laptop must not move in it.** Everything here depends on the drawn
 * screen sitting at fixed coordinates, and a machine that wanders even a few
 * pixels would show as the desktop sliding around inside its own bezel. This
 * clip was measured before being wired in: zero drift on all four edges across
 * the full five seconds, and its screen matches the still's to within 0.001.
 * Re-measure the same way if it is ever regenerated.
 */
export const SCENE_VIDEO_SRC = '/hero/scene-ambient.mp4'

/**
 * The desktop, drawn.
 *
 * At rest the laptop's screen is a couple of hundred pixels across, and the
 * real UI rendered into it is an illegible smear of eleven-pixel type — a
 * screenshot of a website seen from across a room, in the middle of a picture
 * that is otherwise entirely hand-drawn. This is that screen in the room's own
 * language, and it hands over to the live one early in the zoom, well before
 * anybody could read either.
 *
 * It is deliberately a *small* file — 344px across, nearest-neighbour
 * downsampled from the generated original, which is a quarter the size and a
 * tenth the weight. Averaging would have been wrong: it invents intermediate
 * colours between two flat fills, and a limited palette must never have those.
 */
export const SCREEN_PIXEL_SRC = '/hero/screen-pixel.png'

/**
 * The room, and the machine in it.
 *
 * This is one picture. Earlier versions built the laptop separately — first out
 * of CSS boxes, four times over, then as its own generated sprite composited on
 * top of the room — and every one read as a sticker. The reason is not
 * alignment, which was exact. It is that two separately drawn things never
 * share a light: the machine cast no shadow on the desk it stood on, caught
 * none of the sunbeam falling across the room, and sat in a palette that had
 * been mixed for a different picture. Drawing it in solved the seam by removing
 * it. The laptop now has a shadow on the desk because somebody drew one.
 *
 * The cost is the lid. A bitmap cannot rotate in 3D without resampling into
 * mush, and a generated frame sequence is not available — the model has no
 * persistent 3D understanding of the object, so consecutive frames either swing
 * the camera round or collapse to a flat profile. Both were tried; both are in
 * the plan's shots directory. So the laptop is open from the start, the way
 * cofounder.co's is, and the camera does the work the lid used to.
 *
 * ### How a live desktop gets into a drawing
 *
 * The picture is drawn with a flat black rectangle where the screen is, and
 * `geometry.ts` knows that rectangle's coordinates. Everything below is derived
 * from one interpolated scene rect — where the picture sits, where its screen
 * is, and what the desktop is clipped to — so the drawing and the live UI
 * cannot drift apart at any point in the scroll. Interpolating them separately
 * is how you get a hairline of desk showing between the bezel and the desktop
 * at one scroll position on one screen size and nowhere else.
 *
 * At the landing everything resolves to identity: no transform on the desktop,
 * no clip, and the room scaled far outside the frame. That is the whole safety
 * property — the landed page is the tree that shipped before any of this
 * existed, so the dock's `getBoundingClientRect()` measurements, and the ghost
 * cursor placed from them, are untouched.
 */
export function Laptop({
  intro, inert, live, children,
}: { intro: Intro; inert: boolean; live: boolean; children: ReactNode }) {
  const video = useRef<HTMLVideoElement>(null)

  /**
   * The clip runs only while the hero is at rest.
   *
   * Decoding a 720p loop *and* scaling a full-viewport transform on the same
   * frames is the one place this page could plausibly drop frames, and it buys
   * nothing: once the camera is moving, the room is travelling past too fast
   * for anyone to notice steam. `play()` returns a promise that rejects if the
   * element is removed mid-call, which is not an error worth surfacing.
   *
   * **`live` is in the dependencies because it decides whether the element
   * exists at all**, and leaving it out shipped a real bug. `phase` starts
   * `live` on the server and on the first client render — that is the
   * hydration contract — and the branch below renders no video in that state.
   * So the element appears on the *second* render, once a layout effect has
   * resolved the phase, and an effect keyed only on `resting` does not re-run
   * for that: `resting` was true the whole time. The room sat frozen until the
   * visitor scrolled down and back up, because that was the first thing that
   * changed `resting` and therefore the first thing that ran this effect while
   * there was something to play.
   */
  useEffect(() => {
    const el = video.current
    if (!el) return
    if (intro.resting) el.play().catch(() => {})
    else el.pause()
  }, [intro.resting, live])

  // Not a scaled-to-1 transform — none at all. Any transform value creates a
  // containing block and changes how descendants position themselves, and this
  // subtree holds a dock measured in viewport coordinates.
  if (live) {
    return <div className="absolute inset-0" inert={inert}>{children}</div>
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* The room. Drawn at its final size and scaled down, so the transform
          does all the work and no frame of this animation touches layout. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0"
        style={{
          width: intro.sceneBox.width,
          height: intro.sceneBox.height,
          transform: intro.scene,
          transformOrigin: '0 0',
        }}
      >
        {/* The still is the floor, not a fallback: it paints immediately, it
            is what the poster frame would have been, and it is what remains if
            the clip fails to load or decode. The video lies exactly on top. */}
        <Image
          src={SCENE_SRC}
          alt=""
          fill
          priority
          sizes="100vw"
          // Pixel art has to be told not to be helped. Browsers smooth an
          // upscaled bitmap by default, and a blurred pixel room announces that
          // the picture was made at the wrong size for the page.
          style={{ objectFit: 'fill', imageRendering: 'pixelated' }}
        />
        <video
          ref={video}
          src={SCENE_VIDEO_SRC}
          poster={SCENE_SRC}
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: 'fill', imageRendering: 'pixelated' }}
        />
      </motion.div>

      {/* The desktop, cut to the drawn screen. Rendered at full viewport size
          and scaled *down*, never rendered small and scaled up, so nothing is
          resampled at rest and the landed page is pixel-exact.

          The black fill is the screen behind the desktop. The desktop is fitted
          inside the drawn screen rather than cropped to fill it, so a sliver
          shows where the two shapes disagree — and a lit screen with a hair of
          black at its edge is a screen, whereas a hair of bookshelf showing
          through it is a hole. */}
      <motion.div
        className="absolute inset-0"
        style={{ clipPath: intro.clip, background: '#000' }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ transform: intro.camera }}
          inert={inert}
        >
          {children}
        </motion.div>

        {/* The drawn screen, over the live one.

            Its own transform rather than the camera's, and that is the whole
            trick: the live desktop is rendered at viewport size and scaled
            *down* into the hole, but doing that to pixel art destroys it — the
            grid disappears into a smear. This is a small bitmap scaled *up*
            instead, so its pixels are near their native size at rest and get
            chunkier as the camera closes in, which is what pixel art is
            supposed to do. */}
        <motion.img
          aria-hidden
          src={SCREEN_PIXEL_SRC}
          alt=""
          width={PIXEL_SCREEN_W}
          height={PIXEL_SCREEN_H}
          className="pointer-events-none absolute left-0 top-0 max-w-none"
          style={{
            transform: intro.pixelScreen,
            transformOrigin: '0 0',
            opacity: intro.pixelOpacity,
            imageRendering: 'pixelated',
          }}
        />
      </motion.div>
    </div>
  )
}
