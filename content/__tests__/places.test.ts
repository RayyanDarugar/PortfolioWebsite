import { describe, it, expect } from 'vitest'
import { getPlaces } from '../places'

describe('the places', () => {
  it('parse with real coordinates', () => {
    const places = getPlaces()
    expect(places.length).toBe(5)
    for (const p of places) {
      expect(p.lat).toBeGreaterThanOrEqual(-90); expect(p.lat).toBeLessThanOrEqual(90)
      expect(p.lon).toBeGreaterThanOrEqual(-180); expect(p.lon).toBeLessThanOrEqual(180)
      expect(p.story.length).toBeGreaterThan(0)
    }
  })
})
