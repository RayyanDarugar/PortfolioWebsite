'use client'
import { useState } from 'react'
import { ADVERTISERS } from '@/components/creatives/advertisers'
import { CPM_DESIGN_POINT } from '@/lib/model/figures'
import { formatPricePerImpression, pricePerImpression } from '@/lib/model/payout'
import { OSWindow } from '../OSWindow'
import { DARK_BODY } from '../chrome'
import { SURFACES, bestSurfaceFor, clearingCpm } from '../adData'
import { type CampaignPlan, impressionsOnSurface } from '../campaign'
import { Segmented, Sparkline } from '../parts'

const UP = '#30D158'
const DOWN = '#FF6B5E'

/**
 * The bid entry's range, derived from the surfaces themselves rather than
 * offset from the design point. `BID_MIN` sits five under the cheapest
 * surface's clearing price and `BID_MAX` five over the priciest, so the
 * slider straddles every surface by construction: it is not possible to
 * re-tune a surface's price without the range moving with it. The previous
 * version was an offset from `CPM_DESIGN_POINT` chosen to fit the surfaces'
 * prices *as they stood the day it was written* — a hand-picked number, not
 * a guarantee, and it had already gone stale: the wait-state unit's price
 * had drifted past `BID_MAX`, so the slider could not reach the top surface
 * no matter how far it was dragged.
 */
const SURFACE_CPMS = SURFACES.map(clearingCpm)
export const BID_MIN = Math.max(0, Math.floor(Math.min(...SURFACE_CPMS) - 5))
export const BID_MAX = Math.ceil(Math.max(...SURFACE_CPMS) + 5)
const BID_STEP = 0.25

/**
 * The queue: what has cleared in the last few minutes.
 *
 * Every row pays its surface's own clearing CPM — the same number the board
 * above it prints — never a number worked out from the advertiser next to it
 * in a sorted list. That used to be how this queue priced a row, and it
 * produced a "clearing $12.80" surface with two rows twelve pixels below it
 * paying $28.90 and $22.00: three price systems for one surface, none of
 * them the one on the board.
 *
 * Each advertiser is placed on the highest-priced surface their bid actually
 * clears — `adData.bestSurfaceFor`, the one placement rule shared with
 * `AdSlot`, so the struck-through bid above the paid figure is never a
 * number smaller than what the row claims it paid, and this queue can never
 * put an advertiser on a different surface than the side card panel does. An
 * advertiser whose bid clears nothing has no honest surface to be shown on;
 * it is left out of the queue rather than labelled with a surface it never
 * actually won.
 */
const BOARD = [...ADVERTISERS].sort((a, b) => b.bid - a.bid)

export const QUEUE = BOARD.map((advertiser) => {
  const surface = bestSurfaceFor(advertiser.bid)
  return surface ? { advertiser, surface, paid: clearingCpm(surface) } : null
})
  .filter((row): row is { advertiser: (typeof BOARD)[number]; surface: (typeof SURFACES)[number]; paid: number } => row !== null)
  .slice(0, 6)

/**
 * App 4 on the advertiser account: the live board.
 *
 * The other account gets Stocks — a list of tickers with a chart beside it,
 * because a person watching their inventory clear wants to see a price go up.
 * A buyer needs the operational version of the same screen: what each surface
 * is clearing at right now, whether their bid takes it, what a fixed budget
 * buys on each, and what has just gone through. So this is denser, it is
 * darker, and the one control on it is a bid.
 *
 * The lesson it exists to teach is the second-price one. Drag the bid up and
 * the surfaces you clear change; the price you pay does not, because you pay
 * the runner-up's bid. That is the single most counter-intuitive thing about
 * buying here, and it is much better learned on a slider than in a footnote.
 */
export function BidConsoleApp({ plan }: { plan: CampaignPlan }) {
  const [bid, setBid] = useState(CPM_DESIGN_POINT.value)

  const clears = SURFACES.filter((surface) => bid >= clearingCpm(surface))
  /**
   * What the bid actually costs, blended across the surfaces it takes. Each
   * surface settles at its own clearing price — the runner-up's bid there,
   * never yours — so the blend is the average of those, and it does not move
   * when the bid goes up. That is the whole lesson of the panel.
   */
  const paid = clears.length > 0
    ? clears.reduce((sum, surface) => sum + clearingCpm(surface), 0) / clears.length
    : 0
  const bought = paid > 0 ? Math.round(plan.budget / pricePerImpression(paid)) : 0

  return (
    <OSWindow
      title="Bid Console"
      subtitle="Live"
      bodyStyle={DARK_BODY}
      toolbar={
        <>
          <Segmented items={['Live', 'Queue', 'Settled', 'Pacing']} active="Live" />
          <span className="ml-auto flex items-center gap-[7px] text-[11.5px] font-bold uppercase tracking-[.08em] text-[#8A94A2]">
            <span className="block h-[7px] w-[7px] rounded-full"
                  style={{ background: '#7BE000', boxShadow: '0 0 0 3px rgba(123,224,0,.22)' }} />
            Bidding open
          </span>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-wrap">
        {/* The board */}
        <div className="min-w-[360px] flex-[1.35_1_460px]"
             style={{ borderRight: '1px solid rgba(255,255,255,.09)' }}>
          <div
            className="flex items-center gap-[12px] px-[clamp(18px,1.8vw,26px)] py-[8px] text-[10px] font-bold uppercase tracking-[.09em]"
            style={{
              fontFamily: 'var(--font-ui)',
              color: 'rgba(255,255,255,.38)',
              borderBottom: '1px solid rgba(255,255,255,.09)',
            }}
          >
            <span className="min-w-0 flex-1">Surface</span>
            <span className="w-[62px] flex-none text-right">Session</span>
            <span className="w-[74px] flex-none text-right">Clearing</span>
            <span className="w-[86px] flex-none text-right">$ / impr</span>
            <span className="w-[96px] flex-none text-right">Your bid</span>
          </div>

          {SURFACES.map((surface) => {
            const price = clearingCpm(surface)
            const takes = bid >= price
            const gap = bid - price
            return (
              <div
                key={surface.id}
                className="flex items-center gap-[12px] px-[clamp(18px,1.8vw,26px)] py-[13px]"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,.07)',
                  background: takes ? 'rgba(123,224,0,.09)' : 'transparent',
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-[8px]">
                    <b className="text-[13.5px] font-bold text-white">{surface.name}</b>
                    <span className="tabular rounded-[4px] px-[5px] py-[1px] text-[10px] font-bold"
                          style={{ background: 'rgba(255,255,255,.10)', color: 'rgba(255,255,255,.62)' }}>
                      {surface.size.replace('x', ' × ')}
                    </span>
                    <span aria-label={`Attention intensity ${surface.intensity} of 3`}
                          className="flex items-center gap-[3px]">
                      {[1, 2, 3].map((n) => (
                        <i key={n} className="block h-[5px] w-[5px] rounded-full"
                           style={{ background: n <= surface.intensity ? '#7BE000' : 'rgba(255,255,255,.18)' }} />
                      ))}
                    </span>
                  </div>
                  <div className="mt-[3px] truncate text-[11.5px]"
                       style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.45)' }}>
                    ${plan.budget.toLocaleString('en-US')} buys{' '}
                    {impressionsOnSurface(plan.budget, surface.id).toLocaleString('en-US')} here
                  </div>
                </div>

                <div className="w-[62px] flex-none">
                  <Sparkline values={surface.spark} stroke={takes ? UP : 'rgba(255,255,255,.42)'} width={62} />
                </div>

                <div className="tabular w-[74px] flex-none text-right text-[14px] font-bold text-white">
                  ${price.toFixed(2)}
                </div>

                <div className="tabular w-[86px] flex-none text-right text-[12.5px]"
                     style={{ color: 'rgba(255,255,255,.62)' }}>
                  {formatPricePerImpression(pricePerImpression(price))}
                </div>

                <div className="w-[96px] flex-none text-right">
                  <span
                    className="tabular inline-block rounded-[5px] px-[7px] py-[2px] text-[11.5px] font-bold"
                    style={{
                      background: takes ? 'rgba(48,209,88,.18)' : 'rgba(255,107,94,.16)',
                      color: takes ? UP : DOWN,
                    }}
                  >
                    {takes ? `Clears +${gap.toFixed(2)}` : `Short ${gap.toFixed(2)}`}
                  </span>
                </div>
              </div>
            )
          })}

          {/* The queue. */}
          <div
            className="px-[clamp(18px,1.8vw,26px)] pb-[6px] pt-[14px] text-[10px] font-bold uppercase tracking-[.09em]"
            style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.34)' }}
          >
            Just cleared
          </div>
          <div className="px-[clamp(18px,1.8vw,26px)] pb-[16px]">
            {QUEUE.map(({ advertiser, paid: cleared, surface }) => (
              <div
                key={advertiser.name}
                className="flex items-center gap-[10px] py-[6px]"
                style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}
              >
                <span aria-hidden className="block h-[8px] w-[8px] flex-none rounded-[2px]"
                      style={{ background: advertiser.color }} />
                <b className="w-[10ch] flex-none truncate text-[12.5px] font-bold text-white">
                  {advertiser.name}
                </b>
                <span className="min-w-0 flex-1 truncate text-[11.5px]"
                      style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.42)' }}>
                  {surface.name}
                </span>
                <span className="tabular flex-none text-[11.5px]"
                      style={{ color: 'rgba(255,255,255,.40)', textDecoration: 'line-through' }}>
                  bid ${advertiser.bid.toFixed(2)}
                </span>
                <span className="tabular w-[8ch] flex-none text-right text-[12.5px] font-bold"
                      style={{ color: '#B6FF63' }}>
                  ${cleared.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* The bid */}
        <div className="flex min-w-[280px] flex-[1_1_320px] flex-col p-[clamp(20px,2.2vw,32px)]">
          <div className="text-[10.5px] font-bold uppercase tracking-[.1em]"
               style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.42)' }}>
            Your bid, per thousand
          </div>
          <div className="tabular mt-[8px] text-[clamp(34px,3.2vw,50px)] font-bold leading-none tracking-[-.035em] text-white">
            ${bid.toFixed(2)}
          </div>

          <div className="relative mt-[18px] h-[24px] w-full rounded-full focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[#7BE000]">
            <span className="absolute inset-x-0 top-1/2 block h-[8px] -translate-y-1/2 rounded-full"
                  style={{ background: 'rgba(255,255,255,.12)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,.5)' }} />
            <span
              className="absolute left-0 top-1/2 block h-[8px] -translate-y-1/2 rounded-full"
              style={{
                width: `${((bid - BID_MIN) / (BID_MAX - BID_MIN)) * 100}%`,
                background: 'linear-gradient(90deg,#7BE000,#B6FF63)',
              }}
            />
            <span
              className="pointer-events-none absolute top-1/2 block h-[20px] w-[20px] -translate-y-1/2 rounded-full"
              style={{
                left: `calc(${((bid - BID_MIN) / (BID_MAX - BID_MIN)) * 100}% - ${(((bid - BID_MIN) / (BID_MAX - BID_MIN))) * 20}px)`,
                background: 'radial-gradient(circle at 50% 22%,#FFFFFF,#D9E0E8 62%,#AAB4C0 100%)',
                boxShadow: '0 2px 5px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.95)',
              }}
            />
            <input
              type="range"
              min={BID_MIN}
              max={BID_MAX}
              step={BID_STEP}
              value={bid}
              onChange={(event) => setBid(Number(event.target.value))}
              aria-label="Your bid, dollars per thousand impressions"
              aria-valuetext={`$${bid.toFixed(2)} per thousand impressions`}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>

          <div className="mt-[20px] rounded-[10px] p-[14px_16px]"
               style={{
                 background: 'rgba(0,0,0,.28)',
                 border: '1px solid rgba(255,255,255,.10)',
                 boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
               }}>
            <div className="flex items-baseline justify-between gap-4 py-[5px]">
              <span className="text-[12.5px]" style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.65)' }}>
                Surfaces it takes
              </span>
              <span className="tabular text-[14px] font-bold text-white">
                {clears.length} of {SURFACES.length}
              </span>
            </div>
            {/* The primary figure: what each surface actually settles at. Fixed
                per row — it never moves when the bid does — which is the
                lesson this panel exists to teach. The blend below it is a
                summary of these, not a price anyone is charged. */}
            <div className="flex flex-col gap-[4px] py-[5px]">
              <span className="text-[12.5px]" style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.65)' }}>
                Settles at
              </span>
              {clears.length === 0 ? (
                <span className="tabular text-[13px] font-bold text-white">—</span>
              ) : (
                clears.map((surface) => (
                  <div key={surface.id} className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[11.5px]"
                          style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.5)' }}>
                      {surface.name}
                    </span>
                    <span className="tabular flex-none text-[13.5px] font-bold" style={{ color: '#B6FF63' }}>
                      ${clearingCpm(surface).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="my-[6px]" style={{ borderTop: '1px solid rgba(255,255,255,.14)' }} />
            <div className="flex items-baseline justify-between gap-4 py-[5px]">
              <span className="text-[11px]" style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.42)' }}>
                Blended across the surfaces you now take
              </span>
              <span className="tabular text-[12.5px] font-bold" style={{ color: 'rgba(255,255,255,.72)' }}>
                {paid > 0 ? `$${paid.toFixed(2)}` : '—'}
              </span>
            </div>
            <div className="my-[6px]" style={{ borderTop: '1px solid rgba(255,255,255,.14)' }} />
            <div className="flex items-baseline justify-between gap-4 py-[5px]">
              <span className="text-[12.5px]" style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.65)' }}>
                ${plan.budget.toLocaleString('en-US')} buys
              </span>
              <span className="tabular text-[14px] font-bold text-white">
                {bought.toLocaleString('en-US')}
              </span>
            </div>
          </div>

          <p className="mt-[16px] text-[13px] leading-[1.55]" style={{ color: 'rgba(255,255,255,.6)' }}>
            {clears.length === 0
              ? 'Nothing clears at that bid. The strip is the floor — go above it and the board opens up.'
              : (
                <>
                  You bid <b className="tabular font-bold text-white">${bid.toFixed(2)}</b>. Every
                  surface above settles at its own fixed price, never yours — raising the bid only
                  ever adds another, pricier surface on top of what you already had; it never moves
                  what you pay on the ones you were already taking. The blend goes up because the
                  mix does, not because any single price did, and that is why fewer impressions
                  come out of the same budget as you bid higher.
                </>
              )}
          </p>
        </div>
      </div>
    </OSWindow>
  )
}
