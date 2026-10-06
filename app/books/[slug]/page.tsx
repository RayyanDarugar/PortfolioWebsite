import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BookSpread } from '@/components/books/BookSpread'
import { Overlay } from '@/components/overlays/Overlay'
import { getBook, getBooks } from '@/content/books'

export const dynamicParams = false

export function generateStaticParams() {
  return getBooks().map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return { title: getBook(slug)?.title }
}

/** One book, open. The room is drawn by <OS /> in the root layout. */
export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const book = getBook(slug)
  if (!book) notFound()
  return <Overlay label={book.title}><BookSpread book={book} /></Overlay>
}
