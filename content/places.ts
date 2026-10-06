import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

/** Places on the globe (spec §4): one Markdown file each; the body is the story. */
export interface Place {
  slug: string
  name: string
  lat: number
  lon: number
  /** When, loosely: "2025", "Summer 2026", "Home". */
  date: string
  photo: string
  story: string[]
}

const DIR = path.join(process.cwd(), 'content', 'places')
let cache: Place[] | null = null

export function getPlaces(): Place[] {
  if (cache) return cache
  cache = fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).sort().map((file) => {
    const { data, content } = matter(fs.readFileSync(path.join(DIR, file), 'utf8'))
    if (typeof data.name !== 'string' || typeof data.lat !== 'number' || typeof data.lon !== 'number') {
      throw new Error(`content/places/${file}: needs name, lat and lon`)
    }
    return {
      slug: file.replace(/\.md$/, ''),
      name: data.name,
      lat: data.lat,
      lon: data.lon,
      date: String(data.date ?? ''),
      photo: typeof data.photo === 'string' ? data.photo : '/room/sprites/globe.png',
      story: content.trim().split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean),
    }
  })
  return cache
}

export function getPlace(slug: string): Place | undefined {
  return getPlaces().find((p) => p.slug === slug)
}
