'use client'
import { useEffect, useState } from 'react'
import { ADVERTISERS } from '@/components/creatives/advertisers'
import { Creative } from '@/components/creatives/Creative'
import { CPM_DESIGN_POINT } from '@/lib/model/figures'
import { formatPricePerImpression, pricePerImpression } from '@/lib/model/payout'
import { advertisersOn, clearingCpm, surfaceById } from './adData'
import { PANEL_SHADOW } from './chrome'
import { useReducedMotion } from './useReducedMotion'

/**
 * The object beside the advertiser hero: the slot itself, with a real
 * creative in it.
 *
 * The other account gets `Auction.tsx` — three bids arriving and a balance
 * filling up, because what a person renting their screen out wants to watch
 * is money landing. An advertiser wants the opposite view of the same
 * transaction: *where does my unit actually go, and what did I pay for it.*
 * So this panel is the placement, at its real pixel size, rotating through
 * the advertisers currently winning it, with the second-price line under it.
 *
 * Its lesson is one sentence and it is the one that matters to a buyer: your
 * bid is not your price. The winner pays what the runner-up bid, every time,
 * and the panel proves it by printing both numbers side by side while the
 * creative changes above them.
 *
 * Deterministic, like everything else on this page: the rotation is a step
 * index advanced by one `setTimeout` in one effect, never a clock, never
 * random. Under `prefers-reduced-motion` it settles on the first placement
 * and no timer is scheduled again.
 */

/** This panel is the side card, at its real 300 × 250 size, so it prices
 *  against the side card's own clearing CPM — the same number the Bid
 *  Console's board and `adData.ts` print, not a figure worked out from
 *  whichever two advertisers happen to sort next to each other. */
const SIDE_CARD = surfaceById('card')
if (!SIDE_CARD) throw new Error('AdSlot: "card" is missing from adData.SURFACES')
const SIDE_CARD_CPM = clearingCpm(SIDE_CARD)

/**
 * Who gets to rotate through this slot: every advertiser whose best-clearing
 * surface, by `adData.bestSurfaceFor`, *is* the side card — highest bid
 * first. That is the same rule the Bid Console's queue places rows by, run
 * through the same function, so the two windows cannot disagree about which
 * surface an advertiser is on. This panel used to test a looser rule of its
 * own ("bid beats the side card's price"), which is correct only as long as
 * no bid also beats the wait-state unit's higher price — the moment one did,
 * this panel would show that advertiser on the side card while the Bid
 * Console showed them on the wait-state unit instead. Routing both through
 * `bestSurfaceFor` makes that disagreement structurally impossible rather
 * than merely untested.
 *
 * Paying strictly less than the bid, never equal to it, matches the
 * exchange's own tie-break: a bid that only matches the price does not win.
 */
export const PLACEMENTS = advertisersOn('card', ADVERTISERS)
  .slice(0, 3)
  .map((advertiser) => ({ advertiser, paid: SIDE_CARD_CPM }))

/**
 * A guard, not a defensive habit: `PLACEMENTS[index]` below is destructured
 * unconditionally, so an empty or single-entry list does not fail loudly at
 * the point of use — it either throws deep inside a render with no context,
 * or (worse, with one entry) renders a "rotation" that never moves and never
 * tells anyone why. That silent one-frame rotation is the exact bug this
 * module is being fixed to not have. Throwing here, at module load, with the
 * bids named as the cause, is what keeps it fixed: the next time the nine
 * advertisers' bids are re-tuned without checking that at least two of them
 * still clear the side card, the app fails to build instead of quietly
 * reverting to a one-advertiser "rotation".
 */
if (PLACEMENTS.length < 2) {
  throw new Error(
    `AdSlot: only ${PLACEMENTS.length} advertiser(s) clear the side card ($${SIDE_CARD_CPM.toFixed(2)}) — `
    + 'the nine bids in components/creatives/advertisers.tsx no longer straddle it. '
    + 'Re-tune at least two bids above that price so the panel has a real rotation.',
  )
}

const HOLD_MS = 3200
const FADE_MS = 380

/** The design point, for the line that anchors the panel to the rest of the
 *  site's arithmetic. */
const DESIGN_CPM = CPM_DESIGN_POINT.value

export function AdSlot({ className = '' }: { className?: string }) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  /** Drops to 0 for the length of the swap so one creative is never
   *  half-replaced by the next. */
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (reduced) return
    const out = window.setTimeout(() => setVisible(false), HOLD_MS)
    const swap = window.setTimeout(() => {
      setIndex((n) => (n + 1) % PLACEMENTS.length)
      setVisible(true)
    }, HOLD_MS + FADE_MS)
    return () => {
      window.clearTimeout(out)
      window.clearTimeout(swap)
    }
  }, [reduced, index])

  const { advertiser, paid } = PLACEMENTS[index]

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      role="img"
      aria-label={
        `One advertising slot in free space on someone's screen, 300 by 250 pixels. `
        + `${advertiser.name} won it with a bid of $${advertiser.bid.toFixed(2)} per thousand `
        + `impressions and pays $${paid.toFixed(2)} — the runner-up's bid. `
        + `That is ${formatPricePerImpression(pricePerImpression(paid))} for the impression.`
      }
      style={{
        borderRadius: 16,
        background: 'linear-gradient(#24262C,#141519)',
        boxShadow: PANEL_SHADOW,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-[18px] py-[13px]"
        style={{
          background: 'linear-gradient(rgba(255,255,255,.07),rgba(255,255,255,.02))',
          borderBottom: '1px solid rgba(255,255,255,.09)',
        }}
      >
        <span
          aria-hidden
          className="block h-[8px] w-[8px] flex-none rounded-full"
          style={{ background: '#7BE000', boxShadow: '0 0 0 3px rgba(123,224,0,.22)' }}
        />
        <b className="text-[12.5px] font-bold tracking-[.01em] text-white"
           style={{ fontFamily: 'var(--font-ui)' }}>
          Serving — side card
        </b>
        <span className="tabular ml-auto text-[11px] font-bold uppercase tracking-[.08em]"
              style={{ color: 'rgba(255,255,255,.40)' }}>
          300 × 250
        </span>
      </div>

      {/* Where on the screen it is. A schematic rather than a screenshot: the
          point is the *shape* of the space — the window the person is working
          in, and the rectangle beside it that nothing is using. */}
      <div className="px-[18px] pt-[14px]">
        <div
          aria-hidden
          className="relative h-[58px] w-full overflow-hidden rounded-[7px]"
          style={{ background: 'linear-gradient(150deg,#39324F,#221E33)' }}
        >
          <div
            className="absolute left-[6px] top-[6px] h-[46px] w-[58%] rounded-[4px]"
            style={{ background: 'rgba(255,255,255,.86)' }}
          >
            <div className="h-[8px] rounded-t-[4px]" style={{ background: 'rgba(20,26,34,.14)' }} />
            <div className="space-y-[4px] p-[6px]">
              {[82, 64, 72].map((w) => (
                <div key={w} className="h-[3px] rounded-full"
                     style={{ width: `${w}%`, background: 'rgba(20,26,34,.16)' }} />
              ))}
            </div>
          </div>
          <div
            className="absolute right-[6px] top-[6px] flex h-[46px] w-[34%] items-center justify-center rounded-[4px]"
            style={{
              border: '1.5px dashed rgba(123,224,0,.8)',
              background: 'rgba(123,224,0,.14)',
            }}
          >
            <span className="text-[8.5px] font-bold uppercase tracking-[.1em]"
                  style={{ fontFamily: 'var(--font-ui)', color: '#B6FF63' }}>
              Free
            </span>
          </div>
        </div>
      </div>

      {/* The creative, at its real size. Nothing is scaled: a 300 × 250 unit
          drawn at 260px would be a picture of an ad rather than an ad. */}
      <div className="flex justify-center px-[18px] pb-[14px] pt-[13px]">
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateY(6px)',
            transition: `opacity ${FADE_MS}ms ease-out, transform ${FADE_MS}ms cubic-bezier(.22,.86,.28,1)`,
          }}
        >
          <Creative advertiser={advertiser} size="300x250" />
        </div>
      </div>

      {/* What it cost. */}
      <div
        className="px-[18px] py-[14px]"
        style={{
          background: 'linear-gradient(rgba(0,0,0,.30),rgba(0,0,0,.16))',
          borderTop: '1px solid rgba(255,255,255,.09)',
        }}
      >
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[.11em]"
                 style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.38)' }}>
              {advertiser.name} bid
            </div>
            <div className="tabular mt-[5px] text-[19px] font-bold leading-none tracking-[-.02em]"
                 style={{ color: 'rgba(255,255,255,.55)', textDecoration: 'line-through' }}>
              ${advertiser.bid.toFixed(2)}
            </div>
          </div>

          <span aria-hidden className="pb-[3px] text-[15px]" style={{ color: 'rgba(255,255,255,.3)' }}>→</span>

          <div className="min-w-0 text-right">
            <div className="text-[10px] font-bold uppercase tracking-[.11em]"
                 style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.38)' }}>
              Paid — the runner-up&rsquo;s bid
            </div>
            <div className="tabular mt-[5px] text-[clamp(24px,2vw,32px)] font-bold leading-none tracking-[-.03em]"
                 style={{ color: '#B6FF63' }}>
              ${paid.toFixed(2)}
            </div>
          </div>
        </div>

        <p className="mt-[12px] text-[11.5px] leading-[1.45]"
           style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.5)' }}>
          {formatPricePerImpression(pricePerImpression(paid))} for the impression. The board&rsquo;s
          design point is <b className="tabular font-bold text-white">${DESIGN_CPM.toFixed(2)}</b> —
          you never pay your own bid.
        </p>
      </div>
    </div>
  )
}
