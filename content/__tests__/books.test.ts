import { describe, it, expect } from 'vitest'
import { getBook, getBooks, reviewPages } from '../books'

describe('the books', () => {
  it('are the eight from the spec, in shelf order, with the fields a spine needs', () => {
    const books = getBooks()
    expect(books.map((b) => b.title)).toEqual([
      'Contact', 'Red Rising', 'Percy Jackson', 'The Three-Body Problem', 'Sapiens', 'Zero to One', "Ender's Game", "Old Man's War",
    ])
    for (const b of books) expect(b.spine).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('gives Percy Jackson its special spine', () => {
    expect(getBook('percy-jackson')?.special).toBe('percy')
  })
})

describe('reviewPages', () => {
  it('keeps a short review on one page', () => {
    expect(reviewPages(['Short.'])).toEqual([['Short.']])
  })

  it('turns a long review into several pages without splitting a paragraph', () => {
    const para = 'x'.repeat(300)
    const pages = reviewPages([para, para, para, para])
    expect(pages.length).toBeGreaterThan(1)
    expect(pages.flat()).toEqual([para, para, para, para])
  })
})
