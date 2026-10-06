import { CPM_DESIGN_POINT, CPM_KICKBACKS_TOP4, IMPRESSIONS_PER_USER_DAY } from '@/lib/model/figures'
import { AdSlot } from '../AdSlot'
import { OSButton } from '../OSButton'
import { OSWindow } from '../OSWindow'
import { HERO_BODY, HERO_FOOTER, INK, TYPE } from '../chrome'
import { Eyebrow, Stat } from '../parts'

/**
 * App 1 on the advertiser account. Same window, same footer band, the other
 * side of the trade.
 *
 * The user's hero sells a payout. This one has to answer a colder
 * question from someone with a budget and four other channels: *why is this
 * worth more than the inventory I am buying today.* So the headline is the
 * asset — space beside work, not inside content — and the figures under it
 * are the price of that space next to the closest thing that actually exists.
 *
 * The middle figure is the uncomfortable one and it is on the window on
 * purpose. A demand-gen lead who finds out later that the design point has
 * never been cleared anywhere does not take the second meeting; one who is
 * handed both numbers in the first thirty seconds has been told the truth by
 * a vendor, which is rarer and worth more.
 */
export function AdHeroApp() {
  return (
    <div className="flex w-full items-stretch gap-[clamp(20px,2.2vw,38px)]">
      <OSWindow
        title="The Attention Exchange"
        subtitle="Buy side"
        className="min-w-0 flex-[1.62_1_580px]"
        bodyStyle={HERO_BODY}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="p-[clamp(28px,2.7vw,46px)] pb-[clamp(24px,2.2vw,34px)]">
            <Eyebrow>Declared audiences · verified placements · second-price</Eyebrow>

            {/* An h2. The hero in front of the laptop owns the page's h1;
                this window states the offer one level down from it. */}
            <h2 className={`mt-[16px] max-w-[17ch] ${TYPE.display}`}>
              Buy the space beside the work, not inside the answer.
            </h2>

            <p className={`mt-[18px] max-w-[56ch] ${TYPE.subhead}`} style={{ color: INK.body }}>
              Every other surface in this category renders inside the thing your buyer
              opened the app for. This one renders in the rectangle nothing was using —
              on the machine of someone who told us what they do and whether they can
              sign for it.
            </p>

            <div className="mt-[clamp(22px,2.2vw,32px)] flex flex-wrap gap-[14px]">
              <OSButton variant="money" href="/advertisers">Start a test</OSButton>
              <OSButton href="/exchange">See the board</OSButton>
            </div>
          </div>

          <div
            className="mt-auto flex flex-wrap items-end gap-x-[clamp(24px,2.6vw,44px)] gap-y-[18px] p-[clamp(20px,1.9vw,28px)_clamp(28px,2.7vw,46px)]"
            style={HERO_FOOTER}
          >
            <Stat
              size="hero"
              accent
              value={`$${CPM_DESIGN_POINT.value.toFixed(2)}`}
              caption={<>CPM the top surface is priced at</>}
            />
            <span
              aria-hidden
              className="hidden h-[46px] w-px self-center sm:block"
              style={{ background: 'rgba(20,26,34,.14)' }}
            />
            <Stat
              value={`$${CPM_KICKBACKS_TOP4.value.toFixed(2)}`}
              caption={<>the highest this market has actually cleared — priced against, not hidden</>}
            />
            <Stat
              value={String(IMPRESSIONS_PER_USER_DAY.value)}
              caption={<>slots a working day, per seat, at the default load</>}
            />
          </div>
        </div>
      </OSWindow>

      {/* Same rule as the other account's auction: below 1180px this would
          have to shrink past the point where a 300 × 250 unit is drawn at its
          real size, and an ad drawn smaller than it renders is a picture of an
          ad rather than the thing being sold. */}
      <AdSlot className="hidden min-w-0 max-w-[430px] flex-[1_1_330px] self-center xl:block" />
    </div>
  )
}
