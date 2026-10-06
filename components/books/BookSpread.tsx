'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { Book } from '@/content/books'
import { reviewPages } from '@/content/books'

/** The spread's two pages, px of public/ui/book-spread.png (1400 × 906), measured from the file. */
const LEFT = [102, 30, 667, 719] as const
const RIGHT = [734, 30, 1297, 719] as const
const place = ([x0, y0, x1, y1]: readonly number[]) => ({
  left: `${(x0 / 1400) * 100}%`, top: `${(y0 / 906) * 100}%`, width: `${((x1 - x0) / 1400) * 100}%`, height: `${((y1 - y0) / 906) * 100}%`,
})
const INK = '#3a2a1c'

function Stars({ rating }: { rating: number }) {
  return (
    <p aria-label={`${rating} out of 5`} className="mt-[1.5cqw] text-[2.2cqw] tracking-[.2em] text-[#b07a1e]" style={{ fontFamily: 'var(--font-pixel)' }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </p>
  )
}

/**
 * A book, open (spec §4): cover, title and author on the left; the review and
 * rating on the right; a long review turns pages (buttons or ←/→).
 */
export function BookSpread({ book }: { book: Book }) {
  const pages = reviewPages(book.review)
  const [page, setPage] = useState(0)
  const last = pages.length - 1

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'ArrowRight') setPage((p) => Math.min(last, p + 1))
      if (event.key === 'ArrowLeft') setPage((p) => Math.max(0, p - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [last])

  return (
    <article className="relative w-[min(900px,92vw)] [container-type:inline-size]" style={{ aspectRatio: '1400 / 906' }}>
      <Image src="/ui/book-spread.png" alt="" fill sizes="900px" priority className="pointer-events-none" />

      <div className="absolute flex flex-col items-center justify-center gap-[2cqw] px-[3cqw] text-center" style={place(LEFT)}>
        <div className="flex aspect-[2/3] w-[46%] flex-col items-center justify-center rounded-[4px] p-[1.5cqw]" style={{ background: book.special === 'percy' ? 'linear-gradient(#1f6f6b,#14504d)' : book.spine, boxShadow: 'inset 0 0 0 4px rgba(0,0,0,.2), 0 6px 14px rgba(0,0,0,.3)' }}>
          <span className="text-[2.1cqw] uppercase tracking-[.1em] text-[#f3e3c4]" style={{ fontFamily: 'var(--font-pixel)' }}>{book.title}</span>
        </div>
        <h2 className="text-[3cqw] leading-[1.1]" style={{ color: INK, fontFamily: 'var(--font-display)', fontWeight: 800 }}>{book.title}</h2>
        <p className="text-[1.9cqw]" style={{ color: '#7a5a3a', fontFamily: 'var(--font-ui)' }}>{book.author}</p>
        {book.rating !== undefined && <Stars rating={book.rating} />}
      </div>

      <div className="absolute flex flex-col px-[3.5cqw] py-[3cqw]" style={place(RIGHT)}>
        <div className="flex-1 overflow-y-auto">
          {pages[page].map((p) => (
            <p key={p} className="mb-[1.6cqw] text-[1.85cqw] leading-[1.55]" style={{ color: INK, fontFamily: 'var(--font-ui)' }}>{p}</p>
          ))}
        </div>
        {pages.length > 1 && (
          <div className="flex items-center justify-between text-[1.5cqw] uppercase tracking-[.16em]" style={{ color: '#7a5a3a', fontFamily: 'var(--font-pixel)' }}>
            <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-30">←</button>
            <span>{page + 1} / {pages.length}</span>
            <button type="button" aria-label="Next page" disabled={page === last} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-30">→</button>
          </div>
        )}
      </div>
    </article>
  )
}
