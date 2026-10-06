import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Entry } from '@/content/journal'
import { BackLink } from '@/components/overlays/BackLink'
import { InAppLink } from '@/components/overlays/InAppLink'

const INK = '#3a2a1c'
const PIXEL = { fontFamily: 'var(--font-pixel)' }
const pretty = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** One journal page: the Minecraft-style book-and-quill page (public/ui/journal-page.png, 900 × 1277). */
function Page({ children }: { children: ReactNode }) {
  return (
    <article className="relative w-[min(460px,88vw)] [container-type:inline-size]" style={{ aspectRatio: '900 / 1277' }}>
      <Image src="/ui/journal-page.png" alt="" fill sizes="460px" priority className="pointer-events-none" />
      <div className="absolute inset-[9%_10%_12%] overflow-y-auto">{children}</div>
    </article>
  )
}

/** The journal's contents page (spec §4): dated entries, newest first. */
export function JournalContents({ entries }: { entries: readonly Entry[] }) {
  return (
    <Page>
      <h2 className="text-[5cqw] uppercase tracking-[.2em]" style={{ ...PIXEL, color: INK }}>Contents</h2>
      <ol className="mt-[5cqw] flex flex-col gap-[4cqw]">
        {entries.map((e) => (
          <li key={e.slug}>
            <InAppLink href={`/journal/${e.slug}`} className="block hover:underline">
              <span className="block text-[2.8cqw] uppercase tracking-[.14em] text-[#8a5a2b]" style={PIXEL}>{pretty(e.date)}</span>
              <span className="block text-[4.4cqw] leading-[1.2]" style={{ color: INK, fontFamily: 'var(--font-display)', fontWeight: 700 }}>{e.title}</span>
              <span className="mt-[1cqw] block text-[3.2cqw] leading-[1.4]" style={{ color: '#6b5440', fontFamily: 'var(--font-ui)' }}>{e.summary}</span>
            </InAppLink>
          </li>
        ))}
      </ol>
    </Page>
  )
}

/** One entry, with the way back to the contents and to its neighbours. */
export function JournalEntry({ entry, prev, next }: { entry: Entry; prev: string | null; next: string | null }) {
  return (
    <Page>
      <BackLink href="/journal" className="text-[2.8cqw] uppercase tracking-[.14em] text-[#8a5a2b] hover:underline" style={PIXEL}>← Contents</BackLink>
      <p className="mt-[4cqw] text-[2.8cqw] uppercase tracking-[.14em] text-[#8a5a2b]" style={PIXEL}>{pretty(entry.date)}</p>
      <h2 className="mt-[1cqw] text-[5.4cqw] leading-[1.15]" style={{ color: INK, fontFamily: 'var(--font-display)', fontWeight: 800 }}>{entry.title}</h2>
      {entry.body.map((p) => (
        <p key={p} className="mt-[3.5cqw] text-[3.6cqw] leading-[1.55]" style={{ color: INK, fontFamily: 'var(--font-ui)' }}>{p}</p>
      ))}
      {(prev || next) && (
        <nav aria-label="More entries" className="mt-[5cqw] flex justify-between text-[2.8cqw] uppercase tracking-[.14em] text-[#8a5a2b]" style={PIXEL}>
          {prev ? <Link href={`/journal/${prev}`} replace scroll={false} className="hover:underline">← Newer</Link> : <span />}
          {next ? <Link href={`/journal/${next}`} replace scroll={false} className="hover:underline">Older →</Link> : <span />}
        </nav>
      )}
    </Page>
  )
}
