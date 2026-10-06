const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '')
// Studio versions first: a live cut often outranks the original in search.
const live = (x) => /\blive\b/i.test(`${x.trackName} ${x.collectionName}`)

/**
 * The iTunes result for this record: its artist, its song, a preview, the
 * studio cut when there is one. Throws rather than settle for another song,
 * because a wrong track must never ship.
 */
export function pickTrack(results, record) {
  const titled = results.filter((x) => x.previewUrl
    && norm(x.artistName).includes(norm(record.artist))
    && norm(x.trackName).startsWith(norm(record.song)))
  const hit = titled.find((x) => !live(x)) ?? titled[0]
  if (!hit) throw new Error(`no iTunes preview for ${record.artist} – ${record.song}`)
  return hit
}
