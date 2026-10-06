import { ACTIVE_DAYS_PER_YEAR } from '@/lib/model/figures'
import { userPayoutPerMonth } from '@/lib/model/payout'
import { type CampaignPlan, impressionsFor, workingDaysIn } from './campaign'
import { WAIT_MINUTES_TOTAL, formatDuration } from './data'
import type { Profile } from './profiles'

/**
 * What is on the desktop.
 *
 * The stage was a wallpaper with a window on it and nothing else, which is
 * not what anybody's machine looks like. A real desktop has a disk in the
 * corner, a folder somebody made, two files they meant to tidy up, and — on a
 * machine running this — a widget quietly counting.
 *
 * Restrained on purpose. Four icons and one widget: enough that the stage
 * reads as someone's computer, few enough that it never competes with the
 * window in front of it. They sit behind every window (`z-10` against the
 * windows' 20 and 30), which is both correct and what stops them being
 * clutter — most of the time most of them are covered, exactly as they would
 * be.
 *
 * Nothing here is interactive. A folder that opens nothing is a dead control;
 * these are scenery, and they are marked as such.
 */

/** A day's share of the monthly payout, from the model rather than from a
 *  number somebody liked the look of. */
const DAILY = (userPayoutPerMonth() * 12) / ACTIVE_DAYS_PER_YEAR.value

interface Item {
  name: string
  kind: 'disk' | 'folder' | 'json' | 'csv'
}

/**
 * Four each, and they are the files that account would actually have. Kept as
 * two flat lists rather than one list with overrides: they are the cheapest
 * possible signal that this is a different machine, and the moment a shared
 * list starts carrying exceptions that signal costs more to maintain than it
 * is worth.
 */
const ITEMS: Readonly<Record<Profile, readonly Item[]>> = {
  user: [
    { name: 'Macintosh HD', kind: 'disk' },
    { name: 'Free rectangles', kind: 'folder' },
    { name: 'screen-map.json', kind: 'json' },
    { name: 'credits-july.csv', kind: 'csv' },
  ],
  advertiser: [
    { name: 'Macintosh HD', kind: 'disk' },
    { name: 'Creatives', kind: 'folder' },
    { name: 'media-plan.json', kind: 'json' },
    { name: 'delivery-2026-07.csv', kind: 'csv' },
  ],
}

function Glyph({ kind }: { kind: Item['kind'] }) {
  if (kind === 'disk') {
    return (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="ax-disk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E9EEF5" />
            <stop offset="100%" stopColor="#A9B4C2" />
          </linearGradient>
        </defs>
        <rect x="6" y="12" width="36" height="24" rx="4" fill="url(#ax-disk)"
              stroke="rgba(20,26,34,.35)" strokeWidth="1" />
        <rect x="6" y="12" width="36" height="9" rx="4" fill="rgba(255,255,255,.55)" />
        <circle cx="24" cy="27" r="4.4" fill="#8E99A8" />
        <circle cx="24" cy="27" r="1.5" fill="#E9EEF5" />
      </svg>
    )
  }
  if (kind === 'folder') {
    return (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="ax-folder" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8FD0F5" />
            <stop offset="100%" stopColor="#3D9BDE" />
          </linearGradient>
        </defs>
        <path d="M5 14a3 3 0 0 1 3-3h10.5l3.4 3.6H40a3 3 0 0 1 3 3V37a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z"
              fill="url(#ax-folder)" stroke="rgba(12,50,90,.35)" strokeWidth="1" />
        <path d="M5 19h38v3H5Z" fill="rgba(255,255,255,.35)" />
      </svg>
    )
  }
  const tint = kind === 'json' ? '#5FAF00' : '#2E7FE0'
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      <path d="M11 7h18l8 8v26a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
            fill="#FBFCFE" stroke="rgba(20,26,34,.32)" strokeWidth="1" />
      <path d="M29 7l8 8h-8Z" fill="#D8DFE8" />
      {[19, 24, 29, 34].map((y, i) => (
        <rect key={y} x="14" y={y} width={i === 3 ? 12 : 20} height="2.4" rx="1.2"
              fill={i === 0 ? tint : 'rgba(20,26,34,.22)'} />
      ))}
    </svg>
  )
}

export function DesktopItems({ profile, plan }: { profile: Profile; plan: CampaignPlan }) {
  const advertiser = profile === 'advertiser'
  const workingDays = workingDaysIn(plan.flightDays)
  const spendPerDay = workingDays > 0 ? plan.budget / workingDays : 0
  const impressionsPerDay = workingDays > 0 ? Math.round(impressionsFor(plan) / workingDays) : 0

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <div className="absolute right-[22px] top-[46px] flex flex-col items-center gap-[16px]">
        {ITEMS[profile].map((item) => (
          <span key={item.name} className="flex w-[92px] flex-col items-center gap-[5px]">
            <span
              className="block h-[46px] w-[46px]"
              style={{ filter: 'drop-shadow(0 3px 5px rgba(6,8,24,.45))' }}
            >
              <Glyph kind={item.kind} />
            </span>
            <span
              className="max-w-full truncate rounded-[4px] px-[5px] py-[1px] text-[11px] font-bold text-white"
              style={{
                fontFamily: 'var(--font-ui)',
                textShadow: '0 1px 2px rgba(0,0,0,.75)',
              }}
            >
              {item.name}
            </span>
          </span>
        ))}
      </div>

      {/* The widget. One on the desktop, the way a Mac has one — and it is
          the only object on the stage that is ours rather than the visitor's,
          which is the whole point of it being there. */}
      <div
        className="absolute bottom-[128px] left-[24px] w-[172px] rounded-[16px] p-[14px]"
        style={{
          background: 'rgba(24,18,38,.42)',
          backdropFilter: 'blur(18px) saturate(170%)',
          WebkitBackdropFilter: 'blur(18px) saturate(170%)',
          border: '1px solid rgba(255,255,255,.18)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.22), 0 18px 40px -14px rgba(6,8,24,.7)',
        }}
      >
        <div className="flex items-center gap-[7px]">
          <span
            className="block h-[14px] w-[14px] flex-none rounded-[4px]"
            style={{
              background: advertiser
                ? 'linear-gradient(#FFA870,#E0562C)'
                : 'linear-gradient(#B6FF63,#5FBE00)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7)',
            }}
          />
          <span
            className="text-[10.5px] font-bold uppercase tracking-[.09em] text-white/70"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            Today
          </span>
        </div>
        <div className="tabular mt-[9px] text-[26px] font-bold leading-none tracking-[-.03em] text-white">
          ${(advertiser ? spendPerDay : DAILY).toFixed(2)}
        </div>
        <div
          className="mt-[7px] text-[11px] leading-[1.35] text-white/55"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          {advertiser
            ? `spent, for ${impressionsPerDay.toLocaleString('en-US')} verified impressions`
            : `in credits, from ${formatDuration(WAIT_MINUTES_TOTAL)} of waiting`}
        </div>
      </div>
    </div>
  )
}
