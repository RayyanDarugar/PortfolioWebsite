import type { Metadata } from 'next'
import { JournalContents } from '@/components/journal/Journal'
import { Overlay } from '@/components/overlays/Overlay'
import { getEntries } from '@/content/journal'

export const metadata: Metadata = { title: 'Journal' }

/** The journal's contents. The room is drawn by <OS /> in the root layout. */
export default function JournalPage() {
  return <Overlay label="Journal"><JournalContents entries={getEntries()} /></Overlay>
}
