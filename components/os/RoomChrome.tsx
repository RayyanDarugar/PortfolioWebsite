'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { PROFILE } from '@/content/profile'
import { TYPE } from './chrome'
import type { Zoom } from './intro/useZoom'
import { pathFor } from './view'

const INK = '#241B12'
const PAPER = 'rgba(246,239,227,.9)'

/**
 * What sits over the room: the page's h1, the way in, and the Résumé link the
 * spec requires on screen from the first frame. Phase 3 moves the intro onto
 * the whiteboard and adds the hotbar; until then this is the room's copy.
 *
 * The laptop itself is a click target too, laid exactly over the drawn screen.
 * It is hidden from assistive tech because the "Open the laptop" button is the
 * same action with a name.
 */
export function RoomChrome({
  zoom, hidden, onOpenLaptop,
}: { zoom: Zoom; hidden: boolean; onOpenLaptop: () => void }) {
  return (
    <motion.div
      aria-hidden={hidden}
      inert={hidden}
      className="pointer-events-none absolute inset-0 z-[80]"
      style={{ opacity: zoom.roomUi }}
    >
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-6 p-[clamp(16px,3vw,40px)]">
        <div className="pointer-events-auto max-w-[38ch] rounded-[10px] px-[16px] py-[12px]"
             style={{ background: PAPER, color: INK }}>
          <h1 className={TYPE.pixelLabel} style={{ fontFamily: 'var(--font-pixel)' }}>{PROFILE.name}</h1>
          <p className="mt-[6px] text-[14px] leading-[1.45]" style={{ fontFamily: 'var(--font-ui)' }}>
            {PROFILE.tagline}
          </p>
          <button
            type="button"
            onClick={onOpenLaptop}
            className={`mt-[10px] ${TYPE.pixelLabel} underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0802C]`}
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            Open the laptop
          </button>
        </div>

        <Link
          href={pathFor({ zoomed: true, app: 'resume' })}
          scroll={false}
          className={`pointer-events-auto rounded-[10px] px-[16px] py-[10px] ${TYPE.pixelLabel} hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0802C]`}
          style={{ background: PAPER, color: INK, fontFamily: 'var(--font-pixel)' }}
        >
          Résumé
        </Link>
      </div>

      {zoom.hit && (
        // A div, not a button: it is hidden from assistive tech, so it must
        // never be able to take focus. The named button above is the same action.
        <div
          aria-hidden
          title="Open the laptop"
          onClick={onOpenLaptop}
          className="pointer-events-auto absolute cursor-pointer rounded-[3px] outline-2 outline-offset-4 outline-[#FFD36E] hover:outline"
          style={{ left: zoom.hit.x, top: zoom.hit.y, width: zoom.hit.w, height: zoom.hit.h }}
        />
      )}
    </motion.div>
  )
}
