import { OSWindow } from '../OSWindow'
import { INK, WELL } from '../chrome'
import { NEVER_READS, READS } from '../data'
import { AppHeading, Eyebrow } from '../parts'
import { ShieldGlyph } from '../icons'

function Tick() {
  return (
    <svg viewBox="0 0 16 16" className="mt-[3px] h-[15px] w-[15px] flex-none" aria-hidden>
      <circle cx="8" cy="8" r="7.2" fill="#5FBE00" />
      <path d="M4.6 8.3 6.9 10.6 11.4 5.6" fill="none" stroke="#fff" strokeWidth="1.9"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Cross() {
  return (
    <svg viewBox="0 0 16 16" className="mt-[3px] h-[15px] w-[15px] flex-none" aria-hidden>
      <circle cx="8" cy="8" r="7.2" fill="#B9C2CD" />
      <path d="M5.4 5.4 10.6 10.6M10.6 5.4 5.4 10.6" fill="none" stroke="#fff" strokeWidth="1.9"
            strokeLinecap="round" />
    </svg>
  )
}

function List({
  title, note, items, kind,
}: { title: string; note: string; items: readonly string[]; kind: 'reads' | 'never' }) {
  return (
    <div className="min-w-[240px] flex-1 p-[18px_20px]" style={WELL}>
      <div className="flex items-baseline gap-[9px]">
        <b className="text-[15px] font-bold text-[#26313D]">{title}</b>
        <span className="tabular text-[12px] text-[#9AA4B0]">{items.length}</span>
      </div>
      <p className="mt-[4px] text-[12.5px] leading-[1.45]" style={{ color: INK.dim }}>{note}</p>
      <ul className="mt-[13px] space-y-[9px]">
        {items.map((item) => (
          <li key={item} className="flex gap-[9px] text-[13.5px] leading-[1.4]"
              style={{ color: kind === 'reads' ? '#26313D' : '#77828F' }}>
            {kind === 'reads' ? <Tick /> : <Cross />}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * App 6. The standing constraint on this product is that it is most easily
 * mistaken for adware, and every design decision has to survive the sentence
 * *this software sees your screen*. So the answer is not a paragraph of
 * reassurance — it is the system permission sheet the visitor already knows
 * how to read, quoting exactly what the app asks for, next to the two lists.
 */
export function PrivacyApp() {
  return (
    <OSWindow title="Privacy & Security" subtitle="Attention Exchange">
      <div className="flex h-full min-h-0 flex-wrap gap-[clamp(22px,2.4vw,40px)] p-[clamp(24px,2.5vw,40px)]">
        <div className="min-w-[300px] flex-[1_1_340px]">
          <AppHeading>It reads the shape of your screen, never the content.</AppHeading>
          <p className="mt-[16px] max-w-[46ch] text-[15px] leading-[1.55]" style={{ color: INK.body }}>
            The app needs one thing: where your windows are and how big they are. Rectangles,
            nothing else. It never captures the screen, never reads a pixel, and never sends
            anything but geometry off your machine. Placement is decided on your Mac, not on
            our server.
          </p>

          {/* The system sheet. A depiction of macOS's own permission dialog —
              deliberately not interactive, because a working Allow button on a
              marketing page would be a claim about what the page can do. */}
          <div
            className="mt-[24px] max-w-[420px] overflow-hidden rounded-[13px]"
            style={{
              background: 'linear-gradient(#FBFCFE,#EFF2F6)',
              border: '1px solid rgba(20,26,34,.18)',
              boxShadow: '0 2px 5px rgba(10,16,30,.18), 0 30px 60px -22px rgba(6,8,24,.55)',
            }}
            role="img"
            aria-label="A macOS permission dialog reading: Attention Exchange would like to read window geometry. It can see the position and size of your windows. It cannot see what is inside them."
          >
            <div className="flex gap-[14px] p-[20px_20px_16px]">
              <span
                className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[11px] p-[9px]"
                style={{
                  background: 'linear-gradient(#7FB4F5,#1B63C0)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55), 0 3px 8px rgba(16,50,110,.4)',
                }}
              >
                <ShieldGlyph />
              </span>
              <div className="min-w-0">
                <b className="block text-[14px] font-bold leading-[1.35] text-[#1A222C]"
                   style={{ fontFamily: 'var(--font-ui)' }}>
                  &ldquo;Attention Exchange&rdquo; would like to read window geometry.
                </b>
                <p className="mt-[6px] text-[12.5px] leading-[1.45] text-[#5A6674]"
                   style={{ fontFamily: 'var(--font-ui)' }}>
                  It can see the position and size of your windows. It cannot see what is inside
                  them, and it cannot capture your screen.
                </p>
              </div>
            </div>
            <div
              className="flex justify-end gap-[10px] p-[12px_20px_16px]"
              style={{ borderTop: '1px solid rgba(20,26,34,.10)' }}
              aria-hidden
            >
              <span className="rounded-full px-[18px] py-[8px] text-[13px] font-bold"
                    style={{
                      fontFamily: 'var(--font-ui)', color: '#3B4756',
                      background: 'linear-gradient(#FFFFFF,#E7ECF2)',
                      border: '1px solid rgba(20,26,34,.22)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9)',
                    }}>
                Don&rsquo;t Allow
              </span>
              <span className="rounded-full px-[18px] py-[8px] text-[13px] font-bold text-white"
                    style={{
                      fontFamily: 'var(--font-ui)',
                      background: 'linear-gradient(#79B4F4,#1F63C4)',
                      border: '1px solid #17539F',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5)',
                    }}>
                Allow
              </span>
            </div>
          </div>

          <div className="mt-[18px]">
            <Eyebrow>Revoke it in System Settings at any time. The app keeps working; it just stops earning.</Eyebrow>
          </div>
        </div>

        <div className="flex min-w-[300px] flex-[1.05_1_360px] flex-col gap-[14px]">
          <List
            kind="reads"
            title="What it reads"
            note="Everything the app is capable of seeing, in full."
            items={READS}
          />
          <List
            kind="never"
            title="What it never reads"
            note="Not opt-out, not off by default. Not implemented."
            items={NEVER_READS}
          />
        </div>
      </div>
    </OSWindow>
  )
}
