'use client'
import Link from 'next/link'
import { PROFILE } from '@/content/profile'
import { GLASS } from './chrome'
import type { AppDef } from './registry'
import { pathFor } from './view'

/** The frontmost-app swap: a short fade, keyed on the name so it replays once
 *  per change. A keyframe cannot be a Tailwind utility, hence the stylesheet. */
const SWAP_CSS = `
@keyframes ax-menu-swap {
  from { opacity: 0; transform: translateY(-3px); }
  to   { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .ax-menu-swap { animation: none !important; }
}
`

/**
 * The laptop's menu bar. The mark and name at the left go back to the room;
 * the menu titles are real links to each app, so the bar is navigation in the
 * position a Mac user already looks for it.
 */
export function OSMenuBar({
  appName, apps, onOpenSpotlight,
}: {
  /** The frontmost app, or "Finder" when no window is open. Announced politely. */
  appName: string
  apps: readonly AppDef[]
  onOpenSpotlight?: () => void
}) {
  return (
    <div
      className="absolute inset-x-0 top-0 z-[70] flex h-[30px] items-stretch text-[13.5px] text-white/95"
      style={{
        ...GLASS,
        background: 'rgba(18,12,32,.46)',
        borderBottom: '1px solid rgba(255,255,255,.14)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <style>{SWAP_CSS}</style>

      <div className="flex min-w-0 flex-1 items-stretch gap-[1px] overflow-hidden px-[10px]">
        <Link
          href={pathFor({ zoomed: false, app: null })}
          scroll={false}
          aria-label="Back to the room"
          className="flex flex-none items-center gap-[7px] rounded-[4px] px-[7px] hover:bg-white/15"
        >
          <span
            aria-hidden
            className="h-[14px] w-[14px] rounded-[3px]"
            style={{
              background: 'linear-gradient(#FFD36E,#E0802C)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.75), 0 1px 2px rgba(0,0,0,.35)',
            }}
          />
          <span className="whitespace-nowrap">{PROFILE.name}</span>
        </Link>

        <b
          key={appName}
          aria-live="polite"
          className="ax-menu-swap flex flex-none items-center whitespace-nowrap px-[9px] font-black tracking-[.005em]"
          style={{ animation: 'ax-menu-swap .26s ease-out both' }}
        >
          {appName}
        </b>

        <nav aria-label="Menu" className="hidden min-w-0 items-stretch gap-[1px] md:flex">
          {apps.map((app) => (
            <Link
              key={app.id}
              href={pathFor({ zoomed: true, app: app.id })}
              scroll={false}
              className="flex flex-none items-center whitespace-nowrap rounded-[4px] px-[10px] text-white/80 hover:bg-white/15 hover:text-white"
            >
              {app.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-none items-stretch gap-[2px] pr-[10px]">
        {/* The visible way out. Esc and scrolling up do the same thing. */}
        <Link
          href={pathFor({ zoomed: false, app: null })}
          scroll={false}
          title="Back to the room — Esc"
          className="flex flex-none items-center gap-[6px] whitespace-nowrap rounded-[4px] px-[9px] text-white/85 hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
        >
          <svg aria-hidden viewBox="0 0 16 16" className="h-[13px] w-[13px]" fill="none"
               stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2.5v6M4.6 4.6a5 5 0 1 0 6.8 0" />
          </svg>
          Leave laptop
        </Link>
        {onOpenSpotlight && (
          <button
            type="button"
            onClick={onOpenSpotlight}
            aria-label="Search"
            title="Search — ⌘K"
            className="flex flex-none items-center rounded-[4px] px-[8px] text-white/85 hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
          >
            <svg viewBox="0 0 16 16" className="h-[15px] w-[15px]" fill="none"
                 stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="7" cy="7" r="4.4" />
              <path d="M10.4 10.4 14 14" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
