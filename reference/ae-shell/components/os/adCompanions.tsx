import { ADVERTISERS } from '@/components/creatives/advertisers'
import { Creative } from '@/components/creatives/Creative'
import { OSWindow } from './OSWindow'
import { INK } from './chrome'

/**
 * The advertiser account's supporting windows.
 *
 * Same job as `companions.tsx` on the other account: two of the seven
 * sections open a second, quieter window beside the main one, so the scroll
 * has a rhythm of busy and calm rather than one box opening seven times.
 *
 * They carry nothing load-bearing. Every figure in them is carried elsewhere
 * too, which is what lets them sit out the stacked fallback entirely.
 */

/** The advertiser the preview shows. Fixed rather than rotated: this window
 *  sits beside a form somebody is filling in, and a creative that changes
 *  while you drag a budget slider is a distraction, not a preview. */
const PREVIEW = ADVERTISERS[3]

/**
 * Beside Campaign: what the thing you are buying actually looks like, at the
 * size you are buying it. A media plan with no creative in it is a
 * spreadsheet; the point of putting the unit next to the form is that the two
 * halves of the decision are on screen together.
 */
export function PreviewCompanion() {
  return (
    <OSWindow title="Preview" subtitle="300 × 250">
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-[10px] p-[14px]"
           style={{ background: 'linear-gradient(#EEF2F7,#E1E7EF)' }}>
        <Creative advertiser={PREVIEW} size="300x250" />
        <span className="text-[11px] leading-[1.35] text-[#7A8593]"
              style={{ fontFamily: 'var(--font-ui)' }}>
          Rendered at its real size. Never scaled to fit a slot.
        </span>
      </div>
    </OSWindow>
  )
}

/**
 * Beside Mail: the note the buyer would have written to themselves before
 * sending the letter next to it — the four things they are actually deciding,
 * in the order they would decide them.
 */
export function TestPlanCompanion() {
  return (
    <OSWindow title="Notes" subtitle="Today">
      <div
        className="flex h-full min-h-0 flex-col p-[18px_20px]"
        style={{
          background: [
            'repeating-linear-gradient(to bottom,transparent 0 25px,rgba(20,26,34,.07) 25px 26px)',
            'linear-gradient(#FFFCEE,#FBF4DA)',
          ].join(','),
        }}
      >
        <b className="text-[14px] font-bold leading-[1.3] text-[#3A3222]">
          Worth a test?
        </b>
        <ul className="mt-[10px] space-y-[9px] text-[12.5px] leading-[1.5]" style={{ color: INK.body }}>
          <li>New surface. No CTR benchmark exists yet — say so in the meeting.</li>
          <li>Declared targeting is the part nobody else has.</li>
          <li>Second price. Bidding up wins surfaces, not costs.</li>
          <li>Pick the walk-away number before the test, not after.</li>
        </ul>
        <span className="mt-auto pt-[14px] text-[11px] font-bold uppercase tracking-[.08em] text-[#A79A78]"
              style={{ fontFamily: 'var(--font-ui)' }}>
          Edited 3:41 AM
        </span>
      </div>
    </OSWindow>
  )
}
