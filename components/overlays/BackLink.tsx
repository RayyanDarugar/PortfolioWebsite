'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'
import { consumeOpenedInApp } from './history'

/**
 * A link up one overlay level (entry → contents). Reached inside the site, it
 * goes back, so the deeper page leaves history and Esc then closes to the
 * room; from a pasted link there is nothing to go back to, so it replaces.
 */
export function BackLink({
  href, children, className, style,
}: { href: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  const router = useRouter()
  return (
    <Link href={href} replace scroll={false} className={className} style={style}
          onClick={(event) => {
            if (!consumeOpenedInApp()) return
            event.preventDefault()
            router.back()
          }}>
      {children}
    </Link>
  )
}
