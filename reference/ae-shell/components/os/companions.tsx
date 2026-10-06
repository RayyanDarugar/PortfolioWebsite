import { userPayoutPerMonth } from '@/lib/model/payout'
import { USER_REVENUE_SHARE } from '@/lib/model/figures'
import { OSWindow } from './OSWindow'
import { INK } from './chrome'

/**
 * The second window.
 *
 * A desktop where exactly one window is open at every moment is a desktop
 * nobody works on. Two of the seven sections open a supporting window
 * alongside the main one — a Finder beside System Settings, a Notes beside
 * Mail — which is what gives the scroll a rhythm of busy and calm instead of
 * a metronome.
 *
 * They are small and they are quiet on purpose. A companion that competes
 * with the window it is supporting is just a second slide.
 */

/** One row of the Finder list. Geometry the app has classified as free, which
 *  is exactly the thing the product sells and the only thing it can see. */
const RECTS: readonly { name: string; size: string; kind: string }[] = [
  { name: 'right-of-editor', size: '412 × 690', kind: 'Free' },
  { name: 'below-terminal', size: '640 × 244', kind: 'Free' },
  { name: 'second-display', size: '300 × 250', kind: 'Serving' },
  { name: 'behind-finder', size: '188 × 120', kind: 'Too small' },
]

export function FinderCompanion() {
  return (
    <OSWindow title="Free rectangles" subtitle={`${RECTS.length} items`}>
      <div className="flex h-full min-h-0 flex-col">
        <div
          className="flex items-center gap-2 px-[14px] py-[7px] text-[10.5px] font-bold uppercase tracking-[.09em] text-[#7A8593]"
          style={{
            fontFamily: 'var(--font-ui)',
            background: 'linear-gradient(#F4F7FA,#E8EDF3)',
            borderBottom: '1px solid rgba(20,26,34,.13)',
          }}
        >
          <span className="flex-1">Name</span>
          <span className="w-[74px] text-right">Size</span>
          <span className="w-[66px] text-right">Status</span>
        </div>

        {RECTS.map((rect, i) => (
          <div
            key={rect.name}
            className="flex items-center gap-2 px-[14px] py-[8px] text-[12.5px]"
            style={{
              fontFamily: 'var(--font-ui)',
              background: i % 2 ? 'rgba(20,26,34,.028)' : 'transparent',
              borderBottom: '1px solid rgba(20,26,34,.06)',
            }}
          >
            <span
              aria-hidden
              className="h-[13px] w-[15px] flex-none rounded-[2.5px]"
              style={{
                border: '1.5px dashed rgba(95,175,0,.85)',
                background: 'rgba(123,224,0,.16)',
              }}
            />
            <span className="min-w-0 flex-1 truncate text-[#26313D]">{rect.name}</span>
            <span className="tabular w-[74px] flex-none text-right text-[11.5px] text-[#6C7889]">
              {rect.size}
            </span>
            <span
              className="w-[66px] flex-none text-right text-[11px] font-bold"
              style={{ color: rect.kind === 'Free' ? '#5FAF00' : '#8A94A2' }}
            >
              {rect.kind}
            </span>
          </div>
        ))}

        <div
          className="mt-auto px-[14px] py-[8px] text-[11px] text-[#7A8593]"
          style={{
            fontFamily: 'var(--font-ui)',
            background: 'linear-gradient(#F4F7FA,#E7ECF3)',
            borderTop: '1px solid rgba(20,26,34,.13)',
          }}
        >
          Geometry only. No pixels leave this machine.
        </div>
      </div>
    </OSWindow>
  )
}

/** The note the visitor would have written themselves. It carries no figure
 *  the page does not already carry — it is the argument in one hand, next to
 *  the letter that acts on it. */
export function NotesCompanion() {
  return (
    <OSWindow title="Notes" subtitle="Today">
      <div
        className="flex h-full min-h-0 flex-col p-[18px_20px]"
        // One `background`, not a shorthand and then a `backgroundImage` —
        // the second would replace the first's image layer rather than sit
        // over it, and the paper would go with it. Rules first, paper under.
        style={{
          background: [
            'repeating-linear-gradient(to bottom,transparent 0 25px,rgba(20,26,34,.07) 25px 26px)',
            'linear-gradient(#FFFCEE,#FBF4DA)',
          ].join(','),
        }}
      >
        <b className="text-[14px] font-bold leading-[1.3] text-[#3A3222]">
          Worth doing?
        </b>
        <ul className="mt-[10px] space-y-[9px] text-[12.5px] leading-[1.5]" style={{ color: INK.body }}>
          <li>Costs nothing. Space is already empty.</li>
          <li>
            <b className="tabular font-bold text-[#3A3222]">
              ${userPayoutPerMonth().toFixed(2)}
            </b>{' '}
            a month, paid in credits.
          </li>
          <li>
            <b className="tabular font-bold text-[#3A3222]">
              {Math.round(USER_REVENUE_SHARE.value * 100)}%
            </b>{' '}
            share. Ad load is mine to set.
          </li>
          <li>Zero is a real setting.</li>
        </ul>
        <span
          className="mt-auto pt-[14px] text-[11px] font-bold uppercase tracking-[.08em] text-[#A79A78]"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          Edited 3:41 AM
        </span>
      </div>
    </OSWindow>
  )
}
