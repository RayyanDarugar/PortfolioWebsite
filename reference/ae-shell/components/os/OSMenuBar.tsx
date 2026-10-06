'use client'
import Link from 'next/link'
import { ROUTES } from '@/components/shell/routes'
import { AccountMenu } from './AccountMenu'
import { GLASS } from './chrome'
import type { Profile } from './profiles'

/**
 * The swap. A 260ms fade and a three-pixel drop, keyed on the app id, so it
 * replays when the frontmost app changes and never on an ordinary re-render —
 * and never on a scroll tick, because the active index only moves when the
 * viewport's midline crosses a marker.
 *
 * Declared as an inline stylesheet rather than a Tailwind utility because a
 * keyframe cannot be expressed as one, and rather than a global rule because
 * this is the only thing on the site that uses it.
 */
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
 * The landing page's menu bar.
 *
 * `components/shell/MenuBar` is the interior pages' nav and stays exactly as
 * it is — five other pages are laid out against it. This one differs in the
 * way that matters here: it belongs to the frontmost application. The bold
 * name after the mark is that app's, and it changes as you scroll, which is
 * the cheapest possible signal that the page is a machine rather than a
 * document.
 *
 * **The menu titles are the nav.** They used to be `File Edit View Window
 * Help` — five words that open nothing, taking the left of the bar, while the
 * site's real routes were exiled to the status area on the right next to the
 * battery. That is backwards on both counts. A menu bar's left side is where
 * a Mac user looks for the things an app can do, so that is where the things
 * this site can do now are: real, crawlable links at menu-bar size, in the
 * position and the register the metaphor promises. The clock and the battery
 * keep the right, where they belong.
 *
 * No `aria-current` here: this bar only ever renders on `/`, and none of the
 * six routes in it is ever the page you are on. The mark at the far left is
 * the link home.
 *
 * **The account lives in the menu extras**, on the right, where macOS puts
 * fast user switching — and it is the site's only route back to the login
 * screen. See `AccountMenu` for why there is deliberately not a second one.
 */
export function OSMenuBar({
  appName, pinned = false, onOpenSpotlight, profile, onSwitchUser,
}: {
  /** The frontmost app. Announced politely, so a screen reader following the
   *  page is told which section it has arrived at. */
  appName: string
  pinned?: boolean
  onOpenSpotlight?: () => void
  /** Who is logged in, or null while the login screen is up — in which case
   *  there is no account to switch away from and the menu is not drawn. */
  profile?: Profile | null
  onSwitchUser?: () => void
}) {
  return (
    <div
      className={`${pinned ? 'fixed' : 'absolute'} inset-x-0 top-0 z-[70] flex h-[30px] items-stretch text-[13.5px] text-white/95`}
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
          href="/"
          aria-label="The Attention Exchange, home"
          className="flex flex-none items-center rounded-[4px] px-[7px] hover:bg-white/15"
        >
          <span
            className="h-[14px] w-[14px] rounded-[3px]"
            style={{
              background: 'linear-gradient(var(--color-money-hi),var(--color-money-lo))',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.75), 0 1px 2px rgba(0,0,0,.35)',
            }}
          />
        </Link>

        {/* The frontmost app. Remounted on its own name so the swap animation
            replays exactly once per change. */}
        <b
          key={appName}
          aria-live="polite"
          className="ax-menu-swap flex flex-none items-center whitespace-nowrap px-[9px] font-black tracking-[.005em]"
          style={{ animation: 'ax-menu-swap .26s ease-out both' }}
        >
          {appName}
        </b>

        <nav aria-label="Site" className="hidden min-w-0 items-stretch gap-[1px] lg:flex">
          {ROUTES.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="flex flex-none items-center whitespace-nowrap rounded-[4px] px-[10px] text-white/80 hover:bg-white/15 hover:text-white"
            >
              {route.menu}
            </Link>
          ))}
        </nav>
      </div>

      {/* The menu-extras region: Spotlight and the system indicators, and
          nothing else. Four percent and 3:41 AM are the same gag the rest of
          the site tells — this is a real machine, at the end of a real night. */}
      <div className="flex flex-none items-stretch gap-[2px] pr-[10px]">
        {profile && onSwitchUser && (
          <AccountMenu profile={profile} onSwitch={onSwitchUser} />
        )}

        {onOpenSpotlight && (
          <button
            type="button"
            onClick={onOpenSpotlight}
            aria-label="Search this site"
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

        <span className="ml-[6px] hidden items-center font-bold text-[#FFD36E] sm:flex">Battery 4%</span>
        <span className="tabular ml-[12px] hidden items-center text-white/80 min-[420px]:flex">3:41 AM</span>
      </div>
    </div>
  )
}
