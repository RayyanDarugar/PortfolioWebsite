import { userPayoutPerMonth } from '@/lib/model/payout'
import { OSButton } from '../OSButton'
import { OSWindow } from '../OSWindow'
import { INK } from '../chrome'
import { MailGlyph } from '../icons'

const MAILBOXES: readonly { name: string; count?: string; on?: boolean }[] = [
  { name: 'Inbox', count: '3' },
  { name: 'Drafts', count: '1', on: true },
  { name: 'Sent' },
  { name: 'Archive' },
]

/** A header field in a compose window: a label, a hairline, a value. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-baseline gap-[14px] py-[9px]"
      style={{ borderBottom: '1px solid rgba(20,26,34,.10)' }}
    >
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

/**
 * App 7. The sign-up, as the thing a sign-up actually is: a message you send
 * us. The compose window is already written, and Send is a real link to the
 * declaration flow at `/join` rather than a form that would post nowhere — a
 * dead Send button on the last screen of the page is the one place this build
 * cannot afford to be theatre.
 */
export function MailApp() {
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
        <div
          className="hidden w-[190px] flex-none flex-col gap-[2px] p-[10px] md:flex"
          style={{ background: 'linear-gradient(#EFF3F8,#E4EAF1)', borderRight: '1px solid rgba(20,26,34,.13)' }}
        >
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
            <b className="font-bold">Put me on the list</b>
          </Field>

          <div className="mt-[20px] max-w-[58ch] flex-1">
            <p className="text-[clamp(16px,1.3vw,20px)] leading-[1.55]" style={{ color: INK.strong }}>
              I have a Mac. I spend half my day waiting on a model to finish, staring at a
              window with nothing in it. I would like to be paid for the empty space beside it,
              at{' '}
              <b className="tabular font-bold">${userPayoutPerMonth().toFixed(2)}</b> a month in
              credits, with the ad load set where I put it and zero as a real option.
            </p>
            <p className="mt-[18px] text-[15px] leading-[1.55]" style={{ color: INK.body }}>
              Send me the build.
            </p>
            <p className="mt-[22px] text-[13.5px] leading-[1.5]" style={{ color: INK.dim }}>
              — Sent from a desktop with one clean rectangle on it
            </p>
          </div>

          <div
            className="mt-[24px] flex flex-wrap items-center gap-x-[18px] gap-y-3 pt-[20px]"
            style={{ borderTop: '1px solid rgba(20,26,34,.13)' }}
          >
            <OSButton variant="money" href="/join">Send</OSButton>
            <OSButton href="/privacy">Read the privacy terms first</OSButton>
            <span className="text-[12.5px] leading-[1.45] text-[#7A8593]" style={{ fontFamily: 'var(--font-ui)' }}>
              Four questions, thirty seconds. We email you when your build is ready.
            </span>
          </div>
        </div>
      </div>
    </OSWindow>
  )
}
