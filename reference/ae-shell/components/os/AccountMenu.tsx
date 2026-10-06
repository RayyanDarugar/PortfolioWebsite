'use client'
import { useEffect, useRef, useState } from 'react'
import { ACCOUNTS, accountFor, type Profile } from './profiles'

/**
 * The fast-user-switching menu, in the menu extras where macOS puts it: the
 * account name on the right of the bar, and one item under it.
 *
 * This is the site's **only** way back to the login screen, and that is a
 * decision rather than an omission. A second route — a link in the footer, a
 * row in Spotlight — would be two controls for one action and would teach the
 * visitor that the menu bar is decoration. Putting it where a Mac user
 * already looks for it is both the faithful answer and the discoverable one.
 *
 * It is a real menu: a button that owns its expanded state, a list of real
 * buttons under it, Escape to close, click-away to close, and focus handed
 * back to the trigger on the way out.
 */
export function AccountMenu({
  profile, onSwitch,
}: {
  profile: Profile
  /** Clears the stored account and returns to the login screen. */
  onSwitch: () => void
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const account = accountFor(profile)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      trigger.current?.focus()
    }
    // `pointerdown` rather than `click`: a click that lands on another control
    // should both close this and do its own job, and waiting for `click`
    // would close the menu on the way back up instead of on the way down.
    const onDown = (event: PointerEvent) => {
      if (root.current?.contains(event.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  return (
    <div ref={root} className="relative flex items-stretch">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex flex-none items-center gap-[7px] rounded-[4px] px-[8px] text-white/85 hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
        style={{ background: open ? 'rgba(255,255,255,.22)' : undefined }}
      >
        <span
          aria-hidden
          className="block h-[15px] w-[15px] flex-none rounded-full p-[2px]"
          style={{ background: account.tile, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55)' }}
        >
          <account.Avatar />
        </span>
        <span className="hidden font-bold md:inline">{account.name}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-[calc(100%+4px)] w-[230px] overflow-hidden rounded-[8px] p-[5px] text-left"
          style={{
            background: 'rgba(42,34,58,.82)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            border: '1px solid rgba(255,255,255,.20)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.24), 0 22px 48px -14px rgba(4,6,20,.8)',
          }}
        >
          <div
            className="px-[10px] pb-[6px] pt-[5px] text-[10.5px] font-bold uppercase tracking-[.09em] text-white/40"
          >
            Logged in as {account.name}
          </div>

          {ACCOUNTS.filter((other) => other.id !== profile).map((other) => (
            <div key={other.id} className="px-[10px] pb-[7px] text-[12px] leading-[1.4] text-white/50">
              {other.name}: {other.hint}
            </div>
          ))}

          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onSwitch() }}
            className="block w-full rounded-[5px] px-[10px] py-[6px] text-left text-[13px] font-bold text-white hover:bg-[rgba(120,110,220,.62)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
          >
            Switch User…
          </button>
        </div>
      )}
    </div>
  )
}
