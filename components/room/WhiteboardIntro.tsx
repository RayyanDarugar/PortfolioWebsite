import { PROFILE } from '@/content/profile'
import type { Variant } from './timeOfDay'

/** The board's surface colour in each lighting, sampled from the art. */
const BOARD: Record<Variant, string> = { sunset: '190,161,131', day: '204,198,188', night: '152,120,102' }

/**
 * The intro, written on the whiteboard in marker (spec §3): the room
 * introduces him itself. It sits on the board's top-left, where the art has
 * only scribbled bullets, on a patch of the board's own colour so it reads as
 * freshly wiped. Sizes are in `cqw` of the room box, so it scales with the room.
 *
 * Placement, in art px: x 816–1122, y 262–488, inside the whiteboard sprite
 * (792, 241, 641 × 379).
 */
export function WhiteboardIntro({ variant = 'sunset' }: { variant?: Variant }) {
  return (
    <div
      className="pointer-events-none absolute flex flex-col justify-center"
      style={{
        left: '30.36%', top: '22.74%', width: '11.38%', height: '19.62%',
        padding: '0 .7cqw',
        background: `radial-gradient(closest-side, rgba(${BOARD[variant]},.97) 74%, rgba(${BOARD[variant]},0) 100%)`,
      }}
    >
      <h1 style={{ fontFamily: 'var(--font-marker)', fontSize: '1.3cqw', lineHeight: 1.1, color: '#2f4a8a' }}>
        {PROFILE.intro}
      </h1>
      <p style={{ fontFamily: 'var(--font-marker)', fontSize: '.9cqw', lineHeight: 1.2, color: '#a3402c', marginTop: '.45cqw' }}>
        {PROFILE.tagline}
      </p>
    </div>
  )
}
