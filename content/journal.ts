import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

/** The journal (spec §4, "the journal" is the blog): one Markdown file per entry. */
export interface Entry {
  slug: string
  title: string
  /** YYYY-MM-DD. */
  date: string
  summary: string
  body: string[]
}

const DIR = path.join(process.cwd(), 'content', 'journal')
let cache: Entry[] | null = null

export function getEntries(): Entry[] {
  if (cache) return cache
  cache = fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).map((file) => {
    const { data, content } = matter(fs.readFileSync(path.join(DIR, file), 'utf8'))
    // gray-matter turns an unquoted date into a Date.
    const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? '')
    for (const [key, value] of [['title', data.title], ['summary', data.summary], ['date', date]] as const) {
      if (typeof value !== 'string' || !value) throw new Error(`content/journal/${file}: missing "${key}"`)
    }
    return {
      slug: file.replace(/\.md$/, ''),
      title: data.title,
      date,
      summary: data.summary,
      body: content.trim().split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean),
    }
  }).sort((a, b) => b.date.localeCompare(a.date))
  return cache
}

export function getEntry(slug: string): Entry | undefined {
  return getEntries().find((e) => e.slug === slug)
}
