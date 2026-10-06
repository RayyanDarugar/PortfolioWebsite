import type { Metadata } from 'next'
import { RecordCrate } from '@/components/music/RecordCrate'
import { Overlay } from '@/components/overlays/Overlay'
import { RECORDS } from '@/content/records'

export const metadata: Metadata = { title: 'Records' }

/** The record player. The room is drawn by <OS /> in the root layout. */
export default function MusicPage() {
  return <Overlay label="Records"><RecordCrate records={RECORDS} /></Overlay>
}
