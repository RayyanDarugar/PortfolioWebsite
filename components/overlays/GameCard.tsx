'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { cardPath } from '@/components/os/view'

export interface CardView {
  id: string
  tag: string
  title: string
  photo: string
  stat?: string
  body: readonly string[]
}

/** The frame's transparent photo window and cream panels, in px of
 *  public/ui/card-frame.png (720 × 1099), measured from the file. */
export const FRAME = {
  w: 720,
  h: 1099,
  photo: [77, 74, 644, 541],
  banner: [56, 584, 666, 661],
  text: [56, 703, 666, 938],
  stat: [56, 979, 666, 1026],
} as const

const place = ([x0, y0, x1, y1]: readonly number[]) => ({
  left: `${(x0 / FRAME.w) * 100}%`,
  top: `${(y0 / FRAME.h) * 100}%`,
  width: `${((x1 - x0) / FRAME.w) * 100}%`,
  height: `${((y1 - y0) / FRAME.h) * 100}%`,
})

const SWIPE = 50 // px

/**
 * One trading-card frame for every game card (spec §4): photo, name, type tag,
 * a short story, an optional stat line. Cards in a set (the three schools)
 * step with the arrow keys, a swipe, or the links under the card; each step
 * replaces the URL so the back button still leaves the set in one press.
 */
export function GameCard({ card, prev, next }: { card: CardView; prev: string | null; next: string | null }) {
  const router = useRouter()
  const start = useRef<number | null>(null)
  const go = (id: string | null) => { if (id) router.replace(cardPath(id), { scroll: false }) }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && prev) router.replace(cardPath(prev), { scroll: false })
      if (event.key === 'ArrowRight' && next) router.replace(cardPath(next), { scroll: false })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, router])

  return (
    <div className="flex flex-col items-center gap-[14px]">
      <article
        className="relative w-[min(380px,82vw)] touch-pan-y select-none [container-type:inline-size]"
        style={{ aspectRatio: `${FRAME.w} / ${FRAME.h}` }}
        onPointerDown={(event) => { start.current = event.clientX }}
        onPointerUp={(event) => {
          const from = start.current
          start.current = null
          if (from === null) return
          const dx = event.clientX - from
          if (dx < -SWIPE) go(next)
          if (dx > SWIPE) go(prev)
        }}
      >
        <div className="absolute overflow-hidden bg-[#1f160f]" style={place(FRAME.photo)}>
          <Image src={card.photo} alt="" fill sizes="380px" className="object-contain p-[6%]" style={{ imageRendering: 'pixelated' }} />
        </div>
        <Image src="/ui/card-frame.png" alt="" fill sizes="380px" priority className="pointer-events-none" />
        <h2
          className="absolute flex items-center justify-center px-[4cqw] text-center"
          style={{ ...place(FRAME.banner), fontFamily: 'var(--font-pixel)', fontSize: '4.6cqw', color: '#2a1a0e' }}
        >
          {card.title}
        </h2>
        <div className="absolute overflow-hidden px-[5cqw] py-[3.4cqw]" style={place(FRAME.text)}>
          <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '2.8cqw', letterSpacing: '.12em', color: '#8a5a2b' }}>
            {card.tag}
          </p>
          {card.body.map((paragraph) => (
            <p key={paragraph} className="mt-[2cqw]" style={{ fontFamily: 'var(--font-ui)', fontSize: '3.9cqw', lineHeight: 1.4, color: '#3a2a1c' }}>
              {paragraph}
            </p>
          ))}
        </div>
        {card.stat && (
          <p
            className="absolute flex items-center justify-center"
            style={{ ...place(FRAME.stat), fontFamily: 'var(--font-pixel)', fontSize: '3.2cqw', color: '#3a2a1c' }}
          >
            {card.stat}
          </p>
        )}
      </article>

      {(prev || next) && (
        <nav aria-label="More cards" className="flex w-[min(380px,82vw)] justify-between text-[12px] uppercase tracking-[.2em] text-[#f3e3c4]" style={{ fontFamily: 'var(--font-pixel)' }}>
          {prev ? <Link href={cardPath(prev)} replace scroll={false} className="hover:underline">← Previous</Link> : <span />}
          {next ? <Link href={cardPath(next)} replace scroll={false} className="hover:underline">Next →</Link> : <span />}
        </nav>
      )}
    </div>
  )
}
