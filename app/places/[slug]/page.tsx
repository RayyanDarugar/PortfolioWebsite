import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GameCard } from '@/components/overlays/GameCard'
import { Overlay } from '@/components/overlays/Overlay'
import { getPlace, getPlaces } from '@/content/places'

export const dynamicParams = false

export function generateStaticParams() {
  return getPlaces().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return { title: getPlace(slug)?.name }
}

/** A place's game card (spec §4). The room is drawn by <OS /> in the root layout. */
export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const place = getPlace(slug)
  if (!place) notFound()
  return (
    <Overlay label={place.name}>
      <GameCard
        card={{ id: place.slug, tag: `PLACE · ${place.name.toUpperCase()} · ${place.date.toUpperCase()}`, title: place.name, photo: place.photo, body: place.story }}
        prev={null}
        next={null}
      />
    </Overlay>
  )
}
