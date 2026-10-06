import { userPayoutPerMonth } from '@/lib/model/payout'
import { IMPRESSIONS_PER_USER_DAY, USER_REVENUE_SHARE } from '@/lib/model/figures'
import { Auction } from '../Auction'
import { OSButton } from '../OSButton'
import { OSWindow } from '../OSWindow'
import { HERO_BODY, HERO_FOOTER, INK, TYPE } from '../chrome'
import { WORKING_DAY_MINUTES } from '../data'
import { Eyebrow, Stat } from '../parts'

/** How often a slot comes round, given the ad load. Derived rather than
 *  written down: "55 ad slots a day" is a number with no scale attached to
 *  it, and "one every nine minutes" is the same fact a stranger can picture. */
const MINUTES_BETWEEN_SLOTS = Math.round(WORKING_DAY_MINUTES / IMPRESSIONS_PER_USER_DAY.value)

/**
 * App 1. The pitch window, with the auction beside it rather than inside it —
 * two separate objects on the same desktop, which gives the headline the air
 * it needs to win against the wallpaper and gives the business model a place
 * to run where it is not competing with prose.
 *
 * The headline says what the product is. It used to be a joke about a messy
 * desktop, which is funny once you already know what this is and useless
 * thirty seconds after arriving; the plain proposition earns the joke later.
 */
export function HeroApp() {
  return (
    <div className="flex w-full items-stretch gap-[clamp(20px,2.2vw,38px)]">
      <OSWindow
        title="The Attention Exchange"
        subtitle="v1.0"
        className="min-w-0 flex-[1.62_1_580px]"
        bodyStyle={HERO_BODY}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="p-[clamp(28px,2.7vw,46px)] pb-[clamp(24px,2.2vw,34px)]">
            <Eyebrow>macOS · free · you set the ad load</Eyebrow>

            {/* An h2 — the hero in front of the laptop owns the page's h1.
                The two sentences swapped places: the hero now leads with the
                offer, in the active voice, because that is what a front door
                is for. This one names the market instead, which is the right
                register once somebody has scrolled in and is being shown how
                it works rather than being told what it is. */}
            <h2 className={`mt-[16px] max-w-[16ch] ${TYPE.display}`}>
              The empty space on your screen is worth money.
            </h2>

            <p className={`mt-[18px] max-w-[54ch] ${TYPE.subhead}`} style={{ color: INK.body }}>
              It rents the parts of your desktop nothing is using. Never over your work, and
              most of what it earns is yours.
            </p>

            <div className="mt-[clamp(22px,2.2vw,32px)] flex flex-wrap gap-[14px]">
              <OSButton variant="money" href="/join">Get the app</OSButton>
              <OSButton href="/exchange">See the exchange</OSButton>
            </div>
          </div>

          {/* The figures, in a footer band of their own. Three identical
              weights was three claims a stranger had to take at once; this is
              one number with two footnotes. */}
          <div
            className="mt-auto flex flex-wrap items-end gap-x-[clamp(24px,2.6vw,44px)] gap-y-[18px] p-[clamp(20px,1.9vw,28px)_clamp(28px,2.7vw,46px)]"
            style={HERO_FOOTER}
          >
            <Stat
              size="hero"
              accent
              value={`$${userPayoutPerMonth().toFixed(2)}`}
              caption={<>a month, paid to you in AI credits</>}
            />
            <span
              aria-hidden
              className="hidden h-[46px] w-px self-center sm:block"
              style={{ background: 'rgba(20,26,34,.14)' }}
            />
            <Stat
              value={String(IMPRESSIONS_PER_USER_DAY.value)}
              caption={<>ads a day — about one every {MINUTES_BETWEEN_SLOTS} minutes you work</>}
            />
            <Stat
              value={`${Math.round(USER_REVENUE_SHARE.value * 100)}%`}
              caption={<>of the price each ad sells for goes to you</>}
            />
          </div>
        </div>
      </OSWindow>

      {/* Hidden below 1180px rather than wrapped: at the widths where it no
          longer fits beside the headline it would have to shrink past the
          point where its own figures are legible, and an auction you cannot
          read the prices in is worse than no auction. */}
      <Auction className="hidden min-w-0 max-w-[430px] flex-[1_1_330px] self-center xl:block" />
    </div>
  )
}
