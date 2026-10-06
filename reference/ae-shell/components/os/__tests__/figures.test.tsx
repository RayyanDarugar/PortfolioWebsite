import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalculatorApp } from '../apps/CalculatorApp'
import { HeroApp } from '../apps/HeroApp'
import { StocksApp } from '../apps/StocksApp'
import { ACTIVE_DAYS_PER_YEAR, CPM_DESIGN_POINT } from '@/lib/model/figures'
import { userPayoutPerMonth } from '@/lib/model/payout'

// Sentinels that cannot collide with the real figures (the design-point CPM
// is really 25.00, the share really 0.7). A test written against the real
// numbers cannot tell "reads from lib/model" apart from "a literal that
// happens to match today's model" — a hardcoded $25.00 would pass it.
// Swapping the module closes that hole.
//
// This replaces the guard that lived in the deleted
// components/home/__tests__/Settlement.test.tsx. The landing page dropped the
// evidence-tier badges by decision, which makes it *more* important, not
// less, that its numbers still trace to one module: nothing on the page now
// visibly marks a figure as coming from the model, so only a test can.
vi.mock('@/lib/model/figures', () => ({
  CPM_DESIGN_POINT: { value: 88.88, tier: 'ASSUMED', note: 'sentinel' },
  CPM_KICKBACKS_TOP4: { value: 9.99, tier: 'OBSERVED', note: 'sentinel' },
  CPM_KICKBACKS_BLENDED: { value: 1.21, tier: 'DERIVED', note: 'sentinel' },
  IMPRESSIONS_PER_USER_DAY: { value: 44, tier: 'ASSUMED', note: 'sentinel' },
  ACTIVE_DAYS_PER_YEAR: { value: 222, tier: 'ASSUMED', note: 'sentinel' },
  USER_REVENUE_SHARE: { value: 0.5, tier: 'ASSUMED', note: 'sentinel' },
}))

describe('the landing page reads its numbers from lib/model', () => {
  it('works the payout out from the model, in the Calculator readout', () => {
    render(<CalculatorApp slots={40} />)
    expect(screen.getAllByText(`$${userPayoutPerMonth({ impressionsPerDay: 40 }).toFixed(2)}`).length)
      .toBeGreaterThan(0)
  })

  it('shows the model figures on the Calculator tape rather than literals', () => {
    render(<CalculatorApp slots={40} />)
    expect(screen.getByText(String(ACTIVE_DAYS_PER_YEAR.value))).toBeDefined()
    expect(screen.getAllByText(`$${CPM_DESIGN_POINT.value.toFixed(2)}`).length).toBeGreaterThan(0)
  })

  it('quotes the same payout in the hero', () => {
    render(<HeroApp />)
    expect(screen.getByText(`$${userPayoutPerMonth().toFixed(2)}`)).toBeDefined()
  })

  it('clears the exchange at the model CPM, so the board and the Calculator agree', () => {
    render(<StocksApp />)
    expect(screen.getAllByText(`$${CPM_DESIGN_POINT.value.toFixed(2)}`).length).toBeGreaterThan(0)
  })
})
