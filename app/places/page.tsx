import type { Metadata } from 'next'
import { Globe } from '@/components/globe/Globe'
import { Overlay } from '@/components/overlays/Overlay'
import { getPlaces } from '@/content/places'

export const metadata: Metadata = { title: 'Places' }

/** The globe. The room is drawn by <OS /> in the root layout. */
export default function PlacesPage() {
  const places = getPlaces().map(({ slug, name, lat, lon }) => ({ slug, name, lat, lon }))
  return <Overlay label="Places"><Globe places={places} /></Overlay>
}
