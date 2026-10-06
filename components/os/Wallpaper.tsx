import Image from 'next/image'
import { GRAIN } from './chrome'

/**
 * The desktop picture. **Swap this one line to change the wallpaper** —
 * `/wallpaper/wall-a.png` is the alternate. Nothing else in the tree names a
 * file, so there is no second place to forget.
 */
export const WALLPAPER_SRC = '/wallpaper/desktop.png'

/**
 * The wallpaper sits behind every pixel of the landing page and never scrolls
 * away, so it is the single object on the page with the most screen-time.
 *
 * Four passes:
 *
 *  1. **A base ramp**, in the picture's own tones. It is a fallback rather
 *     than decoration: it is what the visitor looks at for the milliseconds
 *     before the image decodes, and it exists so that moment is a plausible
 *     desktop rather than a white flash.
 *  2. **The picture**, `cover` and centred, through `next/image` with
 *     `priority`. Next re-encodes it and emits the preload link itself, which
 *     is worth more here than a hand-written `background-image` would be: the
 *     source is a 2MB PNG and the thing behind everything is the one thing
 *     that must never pop in.
 *  3. **Grain** at 4% in `overlay`, which keeps the hue and moves only the
 *     value — it textures the picture rather than greying it, and it kills
 *     the banding a re-encode leaves in a smooth gradient.
 *  4. **A vignette**, plus a darkening of the very top. This picture is
 *     bright through the middle, and a white window on a bright field has no
 *     edge; the vignette is what its shadow falls on and what the menu bar is
 *     translucent against.
 *
 * Nothing here animates and nothing is random: it renders identically on the
 * server and on the client.
 */
export function Wallpaper({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{
        background:
          'linear-gradient(150deg,#2A2350 0%,#4A4478 26%,#6E6C9B 46%,#9A7E9C 64%,#C58A73 82%,#E8A85C 100%)',
      }}
    >
      <Image
        src={WALLPAPER_SRC}
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />


      <div
        className="absolute inset-0"
        style={{ backgroundImage: GRAIN, opacity: 0.04, mixBlendMode: 'overlay' }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(128% 104% at 50% 46%,transparent 26%,rgba(10,6,28,.50) 100%)',
            'linear-gradient(to bottom,rgba(8,4,22,.40),transparent 11%)',
            'linear-gradient(to top,rgba(8,4,22,.30),transparent 16%)',
          ].join(','),
        }}
      />
    </div>
  )
}
