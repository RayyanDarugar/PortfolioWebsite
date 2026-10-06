'use client'
import type { ReactNode } from 'react'
import { USER_REVENUE_SHARE } from '@/lib/model/figures'
import { userPayoutPerMonth } from '@/lib/model/payout'
import { OSWindow } from '../OSWindow'
import { INK, WELL } from '../chrome'
import { AppHeading } from '../parts'
import { SLOTS_MAX, SLOTS_MIN, SLOTS_STEP } from '../slots'

const SIDEBAR: readonly { label: string; tile: string; on?: boolean }[] = [
  { label: 'Appearance', tile: 'linear-gradient(#8AC6FF,#2069CE)' },
  { label: 'Desktop & Dock', tile: 'linear-gradient(#5FC9F8,#1A8FD6)' },
  { label: 'Notifications', tile: 'linear-gradient(#F79BC4,#C8437A)' },
  { label: 'Attention Exchange', tile: 'linear-gradient(var(--color-money-hi),var(--color-money-lo))', on: true },
  { label: 'Privacy & Security', tile: 'linear-gradient(#8FA3FF,#3A4FD0)' },
  { label: 'Screen Time', tile: 'linear-gradient(#C4A6FF,#7A4BD0)' },
]

/** One row of the settings pane: a name, a one-line explanation, and the
 *  control that belongs to it, ruled off from the next. */
function Row({ n, name, note, children }: { n: string; name: string; note: string; children: ReactNode }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-3 py-[15px]"
      style={{ borderBottom: '1px solid rgba(20,26,34,.10)' }}
    >
      <div className="min-w-[16ch] flex-[1_1_240px]">
        <div className="flex items-baseline gap-[9px]">
          <span className="tabular text-[11px] font-bold text-[#A6B0BC]">{n}</span>
          <b className="text-[15px] font-bold text-[#26313D]">{name}</b>
        </div>
        <p className="mt-[4px] max-w-[42ch] text-[13px] leading-[1.45]" style={{ color: INK.body }}>
          {note}
        </p>
      </div>
      <div className="ml-auto flex min-w-[220px] flex-[1_1_240px] items-center justify-end gap-3">
        {children}
      </div>
    </div>
  )
}

/** The read-only state pill: what a settings row shows when the setting is
 *  not yours to change. It is a value, not a control, and it is rendered as
 *  one — a switch that cannot be switched is a worse lie than a label. */
function Pill({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      className="rounded-full px-[13px] py-[6px] text-[12.5px] font-bold"
      style={{
        fontFamily: 'var(--font-ui)',
        background: accent
          ? 'linear-gradient(var(--color-money-hi),var(--color-money-lo))'
          : 'linear-gradient(#FFFFFF,#E7ECF2)',
        color: accent ? '#183300' : '#3B4756',
        border: `1px solid ${accent ? 'var(--color-money-lo)' : 'rgba(20,26,34,.22)'}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.85), 0 1px 2px rgba(16,30,54,.16)',
      }}
    >
      {children}
    </span>
  )
}

/**
 * App 3. System Settings, which is where a Mac user would in fact go to set
 * how many ads they are willing to see — so that is where the explanation
 * lives. The four steps of the product are the four rows of a settings pane.
 *
 * The ad-load slider is the one genuinely live control on the page, and it is
 * live on purpose: "you configure your own ad load, and zero is a real
 * setting" is the claim the whole trust argument rests on, and a slider you
 * can actually drag to zero makes it in a way no sentence does. The value it
 * sets is read by the Calculator two windows down.
 */
export function SettingsApp({ slots, setSlots }: { slots: number; setSlots: (n: number) => void }) {
  const pct = ((slots - SLOTS_MIN) / (SLOTS_MAX - SLOTS_MIN)) * 100
  const monthly = userPayoutPerMonth({ impressionsPerDay: slots })

  return (
    <OSWindow title="System Settings" subtitle="Attention Exchange">
      <div className="flex h-full min-h-0">
        {/* Sidebar */}
        <div
          className="hidden w-[232px] flex-none flex-col gap-[2px] p-[10px] md:flex"
          style={{ background: 'linear-gradient(#EFF3F8,#E4EAF1)', borderRight: '1px solid rgba(20,26,34,.13)' }}
        >
          <span className="px-[10px] pb-[8px] pt-[6px] text-[11px] font-bold uppercase tracking-[.09em] text-[#8A94A2]"
                style={{ fontFamily: 'var(--font-ui)' }}>
            Settings
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
              <span
                className="h-[19px] w-[19px] flex-none rounded-[5px]"
                style={{ background: item.tile, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6)' }}
              />
              {item.label}
            </span>
          ))}
        </div>

        {/* Pane */}
        <div className="min-w-0 flex-1 overflow-hidden p-[clamp(22px,2.3vw,36px)]">
          <AppHeading>Declare, place, serve, share.</AppHeading>
          <p className="mt-[14px] max-w-[62ch] text-[15px] leading-[1.55]" style={{ color: INK.body }}>
            Four settings, and you own all four. Nothing renders over anyone&rsquo;s page, nothing
            renders when there is nowhere honest to put it, and the number of ads you see is a
            slider you control.
          </p>

          <div className="mt-[18px]">
            <Row n="01" name="Declare" note="Role, tools, company, whether you can sign a purchase order. Declared by you, never inferred.">
              <Pill>Marketing lead · SaaS · 200–500</Pill>
            </Row>

            <Row n="02" name="Ad load" note="How many slots a day you are willing to fill. Drag it wherever you like.">
              <div className="flex min-w-0 flex-1 items-center gap-[14px]">
                <div
                  className="relative h-[24px] min-w-0 flex-1 rounded-full focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[#2E7FE0]"
                >
                  {/* Track */}
                  <span
                    className="absolute inset-x-0 top-1/2 block h-[8px] -translate-y-1/2 rounded-full"
                    style={{ background: 'linear-gradient(#D3DAE3,#E6EBF1)', boxShadow: 'inset 0 1px 2px rgba(20,26,34,.30)' }}
                  />
                  {/* Fill */}
                  <span
                    className="absolute left-0 top-1/2 block h-[8px] -translate-y-1/2 rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg,var(--color-money-hi),var(--color-money-lo))',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6)',
                    }}
                  />
                  {/* Thumb */}
                  <span
                    className="pointer-events-none absolute top-1/2 block h-[20px] w-[20px] -translate-y-1/2 rounded-full"
                    style={{
                      left: `calc(${pct}% - ${(pct / 100) * 20}px)`,
                      background: 'radial-gradient(circle at 50% 22%,#FFFFFF,#E3E9F0 62%,#C6CFDA 100%)',
                      border: '1px solid rgba(20,26,34,.28)',
                      boxShadow: '0 1px 3px rgba(16,30,54,.38), inset 0 1px 0 rgba(255,255,255,.95)',
                    }}
                  />
                  {/* The real control, invisible over the drawn one. Native
                      range semantics and keyboard behaviour, our appearance. */}
                  <input
                    type="range"
                    min={SLOTS_MIN}
                    max={SLOTS_MAX}
                    step={SLOTS_STEP}
                    value={slots}
                    onChange={(e) => setSlots(Number(e.target.value))}
                    aria-label="Ad slots a day"
                    aria-valuetext={`${slots} slots a day`}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
                <span className="tabular w-[9ch] flex-none text-right text-[14px] font-bold text-[#26313D]">
                  {slots} / day
                </span>
              </div>
            </Row>

            <Row n="03" name="Serve" note="Only into space no window is using, classified on your machine. Never over a page, never inside an answer.">
              <Pill>Free space only</Pill>
            </Row>

            <Row n="04" name="Share" note="Paid in AI credits. Cheaper for us to deliver, worth more to you, far worse bait for fraud.">
              <Pill accent>{Math.round(USER_REVENUE_SHARE.value * 100)}% to you</Pill>
            </Row>
          </div>

          <div className="mt-[18px] flex flex-wrap items-center gap-x-5 gap-y-2 p-[14px_18px]" style={WELL}>
            <span className="text-[13px] font-bold uppercase tracking-[.08em] text-[#7A8593]"
                  style={{ fontFamily: 'var(--font-ui)' }}>
              At this setting
            </span>
            <span className="tabular text-[26px] font-bold leading-none tracking-[-.03em] text-[#5FAF00]">
              ${monthly.toFixed(2)}
            </span>
            <span className="text-[13.5px]" style={{ color: INK.body }}>
              a month, in AI credits.{' '}
              {slots === 0
                ? 'Zero is a real setting, and this is what it pays.'
                : 'Drag it to zero and you will see zero ads. That is a real setting.'}
            </span>
          </div>
        </div>
      </div>
    </OSWindow>
  )
}
