import { describe, it, expect } from 'vitest'
import {
  ACTIVE_DAYS_PER_YEAR, CPM_DESIGN_POINT, IMPRESSIONS_PER_USER_DAY,
} from '@/lib/model/figures'
import { pricePerImpression } from '@/lib/model/payout'
import { COHORTS, COHORT_SHARE_TOTAL, SURFACES, clearingCpm } from '../adData'
import { surfaceById as exchangeSurfaceById } from '@/components/exchange/constants'
import {
  BUDGET_MAX, PANEL_SIZE_SEATS, PLAN_DEFAULT, blendedCpm, costPerSeat, impressionsFor,
  impressionsOnSurface, impressionsPerSeat, reachesFullPanel, seatsFor, toggleSurface,
  workingDaysIn,
} from '../campaign'

/**
 * The advertiser desktop's arithmetic.
 *
 * It is the buy side's equivalent of the Calculator's tape, and it earns a
 * test for the same reason: four windows print numbers derived from it, and a
 * regression that made the Campaign window's estimate disagree with the Bid
 * Console's board would not throw, it would just quietly be wrong in front of
 * somebody with a budget.
 */

describe('the surfaces', () => {
  it('quote the same clearing price /exchange does, so a buyer following the link finds one number', () => {
    for (const surface of SURFACES) {
      const { priceIndex } = exchangeSurfaceById(surface.exchangeId)
      const fromExchange = Math.round(CPM_DESIGN_POINT.value * priceIndex * 100) / 100
      expect(clearingCpm(surface)).toBe(fromExchange)
    }
  })

  it('ascend in price with intensity, so the board reads the way the product is sold', () => {
    const prices = SURFACES.map(clearingCpm)
    for (let i = 1; i < prices.length; i += 1) {
      expect(prices[i]).toBeGreaterThan(prices[i - 1])
    }
  })
})

describe('the declared panel', () => {
  it('has shares that add to the whole panel, so every derived count is honest', () => {
    expect(COHORT_SHARE_TOTAL).toBeCloseTo(1, 10)
  })

  it('gives every cohort tools to be filtered on', () => {
    for (const cohort of COHORTS) {
      expect(cohort.tools.length).toBeGreaterThan(0)
    }
  })
})

describe('what a plan buys', () => {
  it('blends the clearing price across only the surfaces that were bought', () => {
    const one = { ...PLAN_DEFAULT, surfaces: [SURFACES[0].id] }
    expect(blendedCpm(one)).toBe(clearingCpm(SURFACES[0]))
    expect(blendedCpm(PLAN_DEFAULT)).toBeCloseTo(
      SURFACES.reduce((sum, surface) => sum + clearingCpm(surface), 0) / SURFACES.length, 10,
    )
  })

  it('converts budget to impressions through the model rather than a literal', () => {
    const expected = Math.round(PLAN_DEFAULT.budget / pricePerImpression(blendedCpm(PLAN_DEFAULT)))
    expect(impressionsFor(PLAN_DEFAULT)).toBe(expected)
  })

  it('takes working days out of the model, not out of a five-sevenths', () => {
    expect(workingDaysIn(365)).toBeCloseTo(ACTIVE_DAYS_PER_YEAR.value, 10)
    expect(workingDaysIn(0)).toBe(0)
  })

  it('spreads the same money across more seats as the frequency cap comes down', () => {
    const tight = seatsFor({ ...PLAN_DEFAULT, frequency: 2 })
    const loose = seatsFor({ ...PLAN_DEFAULT, frequency: 20 })
    expect(tight).toBeGreaterThan(loose)
  })

  it('never lets the cap exceed what a seat opens in a day', () => {
    const absurd = { ...PLAN_DEFAULT, frequency: IMPRESSIONS_PER_USER_DAY.value * 10 }
    expect(impressionsPerSeat(absurd))
      .toBeCloseTo(IMPRESSIONS_PER_USER_DAY.value * workingDaysIn(absurd.flightDays), 10)
  })

  it('costs less per seat as the budget stays put and the reach widens', () => {
    const tight = costPerSeat({ ...PLAN_DEFAULT, frequency: 2 })
    const loose = costPerSeat({ ...PLAN_DEFAULT, frequency: 20 })
    expect(tight).toBeLessThan(loose)
  })

  it('returns nothing rather than dividing by zero when no surface is selected', () => {
    const empty = { ...PLAN_DEFAULT, surfaces: [] }
    expect(blendedCpm(empty)).toBe(0)
    expect(impressionsFor(empty)).toBe(0)
    expect(seatsFor(empty)).toBe(0)
    expect(costPerSeat(empty)).toBe(0)
  })

  it('prices a single surface the same way the board does', () => {
    const surface = SURFACES[1]
    expect(impressionsOnSurface(10_000, surface.id))
      .toBe(Math.round(10_000 / pricePerImpression(clearingCpm(surface))))
    expect(impressionsOnSurface(10_000, 'not-a-surface')).toBe(0)
  })
})

describe('toggling a surface', () => {
  it('removes and restores it, and keeps the list in board order', () => {
    const without = toggleSurface(PLAN_DEFAULT, SURFACES[1].id)
    expect(without.surfaces).toEqual([SURFACES[0].id, SURFACES[2].id])
    const restored = toggleSurface(without, SURFACES[1].id)
    expect(restored.surfaces).toEqual(SURFACES.map((surface) => surface.id))
  })

  it('leaves the rest of the plan alone', () => {
    const next = toggleSurface(PLAN_DEFAULT, SURFACES[0].id)
    expect(next.budget).toBe(PLAN_DEFAULT.budget)
    expect(next.flightDays).toBe(PLAN_DEFAULT.flightDays)
    expect(next.frequency).toBe(PLAN_DEFAULT.frequency)
  })
})

/**
 * The Audience window's stat well prints a seat count and a percentage side
 * by side, and a media buyer reads two figures in the same well as one
 * fraction — divide the smaller into the bigger and you should get back
 * whatever the well is measuring against. Before this fix the percentage's
 * denominator was the filter's *composition* share of the panel, not the
 * panel itself, so dividing recovered a "panel" that moved with the budget
 * slider. This is that division, run at unfiltered (`share === COHORT_SHARE_TOTAL`,
 * which is what makes `seats` here equal `seatsFor(plan)`) across the budget
 * range from the regression's own repro table.
 */
describe("the audience window's seat percentage", () => {
  it('always recovers the declared panel size, whatever the budget', () => {
    for (const budget of [5_000, 10_000, 15_000, 20_000, 50_000]) {
      const seats = seatsFor({ ...PLAN_DEFAULT, budget })
      const percentage = (seats / PANEL_SIZE_SEATS) * 100
      expect(seats / (percentage / 100)).toBeCloseTo(PANEL_SIZE_SEATS, 6)
    }
  })
})

describe('reachesFullPanel', () => {
  it('is false at the default plan, where the budget has not saturated the panel', () => {
    expect(reachesFullPanel(PLAN_DEFAULT)).toBe(false)
  })

  it('is true at the maximum budget, where seatsFor is clamped at the panel size', () => {
    expect(reachesFullPanel({ ...PLAN_DEFAULT, budget: BUDGET_MAX })).toBe(true)
  })
})
