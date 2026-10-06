import type { Metadata } from 'next'
import { Bookshelf } from '@/components/books/Bookshelf'
import { Overlay } from '@/components/overlays/Overlay'
import { getBooks } from '@/content/books'

export const metadata: Metadata = { title: 'Books' }

/** The bookshelf. The room is drawn by <OS /> in the root layout. */
export default function BooksPage() {
  const books = getBooks().map(({ slug, title, author, spine, special }) => ({ slug, title, author, spine, special }))
  return <Overlay label="Bookshelf"><Bookshelf books={books} /></Overlay>
}
