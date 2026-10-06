'use client'
import { OSMenuBar } from './OSMenuBar'
import { Wallpaper } from './Wallpaper'
import { StaticHero } from './intro/Hero'
import { ACCOUNTS, accountFor, type Profile } from './profiles'
import { appsFor } from './registry'
import type { CampaignPlan } from './campaign'

/**
 * The fallback, and the one place the login screen must never appear.
 *
 * A reduced-motion visitor and a visitor on a narrow window both get the page
 * as a document. Making them pick an account first would be a modal gate on a
 * page that has, at that point, told them nothing — so a visitor with no
 * account gets **both** accounts' windows in document order, each behind a
 * plain band that says whose they are and offers the choice as an ordinary
 * button. Choosing one narrows the page to it; not choosing costs nothing and
 * hides nothing. There is no state in which this path is a dead end.
 *
 * It gets the primer hero too, and it is the bigger improvement here: this
 * path used to open by dropping the visitor straight into an app window with
 * no orienting sentence in front of it. There is no laptop, because a static
 * picture of a desktop directly above that same desktop's contents is
 * decoration, and it would cost the most layout on exactly the narrowest
 * viewports that can least afford it.
 */
export function Stacked({
  profile, slots, setSlots, plan, setPlan, onChoose, onSwitchUser,
}: {
  profile: Profile | null
  slots: number
  setSlots: (n: number) => void
  plan: CampaignPlan
  setPlan: (next: CampaignPlan) => void
  onChoose: (profile: Profile) => void
  onSwitchUser: () => void
}) {
  const shown: readonly Profile[] = profile === null ? ACCOUNTS.map((a) => a.id) : [profile]

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0"><Wallpaper cast={profile === 'advertiser'} /></div>
      <OSMenuBar
        pinned
        appName="The Attention Exchange"
        profile={profile}
        onSwitchUser={onSwitchUser}
      />
      <div className="relative pt-[30px]">
        <StaticHero onAdvertisers={() => onChoose('advertiser')} />
      </div>
      <div className="relative mx-auto flex w-full max-w-[1240px] flex-col gap-[clamp(28px,5vw,60px)] px-[clamp(12px,3vw,30px)] pb-[90px] pt-[20px]">
        {shown.map((id) => {
          const account = accountFor(id)
          return (
            <div key={id} className="flex flex-col gap-[clamp(28px,5vw,60px)]">
              {profile === null && (
                <div
                  className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[14px] p-[18px_22px]"
                  style={{
                    background: 'rgba(24,18,38,.52)',
                    border: '1px solid rgba(255,255,255,.18)',
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  <span
                    aria-hidden
                    className="block h-[38px] w-[38px] flex-none rounded-full p-[7px]"
                    style={{ background: account.tile, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5)' }}
                  >
                    <account.Avatar />
                  </span>
                  <div className="min-w-[18ch] flex-1">
                    <b className="block text-[16px] font-bold text-white">{account.name}</b>
                    <span className="mt-[3px] block text-[13px] leading-[1.45] text-white/60">
                      {account.hint}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChoose(id)}
                    className="flex-none rounded-full px-[18px] py-[8px] text-[13px] font-bold text-white hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    style={{
                      background: 'rgba(255,255,255,.16)',
                      border: '1px solid rgba(255,255,255,.32)',
                    }}
                  >
                    Show only this
                  </button>
                </div>
              )}
              {appsFor(id).map((app) => (
                <app.Scene
                  key={`${id}-${app.id}`}
                  slots={slots}
                  setSlots={setSlots}
                  plan={plan}
                  setPlan={setPlan}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
