'use client'
import { MotionConfig, motion, useMotionValue, useSpring } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { markOverlayOpenedInApp, resetOverlayDepth } from '@/components/overlays/history'
import { Hotbar } from '@/components/room/Hotbar'
import { RoomBackdrop } from '@/components/room/RoomBackdrop'
import { RoomBar } from '@/components/room/RoomBar'
import { RoomScene } from '@/components/room/RoomScene'
import { WhiteboardIntro } from '@/components/room/WhiteboardIntro'
import { panFor } from '@/components/room/layout'
import { useTimeOfDay } from '@/components/room/useTimeOfDay'
import { headlineMetrics } from '@/content/projects'
import { HOTBAR, ROOM_OBJECTS, type HotbarSlot } from '@/content/room'
import { DesktopItems } from './DesktopItems'
import { Dock } from './Dock'
import { LaunchedWindow } from './LaunchedWindow'
import { OSMenuBar } from './OSMenuBar'
import { Spotlight } from './Spotlight'
import { Stacked } from './Stacked'
import { Wallpaper } from './Wallpaper'
import type { Box } from './chrome'
import { Laptop } from './intro/Laptop'
import { Picker } from './picker/Picker'
import { isDownwardWheel, isUpwardWheel } from './intro/geometry'
import { useZoom } from './intro/useZoom'
import { APPS, appIndex } from './registry'
import { useIsoLayoutEffect } from './useIsoLayoutEffect'
import { useReducedMotion } from './useReducedMotion'
import { DESKTOP, ROOM, cardPath, isRoomOverlay, pathFor, viewFromPath, type AppId } from './view'

/** Below these the desktop cannot hold a menu bar, a window and a dock at once. */
const MIN_WIDTH = 1000
const MIN_HEIGHT = 680

/** Menu bar, dock, and the breathing room either side of a window. */
const STAGE_INSET = 172

/** The picker's headline strip: flagged project metrics. */
const HEADLINES = headlineMetrics()

/** Typing somewhere: number keys belong to the field, not the hotbar. */
function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

/**
 * The room and the laptop in it.
 *
 * **The URL is the state.** `view` comes from the pathname; every action here
 * navigates rather than setting state, so Esc, the back button and a pasted
 * link all arrive the same way. Cards are routes too (`/cards/<id>`): their
 * pages draw the overlay, and this component keeps the room still beneath it.
 * It is mounted in the root layout so it survives every navigation.
 *
 * **The room** is drawn in layers by `RoomScene`, inside the Laptop's room
 * box, so the zoom flies through the same picture you hover. The pan is one
 * motion value, eased by a spring (set directly under reduced motion), that
 * the zoom fades out as it lands.
 *
 * **Server HTML.** `mode` starts `os` and the zoom starts wherever the URL
 * says; the room box is placed by CSS until the viewport is measured, so `/`
 * has the room, its h1 and the Résumé link, and `/work/resume` the open résumé.
 */
export function OS() {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const view = viewFromPath(pathname) ?? ROOM
  const overlayOpen = isRoomOverlay(pathname)
  const reduced = useReducedMotion()
  const { variant } = useTimeOfDay()

  const panTarget = useMotionValue(0)
  const panSpring = useSpring(panTarget, { stiffness: 140, damping: 26, mass: 0.6 })
  const zoom = useZoom(view.zoomed, reduced, reduced ? panTarget : panSpring)

  const [mode, setMode] = useState<'os' | 'stacked'>('os')
  const [icons, setIcons] = useState<(Box | null)[]>([])
  /** The path Spotlight was opened on. Any navigation closes it by construction. */
  const [spotlightAt, setSpotlightAt] = useState<string | null>(null)
  /** Objects lit from outside the room (the hotbar). */
  const [lit, setLit] = useState<readonly string[]>([])
  const tiles = useRef<(HTMLElement | null)[]>([])
  /** The object that opened the current card, to hand focus back to. */
  const opener = useRef<string | null>(null)
  const wasOverlay = useRef(overlayOpen)

  const landed = zoom.phase === 'desktop'
  const active = landed ? appIndex(view.app) : -1
  const frontmost = APPS[active]?.name ?? 'Finder'
  const spotlight = landed && spotlightAt === pathname
  /** The room is what is being looked at: no laptop, no card, no flight. */
  const roomActive = mode === 'os' && !view.zoomed && !overlayOpen && zoom.resting

  const go = useCallback((path: string) => router.push(path, { scroll: false }), [router])
  const replace = useCallback((path: string) => router.replace(path, { scroll: false }), [router])
  const openLaptop = useCallback(() => go(pathFor(DESKTOP)), [go])
  const closeApp = useCallback(() => go(pathFor(DESKTOP)), [go])
  const goHome = useCallback(() => go(pathFor(DESKTOP)), [go])
  const openApp = useCallback((id: AppId) => go(pathFor({ zoomed: true, app: id })), [go])
  const openSpotlight = useCallback(() => setSpotlightAt(pathname), [pathname, setSpotlightAt])
  const closeSpotlight = useCallback(() => setSpotlightAt(null), [setSpotlightAt])

  const activate = useCallback((id: string) => {
    const object = ROOM_OBJECTS.find((o) => o.id === id)
    if (!object) return
    opener.current = id
    if (object.action.kind === 'zoom') { openLaptop(); return }
    markOverlayOpenedInApp()
    go(object.action.kind === 'card' ? cardPath(object.action.card) : object.action.href)
  }, [openLaptop, go])
  const activateSlot = useCallback((slot: HotbarSlot) => activate(slot.objects[0]), [activate])

  useIsoLayoutEffect(() => {
    const resolve = () => {
      const roomy = window.innerWidth >= MIN_WIDTH && window.innerHeight >= MIN_HEIGHT
      setMode(roomy ? 'os' : 'stacked')
    }
    resolve()
    window.addEventListener('resize', resolve)
    return () => window.removeEventListener('resize', resolve)
  }, [])

  // Esc steps out one level: Spotlight, then an open app to the desktop, then
  // the desktop to the room (an open card handles its own Esc). ⌘K / Ctrl-K
  // toggles Spotlight on the landed desktop. 1–9 pick hotbar slots in the room,
  // never with a modifier (⌘1 is the browser's) and never while typing.
  useEffect(() => {
    if (mode !== 'os') return
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.key === 'Escape') {
        if (spotlight) closeSpotlight()
        else if (view.zoomed && !landed) go(pathFor(ROOM))
        else if (view.app) go(pathFor(DESKTOP))
        else if (view.zoomed) go(pathFor(ROOM))
        return
      }
      if (landed && event.key === 'F3') {
        event.preventDefault()
        goHome()
        return
      }
      if (landed && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSpotlightAt((was) => (was === pathname ? null : pathname))
        return
      }
      if (roomActive && /^[1-9]$/.test(event.key) && !event.metaKey && !event.ctrlKey && !event.altKey
        && !isTyping(event.target)) {
        const slot = HOTBAR.find((s) => s.slot === Number(event.key))
        if (slot) { event.preventDefault(); activateSlot(slot) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, view.app, view.zoomed, landed, pathname, spotlight, closeSpotlight, go, goHome, roomActive, activateSlot])

  // Scrolling is a shortcut both ways: down in the room goes into the laptop,
  // up on the landed desktop comes back out. A trackpad flick is dozens of
  // wheel events, so each direction fires once per visit. Nothing while a card is open.
  useEffect(() => {
    if (mode !== 'os' || overlayOpen) return
    let fired = false
    const onWheel = (event: WheelEvent) => {
      if (fired) return
      if (!view.zoomed) {
        // Not until the camera is back at rest: a scroll during the flight
        // out would throw it straight back in.
        if (!zoom.resting || !isDownwardWheel(event.deltaY)) return
        fired = true
        openLaptop()
        return
      }
      if (!landed || !isUpwardWheel(event.deltaY)) return
      // Inside an open window the wheel scrolls the window, not the camera.
      if (event.target instanceof Element && event.target.closest('[data-os-window]')) return
      fired = true
      go(pathFor(ROOM))
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [mode, overlayOpen, view.zoomed, landed, zoom.resting, openLaptop, go])

  // The pan follows the pointer across the whole window while the room is in
  // view, and returns to rest when the pointer leaves the page.
  useEffect(() => {
    const rest = zoom.rest
    if (!roomActive || !rest) return
    const onMove = (event: PointerEvent) => panTarget.set(panFor(event.clientX, window.innerWidth, rest))
    const onLeave = () => panTarget.set(0)
    window.addEventListener('pointermove', onMove)
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [roomActive, zoom.rest, panTarget])

  // The room is showing: no overlay steps are left to undo.
  useEffect(() => { if (!overlayOpen) resetOverlayDepth() }, [overlayOpen])

  // Closing a card hands focus back to the object that opened it (spec §8).
  useEffect(() => {
    if (wasOverlay.current && !overlayOpen && opener.current) {
      document.querySelector<HTMLElement>(`[data-room-object="${opener.current}"]`)?.focus()
    }
    wasOverlay.current = overlayOpen
  }, [overlayOpen])

  // Dock tiles are the windows' launch origins. Measured only once landed: inside
  // the zoom's transform every rect would be off by the camera's scale.
  const measureTiles = useCallback(() => {
    setIcons(APPS.map((_, i) => {
      const el = tiles.current[i]
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.left, y: r.top, w: r.width, h: r.height }
    }))
  }, [setIcons])

  useIsoLayoutEffect(() => {
    if (mode !== 'os' || !landed) return
    measureTiles()
    window.addEventListener('resize', measureTiles)
    return () => window.removeEventListener('resize', measureTiles)
  }, [mode, landed, measureTiles])

  const registerTile = useCallback((index: number, el: HTMLElement | null) => {
    tiles.current[index] = el
  }, [])

  if (mode === 'stacked') return <Stacked />

  return (
    <MotionConfig reducedMotion="user">
      <div className="fixed inset-0 overflow-hidden bg-[#1b130e]">
        <RoomBackdrop />

        <Laptop
          zoom={zoom}
          inert={!landed}
          live={landed}
          room={(
            <RoomScene lit={lit} disabled={!roomActive} onActivate={activate} variant={variant}>
              <WhiteboardIntro variant={variant} />
            </RoomScene>
          )}
        >
          <div className="absolute inset-0"><Wallpaper /></div>
          <DesktopItems />

          {/* /work is the picker: the laptop's home screen, never an empty desktop. */}
          {view.zoomed && !view.app && <Picker apps={APPS} headlines={HEADLINES} onOpen={openApp} />}

          {/* Clicking the desktop around an open window closes it. Esc and the
              red light are the keyboard and visible routes to the same thing. */}
          {view.app && (
            <div aria-hidden className="absolute inset-0 z-[15]" onClick={closeApp} />
          )}

          <OSMenuBar appName={frontmost} apps={APPS} onOpenSpotlight={openSpotlight} />

          <div className="pointer-events-none absolute inset-0">
            {APPS.map((app, i) => (
              <LaunchedWindow
                key={app.id}
                active={i === active}
                icon={icons[i] ?? null}
                frame={app.frame}
                stageInset={STAGE_INSET}
              >
                <app.Scene
                  onClose={closeApp}
                  active={i === active}
                  sub={i === active ? view.sub : undefined}
                  onNavigate={replace}
                  onOpenApp={openApp}
                />
              </LaunchedWindow>
            ))}
          </div>

          <Dock
            apps={APPS}
            active={active}
            onSelect={(i) => openApp(APPS[i].id)}
            registerTile={registerTile}
            onHome={goHome}
            homeActive={!view.app}
          />
        </Laptop>

        {/* The room's own chrome, faded out by the zoom. `inert` alone, not
            aria-hidden: inert already hides it, and aria-hidden over a link
            that still has focus (the Résumé link, just clicked) is blocked. */}
        <motion.div className="pointer-events-none absolute inset-0" style={{ opacity: zoom.roomUi }} inert={!roomActive}>
          <RoomBar />
          <Hotbar onHighlight={(ids) => setLit(ids ?? [])} onActivate={activateSlot} />
        </motion.div>
      </div>

      <Spotlight open={spotlight} onClose={closeSpotlight} onGoTo={openApp} apps={APPS} />
    </MotionConfig>
  )
}
