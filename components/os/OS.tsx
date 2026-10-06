'use client'
import { MotionConfig } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DesktopItems } from './DesktopItems'
import { Dock } from './Dock'
import { LaunchedWindow } from './LaunchedWindow'
import { OSMenuBar } from './OSMenuBar'
import { RoomChrome } from './RoomChrome'
import { Spotlight } from './Spotlight'
import { Stacked } from './Stacked'
import { Wallpaper } from './Wallpaper'
import type { Box } from './chrome'
import { Laptop } from './intro/Laptop'
import { isDownwardWheel } from './intro/geometry'
import { useZoom } from './intro/useZoom'
import { APPS, appIndex } from './registry'
import { useIsoLayoutEffect } from './useIsoLayoutEffect'
import { useReducedMotion } from './useReducedMotion'
import { DESKTOP, ROOM, pathFor, viewFromPath, type AppId } from './view'

/** Below these the desktop cannot hold a menu bar, a window and a dock at once. */
const MIN_WIDTH = 1000
const MIN_HEIGHT = 680

/** Menu bar, dock, and the breathing room either side of a window. */
const STAGE_INSET = 172

/**
 * The room and the laptop in it.
 *
 * **The URL is the state.** `view` comes from the pathname; every action here
 * navigates rather than setting state, so Esc, the back button and a pasted
 * link all arrive the same way. This component is mounted in the root layout
 * so it survives those navigations and can animate between them.
 *
 * **Server HTML.** `mode` starts `os` and the zoom starts wherever the URL
 * says, so `/` renders the room with its h1 and Résumé link, and `/work/resume`
 * renders the landed desktop with the résumé window open. The viewport is read
 * in layout effects, before the first paint.
 */
export function OS() {
  const pathname = usePathname()
  const router = useRouter()
  const view = viewFromPath(pathname ?? '/') ?? ROOM
  const reduced = useReducedMotion()
  const zoom = useZoom(view.zoomed, reduced)

  const [mode, setMode] = useState<'os' | 'stacked'>('os')
  const [icons, setIcons] = useState<(Box | null)[]>([])
  /** The path Spotlight was opened on. Any navigation closes it by construction. */
  const [spotlightAt, setSpotlightAt] = useState<string | null>(null)
  const tiles = useRef<(HTMLElement | null)[]>([])

  const landed = zoom.phase === 'desktop'
  const active = landed ? appIndex(view.app) : -1
  const frontmost = APPS[active]?.name ?? 'Finder'
  const spotlight = landed && spotlightAt === pathname

  const go = useCallback((path: string) => router.push(path, { scroll: false }), [router])
  const openLaptop = useCallback(() => go(pathFor(DESKTOP)), [go])
  const closeApp = useCallback(() => go(pathFor(DESKTOP)), [go])
  const openApp = useCallback((id: AppId) => go(pathFor({ zoomed: true, app: id })), [go])
  const openSpotlight = useCallback(() => setSpotlightAt(pathname), [pathname, setSpotlightAt])
  const closeSpotlight = useCallback(() => setSpotlightAt(null), [setSpotlightAt])

  useIsoLayoutEffect(() => {
    const resolve = () => {
      const roomy = window.innerWidth >= MIN_WIDTH && window.innerHeight >= MIN_HEIGHT
      setMode(roomy ? 'os' : 'stacked')
    }
    resolve()
    window.addEventListener('resize', resolve)
    return () => window.removeEventListener('resize', resolve)
  }, [])

  // Esc steps out one level: an open app to the desktop, the desktop to the
  // room. A component that handled Esc itself (Spotlight) marks it handled.
  // ⌘K / Ctrl-K toggles Spotlight, on the landed desktop only.
  useEffect(() => {
    if (mode !== 'os') return
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.key === 'Escape') {
        if (view.app) go(pathFor(DESKTOP))
        else if (view.zoomed) go(pathFor(ROOM))
        return
      }
      if (landed && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSpotlightAt((was) => (was === pathname ? null : pathname))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, view.app, view.zoomed, landed, pathname, go])

  // Scrolling down in the room is a shortcut into the laptop. A trackpad flick
  // is dozens of wheel events, so this fires once per visit to the room.
  useEffect(() => {
    if (mode !== 'os' || view.zoomed) return
    let fired = false
    const onWheel = (event: WheelEvent) => {
      if (fired || !isDownwardWheel(event.deltaY)) return
      fired = true
      openLaptop()
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [mode, view.zoomed, openLaptop])

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
      <div className="fixed inset-0 overflow-hidden bg-black">
        <Laptop zoom={zoom} inert={!landed} live={landed}>
          <div className="absolute inset-0"><Wallpaper /></div>
          <DesktopItems />

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
                <app.Scene onClose={closeApp} />
              </LaunchedWindow>
            ))}
          </div>

          <Dock
            apps={APPS}
            active={active}
            onSelect={(i) => openApp(APPS[i].id)}
            registerTile={registerTile}
          />
        </Laptop>

        <RoomChrome zoom={zoom} hidden={view.zoomed} onOpenLaptop={openLaptop} />
      </div>

      <Spotlight open={spotlight} onClose={closeSpotlight} onGoTo={openApp} apps={APPS} />
    </MotionConfig>
  )
}
