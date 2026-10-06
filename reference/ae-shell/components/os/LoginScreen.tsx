'use client'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { ACCOUNTS, type Profile } from './profiles'

/**
 * The login window.
 *
 * The problem it solves is older than the desktop metaphor: this product has
 * two audiences with opposite motivations — someone renting screen space out
 * and someone buying it — and one page that addresses both at once addresses
 * neither. Every version of the fix that is a segmented nav or a pair of
 * tabs asks the visitor to do admin before they have been told anything.
 *
 * A Mac already had the answer. It boots to a window with the accounts on it,
 * you pick yours, and the machine you get is configured for you. So that is
 * what this is: two accounts, a picture and a hint each, and the desktop
 * assembling behind whichever one you press.
 *
 * ### The rules it obeys
 *
 *  - **It is above everything**, including the menu bar, because on macOS the
 *    login window is not a sheet over a desktop you could be using.
 *  - **The desktop behind it is `inert`**, which is the OS root's job rather
 *    than this component's, so nothing behind here can take focus or be
 *    reached by a screen reader while the choice is open.
 *  - **There is no dismiss.** No Escape, no click-away. It is not a modal
 *    interrupting a task; it is the first screen, and both ways out of it are
 *    on it. What keeps that from being a trap is that neither the
 *    reduced-motion path nor the narrow-viewport path ever mounts it — those
 *    get both accounts' content in document order instead.
 *  - **It never renders on the server as a decision.** The OS root resolves
 *    the stored account in a layout effect, so a returning visitor's login
 *    screen is gone before the browser paints rather than flashing.
 */
export function LoginScreen({ onChoose }: { onChoose: (profile: Profile) => void }) {
  const first = useRef<HTMLButtonElement>(null)

  // The window takes focus on mount. Without it a keyboard visitor arrives at
  // a screen with two buttons on it and their focus still on the document,
  // which on a page this tall means several Tab presses through nothing.
  useEffect(() => { first.current?.focus() }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex flex-col items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Choose an account"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.035 }}
      transition={{ duration: 0.42, ease: [0.32, 0.72, 0.24, 1] }}
      style={{
        // The wallpaper is already painted behind this; blurring it rather
        // than covering it is what makes the login read as being *on* the
        // machine instead of in front of it.
        background: 'rgba(14,10,28,.52)',
        backdropFilter: 'blur(46px) saturate(150%)',
        WebkitBackdropFilter: 'blur(46px) saturate(150%)',
      }}
    >
      <div className="w-full max-w-[860px] px-[24px] text-center">
        <p
          className="text-[12px] font-bold uppercase tracking-[.14em] text-white/45"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          The Attention Exchange
        </p>
        {/* An h2, not an h1. The page's h1 is the hero the visitor scrolled
            through to get here; this is the heading of a dialog inside it. */}
        <h2
          className="mx-auto mt-[14px] max-w-[20ch] text-[clamp(26px,3vw,40px)] font-extrabold leading-[1.05] tracking-[-.035em] text-white"
        >
          Which side of the screen are you on?
        </h2>

        <div className="mt-[clamp(30px,4vw,52px)] flex flex-wrap items-start justify-center gap-[clamp(20px,3vw,54px)]">
          {ACCOUNTS.map((account, i) => (
            <button
              key={account.id}
              ref={i === 0 ? first : undefined}
              type="button"
              onClick={() => onChoose(account.id)}
              className="group flex w-[min(300px,42vw)] flex-col items-center rounded-[18px] px-[16px] py-[18px] transition-colors duration-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span
                aria-hidden
                className="flex h-[clamp(92px,9vw,116px)] w-[clamp(92px,9vw,116px)] items-center justify-center rounded-full p-[clamp(18px,1.9vw,24px)] transition-transform duration-200 group-hover:scale-[1.045] group-focus-visible:scale-[1.045]"
                style={{
                  background: account.tile,
                  boxShadow: [
                    'inset 0 2px 0 rgba(255,255,255,.5)',
                    'inset 0 0 0 1px rgba(255,255,255,.34)',
                    '0 2px 6px rgba(6,8,24,.4)',
                    '0 26px 54px -18px rgba(4,6,20,.8)',
                  ].join(','),
                }}
              >
                <account.Avatar />
              </span>

              <b
                className="mt-[16px] block text-[clamp(17px,1.5vw,21px)] font-bold tracking-[-.01em] text-white"
                style={{ fontFamily: 'var(--font-ui)' }}
              >
                {account.name}
              </b>
              <span
                className="mt-[7px] block max-w-[30ch] text-[13.5px] leading-[1.45]"
                style={{ fontFamily: 'var(--font-ui)', color: 'rgba(255,255,255,.62)' }}
              >
                {account.hint}
              </span>

              {/* The macOS login button, revealed under the account you are
                  about to press. It is a drawing rather than a second control:
                  the whole tile is already the button, and two nested buttons
                  is one of them being unreachable by keyboard. */}
              <span
                aria-hidden
                className="mt-[14px] rounded-full px-[20px] py-[7px] text-[12.5px] font-bold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                style={{
                  fontFamily: 'var(--font-ui)',
                  background: 'rgba(255,255,255,.18)',
                  border: '1px solid rgba(255,255,255,.34)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.30)',
                }}
              >
                Log in
              </span>
            </button>
          ))}
        </div>

        <p
          className="mt-[clamp(26px,3vw,42px)] text-[12.5px] leading-[1.5] text-white/40"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          Switch accounts any time from the menu bar. Nothing is stored beyond this tab.
        </p>
      </div>
    </motion.div>
  )
}
