import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ROUTES } from '@/components/shell/routes'
import { Hero, StaticHero } from '../Hero'
import type { Intro } from '../useIntro'

describe('the hero copy', () => {
  it('states the market, carries the payout figure, and offers both routes', () => {
    render(<StaticHero onAdvertisers={vi.fn()} />)

    // The page's one h1, and the sentence a stranger reads first. It states
    // the offer in the active voice; the market framing it used to carry now
    // lives inside the machine, in apps/HeroApp.tsx.
    expect(
      screen.getByRole('heading', { level: 1, name: /get paid for the empty space on your screen/i }),
    ).toBeTruthy()

    // The payout, in the sentence rather than in a stat tile. Asserting on the
    // surrounding words rather than the number on purpose: the figure comes
    // from `userPayoutPerMonth()`, so pinning it here would mean this test
    // fails every time the model is retuned — a test that punishes the thing
    // it is supposed to protect.
    expect(screen.getByText(/a month, paid in AI credits/i)).toBeTruthy()

    // Two "Get the app" links, and that is correct: one in the nav and one in
    // the hero, the way every landing page repeats its primary action. The
    // advertiser route is a button rather than a link because in desktop mode
    // it picks an account and moves the scroll instead of navigating.
    expect(screen.getAllByRole('link', { name: 'Get the app' })).toHaveLength(2)
    expect(screen.getByRole('button', { name: /for advertisers/i })).toBeTruthy()
  })

  it('carries a real nav built from the site route table', () => {
    render(<StaticHero onAdvertisers={vi.fn()} />)
    // Read from ROUTES rather than hardcoded, so adding a page to the site
    // cannot leave this test passing against a nav that has gone stale.
    for (const route of ROUTES.filter((r) => r.href !== '/join')) {
      expect(screen.getByRole('link', { name: route.menu })).toBeTruthy()
    }
  })
})

describe('the hero, hidden past the crossing', () => {
  // A stub is enough: none of these motion values are read for their motion,
  // only passed through to style props Testing Library's DOM never animates.
  const stubIntro = {
    heroOpacity: 0, heroLift: 0, heroPointer: 'none', arrowOpacity: 0,
  } as unknown as Intro

  it('is inert once hidden, so Tab cannot reach its buttons', () => {
    const { container, rerender } = render(
      <Hero intro={stubIntro} hidden onEnter={vi.fn()} onAdvertisers={vi.fn()} />,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.getAttribute('aria-hidden')).toBe('true')
    expect(root.hasAttribute('inert')).toBe(true)

    // Same element, un-hidden: aria-hidden and inert both have to lift, or a
    // visitor who scrolled back up finds a headline a screen reader skips.
    rerender(<Hero intro={stubIntro} hidden={false} onEnter={vi.fn()} onAdvertisers={vi.fn()} />)
    expect(root.getAttribute('aria-hidden')).toBe('false')
    expect(root.hasAttribute('inert')).toBe(false)
  })
})
