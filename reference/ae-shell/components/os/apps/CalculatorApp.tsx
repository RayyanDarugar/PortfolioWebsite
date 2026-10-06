import {
  ACTIVE_DAYS_PER_YEAR, CPM_DESIGN_POINT, USER_REVENUE_SHARE,
} from '@/lib/model/figures'
import { grossPerYear, userPayoutPerMonth } from '@/lib/model/payout'
import { OSWindow } from '../OSWindow'
import { DARK_BODY } from '../chrome'
import { AppHeading, AppLead } from '../parts'

/** The keypad. Decorative — the readout is driven by the ad-load slider in
 *  System Settings, not by these — so it is one aria-hidden grid rather than
 *  nineteen buttons that do nothing when a keyboard user reaches them. */
const KEYS: readonly { label: string; kind: 'fn' | 'digit' | 'op'; wide?: boolean }[] = [
  { label: 'AC', kind: 'fn' }, { label: '±', kind: 'fn' }, { label: '%', kind: 'fn' }, { label: '÷', kind: 'op' },
  { label: '7', kind: 'digit' }, { label: '8', kind: 'digit' }, { label: '9', kind: 'digit' }, { label: '×', kind: 'op' },
  { label: '4', kind: 'digit' }, { label: '5', kind: 'digit' }, { label: '6', kind: 'digit' }, { label: '−', kind: 'op' },
  { label: '1', kind: 'digit' }, { label: '2', kind: 'digit' }, { label: '3', kind: 'digit' }, { label: '+', kind: 'op' },
  { label: '0', kind: 'digit', wide: true }, { label: '.', kind: 'digit' }, { label: '=', kind: 'op' },
]

const KEY_SKIN: Record<'fn' | 'digit' | 'op', { bg: string; ink: string; edge: string }> = {
  fn:    { bg: 'linear-gradient(#C3C6CB,#A3A7AD)', ink: '#16181C', edge: 'rgba(0,0,0,.3)' },
  digit: { bg: 'linear-gradient(#43474E,#32353B)', ink: '#F4F6F9', edge: 'rgba(0,0,0,.4)' },
  op:    { bg: 'linear-gradient(#FFB63D,#F1900A)', ink: '#FFFFFF', edge: 'rgba(120,60,0,.5)' },
}

/** One line of the paper tape. */
function Tape({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-[6px]">
      <span
        className="text-[13px]"
        style={{ fontFamily: 'var(--font-ui)', color: muted ? 'rgba(255,255,255,.42)' : 'rgba(255,255,255,.72)' }}
      >
        {label}
      </span>
      <span
        className="tabular text-[14px] font-bold"
        style={{ color: muted ? 'rgba(255,255,255,.42)' : '#FFFFFF' }}
      >
        {value}
      </span>
    </div>
  )
}

/**
 * App 4. The Calculator computes the payout, which is the joke and the
 * explanation in the same object: the number is not asserted, it is worked
 * out on screen, one operation at a time, from figures that live in
 * `lib/model` rather than in this file.
 */
export function CalculatorApp({ slots }: { slots: number }) {
  const gross = grossPerYear(slots, ACTIVE_DAYS_PER_YEAR.value, CPM_DESIGN_POINT.value)
  const monthly = userPayoutPerMonth({ impressionsPerDay: slots })

  return (
    <OSWindow title="Calculator" subtitle="Basic" bodyStyle={DARK_BODY}>
      <div className="flex h-full min-h-0 flex-wrap items-start gap-[clamp(24px,3vw,48px)] p-[clamp(24px,2.5vw,40px)]">
        <div className="min-w-[300px] flex-[1.25_1_380px]">
          <AppHeading dark>What you earn, and how it is worked out.</AppHeading>
          <AppLead dark>
            No blended averages, no bundled sums, nothing you have to take on trust. Six
            operations, all of them yours to check. Change the ad load in System Settings and
            every line below moves with it.
          </AppLead>

          <div
            className="mt-[22px] rounded-[10px] p-[14px_18px]"
            style={{
              background: 'rgba(0,0,0,.28)',
              border: '1px solid rgba(255,255,255,.10)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
            }}
          >
            <Tape label="Ad slots a day" value={String(slots)} />
            <Tape label="× active days a year" value={String(ACTIVE_DAYS_PER_YEAR.value)} />
            <Tape label="× clearing CPM" value={`$${CPM_DESIGN_POINT.value.toFixed(2)}`} />
            <Tape label="÷ 1,000 impressions" value="" muted />
            <div className="my-[6px]" style={{ borderTop: '1px solid rgba(255,255,255,.14)' }} />
            <Tape label="Gross media value, a year" value={`$${gross.toFixed(2)}`} />
            <Tape label="× your share" value={`${Math.round(USER_REVENUE_SHARE.value * 100)}%`} />
            <Tape label="÷ 12 months" value="" muted />
          </div>

          <p className="mt-[16px] max-w-[46ch] text-[13px] leading-[1.5]" style={{ color: 'rgba(255,255,255,.55)' }}>
            Paid in AI credits rather than cash. They cost us less to deliver, they are worth
            more to you than the equivalent in dollars, and they are far worse bait for fraud.
            Your tools end up paying for themselves.
          </p>
        </div>

        {/* The calculator itself. */}
        <div className="mx-auto w-[286px] flex-none">
          <div
            className="rounded-[12px] px-[16px] pb-[10px] pt-[18px] text-right"
            style={{
              background: 'linear-gradient(#1B1D22,#101216)',
              border: '1px solid rgba(255,255,255,.09)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.07), 0 12px 30px -10px rgba(0,0,0,.7)',
            }}
          >
            <div
              className="text-[10.5px] font-bold uppercase tracking-[.1em]"
              style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.38)' }}
            >
              A month, in AI credits
            </div>
            <div className="tabular mt-[6px] overflow-hidden text-[42px] font-medium leading-none tracking-[-.03em] text-white">
              ${monthly.toFixed(2)}
            </div>
            <div className="tabular mt-[10px] text-[11.5px]" style={{ color: 'rgba(255,255,255,.34)' }}>
              {slots} × {ACTIVE_DAYS_PER_YEAR.value} × {CPM_DESIGN_POINT.value.toFixed(2)} ÷ 1000 ×{' '}
              {USER_REVENUE_SHARE.value} ÷ 12
            </div>
          </div>

          <div className="mt-[12px] grid grid-cols-4 gap-[9px]" aria-hidden>
            {KEYS.map((key) => {
              const skin = KEY_SKIN[key.kind]
              return (
                <span
                  key={key.label}
                  className={`flex h-[52px] items-center rounded-full text-[19px] font-medium ${
                    key.wide ? 'col-span-2 justify-start pl-[21px]' : 'justify-center'
                  }`}
                  style={{
                    background: skin.bg,
                    color: skin.ink,
                    border: `1px solid ${skin.edge}`,
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.28), 0 2px 4px rgba(0,0,0,.45)',
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  {key.label}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </OSWindow>
  )
}
