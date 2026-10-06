import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

/** The bookshelf (spec §4): one Markdown file per book; the body is the review. */
export interface Book {
  slug: string
  title: string
  author: string
  order: number
  /** 1–5, shown as stars when present. */
  rating?: number
  /** The spine's colour on the shelf. */
  spine: string
  special?: 'percy'
  review: string[]
}

const DIR = path.join(process.cwd(), 'content', 'books')
let cache: Book[] | null = null

export function getBooks(): Book[] {
  if (cache) return cache
  cache = fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).map((file) => {
    const { data, content } = matter(fs.readFileSync(path.join(DIR, file), 'utf8'))
    for (const key of ['title', 'author', 'spine']) {
      if (typeof data[key] !== 'string' || !data[key]) throw new Error(`content/books/${file}: missing "${key}"`)
    }
    return {
      slug: file.replace(/\.md$/, ''),
      title: data.title,
      author: data.author,
      order: typeof data.order === 'number' ? data.order : 0,
      rating: typeof data.rating === 'number' ? data.rating : undefined,
      spine: data.spine,
      special: data.special === 'percy' ? 'percy' : undefined,
      review: content.trim().split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean),
    } satisfies Book
  }).sort((a, b) => a.order - b.order)
  return cache
}

export function getBook(slug: string): Book | undefined {
  return getBooks().find((b) => b.slug === slug)
}

/** Splits a review into pages of about `budget` characters, never inside a paragraph. */
export function reviewPages(review: string[], budget = 520): string[][] {
  const pages: string[][] = [[]]
  let used = 0
  for (const p of review) {
    if (used > 0 && used + p.length > budget) { pages.push([]); used = 0 }
    pages[pages.length - 1].push(p)
    used += p.length
  }
  return pages
}
