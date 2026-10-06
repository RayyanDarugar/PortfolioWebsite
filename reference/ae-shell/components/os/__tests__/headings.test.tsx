import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HeroApp } from '../apps/HeroApp'
import { AdHeroApp } from '../apps/AdHeroApp'

/**
 * The page's one `<h1>` lives in `intro/Hero.tsx`, in front of the laptop.
 * Every app window rendered inside the laptop — on either account — has to
 * stay one level down from it, or the document ends up with more than one.
 *
 * This is pinned here, at the app components themselves, rather than only at
 * one render path through `<OS />`: the server render of `<OS />` resolves
 * `appsFor(profile ?? 'user')`, so a render of the user account's tree alone
 * never mounts `AdHeroApp` and would not have caught a stray `<h1>` in it. The
 * stacked / reduced-motion path does mount both accounts' windows at once
 * (`OS.tsx`'s own docblock), which is exactly the situation a second `<h1>`
 * here would collide in — but asserting the invariant at each component
 * directly is the cheaper, more honest check, and it does not depend on which
 * paths happen to be exercised elsewhere.
 */
describe('the app windows stay below the page heading', () => {
  it('HeroApp renders no h1', () => {
    const { container } = render(<HeroApp />)
    expect(container.querySelectorAll('h1')).toHaveLength(0)
  })

  it('AdHeroApp renders no h1', () => {
    const { container } = render(<AdHeroApp />)
    expect(container.querySelectorAll('h1')).toHaveLength(0)
  })
})
