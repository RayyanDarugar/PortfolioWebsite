import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { OS } from '../OS'
import {
  PROFILE_KEY, isProfile, profileFromSearch, readStoredProfile, storeProfile,
} from '../profiles'

/**
 * The account, end to end.
 *
 * Four things are worth a test here and all four are things a visitor would
 * notice immediately if they broke:
 *
 *  1. The login window appears when nobody has chosen an account.
 *  2. Choosing one assembles that account's desktop, and only that one's.
 *  3. `?profile=advertiser` skips the window entirely — this is the link the
 *     owner sends an advertiser, and a login screen in front of it is the
 *     whole reason the parameter exists.
 *  4. A choice already made in this session is not asked for again, and
 *     Switch User puts it back.
 */

/** A working `sessionStorage`, because half of what is under test is what
 *  survives in it. jsdom's own is shared across tests in the same file and
 *  this is easier to reason about than remembering to clear it. */
function fakeStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value) },
    removeItem: (key: string) => { map.delete(key) },
    map,
  }
}

/** Returns the `scrollTo` spy so callers can assert on where a landing
 *  actually asked the page to go, rather than only on its downstream effects
 *  (which apps are visible, what's in storage). A frozen scroll position is
 *  exactly what let a real regression — logging in or switching users
 *  scrolling to document `0`, which folds the laptop shut again — through a
 *  green suite once before; asserting on the call itself is how that class of
 *  bug gets caught next time. */
function stubDesktop(storage: ReturnType<typeof fakeStorage>) {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })))
  vi.stubGlobal('sessionStorage', storage)
  // jsdom does not implement scrolling, and every login path calls it.
  const scrollTo = vi.fn()
  vi.stubGlobal('scrollTo', scrollTo)
  // The login window only mounts once the intro has landed — `locked` is
  // gated on `phase === 'live'`, precisely so the login window cannot trap
  // the very scroll that would open the laptop. jsdom starts every render at
  // `scrollY = 0`, which `useIntro`'s mount effect reads as "top of an
  // unopened laptop" and resolves to the `intro` phase (see
  // `intro/geometry.ts`'s own `nextPhase('live', 0, true) === 'intro'`). These
  // tests are about the account machinery once the desktop is showing, not
  // about the intro itself, so they stub a scroll position past `LAND` to
  // start from the state a visitor reaches by scrolling once.
  Object.defineProperty(window, 'scrollY', { value: 10_000, writable: true, configurable: true })
  return { scrollTo }
}

/** The reduced-motion path: no intro, no laptop, no login dialog — `mode`
 *  resolves to `stacked` regardless of scroll position, so section 0 really
 *  is document offset `0` here. */
function stubStacked(storage: ReturnType<typeof fakeStorage>) {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: true,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })))
  vi.stubGlobal('sessionStorage', storage)
  const scrollTo = vi.fn()
  vi.stubGlobal('scrollTo', scrollTo)
  return { scrollTo }
}

describe('reading the account out of a URL', () => {
  it('accepts both accounts, with or without the leading question mark', () => {
    expect(profileFromSearch('?profile=advertiser')).toBe('advertiser')
    expect(profileFromSearch('profile=user')).toBe('user')
  })

  it('ignores anything that is not one of the two accounts', () => {
    expect(profileFromSearch('?profile=admin')).toBeNull()
    expect(profileFromSearch('?profile=')).toBeNull()
    expect(profileFromSearch('')).toBeNull()
    expect(profileFromSearch('?utm_source=email')).toBeNull()
  })

  it('finds the parameter among others', () => {
    expect(profileFromSearch('?utm_source=email&profile=advertiser&ref=x')).toBe('advertiser')
  })

  it('guards the type at the boundary rather than trusting the string', () => {
    expect(isProfile('user')).toBe(true)
    expect(isProfile('advertiser')).toBe(true)
    expect(isProfile('Advertiser')).toBe(false)
    expect(isProfile(null)).toBe(false)
  })
})

describe('storing the account', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('round-trips through the session, and clearing it is Switch User', () => {
    const storage = fakeStorage()
    vi.stubGlobal('sessionStorage', storage)
    storeProfile('advertiser')
    expect(storage.map.get(PROFILE_KEY)).toBe('advertiser')
    expect(readStoredProfile()).toBe('advertiser')
    storeProfile(null)
    expect(storage.map.has(PROFILE_KEY)).toBe(false)
    expect(readStoredProfile()).toBeNull()
  })

  it('survives storage being unavailable rather than throwing at a visitor', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
      removeItem: () => { throw new Error('denied') },
    })
    expect(readStoredProfile()).toBeNull()
    expect(() => storeProfile('user')).not.toThrow()
  })
})

describe('the login window on the desktop', () => {
  let storage: ReturnType<typeof fakeStorage>

  beforeEach(() => {
    storage = fakeStorage()
    stubDesktop(storage)
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.history.replaceState({}, '', '/')
  })

  it('asks for an account when nobody has chosen one', () => {
    render(<OS />)
    expect(screen.getByRole('dialog', { name: 'Choose an account' })).toBeDefined()
    // Anchored: the button's accessible name is the account name followed by
    // its hint, and an unanchored /User/ would also match a hint that happens
    // to mention users.
    expect(screen.getByRole('button', { name: /^User/ })).toBeDefined()
    expect(screen.getByRole('button', { name: /^Advertiser/ })).toBeDefined()
  })

  it('assembles the advertiser desktop when that account is chosen, and remembers it', async () => {
    render(<OS />)
    fireEvent.click(screen.getByRole('button', { name: /Advertiser/ }))

    await waitFor(() => {
      expect(screen.getAllByText('Bid Console').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('Audience').length).toBeGreaterThan(0)
    // The user account's apps are gone, not hidden underneath.
    expect(screen.queryByText('Activity Monitor')).toBeNull()
    expect(storage.map.get(PROFILE_KEY)).toBe('advertiser')
  })

  it('assembles the user desktop when that account is chosen', async () => {
    render(<OS />)
    fireEvent.click(screen.getByRole('button', { name: /^User/ }))

    await waitFor(() => {
      expect(screen.getAllByText('Activity Monitor').length).toBeGreaterThan(0)
    })
    expect(screen.queryByText('Bid Console')).toBeNull()
    expect(storage.map.get(PROFILE_KEY)).toBe('user')
  })

  it('skips the window entirely for ?profile=advertiser, and stores it', () => {
    window.history.replaceState({}, '', '/?profile=advertiser')
    render(<OS />)
    expect(screen.queryByRole('dialog', { name: 'Choose an account' })).toBeNull()
    expect(screen.getAllByText('Bid Console').length).toBeGreaterThan(0)
    expect(storage.map.get(PROFILE_KEY)).toBe('advertiser')
  })

  it('skips it for ?profile=user too', () => {
    window.history.replaceState({}, '', '/?profile=user')
    render(<OS />)
    expect(screen.queryByRole('dialog', { name: 'Choose an account' })).toBeNull()
    expect(screen.getAllByText('Calculator').length).toBeGreaterThan(0)
  })

  it('ignores an unknown profile parameter and asks anyway', () => {
    window.history.replaceState({}, '', '/?profile=nonsense')
    render(<OS />)
    expect(screen.getByRole('dialog', { name: 'Choose an account' })).toBeDefined()
  })

  it('does not ask again for an account already chosen this session', () => {
    storage.map.set(PROFILE_KEY, 'advertiser')
    render(<OS />)
    expect(screen.queryByRole('dialog', { name: 'Choose an account' })).toBeNull()
    expect(screen.getAllByText('Measurement').length).toBeGreaterThan(0)
  })

  it('lets the URL override the stored account, because a link is a fresh instruction', () => {
    storage.map.set(PROFILE_KEY, 'user')
    window.history.replaceState({}, '', '/?profile=advertiser')
    render(<OS />)
    expect(screen.getAllByText('Campaign').length).toBeGreaterThan(0)
    expect(storage.map.get(PROFILE_KEY)).toBe('advertiser')
  })
})

describe('Switch User', () => {
  let storage: ReturnType<typeof fakeStorage>

  beforeEach(() => {
    storage = fakeStorage()
    stubDesktop(storage)
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.history.replaceState({}, '', '/')
  })

  it('is in the menu bar, and returns to the login window with the account cleared', async () => {
    storage.map.set(PROFILE_KEY, 'advertiser')
    render(<OS />)

    fireEvent.click(screen.getByRole('button', { name: /Advertiser/ }))
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Switch User…' }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Choose an account' })).toBeDefined()
    })
    expect(storage.map.has(PROFILE_KEY)).toBe(false)
  })

  it('is not offered while nobody is logged in', () => {
    render(<OS />)
    expect(screen.queryByRole('button', { name: /Logged in as/ })).toBeNull()
  })
})

/**
 * Where logging in and Switch User land, which is not document `0` in every
 * mode.
 *
 * `chooseProfile` and `switchUser` both call `window.scrollTo` with what they
 * believe is the top of section 0. In desktop mode that is one viewport down
 * — `OS.tsx`'s Step 7 moved every marker to `(i + 1) * 100vh` so the first
 * viewport could belong to the intro — and document `0` there is the top of
 * a *shut* laptop: `useIntro`'s own geometry resolves scroll position `0` to
 * `phase: 'intro'` regardless of what phase the page was in a moment ago
 * (`geometry.test.ts`'s `nextPhase('live', 0, true) === 'intro'`). Landing at
 * `0` in desktop mode would fold the machine closed over whichever window was
 * supposed to open. In `stacked` mode there is no intro and no laptop, so `0`
 * is exactly correct there.
 *
 * These assert on the `scrollTo` call itself rather than only on the visible
 * result, because the frozen `scrollY` these tests otherwise run under
 * (`stubDesktop`'s landed-scroll stub, and the no-op `scrollTo` mock that
 * predates it) is exactly what let a real regression here through a green
 * suite once: the desktop assertions below never depend on where the intro
 * *thinks* the scroll went, only on what `scrollTo` was asked to do.
 */
describe('where logging in and Switch User land', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    window.history.replaceState({}, '', '/')
  })

  it('logging in on the desktop lands past the intro, not at document 0', async () => {
    const storage = fakeStorage()
    const { scrollTo } = stubDesktop(storage)
    render(<OS />)
    fireEvent.click(screen.getByRole('button', { name: /^User/ }))

    await waitFor(() => {
      expect(scrollTo).toHaveBeenCalledWith({ top: window.innerHeight, behavior: 'instant' })
    })
  })

  it('Switch User on the desktop lands past the intro too', async () => {
    const storage = fakeStorage()
    storage.map.set(PROFILE_KEY, 'user')
    const { scrollTo } = stubDesktop(storage)
    render(<OS />)

    fireEvent.click(screen.getByRole('button', { name: /^User/ }))
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Switch User…' }))

    await waitFor(() => {
      expect(scrollTo).toHaveBeenCalledWith({ top: window.innerHeight, behavior: 'instant' })
    })
  })

  it('logging in under reduced motion lands at document 0 — there is no intro to skip', () => {
    const storage = fakeStorage()
    const { scrollTo } = stubStacked(storage)
    render(<OS />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Show only this' })[0])

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
  })

  it('Switch User under reduced motion lands at document 0 too', async () => {
    const storage = fakeStorage()
    storage.map.set(PROFILE_KEY, 'user')
    const { scrollTo } = stubStacked(storage)
    render(<OS />)

    fireEvent.click(screen.getByRole('button', { name: /^User/ }))
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Switch User…' }))

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
  })
})
