'use client'
import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLenis } from '../SmoothScroll'
import { DesktopItems } from './DesktopItems'
import { Dock } from './Dock'
import { GhostCursor } from './GhostCursor'
import { LaunchedWindow } from './LaunchedWindow'
import { LoginScreen } from './LoginScreen'
import { Notifications } from './Notifications'
import { OSMenuBar } from './OSMenuBar'
import { Spotlight } from './Spotlight'
import { Stacked } from './Stacked'
import { Wallpaper } from './Wallpaper'
import { PLAN_DEFAULT, type CampaignPlan } from './campaign'
import type { Box } from './chrome'
import { Hero } from './intro/Hero'
import { Laptop } from './intro/Laptop'
import * as G from './intro/geometry'
import { useIntro } from './intro/useIntro'
import {
  profileFromSearch, readStoredProfile, storeProfile, type Profile,
} from './profiles'
import { appsFor } from './registry'
import { SLOTS_DEFAULT } from './slots'
import { useIsoLayoutEffect } from './useIsoLayoutEffect'

/**
 * Below these, the desktop metaphor stops helping. A window with a sidebar,
 * a table and a graph in it cannot be legible in 900 logical pixels, and a
 * viewport shorter than this cannot hold a menu bar, a window and a dock at
 * once without the window scrolling inside itself — which is the one thing
 * that would make the page genuinely hard to read.
 */
const MIN_WIDTH = 1000
const MIN_HEIGHT = 680

/** Menu bar, dock, and the breathing room either side of the window. */
const STAGE_INSET = 172

/**
 * How close to the target the scroll has to be before a jump counts as
 * arrived, and how much it has to move *away* from the target between two
 * polls before we conclude somebody else is driving. Native scrolling is
 * monotonic and never overshoots, so a growing distance is never us.
 */
const SETTLE_EPSILON = 2
const DRIFT_EPSILON = 4

/** How long the page takes to fly the rest of the way into the machine once the
 *  visitor has committed, in seconds. Slow enough to read as travel rather than
 *  a cut, quick enough that holding the scroll still does not feel like a hang. */
const CROSSING_SECONDS = 0.9

/**
 * How long the machine is held on arrival before the track hands back, in ms.
 *
 * Without it the flight ends and whatever the visitor's gesture still had in it
 * carries straight on into section two — they never see the thing they were
 * flying toward. The hold absorbs that momentum, so arriving is a stop rather
 * than a waypoint, and going further has to be a new decision.
 */
const CROSSING_HOLD_MS = 420

/** Poll interval and hard ceiling for the settle watch, in ms. */
const SETTLE_POLL = 80
const SETTLE_CEILING = 3000

/** How long the dock's build plays for after an account logs in. Long enough
 *  to cover the login window's fade, and released rather than left on so the
 *  animation cannot replay on an unrelated re-render. */
const ASSEMBLE_MS = 900

/** Keys that scroll the document. Pressing one mid-jump is the visitor taking
 *  the wheel, and the visitor always wins. */
const SCROLL_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar',
])

/**
 * The landing page.
 *
 * Six things are happening here and they are deliberately separate:
 *
 * 1. **An intro.** The page opens on a laptop, shut, that the scroll of the
 *    first viewport opens — see `intro/geometry.ts` for the choreography and
 *    `intro/useIntro.ts` for the scroll-to-value plumbing. `phase` ('intro' or
 *    'live') is the one piece of that state React ever re-renders on;
 *    everything else is a Framer motion value written straight to the DOM.
 *    `Laptop` owns the transform this produces and removes it entirely once
 *    `phase` is `live`, and `Hero` — the page's actual first content — sits
 *    over it the whole time, fading and lifting away as the laptop opens.
 *
 * 2. **An account.** Landing resolves into a login window with two accounts
 *    on it, and the desktop that assembles is the one configured for whoever
 *    was picked — its own dock, its own seven apps, its own copy, its own
 *    wallpaper. There is one engine and two datasets; nothing below this
 *    point knows which account it is drawing. The choice survives the session
 *    and can be preselected with `?profile=advertiser`, which is how an
 *    advertiser is sent straight to their own machine — and it is also what
 *    the hero's "For advertisers" button does, skipping the intro outright.
 *
 * 3. **Mode.** Reduced motion, a narrow viewport or a short one all resolve
 *    to `stacked` — the app windows in document order, no intro, no login, no
 *    launch animation, nothing fixed. It is not a degraded version; it is the
 *    whole page, read as a page, and a visitor who has not chosen an account
 *    gets *both* accounts' windows rather than a choice they cannot make.
 *
 * 4. **Scroll drives an index.** A full-viewport marker strip per section is
 *    laid down the scroll track and observed against a zero-height root box
 *    pinned to the viewport's midline, so the active section is whichever
 *    marker the midline is currently inside. Mapping raw `scrollY` to an index
 *    would work too, right up until a window changes height or a browser
 *    reports a different `100vh`; the observer survives both because it asks
 *    the layout rather than predicting it. The first marker starts one
 *    viewport down the track, because that first viewport belongs to the
 *    intro and no section is active while the laptop is still opening.
 *
 * 5. **A jump overrides the observer.** {@link goTo} — the dock, Spotlight —
 *    lands the scroll on the target at once and holds the active index at the
 *    target until the scroll has demonstrably settled there. Without that
 *    hold, travelling from section 1 to section 6 drags the midline through
 *    four intervening markers and the observer dutifully opens and minimises
 *    four windows nobody asked to see.
 *
 * 6. **The desktop never moves.** One `position: sticky` layer holds the
 *    laptop for the whole scroll, and the wallpaper, its icons, the menu bar,
 *    the stage and the dock are `Laptop`'s children in both phases — what
 *    changes on landing is the transform around them, not what is nested
 *    inside what. The markers are absolutely positioned and give the track
 *    its height, so nothing the visitor scrolls past is ever a thing they
 *    can see.
 *
 * ### The hydration rule
 *
 * `sessionStorage` is **never** read during render. The server has no account
 * and neither does the first client render: `profile` starts `null` on both,
 * which renders the login window over a desktop drawn with the user
 * account's apps, and the stored or URL-supplied account is resolved in a
 * *layout* effect — before the browser paints, so a returning visitor never
 * sees the login screen flash. A `sessionStorage` read during render is
 * exactly how this project has produced a hydration mismatch three times.
 * `phase` itself starts `live` for the same reason: the server and the first
 * client render both need the hero and the seven app windows in the HTML, and
 * neither can know yet whether there is scroll history to resume the intro
 * from — that is decided in a layout effect too, in `useIntro`.
 */
export function OS() {
  const [mode, setMode] = useState<'os' | 'stacked'>('os')
  /**
   * Who is logged in. `null` means the login window is up — and it is also
   * what the server rendered, which is the whole of the hydration contract.
   */
  const [profile, setProfile] = useState<Profile | null>(null)
  /**
   * Whether the account has been looked for yet.
   *
   * This is the flag that keeps the login window off the server's HTML and
   * off a returning visitor's screen. Both the server and the first client
   * render have `resolved: false` and therefore draw no login window at all;
   * the layout effect below looks the account up and commits both values
   * together, so a visitor who already has one never mounts the window and a
   * visitor who does not gets it before the browser has painted. Mounting it
   * on `profile === null` alone would flash it at everybody, because "null"
   * on the first pass means "not asked yet", not "no account".
   */
  const [resolved, setResolved] = useState(false)
  /** True for the moment after a login, while the dock builds itself. */
  const [assembling, setAssembling] = useState(false)
  /** Where the IntersectionObserver says the viewport's midline is. */
  const [seen, setSeen] = useState(0)
  /**
   * The section a programmatic jump is on its way to, or null when the scroll
   * is the visitor's own. While it is set it *is* the active section: the
   * observer carries on writing {@link seen} throughout, and carries on being
   * ignored, which is the whole of the fix for a jump playing every window
   * between here and there on the way past.
   */
  const [jump, setJump] = useState<number | null>(null)
  /** The ad load. Set in System Settings, read by the Calculator. */
  const [slots, setSlots] = useState(SLOTS_DEFAULT)
  /** The campaign. Built in Campaign, sliced by Audience, priced by the Bid
   *  Console, quoted back in Mail. */
  const [plan, setPlan] = useState<CampaignPlan>(PLAN_DEFAULT)
  const [icons, setIcons] = useState<(Box | null)[]>([])
  /** The dock tile the drifting cursor is clicking, or −1. */
  const [pressed, setPressed] = useState(-1)
  const [spotlight, setSpotlight] = useState(false)

  /**
   * The laptop opening. `mode` is resolved in a layout effect above, so on
   * the server and the first client render this is asked with `os = true`
   * and answers `live` — which is what keeps the hero and the seven windows
   * in the server HTML.
   */
  const intro = useIntro(mode === 'os')
  const lenis = useLenis()
  const phase = mode === 'os' ? intro.phase : 'live'

  const tiles = useRef<(HTMLElement | null)[]>([])
  const markers = useRef<(HTMLDivElement | null)[]>([])
  const profileDecided = useRef(false)
  const pressTimer = useRef(0)
  const assembleTimer = useRef(0)
  /** The document offset the jump in flight is aiming at. A ref rather than
   *  state because only the settle watch reads it, and re-rendering on it
   *  would tell the page something it cannot see. */
  const jumpTop = useRef(0)
  /** Whether the visitor has made the one committed crossing out of the hero.
   *  A ref rather than state: nothing renders differently for it. */
  const crossed = useRef(false)
  /** The dwell after the crossing lands, so it can be cancelled on unmount
   *  rather than starting a Lenis that no longer exists. */
  const holdTimer = useRef(0)

  /**
   * The account's apps. Falls back to the user's while the login window
   * is up, so the desktop behind it is a real desktop with real content in
   * the server HTML rather than an empty stage — and so the seven windows the
   * page has always server-rendered still are.
   */
  const apps = appsFor(profile ?? 'user')
  /**
   * Gated on the phase, and this is the gate that makes the intro possible at
   * all. `locked` sets `overflow: hidden` on the document below, and every
   * first-time visitor has `profile === null` — so without this the login
   * window would strangle the scroll before the laptop could open a degree.
   */
  const locked = phase === 'live' && mode === 'os' && resolved && profile === null
  const active = jump ?? seen
  const frontmost = apps[active] ?? apps[0]

  /* -------------------------------------------------------------- *
   * Mode
   * -------------------------------------------------------------- */
  useIsoLayoutEffect(() => {
    const resolve = () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const roomy = window.innerWidth >= MIN_WIDTH && window.innerHeight >= MIN_HEIGHT
      const next = reduced || !roomy ? 'stacked' : 'os'
      setMode(next)
      // A jump cannot outlive the track it was aiming at. Dropping out of the
      // desktop mode mid-flight unmounts every marker, so the guard is
      // released here rather than left holding an index nothing can reach.
      if (next !== 'os') setJump(null)
    }
    resolve()
    window.addEventListener('resize', resolve)
    return () => window.removeEventListener('resize', resolve)
  }, [])

  /* -------------------------------------------------------------- *
   * The account
   * -------------------------------------------------------------- */
  /**
   * Resolved once, in a layout effect, from two sources in priority order:
   *
   *  1. **`?profile=` in the URL.** A link the owner sent, and it wins — an
   *     advertiser who follows one is not asked a question they have already
   *     been asked. It is also written to storage, so scrolling to an interior
   *     page and coming back without the parameter still lands them right.
   *  2. **The session.** A choice already made in this tab.
   *
   * Neither is read during render. `window.location.search` is read here
   * rather than through `useSearchParams` deliberately: the hook would either
   * force a Suspense boundary around the whole page or opt the route out of
   * static rendering, and the parameter is worth neither. The cost is that
   * `?profile=advertiser` resolves on the client rather than on the server —
   * before paint, in a layout effect, so it is invisible.
   *
   * `profileDecided` guards against Strict Mode's dev-only double-invoke:
   * without it the second setup would re-read the URL and storage a second
   * time in dev only.
   */
  useIsoLayoutEffect(() => {
    if (profileDecided.current) return
    profileDecided.current = true
    const fromUrl = profileFromSearch(window.location.search)
    if (fromUrl) storeProfile(fromUrl)
    setProfile(fromUrl ?? readStoredProfile())
    setResolved(true)
  }, [])

  /**
   * Where section 0 begins. `0` in `stacked` mode — there is no intro and no
   * laptop, so the document's own top is section 0 — and one viewport down in
   * `os` mode, because Step 7 moved every marker to `(i + 1) * 100vh` and the
   * first viewport now belongs to the intro. `chooseProfile` and `switchUser`
   * both land here, computed once, so they agree by construction rather than
   * by two copies of the same conditional staying in sync by luck. Landing at
   * document `0` in `os` mode would resolve straight back to `t = 0`, which
   * `nextPhase` reads as the top of a shut laptop — folding the machine closed
   * under whichever window was supposed to open.
   */
  const landingTop = useCallback(() => (mode === 'os' ? window.innerHeight : 0), [mode])

  /**
   * Every programmatic scroll on this page goes through here.
   *
   * `window.scrollTo` moves the document without telling Lenis, which keeps
   * its own target position and lerps toward it every frame — so a jump it did
   * not perform leaves that target stale, and the next wheel tick snaps the
   * page back to wherever Lenis still believed it was. The dock, Spotlight,
   * the hero's arrow and logging in are all programmatic scrolls, so all four
   * had that failure available to them.
   *
   * `lenis` is `null` for a reduced-motion visitor, who has no smooth scroll
   * to keep in sync — and for jsdom, which is why the tests still observe a
   * `window.scrollTo` call.
   */
  const jumpTo = useCallback((top: number, smooth = false) => {
    if (lenis) {
      lenis.scrollTo(top, smooth ? undefined : { immediate: true })
      return
    }
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top, behavior: smooth ? 'smooth' : 'instant' })
    }
  }, [lenis])


  /** Logging in. The scroll goes back to the top of section 0 because the
   *  account you just picked has its own first window and its own argument,
   *  and dropping somebody into section four of it is not a login.
   *
   *  `landAt` is the exception: the hero's "For advertisers" button picks the
   *  account *and* skips the set-piece, landing on the advertiser's desktop
   *  directly. Somebody who followed a link meant for them should not have to
   *  sit through an animation to find out they are catered for. */
  const chooseProfile = useCallback((next: Profile, landAt?: number) => {
    storeProfile(next)
    setProfile(next)
    setSeen(0)
    setJump(null)
    setAssembling(true)
    window.clearTimeout(assembleTimer.current)
    assembleTimer.current = window.setTimeout(() => setAssembling(false), ASSEMBLE_MS)
    jumpTo(landAt ?? landingTop())
  }, [landingTop, jumpTo])

  /** The arrow. Smooth rather than instant: the whole point of pressing it is
   *  to see the machine open, and an instant jump would land past the
   *  animation it exists to start. */
  const enterFromHero = useCallback(() => {
    jumpTo(window.innerHeight, true)
  }, [jumpTo])

  const advertisersFromHero = useCallback(() => {
    chooseProfile('advertiser', landingTop())
  }, [chooseProfile, landingTop])

  /** Switch User. Clears the stored account and puts the login window back —
   *  the site's only route back to it, and macOS's own name for the action.
   *  Lands on section 0 the same way {@link chooseProfile} does, for the same
   *  reason: document `0` in `os` mode is the top of a shut laptop, not the
   *  login window this is supposed to reveal. */
  const switchUser = useCallback(() => {
    storeProfile(null)
    setProfile(null)
    setSeen(0)
    setJump(null)
    setSpotlight(false)
    jumpTo(landingTop())
  }, [landingTop, jumpTo])

  useEffect(() => () => window.clearTimeout(assembleTimer.current), [])
  useEffect(() => () => window.clearTimeout(holdTimer.current), [])

  /**
   * The first crossing commits, and it commits on intent.
   *
   * The intro is a free scrub, so before this the visitor stopped wherever
   * their gesture happened to stop — a short flick left them halfway into a
   * laptop, a hard one carried through the landing into section two or three.
   *
   * The first attempt fired when the scroll *settled*, and settling was the
   * wrong moment: Lenis lerps for up to a second after a gesture ends, and a
   * quiet-period timer waits past that, so the correction arrived over a second
   * late — nothing, then a lurch — and pulled an overshooting visitor backwards
   * from somewhere they had already landed.
   *
   * Now the first twelve percent is theirs to scrub, and past that the page
   * flies the rest of the way itself at a fixed speed. The distance stops
   * depending on how hard anyone flicked, which is the whole bug.
   *
   * **The scroll is locked during the flight.** Without that a second flick
   * lands on top of the animation and carries straight past the landing again,
   * which is the original complaint wearing a hat.
   */
  useEffect(() => {
    if (mode !== 'os' || crossed.current) return
    if (window.scrollY >= window.innerHeight - G.LANDED_EPSILON) {
      // Already at or past the landing — a restored scroll position. There is
      // no crossing left to commit.
      crossed.current = true
      return
    }

    /**
     * One notch is enough.
     *
     * `commit` is fired by a gesture, not by a distance. Somebody who scrolls
     * the way most people scroll — small repeated nudges rather than one long
     * flick — moves the page a handful of pixels at a time, so a pixel
     * threshold takes two or three notches to cross however low it is set. A
     * wheel notch is a decision on its own, whatever distance it produced.
     *
     * The scroll listener stays as a backstop for input that announces itself
     * no other way: a scrollbar drag, or a touch. It is not the mechanism.
     */
    const commit = () => {
      // Read the latch here as well as at setup. `crossed` is a ref, so
      // flipping it does not tear this effect down, and the flight below fires
      // scroll events of its own — without this the commit re-entered itself
      // on every frame of its own animation.
      if (crossed.current) return
      if (window.scrollY >= window.innerHeight - G.LANDED_EPSILON) return
      crossed.current = true

      const target = window.innerHeight
      if (lenis) {
        // `lock` is what makes this seamless rather than a race: it holds the
        // visitor's own scrolling off until the flight lands, so the page
        // cannot be flicked past its destination mid-animation.
        //
        // And the hold afterwards is the other half of it. Releasing the moment
        // the flight ends hands back to a gesture that is often still running,
        // which carries straight on into section two — the machine they were
        // flying toward goes past without ever being looked at. Stopping the
        // scroll for a beat absorbs that, so arriving is a stop and going on is
        // a new decision.
        lenis.scrollTo(target, {
          lock: true,
          duration: CROSSING_SECONDS,
          onComplete: () => {
            lenis.stop()
            window.clearTimeout(holdTimer.current)
            holdTimer.current = window.setTimeout(() => lenis.start(), CROSSING_HOLD_MS)
          },
        })
      } else if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: target, behavior: 'smooth' })
      }
    }

    const onWheel = (event: WheelEvent) => {
      if (G.isDownwardWheel(event.deltaY)) commit()
    }
    const onKey = (event: KeyboardEvent) => {
      if (G.DOWNWARD_KEYS.has(event.key)) commit()
    }
    const onScroll = () => {
      if (G.shouldCommitCrossing(window.scrollY, window.innerHeight)) commit()
    }

    // `wheel` is registered on the window rather than the document because
    // Lenis consumes the event on its own target, and a listener further in
    // would only see the ones it chose to leave alone.
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
    }
  }, [mode, lenis])

  /**
   * The page behind the login window does not scroll.
   *
   * `overflow: hidden` alone was not enough and the bug was visible: Lenis
   * does not decorate the browser's scrolling, it replaces it — cancelling
   * wheel events and driving the document from its own loop — so it scrolled
   * straight through the lock, and the whole desktop slid past behind a modal
   * that was supposed to be holding the visitor still. The rule has to be
   * given to whoever is actually doing the scrolling.
   *
   * Both are set, because they cover different visitors: `lenis` is `null` for
   * anyone with reduced motion on, and they get the CSS. The overflow is
   * restored to whatever it was rather than to `''`, so this cannot quietly
   * undo a rule somebody else set.
   */
  useEffect(() => {
    if (!locked) return
    const root = document.documentElement
    const was = root.style.overflow
    root.style.overflow = 'hidden'
    lenis?.stop()
    return () => {
      root.style.overflow = was
      lenis?.start()
    }
  }, [locked, lenis])

  /* -------------------------------------------------------------- *
   * Scroll -> active section
   * -------------------------------------------------------------- */
  // The observer is never gated on the jump. It keeps reporting the truth
  // about where the midline is, and `active` above decides whether that truth
  // is currently what the screen should be showing — so the moment a jump is
  // abandoned there is already a correct index waiting, rather than a frame of
  // blank while the observer catches up.
  useEffect(() => {
    if (mode !== 'os' || typeof IntersectionObserver === 'undefined') return
    const observed = markers.current.filter((el): el is HTMLDivElement => el !== null)
    if (observed.length === 0) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = Number((entry.target as HTMLElement).dataset.index)
          if (Number.isInteger(index)) setSeen(index)
        }
      },
      // A zero-height root box on the viewport's midline. The markers tile the
      // track edge to edge, so exactly one of them contains that line at any
      // scroll position and there is never a tie to break.
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    )
    observed.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [mode, apps])

  /* -------------------------------------------------------------- *
   * Dock geometry
   * -------------------------------------------------------------- */
  const measureTiles = useCallback(() => {
    setIcons(apps.map((_, i) => {
      const el = tiles.current[i]
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.left, y: r.top, w: r.width, h: r.height }
    }))
  }, [apps])

  useIsoLayoutEffect(() => {
    if (mode !== 'os') return
    measureTiles()
    const onResize = () => measureTiles()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [mode, measureTiles])

  /**
   * The dock's tiles are measured with `getBoundingClientRect()`, which
   * returns *transformed* coordinates. During the intro the whole stage sits
   * inside the laptop's scale, so anything measured then would be wrong by
   * that scale factor — and the window-launch origins and the ghost cursor
   * both read those numbers. The landing removes the transform entirely, so
   * this re-reads the truth on the first frame that has one.
   */
  useIsoLayoutEffect(() => {
    if (mode === 'os' && phase === 'live') measureTiles()
  }, [mode, phase, measureTiles])

  const registerTile = useCallback((index: number, el: HTMLElement | null) => {
    tiles.current[index] = el
  }, [])

  /* -------------------------------------------------------------- *
   * Jumping
   * -------------------------------------------------------------- */
  /**
   * Go to a section, from the dock or from Spotlight.
   *
   * **The scroll is instant, not smooth.** The desktop is one `sticky` layer:
   * nothing on screen travels with the scroll, so a smooth scroll across six
   * viewports animates nothing but time, and the further away the target the
   * longer the visitor spends watching a page that is deliberately not moving.
   * Landing at once puts the whole transition where it can actually be seen —
   * in the windows — and makes a jump of six read exactly like a jump of one
   * instead of six times as slow.
   *
   * What that transition is, is the page's existing app switch and nothing
   * new: the window that was open drops into its dock tile while the target
   * springs out of its own, the drifting cursor corrects onto the target's
   * tile, and the menu bar renames itself. It is the same gesture the scroll
   * already performs between two neighbouring sections, which is the argument
   * for it — a page with one window transition is composed; a page with a
   * second one reserved for clicks is a page with a tell.
   */
  const goTo = useCallback((app: number) => {
    const marker = markers.current[app]
    if (!marker) return
    const top = marker.getBoundingClientRect().top + window.scrollY
    jumpTop.current = top
    setJump(app)
    // Through {@link jumpTo}, so Lenis's own target moves with the document —
    // otherwise the next wheel tick after a dock press snaps the page back to
    // the section you just left. Instant rather than smooth: the desktop is
    // one sticky layer, so a smooth scroll across six viewports animates
    // nothing but time.
    jumpTo(top)
  }, [jumpTo])

  /**
   * The guard's lifetime.
   *
   * It is deliberately not a timer. A fixed timeout that fires before the
   * scroll has arrived hands the observer back a midline that is still
   * somewhere in the middle of the track, which is the original bug with a
   * delay in front of it. So the guard is released on evidence — `scrollend`
   * where the browser has it, a position poll where it does not — and only
   * once the scroll is actually at the target.
   */
  useEffect(() => {
    if (jump === null) return

    const target = jump
    const top = jumpTop.current
    let finished = false

    /** Arrived. `seen` is committed in the same batch as the guard is dropped,
     *  so `active` cannot fall back through a stale observer value for a frame
     *  in between — which would flash the window we just left. */
    const settle = () => {
      if (finished) return
      finished = true
      setSeen(target)
      setJump(null)
    }

    /** The visitor took over. Hand straight back to the observer without
     *  forcing the target on them: wherever they have scrolled to is where
     *  they want to be, and the alternative is the page fighting the scroll. */
    const abandon = () => {
      if (finished) return
      finished = true
      setJump(null)
    }

    const distance = () => Math.abs(window.scrollY - top)

    const onScrollEnd = () => { if (distance() <= SETTLE_EPSILON) settle(); else abandon() }
    const onKey = (event: KeyboardEvent) => { if (SCROLL_KEYS.has(event.key)) abandon() }

    const hasScrollEnd = 'onscrollend' in window
    if (hasScrollEnd) window.addEventListener('scrollend', onScrollEnd)
    window.addEventListener('wheel', abandon, { passive: true })
    window.addEventListener('touchstart', abandon, { passive: true })
    window.addEventListener('keydown', onKey)

    // The fallback, and the scrollbar-drag detector. A scroll we started only
    // ever closes the distance to its target; one that starts opening it again
    // is a thumb being dragged or a wheel we did not hear about, and either way
    // the visitor is driving.
    let last = distance()
    const poll = window.setInterval(() => {
      const now = distance()
      if (now <= SETTLE_EPSILON) settle()
      else if (now > last + DRIFT_EPSILON) abandon()
      else last = now
    }, SETTLE_POLL)
    const ceiling = window.setTimeout(abandon, SETTLE_CEILING)

    return () => {
      finished = true
      window.clearInterval(poll)
      window.clearTimeout(ceiling)
      if (hasScrollEnd) window.removeEventListener('scrollend', onScrollEnd)
      window.removeEventListener('wheel', abandon)
      window.removeEventListener('touchstart', abandon)
      window.removeEventListener('keydown', onKey)
    }
  }, [jump])

  /* -------------------------------------------------------------- *
   * The drifting cursor's click
   * -------------------------------------------------------------- */
  const onGhostPress = useCallback((index: number) => {
    window.clearTimeout(pressTimer.current)
    setPressed(index)
    pressTimer.current = window.setTimeout(() => setPressed(-1), 160)
  }, [])

  useEffect(() => () => window.clearTimeout(pressTimer.current), [])

  /* -------------------------------------------------------------- *
   * Spotlight
   * -------------------------------------------------------------- */
  // Also gated on the phase: the menu bar's own search button sits inside
  // `Laptop`'s children and is `inert` for the whole intro, so ⌘K has to
  // agree with it rather than opening a search over a laptop that is still
  // shut. There is nothing to navigate to yet during the intro anyway — the
  // hero is the only surface.
  useEffect(() => {
    if (mode !== 'os' || locked || phase !== 'live') return
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSpotlight((was) => !was)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, locked, phase])

  const closeSpotlight = useCallback(() => setSpotlight(false), [])
  const openSpotlight = useCallback(() => setSpotlight(true), [])

  /* -------------------------------------------------------------- *
   * Stacked
   * -------------------------------------------------------------- */
  if (mode === 'stacked') {
    return (
      <Stacked
        profile={profile}
        slots={slots}
        setSlots={setSlots}
        plan={plan}
        setPlan={setPlan}
        onChoose={chooseProfile}
        onSwitchUser={switchUser}
      />
    )
  }

  /* -------------------------------------------------------------- *
   * The desktop
   * -------------------------------------------------------------- */
  return (
    <div className="relative">
      {/* The login window, over everything the desktop has — including the
          menu bar, because on a Mac it is not a sheet on top of a machine you
          could be using. It mounts only once the page has landed: nothing
          interactive may exist inside the laptop's transform, or a visitor
          could tab into a control that is currently the size of a postcard. */}
      <AnimatePresence>
        {locked && <LoginScreen key="login" onChoose={chooseProfile} />}
      </AnimatePresence>

      <div className="sticky top-0 h-screen overflow-hidden" inert={locked}>
        {/* In the `live` phase this renders its children with no transform at
            all — not `scale(1)`, none — inside one plain wrapper div. That
            wrapper is geometrically and stackingly inert, so the OS below
            behaves exactly like the tree that shipped before the intro
            existed, even though it is not literally the same tree. */}

        <Laptop intro={intro} inert={phase === 'intro'} live={phase === 'live'}>
          <div className="absolute inset-0"><Wallpaper cast={profile === 'advertiser'} /></div>
          <DesktopItems profile={profile ?? 'user'} plan={plan} />

          <OSMenuBar
            appName={frontmost.name}
            onOpenSpotlight={openSpotlight}
            profile={profile}
            onSwitchUser={switchUser}
          />

          <div className="pointer-events-none absolute inset-0">
            {apps.map((app, i) => (
              <LaunchedWindow
                key={app.id}
                // Forced inactive through the intro, so what you fly into is a
                // bare running machine rather than a window already open on a
                // desktop nobody has logged into. They stay *mounted* — the
                // seven windows are a deliberate property of the server HTML,
                // and six of them already render at zero opacity anyway.
                active={phase === 'live' && i === active}
                icon={icons[i] ?? null}
                frame={app.frame}
                stageInset={STAGE_INSET}
              >
                <app.Scene slots={slots} setSlots={setSlots} plan={plan} setPlan={setPlan} />
              </LaunchedWindow>
            ))}

            {/* The supporting windows. Two of the seven sections open a second,
                smaller window behind the one that is frontmost. */}
            {apps.map((app, i) => app.companion && (
              <LaunchedWindow
                key={`${app.id}-companion`}
                active={phase === 'live' && i === active}
                icon={icons[i] ?? null}
                frame={app.companion.frame}
                stageInset={STAGE_INSET}
                delay={app.companion.delay}
                behind
              >
                <app.companion.Scene />
              </LaunchedWindow>
            ))}
          </div>

          {/* Keyed on the account: switching users is a new machine, and its
              two banners should be allowed to fire once on it. */}
          {phase === 'live' && profile !== null && (
            <Notifications
              key={profile}
              active={active}
              slots={slots}
              plan={plan}
              profile={profile}
              apps={apps}
            />
          )}

          <Dock
            apps={apps}
            active={active}
            pressed={pressed}
            assembling={assembling}
            onSelect={goTo}
            registerTile={registerTile}
          />

          {/* Last, so it draws over the dock it is pointing at. Gated on the
              landing as well as on the account: the cursor's whole position is
              read out of `getBoundingClientRect()`, which inside the laptop's
              transform would put it somewhere the dock is not. */}
          {phase === 'live' && profile !== null && (
            <GhostCursor icons={icons} active={active} onPress={onGhostPress} />
          )}
        </Laptop>

        {/* Outside the laptop, over it. The hero is the page; the laptop is a
            thing on the page. */}
        <Hero
          intro={intro}
          hidden={phase === 'live'}
          onEnter={enterFromHero}
          onAdvertisers={advertisersFromHero}
        />
      </div>

      <Spotlight open={spotlight} onClose={closeSpotlight} onGoTo={goTo} apps={apps} />

      {/* The scroll track. Each marker is a hairline strip one viewport tall,
          stacked edge to edge down the whole track — they exist to be
          observed and nothing else, so they carry no content and no width.
          They start one viewport down: the first viewport is the intro, and
          no section is active while the laptop is still opening. */}
      {apps.map((app, i) => (
        <div
          key={app.id}
          ref={(el) => { markers.current[i] = el }}
          data-index={i}
          aria-hidden
          className="pointer-events-none absolute left-0 w-px"
          style={{ top: `${(i + 1) * 100}vh`, height: '100vh' }}
        />
      ))}
      {/* The sticky layer above is itself one viewport tall, so the track
          needs one viewport per section — one each for the sections after the
          first, plus the one the intro spends opening the laptop. */}
      <div aria-hidden style={{ height: `${apps.length * 100}vh` }} />
    </div>
  )
}
