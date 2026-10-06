import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }), usePathname: () => '/books' }))
import { getBooks } from '@/content/books'
import { Bookshelf } from '../Bookshelf'
import { BookSpread } from '../BookSpread'

const books = getBooks()

describe('Bookshelf', () => {
  it('shelves every book as a link to it', () => {
    render(<Bookshelf books={books} />)
    for (const b of books) {
      expect(screen.getByRole('link', { name: `${b.title} by ${b.author}` }).getAttribute('href')).toBe(`/books/${b.slug}`)
    }
  })
})

describe('BookSpread', () => {
  const long = { ...books[0], review: ['a'.repeat(400), 'b'.repeat(400), 'c'.repeat(400)] }

  it('opens to the cover and the first page of the review', () => {
    render(<BookSpread book={books[0]} />)
    expect(screen.getByRole('heading', { level: 2, name: books[0].title })).toBeTruthy()
    expect(screen.getByText(books[0].author)).toBeTruthy()
    expect(screen.getByText(books[0].review[0])).toBeTruthy()
  })

  it('turns pages of a long review', () => {
    render(<BookSpread book={long} />)
    expect(screen.queryByText(long.review[2])).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText(long.review[2])).toBeTruthy()
  })

  it('is in the server HTML', () => {
    // React escapes apostrophes in HTML, so match the review without them.
    expect(renderToString(<BookSpread book={books[0]} />)).toContain(books[0].review[0].split("'").pop())
  })
})
