import { OSButton } from '../OSButton'
import { OSWindow } from '../OSWindow'
import { INK } from '../chrome'
import { MailGlyph } from '../icons'
import { planSurfaces, seatsFor, type CampaignPlan } from '../campaign'

const MAILBOXES: readonly { name: string; count?: string; on?: boolean }[] = [
  { name: 'Inbox', count: '2' },
  { name: 'Drafts', count: '1', on: true },
  { name: 'Sent' },
  { name: 'Media plans' },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-[14px] py-[9px]"
         style={{ borderBottom: '1px solid rgba(20,26,34,.10)' }}>
      <span className="w-[62px] flex-none text-right text-[12.5px] font-bold text-[#9AA4B0]"
            style={{ fontFamily: 'var(--font-ui)' }}>
        {label}
      </span>
      <span className="min-w-0 text-[14px] text-[#26313D]" style={{ fontFamily: 'var(--font-ui)' }}>
        {children}
      </span>
    </div>
  )
}

/** Reads the plan back as a sentence. Written from the plan rather than typed,
 *  so a visitor who dragged the budget to $30,000 four windows ago finds their
 *  own number in the letter — which is the whole reason the state travels. */
function surfaceList(plan: CampaignPlan): string {
  const names = planSurfaces(plan).map((surface) => surface.name.toLowerCase())
  if (names.length === 0) return 'no surfaces yet'
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} and the ${names[names.length - 1]}`
}

/**
 * App 7 on the advertiser account: the ask, and there is only one.
 *
 * Not a demo request, not a deck, not a call. The question this whole desktop
 * exists to put in front of a demand-gen lead is *would you run a $10,000
 * test, and what would you need to see before you spent more* — and the
 * second half of that is the half that matters, because a test built around
 * the buyer's bar is a shorter conversation than a test built around ours.
 *
 * Send is a real link to the request form on `/advertisers`. A dead Send
 * button on the last window of the page is the one place this build cannot
 * afford to be theatre.
 */
export function AdMailApp({ plan }: { plan: CampaignPlan }) {
  return (
    <OSWindow
      title="Mail"
      subtitle="Drafts"
      toolbar={
        <>
          <span className="flex items-center gap-[9px] text-[12.5px] font-bold text-[#3B4756]">
            <span className="flex h-[19px] w-[19px] items-center justify-center rounded-[5px] p-[3px]"
                  style={{ background: 'linear-gradient(#7FB4F5,#1B63C0)' }}>
              <MailGlyph />
            </span>
            New Message
          </span>
          <span className="ml-auto text-[11.5px] font-bold uppercase tracking-[.08em] text-[#8A94A2]">
            Not sent
          </span>
        </>
      }
    >
      <div className="flex h-full min-h-0">
        <div className="hidden w-[190px] flex-none flex-col gap-[2px] p-[10px] md:flex"
             style={{ background: 'linear-gradient(#EFF3F8,#E4EAF1)', borderRight: '1px solid rgba(20,26,34,.13)' }}>
          <span className="px-[10px] pb-[8px] pt-[6px] text-[11px] font-bold uppercase tracking-[.09em] text-[#8A94A2]"
                style={{ fontFamily: 'var(--font-ui)' }}>
            Mailboxes
          </span>
          {MAILBOXES.map((box) => (
            <span
              key={box.name}
              className="flex items-center gap-[9px] rounded-[7px] px-[10px] py-[7px] text-[13.5px] font-bold"
              style={{
                fontFamily: 'var(--font-ui)',
                background: box.on ? 'linear-gradient(#5DA9F6,#1F6FD0)' : 'transparent',
                color: box.on ? '#fff' : '#3B4756',
                boxShadow: box.on ? 'inset 0 1px 0 rgba(255,255,255,.35), 0 1px 3px rgba(16,50,110,.35)' : 'none',
              }}
            >
              <span className="h-[15px] w-[15px] flex-none rounded-[4px]"
                    style={{ background: box.on ? 'rgba(255,255,255,.85)' : 'linear-gradient(#B7C3D0,#8C9AAA)' }} />
              {box.name}
              {box.count && (
                <span className="tabular ml-auto text-[11.5px] font-bold"
                      style={{ color: box.on ? 'rgba(255,255,255,.8)' : '#9AA4B0' }}>
                  {box.count}
                </span>
              )}
            </span>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-[clamp(22px,2.3vw,36px)]">
          <Field label="To:">
            <span className="rounded-[5px] px-[8px] py-[3px]"
                  style={{ background: 'rgba(46,127,224,.13)', color: '#1F5FB5' }}>
              The Attention Exchange
            </span>
          </Field>
          <Field label="Subject:">
            <b className="font-bold">
              Run a ${plan.budget.toLocaleString('en-US')} test
            </b>
          </Field>

          <div className="mt-[20px] max-w-[58ch] flex-1">
            <p className="text-[clamp(16px,1.3vw,20px)] leading-[1.55]" style={{ color: INK.strong }}>
              We will put{' '}
              <b className="tabular font-bold">${plan.budget.toLocaleString('en-US')}</b> against{' '}
              {plan.flightDays} days across the {surfaceList(plan)}, capped at {plan.frequency} a
              day per person — roughly{' '}
              <b className="tabular font-bold">{seatsFor(plan).toLocaleString('en-US')}</b> declared
              seats.
            </p>
            <p className="mt-[18px] text-[15px] leading-[1.55]" style={{ color: INK.body }}>
              Before we do: what has to be true at the end of it for us to spend more? Give us your
              number and your walk-away condition and build the test around them — a viewability
              floor, a CTR relative to our other channels, a cost per qualified seat, a date.
            </p>
            <p className="mt-[16px] text-[15px] leading-[1.55]" style={{ color: INK.body }}>
              We would rather be told the surface failed our bar than shown an average that hides
              which of the three did the work.
            </p>
            <p className="mt-[22px] text-[13.5px] leading-[1.5]" style={{ color: INK.dim }}>
              — Sent from a desk with four channels and one that is new
            </p>
          </div>

          <div className="mt-[24px] flex flex-wrap items-center gap-x-[18px] gap-y-3 pt-[20px]"
               style={{ borderTop: '1px solid rgba(20,26,34,.13)' }}>
            <OSButton variant="money" href="/advertisers">Send</OSButton>
            <OSButton href="/exchange">Check the board first</OSButton>
            <span className="text-[12.5px] leading-[1.45] text-[#7A8593]" style={{ fontFamily: 'var(--font-ui)' }}>
              One budget, one condition. That is the whole form.
            </span>
          </div>
        </div>
      </div>
    </OSWindow>
  )
}
