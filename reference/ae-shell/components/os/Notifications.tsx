'use client'
import { useEffect, useRef, useState } from 'react'
import { ACTIVE_DAYS_PER_YEAR, CPM_DESIGN_POINT } from '@/lib/model/figures'
import { userPayoutPerMonth } from '@/lib/model/payout'
import { type CampaignPlan, impressionsFor, seatsFor } from './campaign'
import type { Profile } from './profiles'
import type { AppDef } from './registry'

/** After the window has opened and settled, not on top of it. */
const DELAY = 900
/** Long enough to read twice, short enough that it is gone before you resent
 *  it. macOS itself uses five seconds for a banner. */
const LIFE = 4600
const EXIT = 380

/** Everything a banner is allowed to know. Both accounts' state, so a beat is
 *  a one-line function rather than a component with props. */
interface BeatContext {
  slots: number
  plan: CampaignPlan
}

interface Beat {
  /** Which app's icon and name the banner wears. */
  app: number
  body: (context: BeatContext) => string
}

/**
 * Two beats across seven sections, per account. The temptation is one per app,
 * and one per app is how a page ends up feeling like it is nagging: a banner
 * is an interruption, and an interruption that arrives on schedule stops being
 * one.
 *
 * Keyed by the section that triggers them, which is not necessarily the app
 * whose name they carry — the earnings banner is the Attention Exchange
 * telling you something while you are looking at the Calculator, which is
 * exactly what a notification is for.
 */
const BEATS: Readonly<Record<Profile, Readonly<Record<number, Beat>>>> = {
  user: {
    // Calculator.
    3: {
      app: 0,
      body: ({ slots }) =>
        `You earned $${dailyPayout(slots).toFixed(2)} today. It is already in your credit balance.`,
    },
    // Stocks.
    4: {
      app: 4,
      body: () =>
        `The board cleared at $${CPM_DESIGN_POINT.value.toFixed(2)} CPM — the runner-up's bid, not the winner's.`,
    },
  },
  advertiser: {
    // Audience — the campaign window is the one telling you what it now buys.
    2: {
      app: 1,
      body: ({ plan }) =>
        `Plan updated: ${impressionsFor(plan).toLocaleString('en-US')} verified impressions across `
        + `${seatsFor(plan).toLocaleString('en-US')} declared seats.`,
    },
    // Bid Console.
    3: {
      app: 3,
      body: () =>
        `Bid accepted. Each surface settles at the runner-up's price, never at yours.`,
    },
  },
}

/** A day's share of the monthly payout, from the model rather than from a
 *  number somebody liked the look of. */
function dailyPayout(slots: number): number {
  return (userPayoutPerMonth({ impressionsPerDay: slots }) * 12) / ACTIVE_DAYS_PER_YEAR.value
}

/**
 * macOS notification banners, at two chosen moments.
 *
 * Each fires once per visit. Scrolling back up through a section it has
 * already announced does not announce it again — a banner that reappears
 * every time you pass a point on the page is a banner the visitor learns to
 * look away from.
 *
 * Mounted only in the desktop mode, and only once an account is logged in —
 * a reduced-motion visitor never reaches either. The OS root **keys this on
 * the account**, so switching users remounts it with an empty fired-set: a
 * new machine gets to announce its own two beats once, and nothing has to
 * reset state in an effect to make that true.
 */
export function Notifications({
  active, slots, plan, profile, apps,
}: {
  active: number
  slots: number
  plan: CampaignPlan
  profile: Profile
  apps: readonly AppDef[]
}) {
  const [showing, setShowing] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const fired = useRef<Set<number>>(new Set())
  const beats = BEATS[profile]

  useEffect(() => {
    if (!beats[active] || fired.current.has(active)) return
    fired.current.add(active)
    const timer = window.setTimeout(() => setShowing(active), DELAY)
    return () => window.clearTimeout(timer)
  }, [active, beats])

  useEffect(() => {
    if (showing === null) return
    // Two frames, not one: the first commits the banner off-stage, the second
    // is the one the transition can run from. Flipping the flag in the same
    // frame as the mount gives the browser nothing to interpolate.
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)))
    const hide = window.setTimeout(() => setOpen(false), LIFE)
    const drop = window.setTimeout(() => setShowing(null), LIFE + EXIT)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(hide)
      window.clearTimeout(drop)
    }
  }, [showing])

  if (showing === null) return null
  const beat = beats[showing]
  if (!beat) return null
  const app = apps[beat.app]
  if (!app) return null

  return (
    <div
      className="pointer-events-none absolute right-[14px] top-[36px] z-[75] w-[344px]"
      style={{
        transform: open ? 'translate3d(0,0,0)' : 'translate3d(calc(100% + 22px),0,0)',
        opacity: open ? 1 : 0,
        transition: `transform ${EXIT}ms cubic-bezier(.2,.86,.3,1), opacity ${EXIT}ms ease-out`,
      }}
    >
      <div
        role="status"
        className="flex items-start gap-[11px] rounded-[15px] p-[12px_14px]"
        style={{
          background: 'rgba(38,32,52,.62)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,.20)',
          boxShadow: [
            'inset 0 1px 0 rgba(255,255,255,.28)',
            '0 2px 6px rgba(6,8,24,.32)',
            '0 28px 56px -16px rgba(6,8,24,.66)',
          ].join(','),
          fontFamily: 'var(--font-ui)',
        }}
      >
        <span
          aria-hidden
          className="relative block h-[34px] w-[34px] flex-none"
          style={{
            borderRadius: 9,
            background: app.tile,
            padding: 6,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5), 0 2px 4px rgba(6,8,24,.4)',
          }}
        >
          <app.Glyph />
        </span>
        <div className="min-w-0">
          <div className="text-[12.5px] font-bold leading-[1.2] text-white">{app.name}</div>
          <p className="mt-[3px] text-[12.5px] leading-[1.38] text-white/80">
            {beat.body({ slots, plan })}
          </p>
        </div>
      </div>
    </div>
  )
}
