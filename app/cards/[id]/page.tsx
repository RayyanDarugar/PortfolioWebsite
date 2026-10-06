import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GameCard } from '@/components/overlays/GameCard'
import { Overlay } from '@/components/overlays/Overlay'
import { getCard, getCards, siblings } from '@/content/cards'

/** Only the cards in content/cards exist; anything else under /cards is a 404. */
export const dynamicParams = false

export function generateStaticParams() {
  return getCards().map((card) => ({ id: card.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: getCard(id)?.title }
}

/** A game card over the room. The room is drawn by <OS /> in the root layout. */
export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = getCard(id)
  if (!card) notFound()
  const { prev, next } = siblings(card)
  return (
    <Overlay label={card.title}>
      <GameCard
        card={{ id: card.id, tag: card.tag, title: card.title, photo: card.photo, stat: card.stat, body: card.body }}
        prev={prev?.id ?? null}
        next={next?.id ?? null}
      />
    </Overlay>
  )
}
