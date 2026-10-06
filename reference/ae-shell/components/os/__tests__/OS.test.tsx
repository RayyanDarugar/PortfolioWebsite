import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { OS } from '../OS'
import { ADVERTISER_APPS, USER_APPS } from '../registry'

/**
 * The stacked path renders both accounts' fourteen windows at once, which is
 * a lot of DOM for jsdom to build and comfortably the slowest render in the
 * suite. The two tests below therefore render **once each** and assert
 * several things against that one tree, and carry a timeout that reflects
 * what they are actually doing rather than the default five seconds. Nothing
 * about either assertion is relaxed; only the clock is.
 */
const HEAVY = 20_000

function stubMatchMedia(reduced: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: reduced,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })))
}

/**
 * The reduced-motion contract, which is a hard constraint on this page rather
 * than a nicety: no boot, no login window, no launch animation, and every
 * section readable as a plain stacked sequence.
 *
 * It is worth a test because the failure mode is silent and total — the
 * scroll-driven layout renders six of its seven windows at `opacity: 0`, so a
 * regression that put a reduced-motion visitor on that path would leave them
 * a page with one window on it and no way to reach the other six. The login
 * window makes that worse rather than better: a modal account gate on the
 * stacked path would be a dead end for exactly the visitor least able to get
 * out of one, which is why this path renders *both* accounts' windows and
 * offers the choice as an ordinary button instead.
 */
describe('OS under reduced motion', () => {
  beforeEach(() => {
    stubMatchMedia(true)
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

  afterEach(() => { vi.unstubAllGlobals() })

  it('renders both accounts\' windows at once, in document order', () => {
    render(<OS />)
    for (const app of [...USER_APPS, ...ADVERTISER_APPS]) {
      expect(screen.getAllByText(app.name).length).toBeGreaterThan(0)
    }
    // And the choice is offered as a plain button per account, never as a gate.
    expect(screen.getAllByRole('button', { name: 'Show only this' })).toHaveLength(2)
  }, HEAVY)

  it('plays no boot, mounts no login window, and draws no dock', () => {
    render(<OS />)
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByRole('dialog', { name: 'Choose an account' })).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
  }, HEAVY)
})

/**
 * The hydration contract itself, pinned at the server-HTML layer rather than
 * the jsdom one above.
 *
 * `OS.tsx`'s own header explains why: `profile` starts `null` on both the
 * server and the first client render, and `resolved` starts `false` on both
 * — so the server draws the desktop behind the login window (the user
 * account's apps, `profile ?? 'user'`) but never the login window itself,
 * which only mounts once `resolved` flips to `true` in a layout effect that
 * cannot run on the server. `renderToString` is the one tool that actually
 * exercises this path: it runs with no DOM, no `matchMedia`, no
 * `sessionStorage` and no effects, which is exactly the environment the real
 * server request runs in and the jsdom-backed tests above do not reach. A
 * regression that mounted the login window from render (rather than from
 * that effect) would put a modal account gate straight into the crawlable
 * HTML — invisible to every test above, because they all render through
 * jsdom with `matchMedia` and `sessionStorage` stubbed in.
 */
describe('OS server-rendered HTML', () => {
  it('renders the user hero and never the login window', () => {
    const html = renderToString(<OS />)
    expect(html).toContain('Get paid for the empty space on your screen.')
    expect(html).not.toContain('Choose an account')
  })

  /**
   * The intro must not cost the page its crawlable content.
   *
   * `phase` starts `live` on the server precisely so this holds: the hero's
   * h1 is the best crawlable sentence this page has, and the seven windows
   * have always been in the HTML. A regression that gated either behind the
   * client-side intro would be invisible in every jsdom test — they all run
   * with matchMedia stubbed — and would silently strip the page.
   */
  it('renders the hero headline and keeps the seven windows', () => {
    const html = renderToString(<OS />)
    expect(html).toContain('The empty space on your screen is worth money.')
    // React HTML-escapes text nodes, so an app name with a literal `&` (only
    // "Privacy & Security" has one) only ever appears in the markup as
    // `&amp;` — matching against the raw name would fail even though the
    // window renders exactly as intended.
    for (const app of USER_APPS) {
      expect(html).toContain(app.name.replace(/&/g, '&amp;'))
    }
  })

  it('has exactly one h1', () => {
    const html = renderToString(<OS />)
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })
})
