import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JournalEntry } from '@/components/journal/Journal'
import { Overlay } from '@/components/overlays/Overlay'
import { getEntries, getEntry } from '@/content/journal'

export const dynamicParams = false

export function generateStaticParams() {
  return getEntries().map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return { title: getEntry(slug)?.title }
}

/** One journal entry. The room is drawn by <OS /> in the root layout. */
export default async function EntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = getEntry(slug)
  if (!entry) notFound()
  const all = getEntries()
  const i = all.findIndex((e) => e.slug === slug)
  return (
    <Overlay label={entry.title}>
      <JournalEntry entry={entry} prev={all[i - 1]?.slug ?? null} next={all[i + 1]?.slug ?? null} />
    </Overlay>
  )
}
