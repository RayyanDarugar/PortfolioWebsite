import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

export type OSButtonVariant = 'money' | 'aqua' | 'quiet'

/**
 * The lozenges. `components/ui/Button` is the interior pages' control and
 * stays as it is; this is the landing page's, and the difference is
 * deliberate — the owner's note on the existing build was that the buttons
 * are uninteresting, and the fix is not a tweak to a shared component that
 * five other pages are laid out against.
 *
 * What makes an Aqua capsule read as an object rather than a coloured pill:
 * a hard gloss break at the vertical midpoint (the top half is a separate,
 * lighter gradient), a bright inset cap on the top edge, a dark inset on the
 * bottom, a 1px rim, a tight contact shadow, and — for the money variant —
 * a coloured bloom under it, so the green looks lit rather than painted.
 */
const SKIN: Record<OSButtonVariant, CSSProperties> = {
  money: {
    background: 'linear-gradient(#C6F97C 0%,#9BEB2C 49%,#7ED000 51%,#5FAF00 100%)',
    color: '#183300',
    border: '1px solid #4E9200',
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,.92)',
      'inset 0 -1px 0 rgba(0,0,0,.16)',
      '0 1px 2px rgba(16,30,54,.30)',
      '0 10px 26px -8px rgba(110,200,0,.75)',
    ].join(','),
  },
  aqua: {
    background: 'linear-gradient(#BEDCFB 0%,#79B4F4 49%,#3C8AE6 51%,#1F63C4 100%)',
    color: '#FFFFFF',
    border: '1px solid #17539F',
    textShadow: '0 1px 1px rgba(0,20,60,.35)',
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,.80)',
      'inset 0 -1px 0 rgba(0,0,0,.18)',
      '0 1px 2px rgba(16,30,54,.30)',
      '0 10px 26px -8px rgba(40,120,230,.68)',
    ].join(','),
  },
  quiet: {
    background: 'linear-gradient(#FFFFFF 0%,#F4F7FA 49%,#E7ECF2 51%,#D6DDE6 100%)',
    color: '#26313D',
    border: '1px solid rgba(20,26,34,.26)',
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,.95)',
      'inset 0 -1px 0 rgba(0,0,0,.07)',
      '0 1px 2px rgba(16,30,54,.20)',
      '0 8px 20px -8px rgba(16,30,54,.35)',
    ].join(','),
  },
}

const SHELL =
  'group relative inline-flex select-none items-center justify-center gap-2 overflow-hidden ' +
  'rounded-full px-[26px] py-[13px] text-[14.5px] font-bold ' +
  'transition-[transform,filter,box-shadow] duration-150 ease-out ' +
  'hover:-translate-y-[1px] hover:brightness-[1.045] active:translate-y-[1px] active:brightness-[.97] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-white/85'

/** The specular sweep. A separate element rather than a gradient stop so it
 *  can sit above the label's own stacking context and be masked to the top
 *  half without touching the fill underneath. */
function Gloss() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-[1px] top-[1px] h-[45%] rounded-t-full"
      style={{
        background:
          'linear-gradient(rgba(255,255,255,.78),rgba(255,255,255,.28) 60%,rgba(255,255,255,0))',
      }}
    />
  )
}

export function OSButton({
  children, variant = 'quiet', href, onClick, type = 'button', className = '',
}: {
  children: ReactNode
  variant?: OSButtonVariant
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
}) {
  const face = (
    <>
      <Gloss />
      <span className="relative" style={{ fontFamily: 'var(--font-ui)' }}>{children}</span>
    </>
  )

  // A control that navigates has to be an anchor. Same rule the interior
  // pages' Button follows, for the same reasons: middle-click, keyboard
  // activation, and screen-reader role all break on a <button> in a <Link>.
  if (href) {
    return (
      <Link href={href} className={`${SHELL} ${className}`} style={SKIN[variant]}>
        {face}
      </Link>
    )
  }
  return (
    <button type={type} onClick={onClick} className={`${SHELL} ${className}`} style={SKIN[variant]}>
      {face}
    </button>
  )
}
