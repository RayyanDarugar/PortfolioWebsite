'use client'
import type { ReactNode } from 'react'
import { formatPricePerImpression } from '@/lib/model/payout'
import { OSWindow } from '../OSWindow'
import { INK, WELL } from '../chrome'
import { SURFACES, clearingCpm } from '../adData'
import {
  BUDGET_MAX, BUDGET_MIN, BUDGET_STEP, FLIGHTS,
  FREQUENCY_MAX, FREQUENCY_MIN, FREQUENCY_STEP,
  type CampaignPlan,
  blendedCpm, costPerSeat, impressionsFor, pricePerImpressionFor, seatsFor, toggleSurface,
  workingDaysIn,
} from '../campaign'
import { AppHeading } from '../parts'

const SIDEBAR: readonly { label: string; tile: string; on?: boolean }[] = [
  { label: 'Q3 pilot test', tile: 'linear-gradient(var(--color-money-hi),var(--color-money-lo))', on: true },
  { label: 'Always-on — ambient', tile: 'linear-gradient(#8AC6FF,#2069CE)' },
  { label: 'Launch week', tile: 'linear-gradient(#C4A6FF,#7A4BD0)' },
  { label: 'Retention — power users', tile: 'linear-gradient(#F79BC4,#C8437A)' },
  { label: 'Archived', tile: 'linear-gradient(#B9C2CC,#79838F)' },
]

/** One row of the builder: a number, a name, a line of explanation, and the
 *  control that belongs to it. Same shape as the other account's System
 *  Settings, because it is the same kind of window doing the same job. */
function Row({ n, name, note, children }: { n: string; name: string; note: string; children: ReactNode }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-3 py-[15px]"
      style={{ borderBottom: '1px solid rgba(20,26,34,.10)' }}
    >
      <div className="min-w-[16ch] flex-[1_1_230px]">
        <div className="flex items-baseline gap-[9px]">
          <span className="tabular text-[11px] font-bold text-[#A6B0BC]">{n}</span>
          <b className="text-[15px] font-bold text-[#26313D]">{name}</b>
        </div>
        <p className="mt-[4px] max-w-[44ch] text-[13px] leading-[1.45]" style={{ color: INK.body }}>
          {note}
        </p>
      </div>
      <div className="ml-auto flex min-w-[250px] flex-[1_1_270px] items-center justify-end gap-3">
        {children}
      </div>
    </div>
  )
}

/** The Aqua slider, drawn once and used by budget and frequency alike. The
 *  real `<input type="range">` sits invisible on top of it, so the keyboard
 *  behaviour and the semantics are the platform's and only the appearance is
 *  ours. */
function Slider({
  value, min, max, step, label, valueText, onChange,
}: {
  value: number
  min: number
  max: number
  step: number
  label: string
  valueText: string
  onChange: (n: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="relative h-[24px] min-w-0 flex-1 rounded-full focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[#2E7FE0]">
      <span
        className="absolute inset-x-0 top-1/2 block h-[8px] -translate-y-1/2 rounded-full"
        style={{ background: 'linear-gradient(#D3DAE3,#E6EBF1)', boxShadow: 'inset 0 1px 2px rgba(20,26,34,.30)' }}
      />
      <span
        className="absolute left-0 top-1/2 block h-[8px] -translate-y-1/2 rounded-full"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg,var(--color-money-hi),var(--color-money-lo))',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6)',
        }}
      />
      <span
        className="pointer-events-none absolute top-1/2 block h-[20px] w-[20px] -translate-y-1/2 rounded-full"
        style={{
          left: `calc(${pct}% - ${(pct / 100) * 20}px)`,
          background: 'radial-gradient(circle at 50% 22%,#FFFFFF,#E3E9F0 62%,#C6CFDA 100%)',
          border: '1px solid rgba(20,26,34,.28)',
          boxShadow: '0 1px 3px rgba(16,30,54,.38), inset 0 1px 0 rgba(255,255,255,.95)',
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        aria-valuetext={valueText}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  )
}

/**
 * App 2 on the advertiser account: the campaign builder.
 *
 * It is this desktop's System Settings — the one window with the live control
 * in it, and the state every window after it reads. Surfaces, budget, flight
 * and frequency are four real inputs, and the band at the bottom re-derives
 * the whole estimate on every keystroke from `lib/model`: nothing on it is a
 * number somebody liked the look of.
 *
 * The frequency cap is the control worth dragging. It is the one that turns a
 * budget into *people* rather than impressions — at six a day the same
 * $10,000 spreads across several times the seats it does at forty — and an
 * advertiser who has watched that trade off on a slider understands the
 * inventory better than one who has read a paragraph about it.
 */
export function CampaignApp({ plan, setPlan }: { plan: CampaignPlan; setPlan: (next: CampaignPlan) => void }) {
  const impressions = impressionsFor(plan)
  const seats = seatsFor(plan)
  const cpm = blendedCpm(plan)
  const none = plan.surfaces.length === 0

  return (
    <OSWindow title="Campaign" subtitle="Draft">
      <div className="flex h-full min-h-0">
        <div
          className="hidden w-[224px] flex-none flex-col gap-[2px] p-[10px] md:flex"
          style={{ background: 'linear-gradient(#EFF3F8,#E4EAF1)', borderRight: '1px solid rgba(20,26,34,.13)' }}
        >
          <span className="px-[10px] pb-[8px] pt-[6px] text-[11px] font-bold uppercase tracking-[.09em] text-[#8A94A2]"
                style={{ fontFamily: 'var(--font-ui)' }}>
            Campaigns
          </span>
          {SIDEBAR.map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-[10px] rounded-[7px] px-[10px] py-[7px] text-[13.5px] font-bold"
              style={{
                fontFamily: 'var(--font-ui)',
                background: item.on ? 'linear-gradient(#5DA9F6,#1F6FD0)' : 'transparent',
                color: item.on ? '#fff' : '#3B4756',
                boxShadow: item.on ? 'inset 0 1px 0 rgba(255,255,255,.35), 0 1px 3px rgba(16,50,110,.35)' : 'none',
              }}
            >
              <span className="h-[19px] w-[19px] flex-none rounded-[5px]"
                    style={{ background: item.tile, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6)' }} />
              {item.label}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1 overflow-hidden p-[clamp(22px,2.3vw,36px)]">
          <AppHeading>Four inputs, and the price falls out of them.</AppHeading>
          <p className="mt-[14px] max-w-[64ch] text-[15px] leading-[1.55]" style={{ color: INK.body }}>
            Pick the surfaces, set a budget you would actually put against a test, choose how long
            it runs and how often one person may see it. Everything below the rule is worked out
            from those four, live, at the price the board is clearing at.
          </p>

          <div className="mt-[18px]">
            <Row
              n="01"
              name="Surfaces"
              note="Three of them, ascending intrusion. The wait-state unit is the one nothing else in this category has."
            >
              <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
                {SURFACES.map((surface) => {
                  const on = plan.surfaces.includes(surface.id)
                  return (
                    <label
                      key={surface.id}
                      className="flex cursor-pointer items-center gap-[10px] rounded-[8px] px-[11px] py-[8px] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#2E7FE0]"
                      style={{
                        background: on ? 'rgba(95,175,0,.10)' : 'linear-gradient(#FFFFFF,#F2F5F9)',
                        border: `1px solid ${on ? 'rgba(95,175,0,.45)' : 'rgba(20,26,34,.15)'}`,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.85)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setPlan(toggleSurface(plan, surface.id))}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className="flex h-[16px] w-[16px] flex-none items-center justify-center rounded-[4px]"
                        style={{
                          background: on ? 'linear-gradient(var(--color-money-hi),var(--color-money-lo))' : '#fff',
                          border: `1px solid ${on ? 'var(--color-money-lo)' : 'rgba(20,26,34,.30)'}`,
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.8)',
                        }}
                      >
                        {on && (
                          <svg viewBox="0 0 12 12" className="h-[11px] w-[11px]" fill="none"
                               stroke="#173300" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2.6 6.2 5 8.6 9.4 3.6" />
                          </svg>
                        )}
                      </span>
                      <span className="min-w-0 flex-1 text-[13px] font-bold text-[#26313D]"
                            style={{ fontFamily: 'var(--font-ui)' }}>
                        {surface.name}
                      </span>
                      <span className="tabular flex-none text-[11.5px] text-[#8A94A2]">
                        {surface.size.replace('x', ' × ')}
                      </span>
                      <span className="tabular w-[7ch] flex-none text-right text-[12.5px] font-bold text-[#26313D]">
                        ${clearingCpm(surface).toFixed(2)}
                      </span>
                    </label>
                  )
                })}
              </div>
            </Row>

            <Row
              n="02"
              name="Budget"
              note="What you would put against a first test, not what you would commit for a year."
            >
              <Slider
                value={plan.budget}
                min={BUDGET_MIN}
                max={BUDGET_MAX}
                step={BUDGET_STEP}
                label="Campaign budget in dollars"
                valueText={`$${plan.budget.toLocaleString('en-US')}`}
                onChange={(budget) => setPlan({ ...plan, budget })}
              />
              <span className="tabular w-[9ch] flex-none text-right text-[14px] font-bold text-[#26313D]">
                ${plan.budget.toLocaleString('en-US')}
              </span>
            </Row>

            <Row
              n="03"
              name="Flight"
              note="Calendar days. Working days come out of it, because nobody is waiting on a build at the weekend."
            >
              <fieldset className="ml-auto flex flex-none items-center gap-[6px]">
                <legend className="sr-only">Flight length in days</legend>
                {FLIGHTS.map((days) => {
                  const on = days === plan.flightDays
                  return (
                    <label
                      key={days}
                      className="cursor-pointer rounded-[7px] px-[13px] py-[6px] text-[12.5px] font-bold focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#2E7FE0]"
                      style={{
                        fontFamily: 'var(--font-ui)',
                        background: on ? 'linear-gradient(#5DA9F6,#1F6FD0)' : 'linear-gradient(#FFFFFF,#E7ECF2)',
                        color: on ? '#fff' : '#3B4756',
                        border: `1px solid ${on ? '#17539F' : 'rgba(20,26,34,.22)'}`,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7)',
                      }}
                    >
                      <input
                        type="radio"
                        name="ax-flight"
                        checked={on}
                        onChange={() => setPlan({ ...plan, flightDays: days })}
                        className="sr-only"
                      />
                      {days}d
                    </label>
                  )
                })}
              </fieldset>
            </Row>

            <Row
              n="04"
              name="Frequency"
              note="The cap, per person per day. Drag it down and the same money reaches more people less often."
            >
              <Slider
                value={plan.frequency}
                min={FREQUENCY_MIN}
                max={FREQUENCY_MAX}
                step={FREQUENCY_STEP}
                label="Frequency cap, impressions per person per day"
                valueText={`${plan.frequency} a day`}
                onChange={(frequency) => setPlan({ ...plan, frequency })}
              />
              <span className="tabular w-[9ch] flex-none text-right text-[14px] font-bold text-[#26313D]">
                {plan.frequency} / day
              </span>
            </Row>
          </div>

          {/* The estimate. */}
          <div className="mt-[18px] flex flex-wrap items-center gap-x-[clamp(18px,2vw,34px)] gap-y-3 p-[14px_18px]" style={WELL}>
            {none ? (
              <span className="text-[13.5px]" style={{ color: INK.body }}>
                No surfaces selected. Pick at least one and the estimate comes back.
              </span>
            ) : (
              <>
                <div>
                  <div className="text-[10.5px] font-bold uppercase tracking-[.09em] text-[#8A94A2]"
                       style={{ fontFamily: 'var(--font-ui)' }}>
                    Verified impressions
                  </div>
                  <div className="tabular mt-[5px] text-[26px] font-bold leading-none tracking-[-.03em] text-[#5FAF00]">
                    {impressions.toLocaleString('en-US')}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] font-bold uppercase tracking-[.09em] text-[#8A94A2]"
                       style={{ fontFamily: 'var(--font-ui)' }}>
                    Declared seats reached
                  </div>
                  <div className="tabular mt-[5px] text-[26px] font-bold leading-none tracking-[-.03em] text-[#26313D]">
                    {seats.toLocaleString('en-US')}
                  </div>
                </div>
                <span aria-hidden className="hidden h-[38px] w-px self-center sm:block"
                      style={{ background: 'rgba(20,26,34,.14)' }} />
                <p className="min-w-[24ch] flex-1 text-[13px] leading-[1.5]" style={{ color: INK.body }}>
                  Blended clearing <b className="tabular font-bold text-[#26313D]">${cpm.toFixed(2)}</b> CPM,{' '}
                  <b className="tabular font-bold text-[#26313D]">
                    {formatPricePerImpression(pricePerImpressionFor(plan))}
                  </b>{' '}
                  an impression, <b className="tabular font-bold text-[#26313D]">${costPerSeat(plan).toFixed(2)}</b>{' '}
                  a seat over{' '}
                  <b className="tabular font-bold text-[#26313D]">{Math.round(workingDaysIn(plan.flightDays))}</b>{' '}
                  working days.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </OSWindow>
  )
}
