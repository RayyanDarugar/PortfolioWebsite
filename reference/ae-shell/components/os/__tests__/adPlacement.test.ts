import { describe, it, expect } from 'vitest'
import { ADVERTISERS } from '@/components/creatives/advertisers'
import { SURFACES, advertisersOn, bestSurfaceFor, clearingCpm } from '../adData'
import { PLACEMENTS } from '../AdSlot'
import { BID_MAX, BID_MIN, QUEUE } from '../apps/BidConsoleApp'

/**
 * The board coherence tests: what pinned the nine advertisers' bids to the
 * three surfaces' prices before, and what keeps `AdSlot` and `BidConsoleApp`
 * from ever disagreeing about where one of them sits now that both derive
 * their placement from `adData.bestSurfaceFor` / `adData.advertisersOn`
 * instead of each carrying its own copy of the rule.
 */

describe('every surface has a real buyer', () => {
  it('finds at least one advertiser whose best-clearing surface is each of the three', () => {
    for (const surface of SURFACES) {
      const buyers = advertisersOn(surface.id, ADVERTISERS)
      expect(buyers.length).toBeGreaterThan(0)
    }
  })

  it('gives the side card at least two buyers, so AdSlot has a genuine rotation', () => {
    expect(advertisersOn('card', ADVERTISERS).length).toBeGreaterThanOrEqual(2)
  })

  it('leaves at least one advertiser clearing nothing, so the board has a real Short row', () => {
    const shutOut = ADVERTISERS.filter((a) => bestSurfaceFor(a.bid) === undefined)
    expect(shutOut.length).toBeGreaterThan(0)
  })
})

describe('bestSurfaceFor', () => {
  it('never places an advertiser on a surface whose price is not strictly under their bid', () => {
    for (const advertiser of ADVERTISERS) {
      const surface = bestSurfaceFor(advertiser.bid)
      if (!surface) continue
      expect(clearingCpm(surface)).toBeLessThan(advertiser.bid)
    }
  })
})

describe('the bid slider', () => {
  it('straddles every surface\'s clearing price by construction', () => {
    const prices = SURFACES.map(clearingCpm)
    expect(BID_MIN).toBeLessThan(Math.min(...prices))
    expect(BID_MAX).toBeGreaterThan(Math.max(...prices))
  })
})

describe('AdSlot and BidConsoleApp', () => {
  it('never disagree about which surface an advertiser is on', () => {
    // Both windows are built from the same `bestSurfaceFor`, so this checks
    // that property directly rather than re-deriving a second placement and
    // hoping the two happen to match.
    const cardBuyers = advertisersOn('card', ADVERTISERS)

    for (const { advertiser } of PLACEMENTS) {
      expect(bestSurfaceFor(advertiser.bid)?.id).toBe('card')
    }

    const cardRowsInQueue = QUEUE.filter((row) => row.surface.id === 'card')
    for (const row of cardRowsInQueue) {
      expect(cardBuyers.some((a) => a.name === row.advertiser.name)).toBe(true)
    }

    // Anyone AdSlot is showing on the side card and who also survived the
    // queue's slice(0, 6) must be shown there on the side card too, never
    // on some other surface.
    for (const { advertiser } of PLACEMENTS) {
      const row = QUEUE.find((r) => r.advertiser.name === advertiser.name)
      if (row) expect(row.surface.id).toBe('card')
    }
  })

  it('places the same three, in the same order, on the side card', () => {
    const expected = advertisersOn('card', ADVERTISERS).slice(0, 3).map((a) => a.name)
    expect(PLACEMENTS.map((p) => p.advertiser.name)).toEqual(expected)
  })
})
