# Phase 1 (Skeleton) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Next.js site where the current pixel room loads at `/`, clicking the laptop zooms into a desktop at `/work`, and the desktop has working Résumé and Contact apps at `/work/resume` and `/work/contact`.

**Architecture:** The URL is the state. One client component, `components/os/OS.tsx`, is mounted in the root layout so it survives navigation. It reads `usePathname()`, turns the path into a `View` (`{ zoomed, app }`), and animates to match. Every action (clicking the laptop, a dock tile, Esc, the close button) calls `router.push(path)`, so the back button and pasted links take the same path. The camera math is the AE shell's scroll-driven geometry, now driven by a motion value that `useZoom` animates on a click.

**Tech Stack:** Next.js 16.2.12 (App Router), React 19.2.4, TypeScript 5, Tailwind 4, framer-motion 12, Vitest 3 + Testing Library + jsdom.

**Spec:** `docs/superpowers/specs/2026-10-06-personal-website-design.md` (§7 phase 1; also §2, §3, §4 laptop row, §5). The source shell is `reference/ae-shell/` (read its README).

## Global Constraints

- Stack versions match the AE snapshot's `reference/ae-shell/package.json` exactly (`next` 16.2.12, `react`/`react-dom` 19.2.4, `framer-motion` ^12.43.0), minus `lenis`.
- **Nothing imports from `reference/`.** It is a frozen snapshot, excluded from `tsc`, Vitest, ESLint and Tailwind's source scan. Copy files out of it; never import from it.
- No Attention Exchange product code or branding in shipped code. The only AE mention allowed is the Résumé's "Building" entry.
- All text and data live in `content/`, not in components (spec §5).
- "The résumé, his work and a way to contact him are always one click from landing": a **Résumé** link is in the server HTML of `/` and visible from the first frame (spec §1, §3).
- Each app window has its own URL, closes with Esc, a click outside it or the back button, and its text is server-rendered (spec §4).
- Reduced motion: no camera zoom (cut straight to the desktop); framer animations respect `prefers-reduced-motion` (spec §3).
- Pixel art always renders with `image-rendering: pixelated`.
- Not on rayyandarugar.com. Phase 1 ends on a Vercel preview URL.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Deliberate departures from the spec's copy list (§5)

- **Not copied:** `intro/Hero.tsx` (AE marketing copy; the whiteboard replaces it in phase 3), `Notifications.tsx` and `GhostCursor.tsx` (their only behaviour was AE-specific scroll theatre), `SmoothScroll.tsx`/Lenis (the page no longer scrolls). They stay in git history and in `reference/`.
- **Rewritten, not copied:** `intro/useIntro.ts` becomes `intro/useZoom.ts` (click-driven instead of scroll-driven). `OS.tsx`, `OSMenuBar.tsx`, `Spotlight.tsx`, `DesktopItems.tsx`, `Stacked.tsx` and `registry.tsx` are rewritten around a single desktop.
- **Two apps, not five.** Phase 1 ships Résumé and Contact; Projects, The Attention Exchange and About/Mission arrive in phase 5 (spec §7).
- **Small viewports** (< 1000×680) get the `Stacked` fallback: the room picture, then the app windows in document order. The real phone layout is phase 5.
- **Draft content.** `content/profile.ts` holds placeholder copy and contact links that Rayyan must confirm before the preview URL is shared (see Task 8).

## Review Focus

1. **Esc inside Spotlight** must close Spotlight only, not also zoom out of the laptop. (Task 7, test "Esc in Spotlight closes only Spotlight")
2. **A trackpad flick** fires dozens of wheel events; it must navigate to `/work` once, not stack duplicate history entries. (Task 7, test "a burst of wheel events navigates once")
3. **Reversing mid-zoom** (Esc or back while the camera is still flying in) must end in the room, never land on the desktop. (Task 4, test "reversing mid-flight never lands")
4. **Typing "resume" without the accent** in Spotlight must still find "Résumé". (Task 6, test "matches without accents")
5. **Unknown paths** like `/work/nope` must 404 at build time and, if the client ever sees one, fall back to the room instead of crashing. (Task 2 and Task 7, tests "owns nothing outside its scheme" and "falls back to the room on an unknown path")

---

## File Structure

```
package.json, tsconfig.json, next.config.ts, postcss.config.mjs,
vitest.config.ts, eslint.config.mjs, .gitignore          Task 1
app/globals.css, app/layout.tsx                          Task 1 (layout edited in Task 7)
app/page.tsx                                             Task 1 placeholder, Task 7 final
app/work/page.tsx, app/work/[app]/page.tsx               Task 7
public/fonts/, public/hero/, public/wallpaper/           Tasks 1, 3 (copied)
content/profile.ts                                       Task 5  all site copy and links
components/os/view.ts                                    Task 2  URL <-> View, pure
components/os/{chrome,stage,useIsoLayoutEffect,
  useReducedMotion}.ts, {parts,icons,OSButton,
  OSWindow,LaunchedWindow,Wallpaper}.tsx                 Task 3  copied shell primitives
components/os/intro/geometry.ts                          Task 4  camera math, pure
components/os/intro/useZoom.ts                           Task 4  animates z, derives phase
components/os/intro/Laptop.tsx                           Task 4  room picture + clipped desktop
components/os/registry.tsx                               Task 5  the apps
components/os/apps/{ResumeApp,ContactApp}.tsx            Task 5
components/os/{Dock,OSMenuBar,Spotlight,
  DesktopItems}.tsx                                      Task 6  desktop chrome
components/os/{OS,RoomChrome,Stacked}.tsx                Task 7  the root
```

---

### Task 1: Scaffold the app

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `eslint.config.mjs`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`
- Modify: `.gitignore`
- Copy: `reference/ae-shell/public/fonts/` → `public/fonts/`

**Interfaces:**
- Produces: CSS tokens `--font-display`, `--font-ui`, `--font-mono`, `--font-pixel`, `--color-money-hi/lo`, `.tabular` (used by every copied shell file); `@/*` path alias.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "rayyandarugar-com",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "framer-motion": "^12.43.0",
    "next": "16.2.12",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^5.2.0",
    "eslint": "^9",
    "eslint-config-next": "16.2.12",
    "jsdom": "^27.0.1",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^3.2.7"
  },
  "overrides": {
    "vite": "^7.3.6"
  }
}
```

- [ ] **Step 2: Write the configs**

`tsconfig.json`: copy `reference/ae-shell/tsconfig.json` verbatim, then change the last line's `"exclude": ["node_modules"]` to:

```json
  "exclude": ["node_modules", "reference"]
```

`next.config.ts` and `postcss.config.mjs`: copy verbatim from `reference/ae-shell/`.

```bash
cp reference/ae-shell/tsconfig.json reference/ae-shell/next.config.ts reference/ae-shell/postcss.config.mjs .
```

`vitest.config.ts`:

```ts
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: {
    environment: 'jsdom',
    globals: true,
    // reference/ is a frozen copy of another repo; its tests import code that
    // does not exist here.
    exclude: [...configDefaults.exclude, 'reference/**'],
    // jsdom renders whole React trees with no compositor; on a busy machine the
    // default five seconds fails before the code does. See the AE snapshot's
    // vitest.config.ts for the history.
    testTimeout: 20_000,
  },
})
```

`eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'reference/**']),
])
```

Append to `.gitignore`:

```
next-env.d.ts
*.tsbuildinfo
```

- [ ] **Step 3: Write `app/globals.css`**

```css
@import "tailwindcss";
@source not "../reference";

@theme inline {
  --color-ink: #141A22;
  --color-money: #7BE000;
  --color-money-hi: #B6FF63;
  --color-money-lo: #5FBE00;
  --color-aqua: #2E7FE0;

  /* Role tokens point at next/font's typeface variables (see layout.tsx). */
  --font-display: var(--font-archivo), system-ui, sans-serif;
  --font-ui: var(--font-lato), system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), ui-monospace, monospace;
  --font-pixel: var(--font-departure), ui-monospace, monospace;
}

:root { color-scheme: light }
body { font-family: var(--font-display); color: var(--color-ink); background: #000; }

.tabular { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
```

- [ ] **Step 4: Write `app/layout.tsx` and a placeholder `app/page.tsx`**

```bash
mkdir -p public && cp -R reference/ae-shell/public/fonts public/
```

`app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Archivo, JetBrains_Mono, Lato } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

// Named after the typeface, not the role, so they cannot collide with the
// role tokens in globals.css that point at them.
const archivo = Archivo({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-archivo' })
const lato = Lato({ subsets: ['latin'], weight: ['400', '700', '900'], variable: '--font-lato' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-jetbrains' })

/** DepartureMono: self-hosted because it is not on Google Fonts. One weight. */
const pixel = localFont({
  src: '../public/fonts/DepartureMono-Regular.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--font-departure',
})

export const metadata: Metadata = {
  title: { default: 'Rayyan Darugar', template: '%s · Rayyan Darugar' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${lato.variable} ${mono.variable} ${pixel.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

`app/page.tsx` (replaced in Task 7):

```tsx
export default function Home() {
  return <main><h1>Rayyan Darugar</h1></main>
}
```

- [ ] **Step 5: Install and verify**

Run: `npm install`
Expected: installs with no errors (peer warnings are fine).

Run: `npm run typecheck && npm run lint && npx vitest run --passWithNoTests && npm run build`
Expected: all four succeed. `build` lists `/` as a static route (○). If `@source not` is rejected by the installed Tailwind, remove that line; it is an optimisation, not a requirement.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs vitest.config.ts eslint.config.mjs .gitignore app public/fonts
git commit -m "Scaffold the Next.js app on the AE shell's stack

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The URL scheme

**Files:**
- Create: `components/os/view.ts`
- Test: `components/os/__tests__/view.test.ts`

**Interfaces:**
- Produces:
  - `APP_IDS: readonly ['resume', 'contact']`, `type AppId = 'resume' | 'contact'`
  - `interface View { zoomed: boolean; app: AppId | null }`
  - `ROOM: View`, `DESKTOP: View`
  - `isAppId(value: string): value is AppId`
  - `viewFromPath(pathname: string): View | null` (null = not a path this scheme owns)
  - `pathFor(view: View): string`

- [ ] **Step 1: Write the failing test**

`components/os/__tests__/view.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { APP_IDS, DESKTOP, ROOM, isAppId, pathFor, viewFromPath } from '../view'

describe('viewFromPath', () => {
  it('reads the room, the desktop and an open app', () => {
    expect(viewFromPath('/')).toEqual(ROOM)
    expect(viewFromPath('/work')).toEqual(DESKTOP)
    expect(viewFromPath('/work/resume')).toEqual({ zoomed: true, app: 'resume' })
    expect(viewFromPath('/work/contact')).toEqual({ zoomed: true, app: 'contact' })
  })

  it('tolerates a trailing slash', () => {
    expect(viewFromPath('/work/')).toEqual(DESKTOP)
    expect(viewFromPath('/work/resume/')).toEqual({ zoomed: true, app: 'resume' })
  })

  it('owns nothing outside its scheme', () => {
    expect(viewFromPath('/music')).toBeNull()
    expect(viewFromPath('/work/nope')).toBeNull()
    expect(viewFromPath('/work/resume/extra')).toBeNull()
    expect(viewFromPath('/Work')).toBeNull()
  })
})

describe('pathFor', () => {
  it('round-trips every view', () => {
    for (const view of [ROOM, DESKTOP, ...APP_IDS.map((app) => ({ zoomed: true, app }))]) {
      expect(viewFromPath(pathFor(view))).toEqual(view)
    }
  })

  it('ignores the app when the laptop is not open', () => {
    expect(pathFor({ zoomed: false, app: 'resume' })).toBe('/')
  })
})

describe('isAppId', () => {
  it('accepts only known apps', () => {
    expect(isAppId('resume')).toBe(true)
    expect(isAppId('projects')).toBe(false)
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run components/os/__tests__/view.test.ts`
Expected: FAIL, "Failed to resolve import ../view".

- [ ] **Step 3: Write `components/os/view.ts`**

```ts
/**
 * The laptop's URL scheme, as pure functions.
 *
 * The URL is the state. `/` is the room, `/work` is the desktop with nothing
 * open, `/work/<app>` is the desktop with that app's window open. Everything
 * that changes what is on screen does it by navigating, so Esc, the back
 * button and a pasted link all go through the same path.
 */

export const APP_IDS = ['resume', 'contact'] as const
export type AppId = (typeof APP_IDS)[number]

export interface View {
  zoomed: boolean
  app: AppId | null
}

export const ROOM: View = { zoomed: false, app: null }
export const DESKTOP: View = { zoomed: true, app: null }

export function isAppId(value: string): value is AppId {
  return (APP_IDS as readonly string[]).includes(value)
}

/** `null` for any path this scheme does not own: a 404, or a later overlay route. */
export function viewFromPath(pathname: string): View | null {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return ROOM
  if (parts[0] !== 'work') return null
  if (parts.length === 1) return DESKTOP
  if (parts.length === 2 && isAppId(parts[1])) return { zoomed: true, app: parts[1] }
  return null
}

export function pathFor(view: View): string {
  if (!view.zoomed) return '/'
  return view.app ? `/work/${view.app}` : '/work'
}
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `npx vitest run components/os/__tests__/view.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add components/os/view.ts components/os/__tests__/view.test.ts
git commit -m "Make the URL the laptop's state

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Copy the shell primitives

**Files:**
- Copy verbatim: `chrome.ts`, `stage.ts`, `parts.tsx`, `icons.tsx`, `OSButton.tsx`, `LaunchedWindow.tsx`, `useReducedMotion.ts`, `useIsoLayoutEffect.ts` into `components/os/`; `public/hero/`, `public/wallpaper/`
- Copy then modify: `components/os/OSWindow.tsx` (real close button), `components/os/Wallpaper.tsx` (drop `cast`), `components/os/icons.tsx` (add `DocGlyph`)
- Test: `components/os/__tests__/OSWindow.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `OSWindow({ title, subtitle?, toolbar?, children, style?, bodyStyle?, className?, onClose? })`; when `onClose` is set, the red light is a `<button aria-label="Close window">`
  - `LaunchedWindow({ active, icon: Box | null, frame: WindowFrame, stageInset, delay?, behind?, children })` (unchanged)
  - `Wallpaper({ className? })`
  - `DocGlyph`, `MailGlyph` from `icons.tsx`
  - `TYPE`, `INK`, `GLASS`, `type Box` from `chrome.ts`; `type WindowFrame` from `stage.ts`; `Eyebrow` from `parts.tsx`; `OSButton({ children, variant?, href?, onClick?, type?, className? })`
  - `useReducedMotion(): boolean` (server snapshot `true`; `false` when `matchMedia` is missing, as in jsdom); `useIsoLayoutEffect`

- [ ] **Step 1: Copy**

```bash
mkdir -p components/os
cd reference/ae-shell/components/os
cp chrome.ts stage.ts parts.tsx icons.tsx OSButton.tsx OSWindow.tsx LaunchedWindow.tsx Wallpaper.tsx useReducedMotion.ts useIsoLayoutEffect.ts ../../../../components/os/
cd ../../../..
cp -R reference/ae-shell/public/hero reference/ae-shell/public/wallpaper public/
```

- [ ] **Step 2: Write the failing test**

`components/os/__tests__/OSWindow.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { OSWindow } from '../OSWindow'

describe('OSWindow', () => {
  it('has no close button unless it can be closed', () => {
    render(<OSWindow title="Résumé"><p>body</p></OSWindow>)
    expect(screen.getByText('Résumé')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Close window' })).toBeNull()
  })

  it('makes the red light a real close button', () => {
    const onClose = vi.fn()
    render(<OSWindow title="Résumé" onClose={onClose}><p>body</p></OSWindow>)
    fireEvent.click(screen.getByRole('button', { name: 'Close window' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `npx vitest run components/os/__tests__/OSWindow.test.tsx`
Expected: the first test passes, the second FAILS ("Unable to find an accessible element with the role "button" and name "Close window"").

- [ ] **Step 4: Modify `OSWindow.tsx`**

Replace the whole `function TrafficLights() { ... }` (lines 33–64 of the copy) with:

```tsx
type Light = (typeof LIGHTS)[number]

const DOT = 'relative block h-[12px] w-[12px] rounded-full'

function dotStyle(light: Light): CSSProperties {
  return {
    background: `radial-gradient(circle at 50% 22%, ${light.hi} 0%, ${light.base} 58%, ${light.rim} 100%)`,
    boxShadow: `inset 0 0 0 .5px ${light.rim}, inset 0 -1px 2px rgba(0,0,0,.24), 0 1px 1px rgba(16,24,40,.28)`,
  }
}

function Face({ light }: { light: Light }) {
  return (
    <>
      <span
        className="absolute left-1/2 top-[1.5px] block h-[3.5px] w-[6px] -translate-x-1/2 rounded-full transition-opacity duration-150 group-hover/window:opacity-40"
        style={{ background: 'rgba(255,255,255,.72)', filter: 'blur(.4px)' }}
      />
      <svg
        viewBox="0 0 10 10"
        className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-150 group-hover/window:opacity-100 group-focus-within/window:opacity-100"
        fill="none"
        stroke={light.ink}
        strokeWidth="1.4"
        strokeLinecap="round"
        style={{ color: light.ink }}
      >
        {light.glyph}
      </svg>
    </>
  )
}

/** The red light is a real close button when the window can be closed. The
 *  other two are always decoration: this desktop has no minimise or zoom. */
function TrafficLights({ onClose }: { onClose?: () => void }) {
  return (
    <span className="relative z-[1] flex flex-none items-center gap-[8px]">
      {LIGHTS.map((light, i) => (i === 0 && onClose ? (
        <button
          key={light.base}
          type="button"
          onClick={onClose}
          aria-label="Close window"
          className={`${DOT} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E7FE0]`}
          style={dotStyle(light)}
        >
          <Face light={light} />
        </button>
      ) : (
        <span key={light.base} aria-hidden className={DOT} style={dotStyle(light)}>
          <Face light={light} />
        </span>
      )))}
    </span>
  )
}
```

In `OSWindow`'s props, add `onClose` to the destructuring and the type:

```tsx
export function OSWindow({
  title, subtitle, toolbar, children, style, bodyStyle, className = '', onClose,
}: {
  title: string
  /** Small right-aligned text in the title bar — a path, a count, a status. */
  subtitle?: string
  toolbar?: ReactNode
  children: ReactNode
  style?: CSSProperties
  bodyStyle?: CSSProperties
  className?: string
  /** Makes the red traffic light a real close button. */
  onClose?: () => void
}) {
```

and change `<TrafficLights />` to `<TrafficLights onClose={onClose} />`.

- [ ] **Step 5: Drop the AE cast from `Wallpaper.tsx`**

Change the signature to:

```tsx
export function Wallpaper({ className = '' }: { className?: string }) {
```

and delete the whole `{cast && ( ... )}` block (the `mixBlendMode: 'color'` overlay).

- [ ] **Step 6: Add `DocGlyph` to `icons.tsx`**

Append:

```tsx
/** A page with a header line: the Résumé app's tile. */
export function DocGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
      <path d="M10 4h14l8 8v22a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
            fill="#FBFCFE" stroke="rgba(20,26,34,.35)" strokeWidth="1.2" />
      <path d="M24 4l8 8h-8Z" fill="#D8DFE8" />
      <rect x="12" y="17" width="16" height="2.4" rx="1.2" fill="#1B63C0" />
      <rect x="12" y="22" width="16" height="2.4" rx="1.2" fill="rgba(20,26,34,.25)" />
      <rect x="12" y="27" width="11" height="2.4" rx="1.2" fill="rgba(20,26,34,.25)" />
    </svg>
  )
}
```

- [ ] **Step 7: Run tests and typecheck**

Run: `npx vitest run components/os && npm run typecheck`
Expected: PASS (8 tests across view and OSWindow); typecheck clean. If any copied file fails to typecheck, it imports something this task did not copy: stop and report it rather than copying more of the AE tree.

- [ ] **Step 8: Commit**

```bash
git add components/os public/hero public/wallpaper
git commit -m "Copy the window chrome out of the AE shell

The red traffic light becomes a real close button, and the wallpaper loses
the advertiser-account tint.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The click-driven zoom

**Files:**
- Create: `components/os/intro/geometry.ts`, `components/os/intro/useZoom.ts`, `components/os/intro/Laptop.tsx`
- Test: `components/os/intro/__tests__/geometry.test.ts`, `components/os/intro/__tests__/useZoom.test.tsx`, `components/os/intro/__tests__/Laptop.test.tsx`

**Interfaces:**
- Consumes: `useIsoLayoutEffect` (Task 3).
- Produces:
  - `geometry.ts`: `type Phase = 'room' | 'desktop'`, `interface Rect { x; y; w; h }`, `scene/hole(z, vw, vh): Rect`, `camera(z, vw, vh): { scale; x; y }`, `clip(z, vw, vh): { top; right; bottom; left }`, `pixelFade(z)`, `roomUiFade(z)`, `isDownwardWheel(deltaY): boolean`, constants `SCREEN_L/T/R/B`, `SCENE_ASPECT`, `PIXEL_SCREEN_W/H`, `HOLE_W/H`
  - `useZoom(zoomed: boolean, reduced: boolean): Zoom` where `Zoom = { phase, resting, measured, hit: Rect | null, camera, clip, scene, pixelScreen: MotionValue<string>, pixelOpacity, roomUi: MotionValue<number>, sceneBox: { width; height } }`; `ZOOM_SECONDS = 1.1`
  - `Laptop({ zoom: Zoom, inert: boolean, live: boolean, children })`; `SCENE_SRC`, `SCENE_VIDEO_SRC`, `SCREEN_PIXEL_SRC`

`phase` is `'desktop'` only while `zoomed` is true **and** the camera has arrived (`z` reached 1). It drops to `'room'` the moment `zoomed` goes false.

- [ ] **Step 1: Write the failing geometry test**

`components/os/intro/__tests__/geometry.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  SCENE_ASPECT, SCREEN_L, SCREEN_T, camera, clip, hole, isDownwardWheel,
  pixelFade, roomUiFade, scene, window01,
} from '../geometry'

const VW = 1512
const VH = 950

describe('window01', () => {
  it('normalises into its own window and clamps outside it', () => {
    expect(window01(0.5, 0, 1)).toBe(0.5)
    expect(window01(0.25, 0.5, 1)).toBe(0)
    expect(window01(2, 0.5, 1)).toBe(1)
  })
})

describe('the scene', () => {
  it('covers the viewport at rest, like any hero image', () => {
    const s = scene(0, VW, VH)
    expect(s.w).toBeGreaterThanOrEqual(VW)
    expect(s.h).toBeGreaterThanOrEqual(VH)
    expect(s.w / s.h).toBeCloseTo(SCENE_ASPECT, 4)
    expect(s.x).toBeLessThanOrEqual(0)
    expect(s.x + s.w).toBeGreaterThanOrEqual(VW)
  })

  it('is scaled so its screen is the viewport at z = 1', () => {
    const s = scene(1, VW, VH)
    expect(s.x + SCREEN_L * s.w).toBeCloseTo(0, 6)
    expect(s.y + SCREEN_T * s.h).toBeCloseTo(0, 6)
  })
})

describe('the screen hole', () => {
  it('sits on the desk in the lower half at rest', () => {
    const r = hole(0, VW, VH)
    expect(r.y).toBeGreaterThan(VH * 0.5)
    expect(r.y + r.h).toBeLessThan(VH)
  })

  it('is exactly the viewport at z = 1', () => {
    const r = hole(1, VW, VH)
    expect(r.x).toBeCloseTo(0, 6)
    expect(r.y).toBeCloseTo(0, 6)
    expect(r.w).toBeCloseTo(VW, 6)
    expect(r.h).toBeCloseTo(VH, 6)
  })

  it('grows monotonically toward the viewport', () => {
    for (let i = 0; i < 40; i += 1) {
      const a = hole(i / 40, VW, VH)
      const b = hole((i + 1) / 40, VW, VH)
      expect(b.w).toBeGreaterThanOrEqual(a.w)
      expect(b.h).toBeGreaterThanOrEqual(a.h)
    }
  })
})

describe('camera', () => {
  it('fits the desktop inside the drawn screen at every point', () => {
    for (let i = 0; i <= 20; i += 1) {
      const z = i / 20
      const c = camera(z, VW, VH)
      const r = hole(z, VW, VH)
      expect(VW * c.scale).toBeLessThanOrEqual(r.w + 1e-6)
      expect(VH * c.scale).toBeLessThanOrEqual(r.h + 1e-6)
    }
  })

  // The landed desktop is unscaled and unmoved, so every getBoundingClientRect()
  // in it (the dock tiles, the window launch origins) is true.
  it('is identity at z = 1', () => {
    const c = camera(1, VW, VH)
    expect(c.scale).toBeCloseTo(1, 9)
    expect(c.x).toBeCloseTo(0, 9)
    expect(c.y).toBeCloseTo(0, 9)
  })
})

describe('clip', () => {
  it('cuts the desktop down to the hole at rest and is no clip at z = 1', () => {
    const rest = clip(0, VW, VH)
    expect(Math.min(rest.top, rest.right, rest.bottom, rest.left)).toBeGreaterThan(0)
    const landed = clip(1, VW, VH)
    expect(landed.top).toBeCloseTo(0, 9)
    expect(landed.right).toBeCloseTo(0, 9)
    expect(landed.bottom).toBeCloseTo(0, 9)
    expect(landed.left).toBeCloseTo(0, 9)
  })
})

describe('fades', () => {
  it('shows the drawn screen at rest and hands over well before landing', () => {
    expect(pixelFade(0)).toBe(1)
    expect(pixelFade(0.6)).toBe(0)
  })

  it('takes the room copy away early in the flight', () => {
    expect(roomUiFade(0)).toBe(1)
    expect(roomUiFade(0.3)).toBe(0)
  })
})

describe('isDownwardWheel', () => {
  it('takes one notch, and ignores a resting hand and upward scrolls', () => {
    expect(isDownwardWheel(4)).toBe(true)
    expect(isDownwardWheel(1)).toBe(false)
    expect(isDownwardWheel(-40)).toBe(false)
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run components/os/intro/__tests__/geometry.test.ts`
Expected: FAIL, cannot resolve `../geometry`.

- [ ] **Step 3: Write `components/os/intro/geometry.ts`**

```ts
/**
 * The laptop zoom, as pure functions of one number.
 *
 * `z` is camera progress: 0 is the laptop on the desk, 1 is its desktop
 * full-bleed. `useZoom` animates it on a click; everything here is a lookup on
 * it, which is what makes the zoom reversible mid-flight for free. Nothing
 * here holds state, reads the DOM or knows what React is.
 *
 * Adapted from the AE shell's intro (reference/ae-shell/components/os/intro/),
 * where the same number came from the scroll position.
 */

export type Phase = 'room' | 'desktop'

/**
 * Where the black screen rectangle sits inside `public/hero/scene-ambient.png`,
 * as fractions of the image. Measured from the file (the largest connected
 * black region), not estimated: an eyeballed value shows up at once as the
 * desktop overlapping the bezel or a black seam around it. Re-measure if the
 * picture is redrawn.
 */
export const SCREEN_L = 0.2420
export const SCREEN_T = 0.5547
export const SCREEN_R = 0.4099
export const SCREEN_B = 0.7357

/** The scene file's pixel size. The fractions above are of a rectangle. */
export const SCENE_PX_W = 1376
export const SCENE_PX_H = 768
export const SCENE_ASPECT = SCENE_PX_W / SCENE_PX_H

/** The drawn screen bitmap's pixel size: small on purpose, so it is near its
 *  native size at rest and gets chunkier, not blurrier, as the camera closes. */
export const PIXEL_SCREEN_W = 344
export const PIXEL_SCREEN_H = 192

/** The screen hole's size as a fraction of the scene. */
export const HOLE_W = SCREEN_R - SCREEN_L
export const HOLE_H = SCREEN_B - SCREEN_T

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/** Normalise `t` into a [start, end] sub-window, clamped at both ends. */
export function window01(t: number, start: number, end: number): number {
  if (end <= start) return t >= end ? 1 : 0
  return clamp01((t - start) / (end - start))
}

/** The drawn screen's opacity. It hands over to the live desktop early, while
 *  both are still too small to read, so nobody sees the swap. */
export function pixelFade(z: number): number {
  return 1 - window01(z, 0.02, 0.48)
}

/** The room's own copy (name, Résumé link) leaves as soon as the camera moves. */
export function roomUiFade(z: number): number {
  return 1 - window01(z, 0, 0.25)
}

export interface Rect { x: number; y: number; w: number; h: number }

/**
 * Where the scene picture sits, in viewport pixels. At z = 0 it covers the
 * viewport, centred; at z = 1 it is scaled so its screen hole is the viewport.
 * Centred is not a default: the room is drawn with content hard against its
 * right edge, so any sideways offset pulls a seam into frame.
 */
export function scene(z: number, vw: number, vh: number): Rect {
  const w0 = Math.max(vw, vh * SCENE_ASPECT)
  const h0 = w0 / SCENE_ASPECT
  const x0 = (vw - w0) / 2
  const y0 = (vh - h0) / 2

  const w1 = vw / HOLE_W
  const h1 = vh / HOLE_H
  const x1 = -SCREEN_L * w1
  const y1 = -SCREEN_T * h1

  return {
    x: x0 + (x1 - x0) * z,
    y: y0 + (y1 - y0) * z,
    w: w0 + (w1 - w0) * z,
    h: h0 + (h1 - h0) * z,
  }
}

/** The drawn screen, in viewport pixels. Derived from {@link scene}, so the
 *  picture and the live desktop cannot drift apart. */
export function hole(z: number, vw: number, vh: number): Rect {
  const s = scene(z, vw, vh)
  return {
    x: s.x + SCREEN_L * s.w,
    y: s.y + SCREEN_T * s.h,
    w: HOLE_W * s.w,
    h: HOLE_H * s.h,
  }
}

/** The desktop's transform: rendered at viewport size and scaled *down* to fit
 *  the hole (fit, not cover, so no menu bar or icon is cropped). Identity at 1. */
export function camera(z: number, vw: number, vh: number): { scale: number; x: number; y: number } {
  const r = hole(z, vw, vh)
  return {
    scale: Math.min(r.w / vw, r.h / vh),
    x: r.x + r.w / 2 - vw / 2,
    y: r.y + r.h / 2 - vh / 2,
  }
}

/** The desktop's clip, as `inset()` edges in viewport pixels. All 0 at z = 1. */
export function clip(z: number, vw: number, vh: number): {
  top: number; right: number; bottom: number; left: number
} {
  const r = hole(z, vw, vh)
  return { top: r.y, right: vw - r.x - r.w, bottom: vh - r.y - r.h, left: r.x }
}

/** The smallest wheel delta that counts as a deliberate downward scroll. Two
 *  pixels ignores the noise a trackpad makes under a resting hand. */
export const WHEEL_FLOOR = 2

export function isDownwardWheel(deltaY: number): boolean {
  return deltaY > WHEEL_FLOOR
}
```

- [ ] **Step 4: Run the geometry test**

Run: `npx vitest run components/os/intro/__tests__/geometry.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 5: Write the failing `useZoom` test**

`components/os/intro/__tests__/useZoom.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useZoom } from '../useZoom'

describe('useZoom', () => {
  it('starts in the room, at rest, with the laptop hit area measured', () => {
    const { result } = renderHook(() => useZoom(false, false))
    expect(result.current.phase).toBe('room')
    expect(result.current.resting).toBe(true)
    expect(result.current.measured).toBe(true)
    expect(result.current.hit).not.toBeNull()
  })

  it('starts landed when the URL is already inside the laptop', () => {
    const { result } = renderHook(() => useZoom(true, false))
    expect(result.current.phase).toBe('desktop')
    expect(result.current.resting).toBe(false)
  })

  it('cuts straight to the desktop under reduced motion', async () => {
    const { result, rerender } = renderHook(({ zoomed }) => useZoom(zoomed, true), {
      initialProps: { zoomed: false },
    })
    rerender({ zoomed: true })
    await waitFor(() => expect(result.current.phase).toBe('desktop'))
  })

  it('stays in the room until the flight lands, then lands', async () => {
    const { result, rerender } = renderHook(({ zoomed }) => useZoom(zoomed, false), {
      initialProps: { zoomed: false },
    })
    rerender({ zoomed: true })
    expect(result.current.phase).toBe('room')
    await waitFor(() => expect(result.current.phase).toBe('desktop'), { timeout: 4000 })
  })

  it('leaves the desktop the moment the laptop is closed', () => {
    const { result, rerender } = renderHook(({ zoomed }) => useZoom(zoomed, false), {
      initialProps: { zoomed: true },
    })
    rerender({ zoomed: false })
    expect(result.current.phase).toBe('room')
  })

  it('reversing mid-flight never lands', async () => {
    const { result, rerender } = renderHook(({ zoomed }) => useZoom(zoomed, false), {
      initialProps: { zoomed: false },
    })
    rerender({ zoomed: true })
    await new Promise((resolve) => setTimeout(resolve, 200))
    rerender({ zoomed: false })
    await waitFor(() => expect(result.current.resting).toBe(true), { timeout: 4000 })
    expect(result.current.phase).toBe('room')
  })
})
```

- [ ] **Step 6: Run it to make sure it fails**

Run: `npx vitest run components/os/intro/__tests__/useZoom.test.tsx`
Expected: FAIL, cannot resolve `../useZoom`.

- [ ] **Step 7: Write `components/os/intro/useZoom.ts`**

```ts
'use client'
import {
  animate, useMotionTemplate, useMotionValue, useMotionValueEvent, useTransform,
  type MotionValue,
} from 'framer-motion'
import { useEffect, useState } from 'react'
import { useIsoLayoutEffect } from '../useIsoLayoutEffect'
import * as G from './geometry'

/** Slow enough to read as travel into the machine, quick enough not to be a wait. */
export const ZOOM_SECONDS = 1.1

export interface Zoom {
  /** `desktop` only once the camera has landed; `room` the moment it leaves. */
  phase: G.Phase
  /** The camera has not moved. The ambient video plays only then. */
  resting: boolean
  /** The viewport has been read. False on the server and the first client render. */
  measured: boolean
  /** The laptop's screen at rest, in viewport px: the click target. */
  hit: G.Rect | null
  camera: MotionValue<string>
  clip: MotionValue<string>
  scene: MotionValue<string>
  pixelScreen: MotionValue<string>
  pixelOpacity: MotionValue<number>
  roomUi: MotionValue<number>
  /** The room's un-transformed box: its size at z = 1. Changes on resize only. */
  sceneBox: { width: number; height: number }
}

/**
 * Animates camera progress `z` toward the URL's answer and derives every style
 * the zoom needs from it.
 *
 * Nothing here re-renders React per frame: the styles are motion values written
 * straight to the DOM. The only React state is the viewport and two booleans
 * that flip at the ends of a flight. `phase` is derived from where `z` actually
 * is, not from a completion callback, so a flight reversed halfway never
 * reports a landing it did not make.
 */
export function useZoom(zoomed: boolean, reduced: boolean): Zoom {
  const z = useMotionValue(zoomed ? 1 : 0)
  const [vp, setVp] = useState({ w: 0, h: 0 })
  const [arrived, setArrived] = useState(zoomed)
  const [resting, setResting] = useState(!zoomed)

  useIsoLayoutEffect(() => {
    const read = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])

  useMotionValueEvent(z, 'change', (v) => {
    setArrived(v >= 1)
    setResting(v < 0.02)
  })

  useEffect(() => {
    const target = zoomed ? 1 : 0
    if (reduced) {
      z.set(target)
      return
    }
    const controls = animate(z, target, { duration: ZOOM_SECONDS, ease: 'easeInOut' })
    return () => controls.stop()
  }, [zoomed, reduced, z])

  const { w: vw, h: vh } = vp

  const camScale = useTransform(z, (v) => G.camera(v, vw, vh).scale)
  const camX = useTransform(z, (v) => G.camera(v, vw, vh).x)
  const camY = useTransform(z, (v) => G.camera(v, vw, vh).y)
  const camera = useMotionTemplate`translate(${camX}px, ${camY}px) scale(${camScale})`

  const clipT = useTransform(z, (v) => G.clip(v, vw, vh).top)
  const clipR = useTransform(z, (v) => G.clip(v, vw, vh).right)
  const clipB = useTransform(z, (v) => G.clip(v, vw, vh).bottom)
  const clipL = useTransform(z, (v) => G.clip(v, vw, vh).left)
  const clip = useMotionTemplate`inset(${clipT}px ${clipR}px ${clipB}px ${clipL}px)`

  // The room is drawn at its z = 1 size and transformed down, so no frame of
  // the flight touches layout.
  const boxW = vw > 0 ? vw / G.HOLE_W : 0
  const boxH = vh > 0 ? vh / G.HOLE_H : 0
  const scX = useTransform(z, (v) => G.scene(v, vw, vh).x)
  const scY = useTransform(z, (v) => G.scene(v, vw, vh).y)
  const scSX = useTransform(z, (v) => (boxW > 0 ? G.scene(v, vw, vh).w / boxW : 1))
  const scSY = useTransform(z, (v) => (boxH > 0 ? G.scene(v, vw, vh).h / boxH : 1))
  const scene = useMotionTemplate`translate(${scX}px, ${scY}px) scale(${scSX}, ${scSY})`

  // The drawn screen is a small bitmap scaled *up* onto the hole, which is why
  // it has its own transform rather than sharing the camera's.
  const pxX = useTransform(z, (v) => G.hole(v, vw, vh).x)
  const pxY = useTransform(z, (v) => G.hole(v, vw, vh).y)
  const pxSX = useTransform(z, (v) => G.hole(v, vw, vh).w / G.PIXEL_SCREEN_W)
  const pxSY = useTransform(z, (v) => G.hole(v, vw, vh).h / G.PIXEL_SCREEN_H)
  const pixelScreen = useMotionTemplate`translate(${pxX}px, ${pxY}px) scale(${pxSX}, ${pxSY})`
  const pixelOpacity = useTransform(z, G.pixelFade)
  const roomUi = useTransform(z, G.roomUiFade)

  const measured = vw > 0
  return {
    phase: zoomed && arrived ? 'desktop' : 'room',
    resting,
    measured,
    hit: measured ? G.hole(0, vw, vh) : null,
    camera,
    clip,
    scene,
    pixelScreen,
    pixelOpacity,
    roomUi,
    sceneBox: { width: boxW, height: boxH },
  }
}
```

- [ ] **Step 8: Run the `useZoom` test**

Run: `npx vitest run components/os/intro/__tests__/useZoom.test.tsx`
Expected: PASS, 6 tests. If "stays in the room until the flight lands" times out, framer is not getting animation frames in jsdom: confirm `requestAnimationFrame` exists in the test environment before changing the hook.

- [ ] **Step 9: Write the failing `Laptop` test**

`components/os/intro/__tests__/Laptop.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Laptop } from '../Laptop'
import type { Zoom } from '../useZoom'

/** Plain strings stand in for motion values: jsdom never animates them, and
 *  what is under test is which branch renders and when the video plays. */
const stub = {
  phase: 'room',
  resting: true,
  measured: true,
  hit: null,
  scene: 'none',
  clip: 'none',
  camera: 'none',
  pixelScreen: 'none',
  pixelOpacity: 1,
  roomUi: 1,
  sceneBox: { width: 100, height: 100 },
} as unknown as Zoom

describe('Laptop', () => {
  let play: ReturnType<typeof vi.fn>
  let pause: ReturnType<typeof vi.fn>

  beforeEach(() => {
    play = vi.fn(() => Promise.resolve())
    pause = vi.fn()
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause)
  })

  afterEach(() => { vi.restoreAllMocks() })

  it('renders the desktop untransformed once landed', () => {
    const { container } = render(<Laptop zoom={stub} inert={false} live><p>desk</p></Laptop>)
    expect(screen.getByText('desk')).toBeTruthy()
    expect(container.querySelector('video')).toBeNull()
  })

  it('before measuring, shows the room as a cover image and hides the desktop', () => {
    const unmeasured = { ...stub, measured: false } as Zoom
    const { container } = render(<Laptop zoom={unmeasured} inert live={false}><p>desk</p></Laptop>)
    expect(container.querySelector('video')).toBeNull()
    expect(screen.getByText('desk').closest('.invisible')).not.toBeNull()
  })

  // Regression from the AE shell: the video element only exists in the room
  // branch, so the play effect has to re-run when that branch appears.
  it('starts playing when the video appears, not only when resting changes', () => {
    const { rerender } = render(<Laptop zoom={stub} inert={false} live><div /></Laptop>)
    expect(play).not.toHaveBeenCalled()
    rerender(<Laptop zoom={stub} inert={false} live={false}><div /></Laptop>)
    expect(play).toHaveBeenCalled()
  })

  it('pauses once the camera starts moving, and resumes at rest', () => {
    const moving = { ...stub, resting: false } as Zoom
    const { rerender } = render(<Laptop zoom={moving} inert live={false}><div /></Laptop>)
    expect(pause).toHaveBeenCalled()
    expect(play).not.toHaveBeenCalled()
    rerender(<Laptop zoom={stub} inert live={false}><div /></Laptop>)
    expect(play).toHaveBeenCalled()
  })
})
```

- [ ] **Step 10: Run it to make sure it fails**

Run: `npx vitest run components/os/intro/__tests__/Laptop.test.tsx`
Expected: FAIL, cannot resolve `../Laptop`.

- [ ] **Step 11: Write `components/os/intro/Laptop.tsx`**

```tsx
'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useRef, type ReactNode } from 'react'
import { PIXEL_SCREEN_H, PIXEL_SCREEN_W } from './geometry'
import type { Zoom } from './useZoom'

/** The room. If you swap it, re-measure `SCREEN_L/T/R/B` in geometry.ts. */
export const SCENE_SRC = '/hero/scene-ambient.png'
/** The same room, breathing. The laptop must not move in it: it was measured
 *  to zero drift against the still. Re-measure if it is regenerated. */
export const SCENE_VIDEO_SRC = '/hero/scene-ambient.mp4'
/** The desktop drawn in the room's own pixel style, shown until the live one
 *  is large enough to read. */
export const SCREEN_PIXEL_SRC = '/hero/screen-pixel.png'

const PIXELATED = { imageRendering: 'pixelated' } as const

/**
 * The room, and the live desktop pasted into its drawn screen.
 *
 * One picture, with a black rectangle where the screen is; `geometry.ts` knows
 * that rectangle. The room, the clip and the desktop's transform all derive
 * from one interpolated rect, so the drawing and the live UI cannot drift
 * apart mid-flight. Once landed (`live`), the desktop renders with no
 * transform at all, so the dock's getBoundingClientRect() measurements are true.
 */
export function Laptop({
  zoom, inert, live, children,
}: { zoom: Zoom; inert: boolean; live: boolean; children: ReactNode }) {
  const video = useRef<HTMLVideoElement>(null)

  // `live` and `measured` decide whether the video element exists at all, so
  // they are dependencies: without them the room sits frozen after hydration.
  useEffect(() => {
    const el = video.current
    if (!el) return
    if (zoom.resting) el.play().catch(() => {})
    else el.pause()
  }, [zoom.resting, zoom.measured, live])

  if (live) {
    return <div className="absolute inset-0" inert={inert}>{children}</div>
  }

  // The server and the first client render have no viewport. At z = 0 the room
  // is exactly a centred cover image, so draw it that way rather than as a
  // zero-sized transform, and keep the desktop out of sight until it can be
  // clipped to the screen.
  if (!zoom.measured) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <Image src={SCENE_SRC} alt="" fill priority sizes="100vw"
               style={{ objectFit: 'cover', ...PIXELATED }} />
        <div className="invisible absolute inset-0" inert>{children}</div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0"
        style={{
          width: zoom.sceneBox.width,
          height: zoom.sceneBox.height,
          transform: zoom.scene,
          transformOrigin: '0 0',
        }}
      >
        <Image src={SCENE_SRC} alt="" fill priority sizes="100vw"
               style={{ objectFit: 'fill', ...PIXELATED }} />
        <video
          ref={video}
          src={SCENE_VIDEO_SRC}
          poster={SCENE_SRC}
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: 'fill', ...PIXELATED }}
        />
      </motion.div>

      {/* The desktop, cut to the drawn screen. Black behind it, because the
          desktop is fitted rather than cropped and a sliver shows where the two
          shapes disagree: a lit screen with a hair of black at its edge. */}
      <motion.div className="absolute inset-0" style={{ clipPath: zoom.clip, background: '#000' }}>
        <motion.div className="absolute inset-0" style={{ transform: zoom.camera }} inert={inert}>
          {children}
        </motion.div>

        <motion.img
          aria-hidden
          src={SCREEN_PIXEL_SRC}
          alt=""
          width={PIXEL_SCREEN_W}
          height={PIXEL_SCREEN_H}
          className="pointer-events-none absolute left-0 top-0 max-w-none"
          style={{
            transform: zoom.pixelScreen,
            transformOrigin: '0 0',
            opacity: zoom.pixelOpacity,
            ...PIXELATED,
          }}
        />
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 12: Run all intro tests and typecheck**

Run: `npx vitest run components/os/intro && npm run typecheck`
Expected: PASS (22 tests); typecheck clean.

- [ ] **Step 13: Commit**

```bash
git add components/os/intro
git commit -m "Drive the laptop zoom from a click instead of the scroll

The AE camera math is kept; useZoom animates its input and derives the phase
from where the camera actually is, so a reversed flight never lands.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Content, the registry and the two apps

**Files:**
- Create: `content/profile.ts`, `components/os/registry.tsx`, `components/os/apps/ResumeApp.tsx`, `components/os/apps/ContactApp.tsx`
- Test: `components/os/__tests__/apps.test.tsx`

**Interfaces:**
- Consumes: `APP_IDS`, `AppId` (Task 2); `OSWindow`, `OSButton`, `TYPE`, `INK`, `Eyebrow`, `DocGlyph`, `MailGlyph`, `WindowFrame` (Task 3).
- Produces:
  - `content/profile.ts`: `PROFILE: { name, tagline }`, `CONTACT: readonly ContactLink[]` (`{ label, href, detail }`), `RESUME: { pdf: string | null; building: readonly ResumeEntry[]; education: readonly ResumeEntry[] }` (`ResumeEntry = { title, detail }`)
  - `registry.tsx`: `interface AppSceneProps { onClose?: () => void }`, `interface AppDef { id: AppId; name; Glyph; tile; inset; frame: WindowFrame; Scene: ComponentType<AppSceneProps> }`, `APPS: readonly AppDef[]` (order = `APP_IDS`), `appIndex(id: AppId | null): number` (−1 for null)

- [ ] **Step 1: Write the failing test**

`components/os/__tests__/apps.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CONTACT, PROFILE, RESUME } from '@/content/profile'
import { APPS, appIndex } from '../registry'
import { APP_IDS } from '../view'
import { ContactApp } from '../apps/ContactApp'
import { ResumeApp } from '../apps/ResumeApp'

describe('the registry', () => {
  // The dock, the URL scheme and the static routes all key on these ids.
  it('lists exactly the apps the URL scheme knows, in the same order', () => {
    expect(APPS.map((app) => app.id)).toEqual([...APP_IDS])
  })

  it('finds an app by id, and nothing for no app', () => {
    expect(appIndex('contact')).toBe(1)
    expect(appIndex(null)).toBe(-1)
  })
})

describe('ResumeApp', () => {
  it('leads with the name as an h2 and lists the schools', () => {
    render(<ResumeApp />)
    expect(screen.getByRole('heading', { level: 2, name: PROFILE.name })).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    for (const entry of RESUME.education) expect(screen.getByText(entry.title)).toBeTruthy()
  })

  it('closes through its red light', () => {
    const onClose = vi.fn()
    render(<ResumeApp onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close window' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('ContactApp', () => {
  it('links every contact method', () => {
    render(<ContactApp />)
    for (const link of CONTACT) {
      expect(screen.getByRole('link', { name: new RegExp(link.label) }).getAttribute('href')).toBe(link.href)
    }
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run components/os/__tests__/apps.test.tsx`
Expected: FAIL, cannot resolve `@/content/profile`.

- [ ] **Step 3: Write `content/profile.ts`**

```ts
/**
 * Who this site is about, and how to reach him.
 *
 * DRAFT. Rayyan replaces this copy with his own (spec §9), and confirms the
 * contact links before the preview URL is shared. No component hardcodes any
 * of it.
 */

export const PROFILE = {
  name: 'Rayyan Darugar',
  tagline: 'Student at USC. Building The Attention Exchange.',
} as const

export interface ContactLink {
  label: string
  href: string
  /** What the visitor sees: the address itself, not "click here". */
  detail: string
}

export const CONTACT: readonly ContactLink[] = [
  { label: 'Email', href: 'mailto:rayyandarugar@gmail.com', detail: 'rayyandarugar@gmail.com' },
  { label: 'GitHub', href: 'https://github.com/RayyanDarugar', detail: 'github.com/RayyanDarugar' },
]

export interface ResumeEntry {
  title: string
  detail: string
}

export const RESUME: {
  /** Path under /public once Rayyan supplies the PDF; null hides the button. */
  pdf: string | null
  building: readonly ResumeEntry[]
  education: readonly ResumeEntry[]
} = {
  pdf: null,
  building: [
    {
      title: 'The Attention Exchange',
      detail: 'Rents out the empty space on your screen and pays you for it.',
    },
  ],
  education: [
    { title: 'University of Southern California', detail: 'Los Angeles' },
    { title: 'HKUST', detail: 'Hong Kong · 2025' },
    { title: 'Bocconi University', detail: 'Milan' },
  ],
}
```

- [ ] **Step 4: Write `components/os/registry.tsx`**

```tsx
import type { ComponentType } from 'react'
import { ContactApp } from './apps/ContactApp'
import { ResumeApp } from './apps/ResumeApp'
import { DocGlyph, MailGlyph } from './icons'
import type { WindowFrame } from './stage'
import type { AppId } from './view'

/** Everything an app window is handed. `onClose` is absent in the stacked
 *  fallback, where there is no desktop to close a window onto. */
export interface AppSceneProps {
  onClose?: () => void
}

export interface AppDef {
  id: AppId
  /** Shown in the menu bar, the dock tooltip and Spotlight. */
  name: string
  Glyph: ComponentType
  /** The dock tile's fill. */
  tile: string
  /** Inset between the tile edge and the glyph, in px. */
  inset: number
  /** Size and position on the stage. See stage.ts. */
  frame: WindowFrame
  Scene: ComponentType<AppSceneProps>
}

/**
 * The laptop's apps, in dock order. Phase 5 adds Projects, The Attention
 * Exchange and About; adding one is an entry here plus its id in view.ts.
 */
export const APPS: readonly AppDef[] = [
  {
    id: 'resume', name: 'Résumé', Glyph: DocGlyph, inset: 10,
    frame: { w: 980, h: 0.9, dx: -0.04, dy: 0 },
    tile: 'linear-gradient(#FFFFFF,#C9D3DF)',
    Scene: ResumeApp,
  },
  {
    id: 'contact', name: 'Contact', Glyph: MailGlyph, inset: 10,
    frame: { w: 760, h: 0.7, dx: 0.06, dy: 0.02 },
    tile: 'linear-gradient(#63C4FF,#1B7FE0)',
    Scene: ContactApp,
  },
]

export function appIndex(id: AppId | null): number {
  return id === null ? -1 : APPS.findIndex((app) => app.id === id)
}
```

- [ ] **Step 5: Write `components/os/apps/ResumeApp.tsx`**

```tsx
import { PROFILE, RESUME, type ResumeEntry } from '@/content/profile'
import { OSButton } from '../OSButton'
import { OSWindow } from '../OSWindow'
import { INK, TYPE } from '../chrome'
import { Eyebrow } from '../parts'
import type { AppSceneProps } from '../registry'

function Section({ label, entries }: { label: string; entries: readonly ResumeEntry[] }) {
  return (
    <section className="mt-[28px]">
      <Eyebrow>{label}</Eyebrow>
      <ul className="mt-[10px] flex flex-col gap-[12px]">
        {entries.map((entry) => (
          <li key={entry.title}>
            <b className="block text-[16px] font-bold" style={{ color: INK.strong }}>{entry.title}</b>
            <span className={TYPE.body} style={{ color: INK.body }}>{entry.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The résumé, as a document window. An h2: the room owns the page's h1. */
export function ResumeApp({ onClose }: AppSceneProps) {
  return (
    <OSWindow title="Résumé" subtitle={RESUME.pdf ? 'PDF' : 'Draft'} onClose={onClose}>
      <div className="h-full overflow-y-auto p-[clamp(24px,2.6vw,42px)]">
        <h2 className={TYPE.heading} style={{ color: INK.strong }}>{PROFILE.name}</h2>
        <p className={`mt-[10px] ${TYPE.lead}`} style={{ color: INK.body }}>{PROFILE.tagline}</p>
        {RESUME.pdf && (
          <div className="mt-[18px]">
            <OSButton href={RESUME.pdf}>Download PDF</OSButton>
          </div>
        )}
        <Section label="Building" entries={RESUME.building} />
        <Section label="Education" entries={RESUME.education} />
      </div>
    </OSWindow>
  )
}
```

- [ ] **Step 6: Write `components/os/apps/ContactApp.tsx`**

```tsx
import { CONTACT } from '@/content/profile'
import { OSWindow } from '../OSWindow'
import { INK, TYPE } from '../chrome'
import type { AppSceneProps } from '../registry'

export function ContactApp({ onClose }: AppSceneProps) {
  return (
    <OSWindow title="Contact" onClose={onClose}>
      <div className="p-[clamp(24px,2.6vw,42px)]">
        <h2 className={TYPE.heading} style={{ color: INK.strong }}>Say hello.</h2>
        <ul className="mt-[22px] flex flex-col">
          {CONTACT.map((link) => {
            const external = link.href.startsWith('http')
            return (
              <li key={link.label} style={{ borderTop: '1px solid rgba(20,26,34,.10)' }}>
                <a
                  href={link.href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="flex items-baseline gap-[14px] py-[12px] hover:underline"
                >
                  <span className="w-[72px] flex-none text-[12.5px] font-bold text-[#9AA4B0]"
                        style={{ fontFamily: 'var(--font-ui)' }}>
                    {link.label}
                  </span>
                  <span className="text-[15px]" style={{ color: INK.strong, fontFamily: 'var(--font-ui)' }}>
                    {link.detail}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </OSWindow>
  )
}
```

- [ ] **Step 7: Run tests and typecheck**

Run: `npx vitest run components/os && npm run typecheck`
Expected: PASS (all tests so far, 5 new); typecheck clean.

- [ ] **Step 8: Commit**

```bash
git add content components/os/registry.tsx components/os/apps components/os/__tests__/apps.test.tsx
git commit -m "Add the Résumé and Contact apps with draft content

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Desktop chrome (dock, menu bar, Spotlight, desktop items)

**Files:**
- Copy then modify: `components/os/Dock.tsx`
- Create: `components/os/OSMenuBar.tsx`, `components/os/Spotlight.tsx`, `components/os/DesktopItems.tsx`
- Test: `components/os/__tests__/desktop.test.tsx`

**Interfaces:**
- Consumes: `AppDef`, `APPS` (Task 5); `AppId`, `pathFor` (Task 2); `GLASS` (Task 3); `PROFILE` (Task 5).
- Produces:
  - `Dock({ apps, active: number, pressed?, assembling?, onSelect(index), registerTile(index, el) })`; nav labelled **"Apps"**
  - `OSMenuBar({ appName: string, apps: readonly AppDef[], onOpenSpotlight?: () => void })`
  - `Spotlight({ open, onClose, onGoTo: (id: AppId) => void, apps })`; dialog labelled "Search"; Esc calls `preventDefault()` then `onClose`
  - `DesktopItems()` (no props)

- [ ] **Step 1: Copy the dock**

```bash
cp reference/ae-shell/components/os/Dock.tsx components/os/
```

In `components/os/Dock.tsx` change `aria-label="Sections"` to `aria-label="Apps"`.

- [ ] **Step 2: Write the failing test**

`components/os/__tests__/desktop.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { Dock } from '../Dock'
import { OSMenuBar } from '../OSMenuBar'
import { Spotlight } from '../Spotlight'
import { APPS } from '../registry'

describe('OSMenuBar', () => {
  it('names the frontmost app and links home and to every app', () => {
    render(<OSMenuBar appName="Résumé" apps={APPS} />)
    expect(screen.getByText('Résumé', { selector: 'b' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to the room' }).getAttribute('href')).toBe('/')
    const menu = screen.getByRole('navigation', { name: 'Menu' })
    expect(within(menu).getByRole('link', { name: 'Contact' }).getAttribute('href')).toBe('/work/contact')
  })
})

describe('Dock', () => {
  it('selects a tile by index and marks the open app', () => {
    const onSelect = vi.fn()
    render(<Dock apps={APPS} active={0} onSelect={onSelect} registerTile={() => {}} />)
    const dock = screen.getByRole('navigation', { name: 'Apps' })
    fireEvent.click(within(dock).getByRole('button', { name: 'Contact' }))
    expect(onSelect).toHaveBeenCalledWith(1)
    expect(within(dock).getByRole('button', { name: 'Résumé' }).getAttribute('aria-current')).toBe('true')
  })
})

describe('Spotlight', () => {
  it('renders nothing while closed', () => {
    render(<Spotlight open={false} onClose={() => {}} onGoTo={() => {}} apps={APPS} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('filters by name and opens the chosen app on Enter', () => {
    const onClose = vi.fn()
    const onGoTo = vi.fn()
    render(<Spotlight open onClose={onClose} onGoTo={onGoTo} apps={APPS} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'con' } })
    expect(screen.queryByRole('button', { name: /Résumé/ })).toBeNull()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onClose).toHaveBeenCalled()
    expect(onGoTo).toHaveBeenCalledWith('contact')
  })

  it('matches without accents', () => {
    render(<Spotlight open onClose={() => {}} onGoTo={() => {}} apps={APPS} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'resume' } })
    expect(screen.getByRole('button', { name: /Résumé/ })).toBeTruthy()
  })

  it('closes on Escape and marks the key handled', () => {
    const onClose = vi.fn()
    render(<Spotlight open onClose={onClose} onGoTo={() => {}} apps={APPS} />)
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    screen.getByRole('textbox').dispatchEvent(event)
    expect(onClose).toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })
})
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `npx vitest run components/os/__tests__/desktop.test.tsx`
Expected: FAIL, cannot resolve `../OSMenuBar`.

- [ ] **Step 4: Write `components/os/OSMenuBar.tsx`**

```tsx
'use client'
import Link from 'next/link'
import { PROFILE } from '@/content/profile'
import { GLASS } from './chrome'
import type { AppDef } from './registry'
import { pathFor } from './view'

/** The frontmost-app swap: a short fade, keyed on the name so it replays once
 *  per change. A keyframe cannot be a Tailwind utility, hence the stylesheet. */
const SWAP_CSS = `
@keyframes ax-menu-swap {
  from { opacity: 0; transform: translateY(-3px); }
  to   { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .ax-menu-swap { animation: none !important; }
}
`

/**
 * The laptop's menu bar. The mark and name at the left go back to the room;
 * the menu titles are real links to each app, so the bar is navigation in the
 * position a Mac user already looks for it.
 */
export function OSMenuBar({
  appName, apps, onOpenSpotlight,
}: {
  /** The frontmost app, or "Finder" when no window is open. Announced politely. */
  appName: string
  apps: readonly AppDef[]
  onOpenSpotlight?: () => void
}) {
  return (
    <div
      className="absolute inset-x-0 top-0 z-[70] flex h-[30px] items-stretch text-[13.5px] text-white/95"
      style={{
        ...GLASS,
        background: 'rgba(18,12,32,.46)',
        borderBottom: '1px solid rgba(255,255,255,.14)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <style>{SWAP_CSS}</style>

      <div className="flex min-w-0 flex-1 items-stretch gap-[1px] overflow-hidden px-[10px]">
        <Link
          href={pathFor({ zoomed: false, app: null })}
          scroll={false}
          aria-label="Back to the room"
          className="flex flex-none items-center gap-[7px] rounded-[4px] px-[7px] hover:bg-white/15"
        >
          <span
            aria-hidden
            className="h-[14px] w-[14px] rounded-[3px]"
            style={{
              background: 'linear-gradient(#FFD36E,#E0802C)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.75), 0 1px 2px rgba(0,0,0,.35)',
            }}
          />
          <span className="whitespace-nowrap">{PROFILE.name}</span>
        </Link>

        <b
          key={appName}
          aria-live="polite"
          className="ax-menu-swap flex flex-none items-center whitespace-nowrap px-[9px] font-black tracking-[.005em]"
          style={{ animation: 'ax-menu-swap .26s ease-out both' }}
        >
          {appName}
        </b>

        <nav aria-label="Menu" className="hidden min-w-0 items-stretch gap-[1px] md:flex">
          {apps.map((app) => (
            <Link
              key={app.id}
              href={pathFor({ zoomed: true, app: app.id })}
              scroll={false}
              className="flex flex-none items-center whitespace-nowrap rounded-[4px] px-[10px] text-white/80 hover:bg-white/15 hover:text-white"
            >
              {app.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-none items-stretch gap-[2px] pr-[10px]">
        {onOpenSpotlight && (
          <button
            type="button"
            onClick={onOpenSpotlight}
            aria-label="Search"
            title="Search — ⌘K"
            className="flex flex-none items-center rounded-[4px] px-[8px] text-white/85 hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
          >
            <svg viewBox="0 0 16 16" className="h-[15px] w-[15px]" fill="none"
                 stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="7" cy="7" r="4.4" />
              <path d="M10.4 10.4 14 14" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write `components/os/Spotlight.tsx`**

```tsx
'use client'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { AppDef } from './registry'
import type { AppId } from './view'

/** Case- and accent-insensitive, so "resume" finds "Résumé". */
function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * Spotlight, on ⌘K: find an app on the laptop by name. Adapted from the AE
 * shell, where it also listed the site's other pages; here every page is an app.
 *
 * Escape is handled here and marked handled (`preventDefault`), so the OS's own
 * Escape (which steps out of the laptop) knows to leave it alone.
 */
export function Spotlight({
  open, onClose, onGoTo, apps,
}: {
  open: boolean
  onClose: () => void
  onGoTo: (id: AppId) => void
  apps: readonly AppDef[]
}) {
  // Mounted rather than hidden, so the query and selection start empty every time.
  return open ? <Panel onClose={onClose} onGoTo={onGoTo} apps={apps} /> : null
}

function Panel({
  onClose, onGoTo, apps,
}: {
  onClose: () => void
  onGoTo: (id: AppId) => void
  apps: readonly AppDef[]
}) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  const items = useMemo(() => {
    const q = fold(query.trim())
    return q ? apps.filter((app) => fold(app.name).includes(q)) : apps
  }, [query, apps])

  useEffect(() => {
    const restore = document.activeElement as HTMLElement | null
    input.current?.focus()
    return () => { restore?.focus?.() }
  }, [])

  const choose = (app: AppDef) => {
    onClose()
    onGoTo(app.id)
  }

  const move = (delta: number) => {
    if (items.length === 0) return
    setCursor((c) => (c + delta + items.length) % items.length)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
    if (event.key === 'ArrowDown') { event.preventDefault(); move(1); return }
    if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); return }
    if (event.key === 'Tab') { event.preventDefault(); move(event.shiftKey ? -1 : 1); return }
    if (event.key === 'Enter') {
      event.preventDefault()
      const app = items[cursor]
      if (app) choose(app)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ background: 'rgba(10,6,24,.32)' }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onKeyDown={onKeyDown}
        className="relative mt-[16vh] w-[min(620px,calc(100vw-48px))] overflow-hidden rounded-[14px]"
        style={{
          background: 'rgba(40,34,54,.66)',
          backdropFilter: 'blur(34px) saturate(180%)',
          WebkitBackdropFilter: 'blur(34px) saturate(180%)',
          border: '1px solid rgba(255,255,255,.22)',
          boxShadow: [
            'inset 0 1px 0 rgba(255,255,255,.28)',
            '0 4px 10px rgba(6,8,24,.34)',
            '0 44px 90px -22px rgba(4,6,20,.78)',
          ].join(','),
          fontFamily: 'var(--font-ui)',
        }}
      >
        <div
          className="flex items-center gap-[12px] px-[18px] py-[14px]"
          style={{ borderBottom: items.length ? '1px solid rgba(255,255,255,.14)' : 'none' }}
        >
          <svg viewBox="0 0 16 16" className="h-[19px] w-[19px] flex-none text-white/70" fill="none"
               stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="7" cy="7" r="4.4" />
            <path d="M10.4 10.4 14 14" />
          </svg>
          <input
            ref={input}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setCursor(0) }}
            placeholder="Search the laptop"
            aria-label="Search the laptop"
            className="min-w-0 flex-1 bg-transparent text-[19px] text-white outline-none placeholder:text-white/45"
          />
          <kbd className="flex-none rounded-[5px] px-[7px] py-[3px] text-[11px] font-bold text-white/60"
               style={{ background: 'rgba(255,255,255,.12)' }}>
            esc
          </kbd>
        </div>

        {items.length > 0 ? (
          <ul className="max-h-[52vh] overflow-y-auto py-[6px]">
            {items.map((app, i) => {
              const on = i === cursor
              return (
                <li key={app.id} onMouseEnter={() => setCursor(i)}>
                  <button
                    type="button"
                    onClick={() => choose(app)}
                    tabIndex={-1}
                    className={`flex w-full items-center gap-3 px-[18px] py-[8px] text-left text-[14px] ${on ? 'text-white' : 'text-white/75'}`}
                    style={{ background: on ? 'rgba(120,110,220,.55)' : 'transparent' }}
                  >
                    <span className="truncate">{app.name}</span>
                    <span className={`ml-auto flex-none text-[11.5px] ${on ? 'text-white/70' : 'text-white/45'}`}>
                      App
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="px-[18px] pb-[16px] pt-[2px] text-[13.5px] text-white/55">
            Nothing here matches that.
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Write `components/os/DesktopItems.tsx`**

```tsx
/**
 * What is on the desktop: a disk, a folder and a file, so the stage reads as
 * somebody's computer. Scenery only. Nothing here is interactive, and it sits
 * behind every window (z-10 against their 20 and 30).
 */

interface Item {
  name: string
  kind: 'disk' | 'folder' | 'doc'
}

const ITEMS: readonly Item[] = [
  { name: 'Macintosh HD', kind: 'disk' },
  { name: 'Projects', kind: 'folder' },
  { name: 'notes.txt', kind: 'doc' },
]

function Glyph({ kind }: { kind: Item['kind'] }) {
  if (kind === 'disk') {
    return (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="desk-disk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E9EEF5" />
            <stop offset="100%" stopColor="#A9B4C2" />
          </linearGradient>
        </defs>
        <rect x="6" y="12" width="36" height="24" rx="4" fill="url(#desk-disk)"
              stroke="rgba(20,26,34,.35)" strokeWidth="1" />
        <rect x="6" y="12" width="36" height="9" rx="4" fill="rgba(255,255,255,.55)" />
        <circle cx="24" cy="27" r="4.4" fill="#8E99A8" />
        <circle cx="24" cy="27" r="1.5" fill="#E9EEF5" />
      </svg>
    )
  }
  if (kind === 'folder') {
    return (
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="desk-folder" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8FD0F5" />
            <stop offset="100%" stopColor="#3D9BDE" />
          </linearGradient>
        </defs>
        <path d="M5 14a3 3 0 0 1 3-3h10.5l3.4 3.6H40a3 3 0 0 1 3 3V37a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z"
              fill="url(#desk-folder)" stroke="rgba(12,50,90,.35)" strokeWidth="1" />
        <path d="M5 19h38v3H5Z" fill="rgba(255,255,255,.35)" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      <path d="M11 7h18l8 8v26a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
            fill="#FBFCFE" stroke="rgba(20,26,34,.32)" strokeWidth="1" />
      <path d="M29 7l8 8h-8Z" fill="#D8DFE8" />
      {[19, 24, 29, 34].map((y, i) => (
        <rect key={y} x="14" y={y} width={i === 3 ? 12 : 20} height="2.4" rx="1.2"
              fill={i === 0 ? '#2E7FE0' : 'rgba(20,26,34,.22)'} />
      ))}
    </svg>
  )
}

export function DesktopItems() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <div className="absolute right-[22px] top-[46px] flex flex-col items-center gap-[16px]">
        {ITEMS.map((item) => (
          <span key={item.name} className="flex w-[92px] flex-col items-center gap-[5px]">
            <span className="block h-[46px] w-[46px]" style={{ filter: 'drop-shadow(0 3px 5px rgba(6,8,24,.45))' }}>
              <Glyph kind={item.kind} />
            </span>
            <span
              className="max-w-full truncate rounded-[4px] px-[5px] py-[1px] text-[11px] font-bold text-white"
              style={{ fontFamily: 'var(--font-ui)', textShadow: '0 1px 2px rgba(0,0,0,.75)' }}
            >
              {item.name}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Run tests and typecheck**

Run: `npx vitest run components/os && npm run typecheck`
Expected: PASS (6 new tests); typecheck clean.

- [ ] **Step 8: Commit**

```bash
git add components/os/Dock.tsx components/os/OSMenuBar.tsx components/os/Spotlight.tsx components/os/DesktopItems.tsx components/os/__tests__/desktop.test.tsx
git commit -m "Rebuild the desktop chrome for a single account

The menu bar links home and to each app; Spotlight finds apps by name,
ignoring accents.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: The root: room, laptop and routes

**Files:**
- Create: `components/os/OS.tsx`, `components/os/RoomChrome.tsx`, `components/os/Stacked.tsx`, `app/work/page.tsx`, `app/work/[app]/page.tsx`
- Modify: `app/layout.tsx` (mount `<OS />`, description), `app/page.tsx` (return null)
- Test: `components/os/__tests__/OS.test.tsx`

**Interfaces:**
- Consumes: everything above. `useZoom`, `Laptop`, `SCENE_SRC`, `isDownwardWheel` (Task 4); `APPS`, `appIndex` (Task 5); `Dock`, `OSMenuBar`, `Spotlight`, `DesktopItems` (Task 6); `viewFromPath`, `pathFor`, `ROOM`, `DESKTOP`, `isAppId` (Task 2); `LaunchedWindow`, `Wallpaper`, `useReducedMotion`, `useIsoLayoutEffect` (Task 3).
- Produces: `OS()` (no props; reads `usePathname`, calls `useRouter().push(path, { scroll: false })`); `RoomChrome({ zoom, hidden, onOpenLaptop })`; `Stacked()`.

**Why the root layout:** `OS` must survive navigation between `/`, `/work` and `/work/[app]` to animate between them. A component in a page remounts when the page changes; one in the root layout does not. The pages exist so those URLs are real, statically generated routes (and 404 otherwise) with their own titles; they render nothing.

- [ ] **Step 1: Write the failing test**

`components/os/__tests__/OS.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { PROFILE } from '@/content/profile'

const nav = vi.hoisted(() => {
  const push = vi.fn()
  return { pathname: '/', push, router: { push, back: () => {}, replace: () => {}, prefetch: () => {} } }
})

vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => nav.router,
}))

import { OS } from '../OS'

function at(pathname: string) {
  nav.pathname = pathname
}

const PUSH_OPTS = { scroll: false }

beforeEach(() => {
  nav.push.mockClear()
  at('/')
})

afterEach(() => { vi.unstubAllGlobals() })

describe('the room', () => {
  it('introduces him and puts the Résumé one click away', () => {
    render(<OS />)
    expect(screen.getByRole('heading', { level: 1, name: PROFILE.name })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Résumé' }).getAttribute('href')).toBe('/work/resume')
  })

  it('opens the laptop on click', () => {
    render(<OS />)
    fireEvent.click(screen.getByRole('button', { name: 'Open the laptop' }))
    expect(nav.push).toHaveBeenCalledWith('/work', PUSH_OPTS)
  })

  it('a burst of wheel events navigates once', () => {
    render(<OS />)
    for (let i = 0; i < 5; i += 1) fireEvent.wheel(window, { deltaY: 40 })
    expect(nav.push).toHaveBeenCalledTimes(1)
    expect(nav.push).toHaveBeenCalledWith('/work', PUSH_OPTS)
  })

  it('ignores an upward wheel and Esc', () => {
    render(<OS />)
    fireEvent.wheel(window, { deltaY: -40 })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(nav.push).not.toHaveBeenCalled()
  })

  it('falls back to the room on an unknown path', () => {
    at('/work/nope')
    render(<OS />)
    expect(screen.getByRole('button', { name: 'Open the laptop' })).toBeTruthy()
  })
})

describe('the laptop', () => {
  it('opens an app from the dock', () => {
    at('/work')
    render(<OS />)
    const dock = screen.getByRole('navigation', { name: 'Apps' })
    fireEvent.click(within(dock).getByRole('button', { name: 'Contact' }))
    expect(nav.push).toHaveBeenCalledWith('/work/contact', PUSH_OPTS)
  })

  it('shows only the open app, and closes it with its red light', () => {
    at('/work/resume')
    render(<OS />)
    const close = screen.getAllByRole('button', { name: 'Close window' })
    expect(close).toHaveLength(1)
    fireEvent.click(close[0])
    expect(nav.push).toHaveBeenCalledWith('/work', PUSH_OPTS)
  })

  it('steps out one level per Esc', () => {
    at('/work/resume')
    const { unmount } = render(<OS />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(nav.push).toHaveBeenLastCalledWith('/work', PUSH_OPTS)
    unmount()

    at('/work')
    render(<OS />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(nav.push).toHaveBeenLastCalledWith('/', PUSH_OPTS)
  })

  it('Esc in Spotlight closes only Spotlight', () => {
    at('/work')
    render(<OS />)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    const search = screen.getByRole('dialog', { name: 'Search' })
    fireEvent.keyDown(within(search).getByRole('textbox'), { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Search' })).toBeNull()
    expect(nav.push).not.toHaveBeenCalled()
  })
})

describe('small viewports', () => {
  it('stack the apps under the room, with one h1 and no dock', () => {
    vi.stubGlobal('innerWidth', 375)
    vi.stubGlobal('innerHeight', 740)
    render(<OS />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText('University of Southern California')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Say hello.' })).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Apps' })).toBeNull()
  })
})

describe('server-rendered HTML', () => {
  it('puts the name and the Résumé link in the room', () => {
    at('/')
    const html = renderToString(<OS />)
    expect(html).toContain(PROFILE.name)
    expect(html).toContain('href="/work/resume"')
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })

  it('puts the résumé text in /work/resume', () => {
    at('/work/resume')
    const html = renderToString(<OS />)
    expect(html).toContain('University of Southern California')
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run components/os/__tests__/OS.test.tsx`
Expected: FAIL, cannot resolve `../OS`.

- [ ] **Step 3: Write `components/os/RoomChrome.tsx`**

```tsx
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { PROFILE } from '@/content/profile'
import { TYPE } from './chrome'
import type { Zoom } from './intro/useZoom'
import { pathFor } from './view'

const INK = '#241B12'
const PAPER = 'rgba(246,239,227,.9)'

/**
 * What sits over the room: the page's h1, the way in, and the Résumé link the
 * spec requires on screen from the first frame. Phase 3 moves the intro onto
 * the whiteboard and adds the hotbar; until then this is the room's copy.
 *
 * The laptop itself is a click target too, laid exactly over the drawn screen.
 * It is hidden from assistive tech because the "Open the laptop" button is the
 * same action with a name.
 */
export function RoomChrome({
  zoom, hidden, onOpenLaptop,
}: { zoom: Zoom; hidden: boolean; onOpenLaptop: () => void }) {
  return (
    <motion.div
      aria-hidden={hidden}
      inert={hidden}
      className="pointer-events-none absolute inset-0 z-[80]"
      style={{ opacity: zoom.roomUi }}
    >
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-6 p-[clamp(16px,3vw,40px)]">
        <div className="pointer-events-auto max-w-[38ch] rounded-[10px] px-[16px] py-[12px]"
             style={{ background: PAPER, color: INK }}>
          <h1 className={TYPE.pixelLabel} style={{ fontFamily: 'var(--font-pixel)' }}>{PROFILE.name}</h1>
          <p className="mt-[6px] text-[14px] leading-[1.45]" style={{ fontFamily: 'var(--font-ui)' }}>
            {PROFILE.tagline}
          </p>
          <button
            type="button"
            onClick={onOpenLaptop}
            className={`mt-[10px] ${TYPE.pixelLabel} underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0802C]`}
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            Open the laptop
          </button>
        </div>

        <Link
          href={pathFor({ zoomed: true, app: 'resume' })}
          scroll={false}
          className={`pointer-events-auto rounded-[10px] px-[16px] py-[10px] ${TYPE.pixelLabel} hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0802C]`}
          style={{ background: PAPER, color: INK, fontFamily: 'var(--font-pixel)' }}
        >
          Résumé
        </Link>
      </div>

      {zoom.hit && (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          title="Open the laptop"
          onClick={onOpenLaptop}
          className="pointer-events-auto absolute cursor-pointer rounded-[3px] outline-2 outline-offset-4 outline-[#FFD36E] hover:outline"
          style={{ left: zoom.hit.x, top: zoom.hit.y, width: zoom.hit.w, height: zoom.hit.h }}
        />
      )}
    </motion.div>
  )
}
```

- [ ] **Step 4: Write `components/os/Stacked.tsx`**

```tsx
'use client'
import Image from 'next/image'
import { PROFILE } from '@/content/profile'
import { TYPE } from './chrome'
import { SCENE_SRC } from './intro/Laptop'
import { APPS } from './registry'
import { Wallpaper } from './Wallpaper'

/**
 * The fallback for viewports too small for the desktop: the room as a picture,
 * then every app's window in document order. Nothing is hidden behind a click.
 * Phase 5 replaces this with the real phone layout (a drag-to-pan room).
 */
export function Stacked() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0"><Wallpaper /></div>
      <div className="relative mx-auto flex w-full max-w-[880px] flex-col gap-[28px] px-[16px] pb-[60px] pt-[16px]">
        <header className="overflow-hidden rounded-[14px]" style={{ background: '#F6EFE3', color: '#241B12' }}>
          <div className="relative aspect-[1376/768] w-full">
            <Image
              src={SCENE_SRC}
              alt="Rayyan's room, drawn in pixel art: a desk with a laptop, shelves and a window"
              fill
              priority
              sizes="(max-width: 880px) 100vw, 880px"
              style={{ objectFit: 'cover', imageRendering: 'pixelated' }}
            />
          </div>
          <div className="p-[18px]">
            <h1 className={TYPE.pixelLabel} style={{ fontFamily: 'var(--font-pixel)' }}>{PROFILE.name}</h1>
            <p className="mt-[6px] text-[15px] leading-[1.45]" style={{ fontFamily: 'var(--font-ui)' }}>
              {PROFILE.tagline}
            </p>
          </div>
        </header>
        {APPS.map((app) => (
          <section key={app.id} id={app.id} aria-label={app.name}>
            <app.Scene />
          </section>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write `components/os/OS.tsx`**

```tsx
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
  const openSpotlight = useCallback(() => setSpotlightAt(pathname), [pathname])
  const closeSpotlight = useCallback(() => setSpotlightAt(null), [])

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
  }, [])

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
```

- [ ] **Step 6: Run the OS test**

Run: `npx vitest run components/os/__tests__/OS.test.tsx`
Expected: PASS, 12 tests.

- [ ] **Step 7: Mount it and add the routes**

`app/layout.tsx`: add the imports

```tsx
import { OS } from '@/components/os/OS'
import { PROFILE } from '@/content/profile'
```

change `metadata` to

```tsx
export const metadata: Metadata = {
  title: { default: PROFILE.name, template: `%s · ${PROFILE.name}` },
  description: PROFILE.tagline,
}
```

and the body to

```tsx
      {/* The room and the laptop live here, not in a page, so they survive
          navigation between /, /work and /work/[app] and can animate between
          them. The pages only make those URLs real and give them titles. */}
      <body>
        <OS />
        {children}
      </body>
```

`app/page.tsx`:

```tsx
/** The room. Rendered by <OS /> in the root layout; see app/layout.tsx. */
export default function Home() {
  return null
}
```

`app/work/page.tsx`:

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Work' }

/** The laptop's desktop. Rendered by <OS /> in the root layout. */
export default function Work() {
  return null
}
```

`app/work/[app]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { APPS } from '@/components/os/registry'
import { isAppId } from '@/components/os/view'

/** Only the registry's apps exist; anything else under /work is a 404. */
export const dynamicParams = false

export function generateStaticParams() {
  return APPS.map((app) => ({ app: app.id }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ app: string }> },
): Promise<Metadata> {
  const { app } = await params
  return { title: APPS.find((def) => def.id === app)?.name }
}

/** One app's window, open on the desktop. Rendered by <OS /> in the root layout. */
export default async function AppWindow({ params }: { params: Promise<{ app: string }> }) {
  const { app } = await params
  if (!isAppId(app)) notFound()
  return null
}
```

- [ ] **Step 8: Full verification**

Run: `npm test && npm run typecheck && npm run lint && npm run build`
Expected: all tests pass; typecheck and lint clean (a `@next/next/no-img-element` warning on Laptop's `motion.img` is expected and fine); the build lists `/`, `/work`, `/work/resume`, `/work/contact` as static (○ or ●).

- [ ] **Step 9: Commit**

```bash
git add components/os app
git commit -m "Mount the room and laptop and route them by URL

/ is the room, /work the desktop, /work/resume and /work/contact the apps.
Esc steps out a level, the back button works, and each URL server-renders
its own content.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Click-through, then the preview URL

**Files:** none changed unless the click-through finds a bug (fix it with a failing test first, in the task that owns the code).

- [ ] **Step 1: Click through in a real browser**

Run `npm run dev` in the background, then with the Playwright browser tools at 1440×900:

1. Load `/`. Screenshot. Expect: the room, the name card top-left, **Résumé** top-right, the ambient video playing.
2. Hover the laptop screen: yellow outline. Click it. Expect: the camera flies into the screen in about a second, the URL becomes `/work`, the dock and menu bar appear. Screenshot.
3. Click the Résumé dock tile. Expect: the window springs out of its tile, the URL is `/work/resume`, the menu bar reads "Résumé". Screenshot.
4. Press Esc → `/work`, window gone. Press Esc → `/`, camera flies back out.
5. Press browser Back twice → `/work/resume` again, window open.
6. Load `/work/contact` directly. Expect: no zoom animation, Contact window already open.
7. On `/work`, press Ctrl-K, type `resume`, Enter → `/work/resume`.
8. From `/`, click **Résumé** in the corner → zoom, then the Résumé window opens on landing.
9. Emulate `prefers-reduced-motion: reduce`, reload `/`, click the laptop: a cut, not a flight.
10. Resize to 390×844, reload `/`. Expect the stacked page: room picture, name, Résumé and Contact windows. Screenshot.
11. Load `/work/nope`: the 404 page (the room renders behind it; that is expected until there is a custom 404).
12. Check the console for errors and hydration warnings on each of `/`, `/work`, `/work/resume`.

Stop the dev server.

- [ ] **Step 2: Ask Rayyan before anything goes outside this machine**

Show him the screenshots and ask him to confirm:
- the draft copy and contact links in `content/profile.ts` (the email and GitHub URL are guesses from his git identity);
- that he wants a **private** GitHub repo created and a Vercel project linked to it (both are outward-facing);
- the typography check with Landon from spec §5 (`TYPE.pixelLabel` came from that system) can wait until before launch.

- [ ] **Step 3: Deploy a preview (only after Step 2's yes)**

```bash
gh repo create rayyandarugar-com --private --source . --push
npx vercel link
npx vercel deploy
```

Expected: a `*.vercel.app` preview URL. Load `/`, `/work/resume` and `/work/contact` on it, then give Rayyan the URL to click through on desktop and his phone (spec §8).

- [ ] **Step 4: Commit any fixes from the click-through**

Each fix gets its own commit with a test, as above. Phase 1 is done when Rayyan has clicked through the preview URL.
