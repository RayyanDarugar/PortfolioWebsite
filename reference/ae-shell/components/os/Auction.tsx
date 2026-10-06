'use client'
import { useEffect, useState } from 'react'
import { CPM_DESIGN_POINT, USER_REVENUE_SHARE } from '@/lib/model/figures'
import { formatPricePerImpression, pricePerImpression } from '@/lib/model/payout'
import { PANEL_SHADOW } from './chrome'
import { useReducedMotion } from './useReducedMotion'

/**
 * The object beside the hero window: one auction, running.
 *
 * It replaces a still of an ad card with a price tag under it, which was the
 * whole business model asserted rather than shown. This is the model itself
 * on a loop — three advertisers bid for one slot on your screen, the highest
 * wins it and pays what the second-highest bid, and that clearing price
 * splits and the larger part lands in your balance. Then it resets and runs
 * again.
 *
 * It is deliberately built in the Stocks window's language — black glass,
 * acid green for money, tabular mono for every figure, gains as bars — so
 * that when the visitor reaches the Stocks app four sections later they are
 * reading a board they have already been taught.
 *
 * Nothing here is random and nothing reads a clock. The loop is a step index
 * advanced by a `setTimeout` in an effect after mount, so the server and the
 * first client render are byte-identical, and a visitor who has asked for
 * reduced motion is shown the settled state and no timer is ever scheduled.
 */

/** The clearing price. Second-highest bid, from the model rather than typed —
 *  it is the same $25.00 the Calculator divides by and the Stocks board
 *  settles at. */
const CLEARING_CPM = CPM_DESIGN_POINT.value

interface Bidder {
  name: string
  category: string
  /** Bid CPM, in dollars. */
  bid: number
  tile: string
}

/**
 * The board.
 *
 * The two losing bids are expressed as offsets from the clearing price rather
 * than as literals, so the ordering — winner above clearing above the rest —
 * is true by construction and cannot be broken by someone editing the model's
 * design point.
 *
 * ---
 * **`components/creatives/` slots in here.** A second module is being built
 * with the invented brands and their artwork. When it lands, replace this
 * constant with an import from it: this component consumes nothing but
 * `{ name, category, bid, tile }` in descending bid order, and nothing else
 * in this file has to change.
 */
const BIDDERS: readonly Bidder[] = [
  {
    name: 'Northlake', category: 'AI tools',
    bid: CLEARING_CPM + 6.1, tile: 'linear-gradient(#8AC6FF,#2069CE)',
  },
  {
    name: 'Basalt', category: 'Productivity tools',
    bid: CLEARING_CPM, tile: 'linear-gradient(#C4A6FF,#7A4BD0)',
  },
  {
    name: 'Verge Cloud', category: 'Cloud storage',
    bid: CLEARING_CPM - 2.6, tile: 'linear-gradient(#FFC46E,#F0801F)',
  },
]

const TOP_BID = BIDDERS[0].bid

/** What one slot clears for, and what of it is yours. Both from `lib/model`. */
const SLOT_PRICE = pricePerImpression(CLEARING_CPM)
const YOUR_SHARE = SLOT_PRICE * USER_REVENUE_SHARE.value

/**
 * The loop, in milliseconds per step.
 *
 * 0        the slot opens, empty
 * 1–3      the three bids arrive
 * 4        the auction decides: winner marked, clearing price marked
 * 5        it settles: your share lands in the balance
 * 6        held, so the balance is legible before it all resets
 */
const STEP_MS: readonly number[] = [760, 560, 560, 720, 1180, 1500, 1100]
const DECIDE_STEP = 4
const SETTLE_STEP = 5

export function Auction({ className = '' }: { className?: string }) {
  const reduced = useReducedMotion()
  const [step, setStep] = useState(0)
  const [cleared, setCleared] = useState(0)

  /**
   * The whole loop, and the only effect in this file.
   *
   * A visitor who has asked for reduced motion is walked to the settled step
   * once and left there — every bid in, the auction decided, one slot's share
   * in the balance. A still, not a stopped animation, and no timer is ever
   * scheduled for them again.
   *
   * The step is rendered from state rather than from `reduced`, which is what
   * keeps the server render and the first client render identical: the server
   * has to assume reduced motion, and if the settled state were derived from
   * that assumption the panel would paint settled and then jump back to an
   * empty board the moment the client knew better.
   */
  useEffect(() => {
    if (reduced) {
      if (step === SETTLE_STEP) return
      const settle = window.setTimeout(() => { setStep(SETTLE_STEP); setCleared(1) }, 0)
      return () => window.clearTimeout(settle)
    }
    const timer = window.setTimeout(() => {
      const next = (step + 1) % STEP_MS.length
      setStep(next)
      if (next === SETTLE_STEP) setCleared((n) => n + 1)
    }, STEP_MS[step] ?? 900)
    return () => window.clearTimeout(timer)
  }, [reduced, step])

  const bidsIn = Math.min(step, BIDDERS.length)
  const decided = step >= DECIDE_STEP
  const settled = step >= SETTLE_STEP
  const balance = cleared * YOUR_SHARE

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      role="img"
      aria-label={
        `One advertising slot on your screen going to auction. ${BIDDERS.length} advertisers bid; `
        + `the highest wins and pays the second-highest bid of $${CLEARING_CPM.toFixed(2)} per thousand `
        + `impressions, which is ${formatPricePerImpression(SLOT_PRICE)} for the slot. `
        + `${Math.round(USER_REVENUE_SHARE.value * 100)}% of that settles to your credit balance.`
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
          className="block h-[8px] w-[8px] flex-none rounded-full transition-shadow duration-300"
          style={{
            background: settled ? '#7BE000' : '#FFC46E',
            boxShadow: `0 0 0 3px ${settled ? 'rgba(123,224,0,.22)' : 'rgba(255,196,110,.22)'}`,
          }}
        />
        <b
          className="text-[12.5px] font-bold tracking-[.01em] text-white"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          {settled ? 'Settled' : decided ? 'Clearing' : 'One slot on your screen'}
        </b>
        <span
          className="tabular ml-auto text-[11px] font-bold uppercase tracking-[.08em]"
          style={{ color: 'rgba(255,255,255,.40)' }}
        >
          300 × 250
        </span>
      </div>

      {/* The board */}
      <div className="px-[18px] pb-[16px] pt-[14px]">
        <div
          className="flex items-baseline justify-between text-[10px] font-bold uppercase tracking-[.11em]"
          style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.34)' }}
        >
          <span>Bidding</span>
          <span>CPM</span>
        </div>

        <div className="mt-[8px] flex flex-col gap-[7px]">
          {BIDDERS.map((bidder, i) => {
            const inBoard = i < bidsIn
            const won = decided && i === 0
            const clears = decided && i === 1
            return (
              <div
                key={bidder.name}
                className="relative flex items-center gap-[10px] overflow-hidden rounded-[9px] px-[10px] py-[8px]"
                style={{
                  background: won ? 'rgba(123,224,0,.13)' : 'rgba(255,255,255,.045)',
                  border: `1px solid ${won ? 'rgba(123,224,0,.42)' : 'rgba(255,255,255,.08)'}`,
                  opacity: inBoard ? 1 : 0,
                  transform: inBoard ? 'none' : 'translateY(7px)',
                  transition: 'opacity .34s ease-out, transform .34s cubic-bezier(.22,.86,.28,1), background .3s, border-color .3s',
                }}
              >
                {/* The bid, as a bar behind the row. It is the only thing here
                    that has to be readable without being read. */}
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${(bidder.bid / TOP_BID) * 100}%`,
                    background: won
                      ? 'linear-gradient(90deg,rgba(123,224,0,.20),rgba(123,224,0,.03))'
                      : 'linear-gradient(90deg,rgba(255,255,255,.07),rgba(255,255,255,0))',
                    transition: 'background .3s',
                  }}
                />
                <span
                  aria-hidden
                  className="relative block h-[22px] w-[22px] flex-none rounded-[6px]"
                  style={{ background: bidder.tile, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5)' }}
                />
                <span className="relative min-w-0 flex-1">
                  <b className="block truncate text-[13px] font-bold leading-[1.2] text-white">
                    {bidder.name}
                  </b>
                  <span
                    className="block truncate text-[11px] leading-[1.3]"
                    style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.44)' }}
                  >
                    {bidder.category}
                  </span>
                </span>

                {(won || clears) && (
                  <span
                    className="relative flex-none rounded-full px-[7px] py-[2px] text-[9px] font-bold uppercase tracking-[.07em]"
                    style={{
                      fontFamily: 'var(--font-ui)',
                      background: won ? '#7BE000' : 'rgba(255,255,255,.17)',
                      color: won ? '#173300' : 'rgba(255,255,255,.85)',
                    }}
                  >
                    {won ? 'Wins' : 'Sets the price'}
                  </span>
                )}

                <span className="tabular relative flex-none text-[14px] font-bold text-white">
                  ${bidder.bid.toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* The settlement */}
      <div
        className="px-[18px] py-[14px]"
        style={{
          background: 'linear-gradient(rgba(0,0,0,.30),rgba(0,0,0,.16))',
          borderTop: '1px solid rgba(255,255,255,.09)',
        }}
      >
        <div
          className="flex items-center gap-[10px] text-[11.5px]"
          style={{
            fontFamily: 'var(--font-ui)',
            color: 'rgba(255,255,255,.52)',
            opacity: decided ? 1 : 0.32,
            transition: 'opacity .34s ease-out',
          }}
        >
          <span>
            Clears at{' '}
            <b className="tabular font-bold text-white">${CLEARING_CPM.toFixed(2)}</b>
          </span>
          <span aria-hidden style={{ color: 'rgba(255,255,255,.28)' }}>→</span>
          <span>
            <b className="tabular font-bold text-white">
              {formatPricePerImpression(SLOT_PRICE)}
            </b>{' '}
            for the slot
          </span>
          <span aria-hidden style={{ color: 'rgba(255,255,255,.28)' }}>→</span>
          <span>
            <b className="tabular font-bold" style={{ color: '#B6FF63' }}>
              {Math.round(USER_REVENUE_SHARE.value * 100)}%
            </b>{' '}
            yours
          </span>
        </div>

        <div className="mt-[12px] flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div
              className="text-[10px] font-bold uppercase tracking-[.11em]"
              style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.38)' }}
            >
              Your credit balance
            </div>
            <div
              className="tabular mt-[5px] text-[clamp(26px,2.2vw,34px)] font-bold leading-none tracking-[-.03em]"
              style={{ color: settled ? '#B6FF63' : '#FFFFFF', transition: 'color .3s' }}
            >
              ${balance.toFixed(4)}
            </div>
          </div>

          {/* What just landed. It has to arrive rather than appear — the
              balance moving in its fourth decimal is not, on its own, a thing
              anybody would notice. */}
          <span
            className="tabular flex-none rounded-full px-[10px] py-[5px] text-[12.5px] font-bold"
            style={{
              background: 'rgba(123,224,0,.16)',
              border: '1px solid rgba(123,224,0,.34)',
              color: '#B6FF63',
              opacity: settled ? 1 : 0,
              transform: settled ? 'none' : 'translateY(9px)',
              transition: 'opacity .3s ease-out, transform .38s cubic-bezier(.22,.86,.28,1)',
            }}
          >
            +${YOUR_SHARE.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  )
}
