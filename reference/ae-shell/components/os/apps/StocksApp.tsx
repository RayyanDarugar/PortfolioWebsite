import { USER_REVENUE_SHARE } from '@/lib/model/figures'
import { OSWindow } from '../OSWindow'
import { DARK_BODY } from '../chrome'
import { BID_ROWS, CLEARING_BID, CLEARING_CURVE, WINNING_BID } from '../data'
import { AppHeading, AppLead, AreaChart, Segmented, Sparkline } from '../parts'

const UP = '#30D158'
const DOWN = '#FF6B5E'

/**
 * App 5. Stocks, because a board of bids moving against each other is
 * literally what the exchange is, and because the visitor already knows how
 * to read this window — a list of tickers on the left, the selected one
 * charted on the right, gains green and losses red.
 *
 * The board is a second-price auction: the top row wins the slot and pays
 * what the runner-up bid. That runner-up bid is the model's clearing CPM,
 * read from `lib/model` rather than typed here, so the price on this screen
 * is the same one the Calculator divides by.
 */
export function StocksApp() {
  return (
    <OSWindow
      title="Stocks"
      subtitle="Your inventory"
      bodyStyle={DARK_BODY}
      toolbar={
        <>
          <Segmented items={['1D', '1W', '1M', '3M', '1Y']} active="1D" />
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
        <div
          className="min-w-[300px] flex-[1_1_360px]"
          style={{ borderRight: '1px solid rgba(255,255,255,.09)' }}
        >
          {BID_ROWS.map((row, i) => {
            const won = i === 0
            const clears = row === CLEARING_BID
            const up = row.change >= 0
            return (
              <div
                key={row.ticker}
                className="flex items-center gap-[14px] px-[clamp(18px,1.8vw,26px)] py-[11px]"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,.07)',
                  background: won ? 'rgba(123,224,0,.10)' : 'transparent',
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-[8px]">
                    <b className="tabular text-[13.5px] font-bold tracking-[.02em] text-white">{row.ticker}</b>
                    {won && (
                      <span className="rounded-full px-[7px] py-[2px] text-[9.5px] font-bold uppercase tracking-[.08em]"
                            style={{ fontFamily: 'var(--font-ui)', background: '#7BE000', color: '#173300' }}>
                        Won
                      </span>
                    )}
                    {clears && (
                      <span className="rounded-full px-[7px] py-[2px] text-[9.5px] font-bold uppercase tracking-[.08em]"
                            style={{ fontFamily: 'var(--font-ui)', background: 'rgba(255,255,255,.16)', color: 'rgba(255,255,255,.82)' }}>
                        Clears at
                      </span>
                    )}
                  </div>
                  <div className="mt-[2px] truncate text-[12px]"
                       style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.48)' }}>
                    {row.category}
                  </div>
                </div>

                <Sparkline values={row.spark} stroke={up ? UP : DOWN} />

                <div className="w-[92px] flex-none text-right">
                  <div className="tabular text-[14px] font-bold text-white">${row.bid.toFixed(2)}</div>
                  <div
                    className="tabular mt-[3px] inline-block rounded-[5px] px-[6px] py-[1px] text-[11px] font-bold"
                    style={{ background: up ? 'rgba(48,209,88,.18)' : 'rgba(255,107,94,.18)', color: up ? UP : DOWN }}
                  >
                    {up ? '+' : ''}{row.change.toFixed(1)}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* The chart and the commentary */}
        <div className="flex min-w-[320px] flex-[1.05_1_380px] flex-col p-[clamp(22px,2.3vw,36px)]">
          <AppHeading dark>Advertisers bid for the space next to what you are doing.</AppHeading>
          <AppLead dark>
            One slot, one auction, settled the moment the space opens up. The highest bid wins
            it and pays what the runner-up bid — that is the clearing price, and it is the
            number every figure on this page is built on.
          </AppLead>

          <div className="mt-[22px] flex items-end justify-between gap-4">
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[.1em]"
                   style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.42)' }}>
                Clearing price, per thousand impressions
              </div>
              <div className="tabular mt-[6px] text-[clamp(30px,3vw,44px)] font-bold leading-none tracking-[-.035em] text-white">
                ${CLEARING_BID.bid.toFixed(2)}
              </div>
            </div>
            <div className="tabular rounded-[7px] px-[10px] py-[6px] text-[12.5px] font-bold"
                 style={{ background: 'rgba(48,209,88,.16)', color: UP }}>
              +{CLEARING_BID.change.toFixed(1)}% today
            </div>
          </div>

          <div className="mt-[16px] text-[#8A94A2]">
            <AreaChart
              values={CLEARING_CURVE}
              width={420}
              height={122}
              grid={3}
              stroke="#7BE000"
              fillFrom="rgba(123,224,0,.34)"
              fillTo="rgba(123,224,0,0)"
              gradientId="clearFill"
            />
          </div>

          <p className="mt-[18px] text-[13.5px] leading-[1.55]" style={{ color: 'rgba(255,255,255,.62)' }}>
            <b className="text-white">{WINNING_BID.category}</b> took this slot at{' '}
            <span className="tabular">${WINNING_BID.bid.toFixed(2)}</span> and paid{' '}
            <span className="tabular">${CLEARING_BID.bid.toFixed(2)}</span>.{' '}
            <span className="tabular">{Math.round(USER_REVENUE_SHARE.value * 100)}%</span> of that
            settles to you.
          </p>
        </div>
      </div>
    </OSWindow>
  )
}
