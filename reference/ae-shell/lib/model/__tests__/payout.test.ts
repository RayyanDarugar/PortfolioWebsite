import { describe, it, expect } from 'vitest'
import {
  formatPricePerImpression, grossPerYear, pricePerImpression, userPayoutPerMonth,
} from '../payout'
import { CPM_DESIGN_POINT, CPM_KICKBACKS_TOP4 } from '../figures'

describe('grossPerYear', () => {
  it('multiplies impressions by days by CPM per thousand', () => {
    expect(grossPerYear(55, 250, 25)).toBeCloseTo(343.75, 2)
  })

  it('is zero when no impressions are delivered', () => {
    expect(grossPerYear(0, 250, 25)).toBe(0)
  })
})

describe('pricePerImpression', () => {
  it('is the design-point CPM divided by a thousand', () => {
    expect(pricePerImpression()).toBeCloseTo(CPM_DESIGN_POINT.value / 1000, 10)
    expect(pricePerImpression()).toBeCloseTo(0.025, 10)
  })

  it('tracks whatever CPM it is handed', () => {
    expect(pricePerImpression(CPM_KICKBACKS_TOP4.value)).toBeCloseTo(0.0028, 10)
  })
})

describe('formatPricePerImpression', () => {
  it('keeps three decimals so the design point does not round up to $0.03', () => {
    expect(formatPricePerImpression(pricePerImpression())).toBe('$0.025')
  })

  it('never renders the old $0.031, which implied a $31 CPM', () => {
    expect(formatPricePerImpression(pricePerImpression())).not.toBe('$0.031')
  })
})

describe('userPayoutPerMonth', () => {
  it('reproduces the model design point of $20.05', () => {
    expect(userPayoutPerMonth()).toBeCloseTo(20.05, 2)
  })

  it('reproduces the observed-CPM case of $2.25', () => {
    expect(userPayoutPerMonth({ cpm: CPM_KICKBACKS_TOP4.value })).toBeCloseTo(2.25, 2)
  })

  it('scales linearly with the user share', () => {
    const full = userPayoutPerMonth({ share: 1 })
    const half = userPayoutPerMonth({ share: 0.5 })
    expect(half).toBeCloseTo(full / 2, 6)
  })

  it('uses the design-point CPM by default', () => {
    expect(userPayoutPerMonth({ cpm: CPM_DESIGN_POINT.value })).toBeCloseTo(
      userPayoutPerMonth(),
      6,
    )
  })
})
