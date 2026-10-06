// Resolves content/records.json against the iTunes Search API (spec §4): a
// 30-second preview URL and an Apple Music link per record, plus the album
// art downsampled to 40 px so it reads as pixel art when scaled up. Run when
// the list changes: npm run content:records
//
// A search can return the song by someone else first (a feature, a cover), so
// a result must match the artist; anything unresolved fails the run rather
// than shipping a wrong track.

import sharp from 'sharp'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const records = JSON.parse(readFileSync('content/records.json', 'utf8'))
mkdirSync('public/records', { recursive: true })
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '')

const out = []
for (const r of records) {
  const url = `https://itunes.apple.com/search?${new URLSearchParams({ term: `${r.artist} ${r.song}`, entity: 'song', limit: '25', country: 'US' })}`
  const { results } = await (await fetch(url)).json()
  const byArtist = results.filter((x) => norm(x.artistName).includes(norm(r.artist)) && x.previewUrl)
  // Studio versions first: a live cut often outranks the original in search.
  const live = (x) => /\blive\b/i.test(`${x.trackName} ${x.collectionName}`)
  const titled = byArtist.filter((x) => norm(x.trackName).startsWith(norm(r.song)))
  const hit = titled.find((x) => !live(x)) ?? titled[0] ?? byArtist.find((x) => !live(x)) ?? byArtist[0]
  if (!hit) throw new Error(`no iTunes preview for ${r.artist} – ${r.song}`)
  const art = await (await fetch(hit.artworkUrl100.replace('100x100bb', '300x300bb'))).arrayBuffer()
  await sharp(Buffer.from(art)).resize(40, 40).png().toFile(`public/records/${r.id}.png`)
  out.push({
    id: r.id,
    artist: r.artist,
    song: r.song,
    album: hit.collectionName,
    previewUrl: hit.previewUrl,
    appleMusicUrl: hit.trackViewUrl,
    art: `/records/${r.id}.png`,
  })
  console.log(`${r.artist} – ${r.song}: ${hit.artistName} / ${hit.trackName} (${hit.collectionName})`)
}
writeFileSync('content/records.generated.json', JSON.stringify(out, null, 2) + '\n')
