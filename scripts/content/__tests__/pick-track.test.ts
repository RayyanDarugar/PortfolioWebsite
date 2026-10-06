import { describe, it, expect } from 'vitest'
import { pickTrack } from '../pick-track.mjs'

const hit = (artistName: string, trackName: string, collectionName = 'Album') => ({ artistName, trackName, collectionName, previewUrl: 'x' })

describe('pickTrack', () => {
  it('prefers the studio cut of the named song', () => {
    const results = [hit('Daniel Caesar', 'Best Part (Live)', 'Live'), hit('Daniel Caesar', 'Best Part (feat. H.E.R.)', 'Freudian')]
    expect(pickTrack(results, { artist: 'Daniel Caesar', song: 'Best Part' }).collectionName).toBe('Freudian')
  })

  // Spec: a wrong track must never ship. The artist's other hit is a wrong track.
  it('refuses to fall back to a different song by the same artist', () => {
    expect(() => pickTrack([hit('Kanye West', 'Stronger')], { artist: 'Kanye West', song: 'Runaway' })).toThrow(/Runaway/)
  })
})
