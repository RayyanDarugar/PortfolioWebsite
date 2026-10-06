import { InAppLink } from '@/components/overlays/InAppLink'

const PIXEL_TEXT = { fontFamily: 'var(--font-pixel)' }

/** Light or dark lettering, whichever reads on the spine. */
function ink(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const lum = 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)
  return lum > 150 ? '#2a1a0e' : '#f3e3c4'
}

/**
 * The bookshelf (spec §4): the eight books as spines on a wooden shelf. Each
 * spine opens the book. Percy Jackson gets its special spine: sea green with
 * a gold trident and gilt bands.
 */
export function Bookshelf({ books }: { books: readonly { slug: string; title: string; author: string; spine: string; special?: 'percy' }[] }) {
  return (
    <div className="flex flex-col items-center gap-[14px] text-[#f3e3c4]">
      <h2 className="text-[14px] uppercase tracking-[.24em]" style={PIXEL_TEXT}>Books I&apos;d recommend</h2>
      <div className="rounded-[10px] px-[22px] pt-[22px]" style={{ background: 'linear-gradient(#5a3a22,#3d2616)', boxShadow: 'inset 0 0 0 6px #6e4a2c, 0 20px 40px rgba(0,0,0,.5)' }}>
        <ul className="flex items-end gap-[6px]">
          {books.map((b, i) => {
            const percy = b.special === 'percy'
            return (
              <li key={b.slug}>
                <InAppLink
                  href={`/books/${b.slug}`}
                  aria-label={`${b.title} by ${b.author}`}
                  className="group relative flex w-[46px] items-center justify-center rounded-t-[3px] transition-transform duration-150 hover:-translate-y-[10px] focus-visible:-translate-y-[10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd36e]"
                  style={{
                    height: 210 + ((i * 37) % 50),
                    background: percy ? 'linear-gradient(90deg,#14504d,#1f6f6b 40%,#14504d)' : b.spine,
                    boxShadow: 'inset -4px 0 0 rgba(0,0,0,.25), inset 4px 0 0 rgba(255,255,255,.12)',
                    borderTop: percy ? '6px solid #d9b03c' : undefined,
                    borderBottom: percy ? '6px solid #d9b03c' : '4px solid rgba(0,0,0,.25)',
                  }}
                >
                  {percy && <span aria-hidden className="absolute top-[12px] text-[16px] text-[#e8c25a]">Ψ</span>}
                  <span className="whitespace-nowrap text-[11px] uppercase tracking-[.12em]" style={{ ...PIXEL_TEXT, color: percy ? '#f3e3c4' : ink(b.spine), writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    {b.title}
                  </span>
                </InAppLink>
              </li>
            )
          })}
        </ul>
        <div className="h-[14px]" style={{ background: '#2a1a0e', margin: '0 -22px', borderRadius: '0 0 10px 10px' }} />
      </div>
    </div>
  )
}
