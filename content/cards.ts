import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

/**
 * The game cards (spec §4): one Markdown file per card in content/cards/.
 * Frontmatter holds the card's fields; the body is its story, one paragraph
 * per blank-line block. Adding a card is adding a file.
 *
 * Server-only: it reads the filesystem. Pages read it at build time and hand
 * components plain data.
 */

export interface Card {
  id: string
  /** The type line, e.g. "SCHOOL · HKUST · 2025". */
  tag: string
  title: string
  /** A path under /public. */
  photo: string
  stat?: string
  /** Cards in the same set swipe between each other, in `order`. */
  set?: string
  order: number
  body: string[]
}

const DIR = path.join(process.cwd(), 'content', 'cards')
let cache: Card[] | null = null

export function getCards(): Card[] {
  if (cache) return cache
  cache = fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).sort().map((file) => {
    const { data, content } = matter(fs.readFileSync(path.join(DIR, file), 'utf8'))
    for (const key of ['tag', 'title', 'photo']) {
      if (typeof data[key] !== 'string' || !data[key]) throw new Error(`content/cards/${file}: missing "${key}"`)
    }
    return {
      id: file.replace(/\.md$/, ''),
      tag: data.tag,
      title: data.title,
      photo: data.photo,
      stat: typeof data.stat === 'string' ? data.stat : undefined,
      set: typeof data.set === 'string' ? data.set : undefined,
      order: typeof data.order === 'number' ? data.order : 0,
      body: content.trim().split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean),
    }
  })
  return cache
}

export function getCard(id: string): Card | undefined {
  return getCards().find((c) => c.id === id)
}

export function siblings(card: Card): { prev: Card | null; next: Card | null } {
  if (!card.set) return { prev: null, next: null }
  const set = getCards().filter((c) => c.set === card.set).sort((a, b) => a.order - b.order)
  const i = set.findIndex((c) => c.id === card.id)
  return { prev: set[i - 1] ?? null, next: set[i + 1] ?? null }
}
