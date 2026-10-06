'use client'
import Link, { type LinkProps } from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { markOverlayOpenedInApp, opensElsewhere } from './history'

/** A link from one overlay to a deeper one (shelf → book), so Esc steps back one level. */
export function InAppLink({
  children, className, style, 'aria-label': ariaLabel, ...props
}: LinkProps & { children: ReactNode; className?: string; style?: CSSProperties; 'aria-label'?: string }) {
  return (
    <Link {...props} scroll={false} className={className} style={style} aria-label={ariaLabel}
          onClick={(event) => { if (!opensElsewhere(event)) markOverlayOpenedInApp() }}>
      {children}
    </Link>
  )
}
