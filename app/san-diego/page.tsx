import type { Metadata } from 'next'
import { Overlay } from '@/components/overlays/Overlay'
import { SanDiegoCard } from '@/components/overlays/SanDiegoCard'

export const metadata: Metadata = { title: 'San Diego' }

/** The window: San Diego, right now. The room is drawn by <OS /> in the root layout. */
export default function SanDiegoPage() {
  return <Overlay label="San Diego"><SanDiegoCard /></Overlay>
}
