# Phase 3 (Room Engine) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the room interactive. It draws from the layered art, pans with the cursor, lights objects on hover, has a Minecraft-style hotbar, introduces Rayyan on the whiteboard, and opens game cards at their own URLs over the room.

**Architecture:** The room is drawn from `public/room/base.png` plus one sprite per object (phase 2). It is laid out at 110.9% of the viewport width, above a band reserved for the hotbar, and panned by a motion value that the laptop zoom folds in so the flight still lands exactly. Hover and click use a quarter-scale hit map, a PNG where each pixel holds the topmost object's index, so irregular shapes and overlaps resolve exactly. Cards are real routes (`/cards/[id]`) whose pages render a server-side overlay over the room, which stays mounted in the root layout.

**Tech Stack:** Next.js 16.2.12 App Router, React 19, framer-motion 12, Tailwind 4, Vitest + Testing Library, sharp (art scripts), gray-matter (new: card frontmatter).

**Spec:** `docs/superpowers/specs/2026-10-06-personal-website-design.md`, §3 (the room), §4 (game cards row), §5 (units), §7 phase 3. Art produced in phase 2 is described in `docs/mockups/masters/README.md` and `docs/mockups/ui/README.md`.

## Global Constraints

- Room canvas ≈ **110.9%** of the viewport width; cursor X pans it linearly between its two edges; on mouse leave it returns to rest (spec §2, §3).
- Hotbar: **9 slots**: work (laptop), journal, music, books, travel, building (whiteboard), schools, surf, photos. Hover lights the matching object(s); click acts exactly like clicking the object; number keys 1–9 select slots (spec §3).
- A fixed **Résumé** link is on screen from the first frame and in the server HTML of `/` (spec §1, §3).
- Every overlay has its own URL, closes with Esc, a click outside it, or the back button, and is **server-rendered** (spec §4).
- Game cards: one trading-card frame for all; photo, name, type tag, short story, optional stat; the flags open a swipeable set of three (spec §4).
- Reduced motion: no pan easing, no camera zoom, overlays fade instead of flying (spec §3).
- All text and data live in `content/`; adding a card is adding a file (spec §5).
- Pixel art renders with `image-rendering: pixelated`.
- Nothing imports from `reference/`.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Deliberate scope choices

- **Bespoke interactions are phase 4.** In phase 3 the record player, bookshelf, journal, globe and window open a game card that says what is coming. Phase 4 changes their `action` in `content/room.ts` to their overlay route. No throwaway components.
- **Sunset only.** Day/night switching belongs to the window interaction (phase 4). The sprites and art already exist for it.
- **Phones keep the stacked fallback** (< 1000×680). The drag-to-pan phone room is phase 5.
- **The room is laid out above a hotbar band.** The art is 21:9, wider than the spec's assumed ~16:9. Keeping the spec's 110.9% width therefore leaves bands above and below. They are filled with a blurred, darkened copy of the room, and the hotbar sits in the bottom band. On viewports where that would make the room taller than the space allows, the room is height-limited instead and pans further.
- **Card copy is draft.** It is written from the résumé and the spec, and Rayyan replaces it. Card photos are the object sprites until he sends real photos.

## Review Focus

1. **Pan never shows past the room's edges** at any pointer position or viewport, including a pointer beyond the window edge. (Task 1, test "never shows past either edge")
2. **Overlapping objects** (the laptop lid stands in front of the whiteboard): hover and click must pick the front one. (Task 3, test "the laptop lid wins over the whiteboard behind it")
3. **Number keys with a modifier** (⌘1 switches browser tabs) or while typing must not trigger hotbar slots. (Task 9, test "number keys with a modifier are left to the browser")
4. **Hotbar keys and the wheel while not in the room** (laptop open, card open, mid-zoom) must do nothing. (Task 9, tests "a card over the room keeps the room still" and "hotbar keys do nothing on the desktop")
5. **The ends of the flags' card set**: the first card has no "previous" and the last no "next"; arrow keys at the ends do nothing. (Task 4, test "has no neighbour past either end"; Task 8, test "shows only the neighbours that exist")

---

## File Structure

```
components/room/layout.ts        Task 1  room rect, pan and pointer→art maths (pure)
components/os/intro/geometry.ts  Task 2  zoom starts from the room rect, not a cover image
components/os/intro/useZoom.ts   Task 2  takes the pan; exposes rest + roomX
components/os/intro/Laptop.tsx   Task 2  draws a `room` node instead of one picture
scripts/art/cut-room.mjs         Task 3  also writes public/room/hitmap.png
components/room/hitmap.ts        Task 3  hit lookup + browser loader
content/cards/*.md, content/cards.ts   Task 4  game-card content + loader
content/room.ts                  Task 5  room manifest: objects, labels, actions, hotbar
components/os/view.ts            Task 5  isRoomOverlay, cardPath
components/room/RoomScene.tsx    Task 6  layered render, hit testing, glow, tooltip, object buttons
components/room/WhiteboardIntro.tsx    Task 6  the h1, in marker, on the board
app/layout.tsx, app/globals.css  Task 6  marker font, glow style
components/room/Hotbar.tsx       Task 7
components/room/RoomBar.tsx      Task 7  the Résumé link
components/room/RoomBackdrop.tsx Task 7  blurred room behind the bands
components/overlays/Overlay.tsx  Task 8  modal shell: Esc, click-outside, focus trap
components/overlays/GameCard.tsx Task 8
app/cards/[id]/page.tsx          Task 8
components/os/OS.tsx             Task 9  wires it all; RoomChrome.tsx deleted
```

---

### Task 1: Room layout and pan maths

**Files:**
- Create: `components/room/layout.ts`
- Test: `components/room/__tests__/layout.test.ts`

**Interfaces:**
- Consumes: `SCENE_ASPECT`, `SCENE_PX_W`, `SCENE_PX_H`, `type Rect` from `components/os/intro/geometry.ts` (existing).
- Produces:
  - `OVERSCAN = 1.109`, `HOTBAR_BAND = 112`
  - `roomRect(vw: number, vh: number): Rect`, the room at rest, unpanned, in viewport px
  - `panRange(rest: Rect, vw: number): number`, the largest pan offset either way (≥ 0)
  - `panFor(pointerX: number, vw: number, rest: Rect): number`, the pan offset in px (positive moves the room right)
  - `toArt(clientX: number, clientY: number, box: { left: number; top: number; width: number; height: number }): { u: number; v: number } | null`, a viewport point → art pixel, `null` outside
  - `restCss(): { left: string; top: string; width: string; height: string }`, the same rest rect in CSS for the server render

- [ ] **Step 1: Write the failing test**

`components/room/__tests__/layout.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { SCENE_ASPECT, SCENE_PX_H, SCENE_PX_W } from '@/components/os/intro/geometry'
import { HOTBAR_BAND, OVERSCAN, panFor, panRange, restCss, roomRect, toArt } from '../layout'

describe('roomRect', () => {
  it('is 110.9% of the viewport wide, centred, above the hotbar band', () => {
    const r = roomRect(1440, 900)
    expect(r.w).toBeCloseTo(1440 * OVERSCAN, 6)
    expect(r.w / r.h).toBeCloseTo(SCENE_ASPECT, 6)
    expect(r.x).toBeCloseTo((1440 - r.w) / 2, 6)
    expect(r.y).toBeGreaterThanOrEqual(0)
    expect(r.y + r.h).toBeLessThanOrEqual(900 - HOTBAR_BAND + 1e-6)
  })

  it('is limited by height on short viewports, and then centred', () => {
    const r = roomRect(1440, 700)
    expect(r.h).toBeCloseTo(700 - HOTBAR_BAND, 6)
    expect(r.w / r.h).toBeCloseTo(SCENE_ASPECT, 6)
    expect(r.x).toBeCloseTo((1440 - r.w) / 2, 6)
  })
})

describe('panFor', () => {
  const vw = 1440
  const rest = roomRect(vw, 900)

  it('rests at the centre and reaches each edge at each side', () => {
    expect(panFor(vw / 2, vw, rest)).toBeCloseTo(0, 6)
    expect(rest.x + panFor(0, vw, rest)).toBeCloseTo(0, 6) // left edge at the viewport's left
    expect(rest.x + rest.w + panFor(vw, vw, rest)).toBeCloseTo(vw, 6) // right edge at its right
  })

  it('never shows past either edge', () => {
    for (const x of [-500, -1, 0, 300, 720, 1439, 1440, 5000]) {
      const left = rest.x + panFor(x, vw, rest)
      expect(left).toBeLessThanOrEqual(1e-6)
      expect(left + rest.w).toBeGreaterThanOrEqual(vw - 1e-6)
    }
  })

  it('does not pan a room narrower than the viewport', () => {
    const narrow = roomRect(1440, 600)
    expect(panRange(narrow, 1440)).toBe(0)
    expect(panFor(0, 1440, narrow)).toBe(0)
  })
})

describe('toArt', () => {
  const box = { left: -80, top: 50, width: 1600, height: 1600 / SCENE_ASPECT }

  it('maps the box onto the art, corner to corner', () => {
    expect(toArt(-80, 50, box)).toEqual({ u: 0, v: 0 })
    const mid = toArt(-80 + 800, 50 + box.height / 2, box)!
    expect(mid.u).toBeCloseTo(SCENE_PX_W / 2, 6)
    expect(mid.v).toBeCloseTo(SCENE_PX_H / 2, 6)
  })

  it('is null outside the room', () => {
    expect(toArt(-81, 60, box)).toBeNull()
    expect(toArt(100, 49, box)).toBeNull()
    expect(toArt(100, 50 + box.height + 1, box)).toBeNull()
  })
})

describe('restCss', () => {
  it('states the same rule in CSS, from the same constants', () => {
    const css = restCss()
    expect(css.height).toContain('110.90vw')
    expect(css.height).toContain(`${HOTBAR_BAND}px`)
    expect(css.width).toContain(String(SCENE_ASPECT))
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run components/room/__tests__/layout.test.ts`
Expected: FAIL, cannot resolve `../layout`.

- [ ] **Step 3: Write `components/room/layout.ts`**

```ts
import { SCENE_ASPECT, SCENE_PX_H, SCENE_PX_W, type Rect } from '@/components/os/intro/geometry'

/**
 * Where the room sits, and how it pans. Pure: every number here is a
 * function of the viewport and the pointer.
 *
 * Spec §2: the canvas is ≈110.9% of the viewport width, so everything is
 * visible at rest and the cursor pans only the edge slivers into view. The
 * art is 21:9, so at that width it is shorter than most viewports. It sits
 * centred above a band kept for the hotbar, and the bands around it are
 * filled by `RoomBackdrop`. When the viewport is too short for that, the room
 * is limited by height instead (and pans further, or not at all).
 */

export const OVERSCAN = 1.109
/** Px kept clear at the bottom for the hotbar. */
export const HOTBAR_BAND = 112

export function roomRect(vw: number, vh: number): Rect {
  const avail = Math.max(0, vh - HOTBAR_BAND)
  let w = vw * OVERSCAN
  let h = w / SCENE_ASPECT
  if (h > avail) {
    h = avail
    w = h * SCENE_ASPECT
  }
  return { x: (vw - w) / 2, y: (avail - h) / 2, w, h }
}

/** How far the room may move either way from rest without showing past an edge. */
export function panRange(rest: Rect, vw: number): number {
  return Math.max(0, (rest.w - vw) / 2)
}

/** The pan offset for a pointer at `pointerX`: the left of the viewport shows
 *  the room's left edge, the right shows its right edge, linear between. */
export function panFor(pointerX: number, vw: number, rest: Rect): number {
  const f = vw > 0 ? Math.min(1, Math.max(0, pointerX / vw)) : 0.5
  return panRange(rest, vw) * (1 - 2 * f)
}

/** A viewport point → a pixel of the art, given the room's on-screen box
 *  (its `getBoundingClientRect()`, which already includes any pan or zoom). */
export function toArt(
  clientX: number,
  clientY: number,
  box: { left: number; top: number; width: number; height: number },
): { u: number; v: number } | null {
  if (box.width <= 0 || box.height <= 0) return null
  const u = ((clientX - box.left) / box.width) * SCENE_PX_W
  const v = ((clientY - box.top) / box.height) * SCENE_PX_H
  if (u < 0 || v < 0 || u >= SCENE_PX_W || v >= SCENE_PX_H) return null
  return { u, v }
}

/**
 * `roomRect` as CSS, for the server render and the first client render,
 * which have no viewport to measure. Same constants, same rule, so the room
 * does not move when the measured layout takes over.
 */
export function restCss(): { left: string; top: string; width: string; height: string } {
  const h = `min(${(OVERSCAN * 100).toFixed(2)}vw / ${SCENE_ASPECT}, 100vh - ${HOTBAR_BAND}px)`
  return {
    width: `calc(${h} * ${SCENE_ASPECT})`,
    height: `calc(${h})`,
    left: `calc((100vw - ${h} * ${SCENE_ASPECT}) / 2)`,
    top: `calc((100vh - ${HOTBAR_BAND}px - ${h}) / 2)`,
  }
}
```

- [ ] **Step 4: Run it to make sure it passes**

Run: `npx vitest run components/room/__tests__/layout.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add components/room
git commit -m "Lay the room out at 110.9% width and work out its pan

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Zoom from the room's rect, with the pan folded in

**Files:**
- Modify: `components/os/intro/geometry.ts` (`scene`, `hole`, `camera`, `clip` take a `rest` rect)
- Modify: `components/os/intro/useZoom.ts` (third parameter `pan`; returns `rest`, `roomX`)
- Modify: `components/os/intro/Laptop.tsx` (draws a `room` node; default = the flattened picture)
- Test: `components/os/intro/__tests__/geometry.test.ts`, `useZoom.test.tsx`, `Laptop.test.tsx`

**Interfaces:**
- Consumes: `roomRect`, `restCss` (Task 1).
- Produces:
  - `scene/hole(z, vw, vh, rest: Rect): Rect`, `camera(z, vw, vh, rest)`, `clip(z, vw, vh, rest)`. At `z = 0`, `scene` is `rest` exactly.
  - `useZoom(zoomed: boolean, reduced: boolean, pan?: MotionValue<number>): Zoom`, where `Zoom` gains `rest: Rect | null` (null until measured; memoised per viewport) and `roomX: MotionValue<number>` (= `pan × (1 − z)`). It keeps `hit` until Task 9 removes it with `RoomChrome`.
  - `Laptop({ zoom, inert, live, room?, children })`. `room` defaults to `<RoomPicture />` (the flattened art). It is drawn in **every** state (hidden once landed) so the room's h1 is always in the HTML.

- [ ] **Step 1: Update the geometry test**

In `components/os/intro/__tests__/geometry.test.ts`, add the import:

```ts
import { roomRect } from '@/components/room/layout'
```

and the constant `const REST = roomRect(VW, VH)` under `VH`. Then replace the whole `describe('the scene', ...)` block, the first test of `describe('the screen hole', ...)`, and pass `REST` as the fourth argument to **every** `scene(`, `hole(`, `camera(` and `clip(` call in the file:

```ts
describe('the scene', () => {
  it('is the room at rest at z = 0', () => {
    expect(scene(0, VW, VH, REST)).toEqual(REST)
  })

  it('is scaled so its screen is the viewport at z = 1', () => {
    const s = scene(1, VW, VH, REST)
    expect(s.x + SCREEN_L * s.w).toBeCloseTo(0, 6)
    expect(s.y + SCREEN_T * s.h).toBeCloseTo(0, 6)
  })
})
```

```ts
  it('sits inside the room, on the desk, at rest', () => {
    const r = hole(0, VW, VH, REST)
    expect(r.x).toBeGreaterThan(REST.x)
    expect(r.y).toBeGreaterThan(REST.y + REST.h * 0.4)
    expect(r.y + r.h).toBeLessThan(REST.y + REST.h)
  })
```

Delete the now-unused `SCENE_ASPECT` import if the linter flags it.

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run components/os/intro/__tests__/geometry.test.ts`
Expected: FAIL. "is the room at rest at z = 0" fails because `scene` still covers the viewport and ignores the fourth argument.

- [ ] **Step 3: Change the geometry**

In `components/os/intro/geometry.ts`, replace `scene`, `hole`, `camera` and `clip` with:

```ts
/**
 * Where the room sits, in viewport pixels, at camera progress `z`. At z = 0 it
 * is the room at rest (`rest`, from `roomRect`); at z = 1 it is scaled so its
 * screen hole is the viewport exactly. Linear between: the easing is on z.
 */
export function scene(z: number, vw: number, vh: number, rest: Rect): Rect {
  const w1 = vw / HOLE_W
  const h1 = vh / HOLE_H
  const x1 = -SCREEN_L * w1
  const y1 = -SCREEN_T * h1
  return {
    x: rest.x + (x1 - rest.x) * z,
    y: rest.y + (y1 - rest.y) * z,
    w: rest.w + (w1 - rest.w) * z,
    h: rest.h + (h1 - rest.h) * z,
  }
}

/** The drawn screen, in viewport pixels. Derived from {@link scene}, so the
 *  picture and the live desktop cannot drift apart. */
export function hole(z: number, vw: number, vh: number, rest: Rect): Rect {
  const s = scene(z, vw, vh, rest)
  return { x: s.x + SCREEN_L * s.w, y: s.y + SCREEN_T * s.h, w: HOLE_W * s.w, h: HOLE_H * s.h }
}

/** The desktop's transform: rendered at viewport size and scaled *down* to fit
 *  the hole (fit, not cover, so no menu bar or icon is cropped). Identity at 1. */
export function camera(z: number, vw: number, vh: number, rest: Rect): { scale: number; x: number; y: number } {
  const r = hole(z, vw, vh, rest)
  return { scale: Math.min(r.w / vw, r.h / vh), x: r.x + r.w / 2 - vw / 2, y: r.y + r.h / 2 - vh / 2 }
}

/** The desktop's clip, as `inset()` edges in viewport pixels. All 0 at z = 1. */
export function clip(z: number, vw: number, vh: number, rest: Rect): {
  top: number; right: number; bottom: number; left: number
} {
  const r = hole(z, vw, vh, rest)
  return { top: r.y, right: vw - r.x - r.w, bottom: vh - r.y - r.h, left: r.x }
}
```

- [ ] **Step 4: Run the geometry test**

Run: `npx vitest run components/os/intro/__tests__/geometry.test.ts`
Expected: PASS. (`useZoom.ts` will not typecheck yet; Step 7 fixes it.)

- [ ] **Step 5: Update the `useZoom` and `Laptop` tests**

In `useZoom.test.tsx`, change the first test's last two assertions to:

```ts
    expect(result.current.measured).toBe(true)
    expect(result.current.rest).not.toBeNull()
```

and add:

```ts
  // The pan moves the room at rest and is folded out by landing, so the
  // landed desktop is never offset.
  it('applies the pan at rest and none once landed', async () => {
    const { result: pan } = renderHook(() => useMotionValue(40))
    const { result, rerender } = renderHook(({ zoomed }) => useZoom(zoomed, true, pan.current), {
      initialProps: { zoomed: false },
    })
    expect(result.current.roomX.get()).toBe(40)
    rerender({ zoomed: true })
    await waitFor(() => expect(result.current.roomX.get()).toBe(0))
  })
```

with `import { useMotionValue } from 'framer-motion'` at the top.

In `Laptop.test.tsx`, add `rest: { x: 0, y: 0, w: 100, h: 50 }` and `roomX: 0` to `stub`, and add this test:

```tsx
  // The room's h1 must be in the HTML whatever the URL, including /work/*.
  it('draws the room in every state, hidden once landed', () => {
    const { rerender } = render(<Laptop zoom={stub} inert live={false} room={<h1>room</h1>}><p>desk</p></Laptop>)
    expect(screen.getByRole('heading', { name: 'room' })).toBeTruthy()
    rerender(<Laptop zoom={stub} inert={false} live room={<h1>room</h1>}><p>desk</p></Laptop>)
    expect(screen.getByText('room').closest('[style*="hidden"]')).not.toBeNull()
  })
```

- [ ] **Step 6: Run them to make sure they fail**

Run: `npx vitest run components/os/intro`
Expected: FAIL. `rest` is undefined on the hook result, `useZoom` ignores a third argument, and `Laptop` ignores `room`.

- [ ] **Step 7: Update `useZoom.ts`**

Add the imports:

```ts
import { useMemo } from 'react'
import { roomRect } from '@/components/room/layout'
```

(merge `useMemo` into the existing `react` import). Change the signature and the `Zoom` interface:

```ts
export interface Zoom {
  /** `desktop` only once the camera has landed; `room` the moment it leaves. */
  phase: G.Phase
  /** The camera has not moved. */
  resting: boolean
  /** The viewport has been read. False on the server and the first client render. */
  measured: boolean
  /** The room at rest, unpanned, in viewport px. Null until measured. */
  rest: G.Rect | null
  /** The laptop's screen at rest, in viewport px (unpanned). Removed with RoomChrome. */
  hit: G.Rect | null
  /** The pan, faded out by the zoom: `pan × (1 − z)`, so landing is never offset. */
  roomX: MotionValue<number>
  camera: MotionValue<string>
  clip: MotionValue<string>
  scene: MotionValue<string>
  pixelScreen: MotionValue<string>
  pixelOpacity: MotionValue<number>
  roomUi: MotionValue<number>
  /** The room box's size: the room at rest. The scene transform scales it from there. */
  sceneBox: { width: number; height: number }
}

export function useZoom(zoomed: boolean, reduced: boolean, pan?: MotionValue<number>): Zoom {
```

After `const { w: vw, h: vh } = vp`, replace everything from `const camScale` to the end of the function with:

```ts
  const rest = useMemo(() => (vw > 0 ? roomRect(vw, vh) : null), [vw, vh])
  const R = rest ?? { x: 0, y: 0, w: 1, h: 1 }

  const fallbackPan = useMotionValue(0)
  const panValue = pan ?? fallbackPan
  const roomX = useTransform([panValue, z], ([p, v]) => (p as number) * (1 - (v as number)))

  const camScale = useTransform(z, (v) => G.camera(v, vw, vh, R).scale)
  const camX = useTransform(z, (v) => G.camera(v, vw, vh, R).x)
  const camY = useTransform(z, (v) => G.camera(v, vw, vh, R).y)
  const camera = useMotionTemplate`translate(${camX}px, ${camY}px) scale(${camScale})`

  const clipT = useTransform(z, (v) => G.clip(v, vw, vh, R).top)
  const clipR = useTransform(z, (v) => G.clip(v, vw, vh, R).right)
  const clipB = useTransform(z, (v) => G.clip(v, vw, vh, R).bottom)
  const clipL = useTransform(z, (v) => G.clip(v, vw, vh, R).left)
  const clip = useMotionTemplate`inset(${clipT}px ${clipR}px ${clipB}px ${clipL}px)`

  // The room box is laid out at its rest size and scaled up from there, so at
  // rest it is drawn 1:1 and crisp; the art is pixel art, so the upscale in
  // flight is drawn nearest-neighbour and stays crisp too.
  const scX = useTransform(z, (v) => G.scene(v, vw, vh, R).x)
  const scY = useTransform(z, (v) => G.scene(v, vw, vh, R).y)
  const scSX = useTransform(z, (v) => G.scene(v, vw, vh, R).w / R.w)
  const scSY = useTransform(z, (v) => G.scene(v, vw, vh, R).h / R.h)
  const scene = useMotionTemplate`translate(${scX}px, ${scY}px) scale(${scSX}, ${scSY})`

  const pxX = useTransform(z, (v) => G.hole(v, vw, vh, R).x)
  const pxY = useTransform(z, (v) => G.hole(v, vw, vh, R).y)
  const pxSX = useTransform(z, (v) => G.hole(v, vw, vh, R).w / G.PIXEL_SCREEN_W)
  const pxSY = useTransform(z, (v) => G.hole(v, vw, vh, R).h / G.PIXEL_SCREEN_H)
  const pixelScreen = useMotionTemplate`translate(${pxX}px, ${pxY}px) scale(${pxSX}, ${pxSY})`
  const pixelOpacity = useTransform(z, G.pixelFade)
  const roomUi = useTransform(z, G.roomUiFade)

  const measured = vw > 0
  return {
    phase: zoomed && arrived ? 'desktop' : 'room',
    resting,
    measured,
    rest,
    hit: rest ? G.hole(0, vw, vh, rest) : null,
    roomX,
    camera,
    clip,
    scene,
    pixelScreen,
    pixelOpacity,
    roomUi,
    sceneBox: { width: R.w, height: R.h },
  }
}
```

Update the hook's doc comment's last paragraph to: "`rest` is memoised per viewport, so effects that depend on it re-run on resize only."

- [ ] **Step 8: Update `Laptop.tsx`**

Replace the import of `Image`, the component and its doc comment with:

```tsx
import { motion } from 'framer-motion'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { restCss } from '@/components/room/layout'
import { PIXEL_SCREEN_H, PIXEL_SCREEN_W } from './geometry'
import type { Zoom } from './useZoom'
```

(keep the three `*_SRC` exports and `PIXELATED` as they are), then:

```tsx
/** The room as one flattened picture: the default until `RoomScene` draws it in layers. */
function RoomPicture() {
  return <Image src={SCENE_SRC} alt="" fill priority sizes="112vw" style={{ objectFit: 'fill', ...PIXELATED }} />
}

/**
 * The room, and the live desktop pasted into its drawn screen.
 *
 * The room box is laid out at the room's rest size and moved by one
 * transform derived from the zoom, so the room, the screen hole and the
 * desktop's clip cannot drift apart mid-flight. The outer layer carries the
 * pan, faded out as the camera lands (`roomX`), so landing is exact.
 *
 * Before the viewport is measured (the server and the first client render)
 * the room box is placed by `restCss()`, the same rule in CSS, and the desktop
 * stays out of sight until it can be clipped to the screen. The room is drawn
 * in every state, hidden once landed, so its h1 is always in the HTML.
 */
export function Laptop({
  zoom, inert, live, room = <RoomPicture />, children,
}: { zoom: Zoom; inert: boolean; live: boolean; room?: ReactNode; children: ReactNode }) {
  const flying = !live && zoom.measured
  const unmeasured = !live && !zoom.measured
  const hidden = live ? 'hidden' : 'visible'

  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ x: zoom.roomX }}>
      <motion.div
        className="absolute"
        style={zoom.measured
          ? {
            left: 0, top: 0, width: zoom.sceneBox.width, height: zoom.sceneBox.height,
            transform: zoom.scene, transformOrigin: '0 0', visibility: hidden,
          }
          : { ...restCss(), visibility: hidden }}
      >
        {room}
      </motion.div>

      {/* The desktop, cut to the drawn screen while flying. Black behind it,
          because the desktop is fitted rather than cropped and a sliver shows
          where the two shapes disagree. */}
      <motion.div
        className={`absolute inset-0 ${unmeasured ? 'invisible' : ''}`}
        style={flying
          ? { clipPath: zoom.clip, background: '#000' }
          : { clipPath: 'none', background: 'transparent' }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ transform: flying ? zoom.camera : 'none' }}
          inert={inert}
          aria-hidden={inert}
        >
          {children}
        </motion.div>

        {flying && (
          <motion.img
            aria-hidden
            src={SCREEN_PIXEL_SRC}
            alt=""
            width={PIXEL_SCREEN_W}
            height={PIXEL_SCREEN_H}
            className="pointer-events-none absolute left-0 top-0 max-w-none"
            style={{ transform: zoom.pixelScreen, transformOrigin: '0 0', opacity: zoom.pixelOpacity, ...PIXELATED }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}
```

- [ ] **Step 9: Run tests and typecheck**

Run: `npx vitest run && npm run typecheck`
Expected: all pass. `OS.tsx` and `RoomChrome.tsx` still compile because `hit` is kept.

- [ ] **Step 10: Commit**

```bash
git add components/os/intro
git commit -m "Zoom into the laptop from the room's own rect, with the pan folded in

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The hit map

**Files:**
- Modify: `scripts/art/cut-room.mjs` (also writes `public/room/hitmap.png`)
- Create: `components/room/hitmap.ts`
- Test: `components/room/__tests__/hitmap.test.ts`

**Interfaces:**
- Produces:
  - `public/room/hitmap.png`: 672×288 (art ÷ 4), RGB, `R = index + 1` of the topmost sprite in `sprites.json` order, `0` for none
  - `interface HitMap { w: number; h: number; data: Uint8Array }`, one byte per cell
  - `HIT_SCALE = 4`
  - `hitAt(map: HitMap, u: number, v: number): number`, the sprite index at art pixel (u, v), or −1
  - `loadHitMap(src: string): Promise<HitMap>` (browser only; rejects where there is no canvas)

- [ ] **Step 1: Write the failing test**

`components/room/__tests__/hitmap.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import path from 'node:path'
import sprites from '@/public/room/sprites.json'
import { HIT_SCALE, hitAt, type HitMap } from '../hitmap'

const index = (id: string) => sprites.sprites.findIndex((s) => s.id === id)

async function realMap(): Promise<HitMap> {
  const { data, info } = await sharp(path.join(process.cwd(), 'public/room/hitmap.png'))
    .removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const out = new Uint8Array(info.width * info.height)
  for (let i = 0; i < out.length; i++) out[i] = data[i * 3]
  return { w: info.width, h: info.height, data: out }
}

describe('hitAt', () => {
  const map: HitMap = { w: 2, h: 1, data: new Uint8Array([0, 3]) }

  it('reads the cell under an art pixel', () => {
    expect(hitAt(map, 0, 0)).toBe(-1)
    expect(hitAt(map, HIT_SCALE, 0)).toBe(2)
    expect(hitAt(map, HIT_SCALE * 2 - 0.5, HIT_SCALE - 0.5)).toBe(2)
  })

  it('is −1 off the map', () => {
    expect(hitAt(map, -1, 0)).toBe(-1)
    expect(hitAt(map, 0, HIT_SCALE)).toBe(-1)
    expect(hitAt(map, HIT_SCALE * 2, 0)).toBe(-1)
  })
})

describe('the room hit map', () => {
  it('is the art at quarter scale', async () => {
    const map = await realMap()
    expect([map.w, map.h]).toEqual([sprites.width / HIT_SCALE, sprites.height / HIT_SCALE])
  })

  it('finds objects where they are drawn, and nothing on bare wall', async () => {
    const map = await realMap()
    expect(hitAt(map, 1091, 657)).toBe(index('laptop')) // screen centre
    expect(hitAt(map, 2480, 400)).toBe(index('window'))
    expect(hitAt(map, 1800, 500)).toBe(index('bookshelf'))
    expect(hitAt(map, 650, 500)).toBe(-1) // wall between the photos and the whiteboard
  })

  it('the laptop lid wins over the whiteboard behind it', async () => {
    const map = await realMap()
    expect(hitAt(map, 1000, 600)).toBe(index('laptop'))
    expect(hitAt(map, 850, 600)).toBe(index('whiteboard'))
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run components/room/__tests__/hitmap.test.ts`
Expected: FAIL, cannot resolve `../hitmap`.

- [ ] **Step 3: Write the hit map in `cut-room.mjs`**

Change the object loop header from `for (const obj of OBJECTS) {` to `for (const [index, obj] of OBJECTS.entries()) {`. Before the loop add:

```js
  // Hit map: quarter scale, R = index + 1 of the topmost sprite (list order is
  // draw order, so later objects overwrite earlier ones), 0 for none.
  const HIT_SCALE = 4
  const HW = Math.floor(W / HIT_SCALE), HH = Math.floor(H / HIT_SCALE)
  const hit = Buffer.alloc(HW * HH * 3)
```

Inside the loop, right after the mask is final (after the `grow` line), add:

```js
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
      if (mask[(y * HIT_SCALE + 2) * W + x * HIT_SCALE + 2]) {
        const o = (y * HW + x) * 3
        hit[o] = hit[o + 1] = hit[o + 2] = index + 1
      }
    }
```

After the loop, next to the `sprites.json` write:

```js
  await sharp(hit, { raw: { width: HW, height: HH, channels: 3 } }).png().toFile(`${OUT}/hitmap.png`)
```

and add `public/room/hitmap.png` to the "Writes" list in the header comment.

- [ ] **Step 4: Write `components/room/hitmap.ts`**

```ts
/**
 * Which object is under the pointer. The room's objects are irregular and
 * overlap (the laptop lid stands in front of the whiteboard), so bounding
 * boxes are wrong. `public/room/hitmap.png` is the art at quarter scale with
 * each pixel's red channel holding the topmost object's index + 1, written by
 * `scripts/art/cut-room.mjs` from the same outlines as the sprites.
 */

export interface HitMap {
  w: number
  h: number
  /** One byte per cell: 0 for none, i + 1 for sprite i of `sprites.json`. */
  data: Uint8Array
}

export const HIT_SCALE = 4

/** The sprite index at art pixel (u, v), or −1. */
export function hitAt(map: HitMap, u: number, v: number): number {
  const x = Math.floor(u / HIT_SCALE)
  const y = Math.floor(v / HIT_SCALE)
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return -1
  return map.data[y * map.w + x] - 1
}

/** Decodes the hit map in the browser. Rejects where there is no 2D canvas
 *  (jsdom), and the room then simply has no pointer hover. */
export async function loadHitMap(src: string): Promise<HitMap> {
  const img = new Image()
  img.src = src
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('no 2d canvas')
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0)
  const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const data = new Uint8Array(canvas.width * canvas.height)
  for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4]
  return { w: canvas.width, h: canvas.height, data }
}
```

- [ ] **Step 5: Regenerate the art and run the test**

Run: `node scripts/art/cut-room.mjs && npx vitest run components/room/__tests__/hitmap.test.ts`
Expected: the script still prints `rebuild: 0 of … differ`; tests PASS (5). If a probe point misses, read the art at that point before changing the test: the probe is wrong only if the point is visibly not on that object.

- [ ] **Step 6: Commit**

```bash
git add scripts/art/cut-room.mjs components/room/hitmap.ts components/room/__tests__/hitmap.test.ts public/room
git commit -m "Write a hit map so hover and click find the exact object

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Game-card content

**Files:**
- Create: `content/cards/{school-usc,school-hkust,school-bocconi,dog,beach,surfboard,building,music,books,journal,travel,san-diego}.md`, `content/cards.ts`
- Modify: `package.json` (add `gray-matter`)
- Test: `content/__tests__/cards.test.ts`

**Interfaces:**
- Produces (server-only module; it reads the filesystem):
  - `interface Card { id: string; tag: string; title: string; photo: string; stat?: string; set?: string; order: number; body: string[] }`
  - `getCards(): Card[]` (sorted by file name; throws naming the file if a required field is missing)
  - `getCard(id: string): Card | undefined`
  - `siblings(card: Card): { prev: Card | null; next: Card | null }` (within `set`, by `order`)

- [ ] **Step 1: Install gray-matter**

Run: `npm install gray-matter`
Expected: added to `dependencies`.

- [ ] **Step 2: Write the failing test**

`content/__tests__/cards.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { getCard, getCards, siblings } from '../cards'

describe('the cards', () => {
  it('all parse, with unique ids and the required fields', () => {
    const cards = getCards()
    expect(cards.length).toBe(12)
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length)
    for (const c of cards) {
      expect(c.tag && c.title && c.photo).toBeTruthy()
      expect(c.body.length).toBeGreaterThan(0)
    }
  })

  it('point at photos that exist', () => {
    for (const c of getCards()) {
      expect(fs.existsSync(path.join(process.cwd(), 'public', c.photo)), c.photo).toBe(true)
    }
  })

  it('keep the schools in order, as one set', () => {
    const usc = getCard('school-usc')!
    expect(siblings(usc).next?.id).toBe('school-hkust')
    expect(siblings(getCard('school-hkust')!).next?.id).toBe('school-bocconi')
  })

  it('has no neighbour past either end, or outside a set', () => {
    expect(siblings(getCard('school-usc')!).prev).toBeNull()
    expect(siblings(getCard('school-bocconi')!).next).toBeNull()
    expect(siblings(getCard('dog')!)).toEqual({ prev: null, next: null })
  })
})
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `npx vitest run content/__tests__/cards.test.ts`
Expected: FAIL, cannot resolve `../cards`.

- [ ] **Step 4: Write `content/cards.ts`**

```ts
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

/**
 * The game cards (spec §4): one Markdown file per card in content/cards/.
 * Frontmatter holds the card's fields; the body is its story, one paragraph
 * per blank-line block. Adding a card is adding a file.
 *
 * Server-only: it reads the filesystem. Pages read it at build time and hand
 * components plain data.
 */

export interface Card {
  id: string
  /** The type line, e.g. "SCHOOL · HKUST · 2025". */
  tag: string
  title: string
  /** A path under /public. */
  photo: string
  stat?: string
  /** Cards in the same set swipe between each other, in `order`. */
  set?: string
  order: number
  body: string[]
}

const DIR = path.join(process.cwd(), 'content', 'cards')
let cache: Card[] | null = null

export function getCards(): Card[] {
  if (cache) return cache
  cache = fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).sort().map((file) => {
    const { data, content } = matter(fs.readFileSync(path.join(DIR, file), 'utf8'))
    for (const key of ['tag', 'title', 'photo']) {
      if (typeof data[key] !== 'string' || !data[key]) throw new Error(`content/cards/${file}: missing "${key}"`)
    }
    return {
      id: file.replace(/\.md$/, ''),
      tag: data.tag,
      title: data.title,
      photo: data.photo,
      stat: typeof data.stat === 'string' ? data.stat : undefined,
      set: typeof data.set === 'string' ? data.set : undefined,
      order: typeof data.order === 'number' ? data.order : 0,
      body: content.trim().split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean),
    }
  })
  return cache
}

export function getCard(id: string): Card | undefined {
  return getCards().find((c) => c.id === id)
}

export function siblings(card: Card): { prev: Card | null; next: Card | null } {
  if (!card.set) return { prev: null, next: null }
  const set = getCards().filter((c) => c.set === card.set).sort((a, b) => a.order - b.order)
  const i = set.findIndex((c) => c.id === card.id)
  return { prev: set[i - 1] ?? null, next: set[i + 1] ?? null }
}
```

- [ ] **Step 5: Write the twelve cards**

Draft copy, from the résumé and the spec; Rayyan replaces it. Each is `content/cards/<id>.md`:

`school-usc.md`
```md
---
tag: SCHOOL · USC · LOS ANGELES
title: USC
photo: /room/sprites/flags.png
stat: GPA 3.96
set: schools
order: 1
---
The first of three schools in the World Bachelor in Business: a B.S. in Business Administration at the University of Southern California.

Los Angeles is where it started.
```

`school-hkust.md`
```md
---
tag: SCHOOL · HKUST · 2025
title: HKUST
photo: /room/sprites/flags.png
set: schools
order: 2
---
The second stop: a Bachelor of Business Administration at the Hong Kong University of Science and Technology.
```

`school-bocconi.md`
```md
---
tag: SCHOOL · BOCCONI · MILAN
title: Bocconi
photo: /room/sprites/flags.png
set: schools
order: 3
---
The third stop: a B.S. in Business at Bocconi University in Milan.
```

`dog.md`
```md
---
tag: FAMILY · THE DOG
title: The dog
photo: /room/sprites/photo-dog.png
---
Curly, apricot, and the best part of coming home.
```

`beach.md`
```md
---
tag: PLACE · SAN DIEGO
title: Home
photo: /room/sprites/photo-beach.png
---
San Diego. Where I grew up, and where I learned to surf and boogie board.
```

`surfboard.md`
```md
---
tag: GEAR · TWIN-FIN FISH
title: The board
photo: /room/sprites/surfboard.png
---
A short fish with a swallow tail, built for the San Diego breaks.
```

`building.md`
```md
---
tag: NOW · BUILDING
title: What I'm building
photo: /room/sprites/whiteboard.png
---
Agent Dynamo, and The Attention Exchange. The laptop has the details.
```

`music.md`
```md
---
tag: COMING SOON · MUSIC
title: The record player
photo: /room/sprites/record-player.png
---
Seven records I love. Soon you'll be able to pull one from the crate and hear it.
```

`books.md`
```md
---
tag: COMING SOON · BOOKS
title: The bookshelf
photo: /room/sprites/bookshelf.png
---
Eight books I'd recommend, each with a short review. Soon you'll be able to pull them off the shelf.
```

`journal.md`
```md
---
tag: COMING SOON · JOURNAL
title: The journal
photo: /room/sprites/journal.png
---
Things I think about, written down. The first entries are on their way.
```

`travel.md`
```md
---
tag: COMING SOON · TRAVEL
title: The globe
photo: /room/sprites/globe.png
---
Places I've been, pinned on a globe you can spin.
```

`san-diego.md`
```md
---
tag: PLACE · SAN DIEGO · NOW
title: The window
photo: /room/sprites/window.png
---
The view from home. Soon it will follow San Diego's real time of day.
```

- [ ] **Step 6: Run the test**

Run: `npx vitest run content/__tests__/cards.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json content/cards content/cards.ts content/__tests__/cards.test.ts
git commit -m "Add the game cards as Markdown content

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The room manifest and the overlay paths

**Files:**
- Create: `content/room.ts`
- Modify: `components/os/view.ts`
- Test: `content/__tests__/room.test.ts`, `components/os/__tests__/view.test.ts`

**Interfaces:**
- Consumes: `public/room/sprites.json` (phase 2), `getCards` (Task 4, in the test only).
- Produces:
  - `type RoomAction = { kind: 'zoom' } | { kind: 'card'; card: string }`
  - `interface RoomObject { id: string; label: string; hint: string; action: RoomAction }`
  - `interface HotbarSlot { slot: number; label: string; objects: readonly string[] }`
  - `ROOM_OBJECTS: readonly RoomObject[]`, `HOTBAR: readonly HotbarSlot[]`
  - `spriteFor(id: string): { id: string; x: number; y: number; w: number; h: number }` (throws on an unknown id)
  - `view.ts`: `isRoomOverlay(pathname: string): boolean`, `cardPath(id: string): string`

- [ ] **Step 1: Write the failing tests**

`content/__tests__/room.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import sprites from '@/public/room/sprites.json'
import { getCards } from '../cards'
import { HOTBAR, ROOM_OBJECTS, spriteFor } from '../room'

describe('the room manifest', () => {
  it('describes exactly the sprites the art has', () => {
    expect(ROOM_OBJECTS.map((o) => o.id).sort()).toEqual(sprites.sprites.map((s) => s.id).sort())
  })

  it('points every card action at a card that exists', () => {
    const ids = new Set(getCards().map((c) => c.id))
    for (const o of ROOM_OBJECTS) if (o.action.kind === 'card') expect(ids.has(o.action.card), o.id).toBe(true)
  })

  it('has hotbar slots 1–9, each naming objects in the room', () => {
    expect(HOTBAR.map((s) => s.slot)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (const s of HOTBAR) for (const id of s.objects) expect(() => spriteFor(id)).not.toThrow()
  })

  it('puts the laptop in slot 1 and both photos in slot 9', () => {
    expect(HOTBAR[0].objects).toEqual(['laptop'])
    expect(HOTBAR[8].objects).toEqual(['photo-dog', 'photo-beach'])
  })
})
```

Append to `components/os/__tests__/view.test.ts` (and add `cardPath, isRoomOverlay` to its import):

```ts
describe('room overlays', () => {
  it('are the card paths and nothing else', () => {
    expect(isRoomOverlay('/cards/dog')).toBe(true)
    expect(isRoomOverlay('/cards/dog/')).toBe(true)
    expect(isRoomOverlay('/cards')).toBe(false)
    expect(isRoomOverlay('/')).toBe(false)
    expect(isRoomOverlay('/work/resume')).toBe(false)
  })

  it('round-trip through cardPath', () => {
    expect(isRoomOverlay(cardPath('school-usc'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run content/__tests__/room.test.ts components/os/__tests__/view.test.ts`
Expected: FAIL, cannot resolve `../room`; `isRoomOverlay` is not exported.

- [ ] **Step 3: Write `content/room.ts`**

```ts
import sprites from '@/public/room/sprites.json'

/**
 * The room manifest (spec §5): what each object is called, what it does, and
 * which hotbar slot it lives in. Positions come from the art pipeline
 * (public/room/sprites.json), so moving an object is re-cutting the art, not
 * editing here.
 *
 * Phase 3: the record player, bookshelf, journal, globe and window open a
 * game card saying what is coming. Phase 4 points them at their own overlays.
 */

export type RoomAction = { kind: 'zoom' } | { kind: 'card'; card: string }

export interface RoomObject {
  id: string
  /** The tooltip, and the start of the button's accessible name. */
  label: string
  /** What it opens, in a few words. */
  hint: string
  action: RoomAction
}

export interface HotbarSlot {
  slot: number
  label: string
  /** Lit when the slot is hovered; the first one is what the slot opens. */
  objects: readonly string[]
}

export const ROOM_OBJECTS: readonly RoomObject[] = [
  { id: 'laptop', label: 'Laptop', hint: 'Work, résumé and contact', action: { kind: 'zoom' } },
  { id: 'journal', label: 'Journal', hint: 'Things I think about', action: { kind: 'card', card: 'journal' } },
  { id: 'record-player', label: 'Record player', hint: 'Songs I love', action: { kind: 'card', card: 'music' } },
  { id: 'bookshelf', label: 'Bookshelf', hint: 'Books I recommend', action: { kind: 'card', card: 'books' } },
  { id: 'globe', label: 'Globe', hint: "Places I've been", action: { kind: 'card', card: 'travel' } },
  { id: 'whiteboard', label: 'Whiteboard', hint: "What I'm building", action: { kind: 'card', card: 'building' } },
  { id: 'flags', label: 'Flags', hint: 'USC, HKUST and Bocconi', action: { kind: 'card', card: 'school-usc' } },
  { id: 'surfboard', label: 'Surfboard', hint: 'The board', action: { kind: 'card', card: 'surfboard' } },
  { id: 'photo-dog', label: 'Photo', hint: 'My dog', action: { kind: 'card', card: 'dog' } },
  { id: 'photo-beach', label: 'Photo', hint: 'San Diego', action: { kind: 'card', card: 'beach' } },
  { id: 'window', label: 'Window', hint: 'San Diego, right now', action: { kind: 'card', card: 'san-diego' } },
]

export const HOTBAR: readonly HotbarSlot[] = [
  { slot: 1, label: 'Work', objects: ['laptop'] },
  { slot: 2, label: 'Journal', objects: ['journal'] },
  { slot: 3, label: 'Music', objects: ['record-player'] },
  { slot: 4, label: 'Books', objects: ['bookshelf'] },
  { slot: 5, label: 'Travel', objects: ['globe'] },
  { slot: 6, label: 'Building', objects: ['whiteboard'] },
  { slot: 7, label: 'Schools', objects: ['flags'] },
  { slot: 8, label: 'Surf', objects: ['surfboard'] },
  { slot: 9, label: 'Photos', objects: ['photo-dog', 'photo-beach'] },
]

export function spriteFor(id: string): { id: string; x: number; y: number; w: number; h: number } {
  const s = sprites.sprites.find((sprite) => sprite.id === id)
  if (!s) throw new Error(`no sprite "${id}" in public/room/sprites.json`)
  return s
}
```

- [ ] **Step 4: Add the overlay helpers to `components/os/view.ts`**

```ts
/** Paths the room opens over itself. Phase 3: the game cards. Phase 4 adds the
 *  record player, bookshelf, journal, globe and window overlays here. */
export function isRoomOverlay(pathname: string): boolean {
  return /^\/cards\/[^/]+\/?$/.test(pathname)
}

export function cardPath(id: string): string {
  return `/cards/${id}`
}
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run content components/os/__tests__/view.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add content/room.ts content/__tests__/room.test.ts components/os/view.ts components/os/__tests__/view.test.ts
git commit -m "Add the room manifest and the card overlay paths

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: The layered room and the whiteboard intro

**Files:**
- Create: `components/room/RoomScene.tsx`, `components/room/WhiteboardIntro.tsx`
- Modify: `app/layout.tsx` (marker font), `app/globals.css` (`--font-marker`, sprite glow), `content/profile.ts` (`intro`)
- Test: `components/room/__tests__/RoomScene.test.tsx`

**Interfaces:**
- Consumes: `ROOM_OBJECTS`, `spriteFor` (Task 5); `hitAt`, `loadHitMap` (Task 3); `toArt` (Task 1); `SCENE_PX_W/H` (geometry).
- Produces:
  - `RoomScene({ lit: readonly string[]; disabled: boolean; onActivate: (id: string) => void; children?: ReactNode })`. It fills its parent (the Laptop's room box). Each object is a `<button data-room-object={id} aria-label="{label}: {hint}">`; each sprite is an `<img data-lit="true|false">`; the root is a size container (`cqw` units).
  - `WhiteboardIntro()`: the page's `<h1>`, drawn on the whiteboard.
  - `PROFILE.intro: "Hi, I'm Rayyan Darugar."`

- [ ] **Step 1: Write the failing test**

`components/room/__tests__/RoomScene.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PROFILE } from '@/content/profile'
import { ROOM_OBJECTS } from '@/content/room'
import { RoomScene } from '../RoomScene'
import { WhiteboardIntro } from '../WhiteboardIntro'

const litIds = (container: HTMLElement) =>
  [...container.querySelectorAll('img[data-lit="true"]')].map((img) => img.getAttribute('data-sprite'))

describe('RoomScene', () => {
  it('gives every object a named button', () => {
    render(<RoomScene lit={[]} disabled={false} onActivate={() => {}} />)
    for (const o of ROOM_OBJECTS) {
      expect(screen.getByRole('button', { name: `${o.label}: ${o.hint}` })).toBeTruthy()
    }
  })

  it('lights an object and names it while it has focus', () => {
    const { container } = render(<RoomScene lit={[]} disabled={false} onActivate={() => {}} />)
    fireEvent.focus(screen.getByRole('button', { name: /^Globe:/ }))
    expect(litIds(container)).toEqual(['globe'])
    expect(screen.getByRole('tooltip').textContent).toBe('Globe')
  })

  it('opens an object from its button', () => {
    const onActivate = vi.fn()
    render(<RoomScene lit={[]} disabled={false} onActivate={onActivate} />)
    fireEvent.click(screen.getByRole('button', { name: /^Laptop:/ }))
    expect(onActivate).toHaveBeenCalledWith('laptop')
  })

  it('lights what it is told to', () => {
    const { container } = render(<RoomScene lit={['photo-dog', 'photo-beach']} disabled={false} onActivate={() => {}} />)
    expect(litIds(container).sort()).toEqual(['photo-beach', 'photo-dog'])
  })

  it('takes no input and lights nothing while disabled', () => {
    const { container } = render(<RoomScene lit={['laptop']} disabled onActivate={() => {}} />)
    expect(litIds(container)).toEqual([])
    expect(container.firstElementChild?.hasAttribute('inert')).toBe(true)
  })
})

describe('WhiteboardIntro', () => {
  it('is the h1, and says who this is', () => {
    render(<WhiteboardIntro />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(PROFILE.name)
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run components/room/__tests__/RoomScene.test.tsx`
Expected: FAIL, cannot resolve `../RoomScene`.

- [ ] **Step 3: Add the marker font, the glow and the intro line**

`app/layout.tsx`: add `Gochi_Hand` to the `next/font/google` import, then:

```tsx
/** The whiteboard's marker hand. */
const marker = Gochi_Hand({ subsets: ['latin'], weight: '400', variable: '--font-gochi' })
```

and add `${marker.variable}` to the `<html>` className list.

`app/globals.css`, inside `@theme inline`:

```css
  --font-marker: var(--font-gochi), cursive;
```

and after the `.tabular` rule:

```css
/* A room object, lit by hover, focus or its hotbar slot. */
.room-sprite { transition: filter .15s ease-out; }
.room-sprite[data-lit='true'] {
  filter: drop-shadow(0 0 1px #fff7da) drop-shadow(0 0 7px rgba(255, 207, 90, .95));
}
```

`content/profile.ts`, in `PROFILE`:

```ts
  /** Written on the whiteboard: the page's h1. Draft; Rayyan writes the real line. */
  intro: "Hi, I'm Rayyan Darugar.",
```

- [ ] **Step 4: Write `components/room/WhiteboardIntro.tsx`**

```tsx
import { PROFILE } from '@/content/profile'

/**
 * The intro, written on the whiteboard in marker (spec §3): the room
 * introduces him itself. It sits on the board's top-left, where the art has
 * only scribbled bullets, on a patch of the board's own colour so it reads as
 * freshly wiped. Sizes are in `cqw` of the room box, so it scales with the room.
 *
 * Placement, in art px: x 816–1122, y 262–488, inside the whiteboard sprite
 * (792, 241, 641 × 379).
 */
export function WhiteboardIntro() {
  return (
    <div
      className="pointer-events-none absolute flex flex-col justify-center"
      style={{
        left: '30.36%', top: '22.74%', width: '11.38%', height: '19.62%',
        padding: '0 .7cqw',
        background: 'radial-gradient(closest-side, rgba(190,161,131,.97) 74%, rgba(190,161,131,0) 100%)',
      }}
    >
      <h1 style={{ fontFamily: 'var(--font-marker)', fontSize: '1.3cqw', lineHeight: 1.1, color: '#2f4a8a' }}>
        {PROFILE.intro}
      </h1>
      <p style={{ fontFamily: 'var(--font-marker)', fontSize: '.9cqw', lineHeight: 1.2, color: '#a3402c', marginTop: '.45cqw' }}>
        {PROFILE.tagline}
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Write `components/room/RoomScene.tsx`**

```tsx
'use client'
import Image from 'next/image'
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { SCENE_PX_H, SCENE_PX_W } from '@/components/os/intro/geometry'
import { ROOM_OBJECTS, spriteFor, type RoomObject } from '@/content/room'
import sprites from '@/public/room/sprites.json'
import { hitAt, loadHitMap, type HitMap } from './hitmap'
import { toArt } from './layout'

const PIXELATED = { imageRendering: 'pixelated' } as const
const pct = (n: number, of: number) => `${(n / of) * 100}%`
const boxOf = (s: { x: number; y: number; w: number; h: number }) => ({
  left: pct(s.x, SCENE_PX_W), top: pct(s.y, SCENE_PX_H), width: pct(s.w, SCENE_PX_W), height: pct(s.h, SCENE_PX_H),
})

/** The pixel tooltip over a lit object; under it when the object touches the top. */
function Tooltip({ object }: { object: RoomObject }) {
  const s = spriteFor(object.id)
  const below = s.y < 120
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute z-10 whitespace-nowrap rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#fff3d6]"
      style={{
        left: pct(s.x + s.w / 2, SCENE_PX_W),
        top: pct(below ? s.y + s.h : s.y, SCENE_PX_H),
        transform: below ? 'translate(-50%, 8px)' : 'translate(-50%, calc(-100% - 8px))',
        background: 'rgba(28,18,12,.9)',
        border: '1px solid rgba(255,214,140,.45)',
        fontFamily: 'var(--font-pixel)',
      }}
    >
      {object.label}
    </span>
  )
}

/**
 * The room, in layers (spec §5 "room engine"): the empty base, then one
 * sprite per object in draw order, then whatever is drawn on the room
 * (`children`, the whiteboard intro), then a focusable button over each
 * object for the keyboard. It knows nothing about books or records: it lights
 * objects and reports which one was chosen.
 *
 * The pointer is resolved through the hit map rather than the buttons, which
 * are transparent to it, because the objects are irregular and overlap. It
 * fills its parent, the Laptop's room box, and reads the pointer against its
 * own on-screen box, so pan and zoom transforms are already accounted for.
 */
export function RoomScene({
  lit, disabled, onActivate, children,
}: {
  lit: readonly string[]
  disabled: boolean
  onActivate: (id: string) => void
  children?: ReactNode
}) {
  const [map, setMap] = useState<HitMap | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadHitMap('/room/hitmap.png').then((m) => { if (alive) setMap(m) }).catch(() => {})
    return () => { alive = false }
  }, [])

  const objectAt = (event: MouseEvent<HTMLElement>): string | null => {
    if (!map) return null
    const p = toArt(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect())
    if (!p) return null
    const i = hitAt(map, p.u, p.v)
    return i >= 0 ? sprites.sprites[i].id : null
  }

  const shown = disabled ? null : hovered
  const isLit = (id: string) => !disabled && (id === hovered || lit.includes(id))
  const tooltip = shown ? ROOM_OBJECTS.find((o) => o.id === shown) : undefined

  return (
    <div
      className="absolute inset-0 [container-type:inline-size]"
      inert={disabled}
      style={{ cursor: shown ? 'pointer' : 'default' }}
      onPointerMove={(event) => { if (!disabled) setHovered(objectAt(event)) }}
      onPointerLeave={() => setHovered(null)}
      onClick={(event) => {
        const id = disabled ? null : objectAt(event)
        if (id) onActivate(id)
      }}
    >
      <Image src="/room/base.png" alt="" fill priority sizes="112vw" style={PIXELATED} />

      {sprites.sprites.map((s) => (
        <Image
          key={s.id}
          src={`/room/sprites/${s.id}.png`}
          alt=""
          width={s.w}
          height={s.h}
          sizes={`${((s.w / SCENE_PX_W) * 112).toFixed(1)}vw`}
          data-sprite={s.id}
          data-lit={isLit(s.id) ? 'true' : 'false'}
          className="room-sprite pointer-events-none absolute max-w-none"
          style={{ ...boxOf(s), ...PIXELATED }}
        />
      ))}

      {children}

      {ROOM_OBJECTS.map((o) => (
        <button
          key={o.id}
          type="button"
          data-room-object={o.id}
          aria-label={`${o.label}: ${o.hint}`}
          className="pointer-events-none absolute rounded-[4px] outline-none"
          style={boxOf(spriteFor(o.id))}
          onFocus={() => setHovered(o.id)}
          onBlur={() => setHovered((h) => (h === o.id ? null : h))}
          onClick={(event) => { event.stopPropagation(); onActivate(o.id) }}
        />
      ))}

      {tooltip && <Tooltip object={tooltip} />}
    </div>
  )
}
```

- [ ] **Step 6: Run the test, typecheck and lint**

Run: `npx vitest run components/room && npm run typecheck && npm run lint`
Expected: PASS (6 new tests), clean.

- [ ] **Step 7: Commit**

```bash
git add components/room content/profile.ts app/layout.tsx app/globals.css
git commit -m "Draw the room in layers, with glow, tooltips and the whiteboard intro

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Hotbar, Résumé link and backdrop

**Files:**
- Create: `components/room/Hotbar.tsx`, `components/room/RoomBar.tsx`, `components/room/RoomBackdrop.tsx`
- Test: `components/room/__tests__/Hotbar.test.tsx`

**Interfaces:**
- Consumes: `HOTBAR`, `spriteFor`, `type HotbarSlot` (Task 5); `pathFor` (view.ts); `HOTBAR_BAND` (Task 1).
- Produces:
  - `Hotbar({ onHighlight: (ids: readonly string[] | null) => void; onActivate: (slot: HotbarSlot) => void })`: a `nav` labelled "Hotbar" with buttons named `"{n}: {label}"`
  - `RoomBar()`: the fixed "Résumé" link to `/work/resume`
  - `RoomBackdrop()`: the blurred room filling the bands

- [ ] **Step 1: Write the failing test**

`components/room/__tests__/Hotbar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { HOTBAR } from '@/content/room'
import { Hotbar } from '../Hotbar'
import { RoomBar } from '../RoomBar'

describe('Hotbar', () => {
  it('shows the nine slots in order, labelled', () => {
    render(<Hotbar onHighlight={() => {}} onActivate={() => {}} />)
    const names = within(screen.getByRole('navigation', { name: 'Hotbar' }))
      .getAllByRole('button').map((b) => b.getAttribute('aria-label'))
    expect(names).toEqual(HOTBAR.map((s) => `${s.slot}: ${s.label}`))
  })

  it('lights its objects on hover and focus, and lets go after', () => {
    const onHighlight = vi.fn()
    render(<Hotbar onHighlight={onHighlight} onActivate={() => {}} />)
    const photos = screen.getByRole('button', { name: '9: Photos' })
    fireEvent.mouseEnter(photos)
    expect(onHighlight).toHaveBeenLastCalledWith(['photo-dog', 'photo-beach'])
    fireEvent.mouseLeave(photos)
    expect(onHighlight).toHaveBeenLastCalledWith(null)
    fireEvent.focus(photos)
    expect(onHighlight).toHaveBeenLastCalledWith(['photo-dog', 'photo-beach'])
  })

  it('opens its slot on click', () => {
    const onActivate = vi.fn()
    render(<Hotbar onHighlight={() => {}} onActivate={onActivate} />)
    fireEvent.click(screen.getByRole('button', { name: '1: Work' }))
    expect(onActivate).toHaveBeenCalledWith(HOTBAR[0])
  })
})

describe('RoomBar', () => {
  it('links the résumé', () => {
    render(<RoomBar />)
    expect(screen.getByRole('link', { name: 'Résumé' }).getAttribute('href')).toBe('/work/resume')
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run components/room/__tests__/Hotbar.test.tsx`
Expected: FAIL, cannot resolve `../Hotbar`.

- [ ] **Step 3: Write `components/room/Hotbar.tsx`**

```tsx
'use client'
import Image from 'next/image'
import { HOTBAR, spriteFor, type HotbarSlot } from '@/content/room'
import { HOTBAR_BAND } from './layout'

const PIXEL_TEXT = { fontFamily: 'var(--font-pixel)', textShadow: '1px 1px 0 rgba(0,0,0,.85)' }

/**
 * The Minecraft-style hotbar (spec §3): nine slots, each an object, labelled
 * without hovering. It is nav, legend and keyboard access at once. Hovering
 * or focusing a slot lights its object(s); clicking acts exactly like clicking
 * the object. Number keys are handled by the OS root, which knows when the
 * room is the thing being looked at.
 */
export function Hotbar({
  onHighlight, onActivate,
}: {
  onHighlight: (ids: readonly string[] | null) => void
  onActivate: (slot: HotbarSlot) => void
}) {
  return (
    <nav
      aria-label="Hotbar"
      className="pointer-events-auto absolute inset-x-0 bottom-0 flex items-center justify-center"
      style={{ height: HOTBAR_BAND }}
    >
      <ol className="flex items-start gap-[6px]">
        {HOTBAR.map((slot) => {
          const s = spriteFor(slot.objects[0])
          return (
            <li key={slot.slot}>
              <button
                type="button"
                aria-label={`${slot.slot}: ${slot.label}`}
                aria-keyshortcuts={String(slot.slot)}
                onMouseEnter={() => onHighlight(slot.objects)}
                onMouseLeave={() => onHighlight(null)}
                onFocus={() => onHighlight(slot.objects)}
                onBlur={() => onHighlight(null)}
                onClick={() => onActivate(slot)}
                className="group relative flex w-[68px] flex-col items-center gap-[5px] outline-none"
              >
                <span className="relative block h-[58px] w-[58px]">
                  <Image src="/ui/hotbar-slot.png" alt="" fill sizes="58px" style={{ imageRendering: 'pixelated' }} />
                  <Image
                    src={`/room/sprites/${s.id}.png`}
                    alt=""
                    width={36}
                    height={36}
                    className="absolute left-[11px] top-[11px] h-[36px] w-[36px] object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <Image
                    src="/ui/hotbar-selected.png"
                    alt=""
                    width={66}
                    height={66}
                    className="absolute -left-[4px] -top-[4px] max-w-none opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                  />
                  <span aria-hidden className="absolute left-[6px] top-[3px] text-[11px] text-[#fff3d6]" style={PIXEL_TEXT}>
                    {slot.slot}
                  </span>
                </span>
                <span aria-hidden className="text-[10px] uppercase tracking-[.12em] text-[#f3e3c4]" style={PIXEL_TEXT}>
                  {slot.label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
```

- [ ] **Step 4: Write `components/room/RoomBar.tsx` and `components/room/RoomBackdrop.tsx`**

```tsx
import Link from 'next/link'
import { pathFor } from '@/components/os/view'

/** The Résumé link, fixed in a corner from the first frame (spec §1, §3). */
export function RoomBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-end p-[clamp(12px,2vw,24px)]">
      <Link
        href={pathFor({ zoomed: true, app: 'resume' })}
        scroll={false}
        className="pointer-events-auto rounded-[8px] px-[14px] py-[8px] text-[12px] uppercase tracking-[.24em] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0802C]"
        style={{ background: 'rgba(246,239,227,.92)', color: '#241B12', fontFamily: 'var(--font-pixel)' }}
      >
        Résumé
      </Link>
    </div>
  )
}
```

```tsx
import Image from 'next/image'

/** The room, blurred and darkened, filling the bands around it: the art is
 *  wider than most screens, and the bands should feel like the same room. */
export function RoomBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <Image
        src="/room/base.png"
        alt=""
        fill
        sizes="40vw"
        className="scale-110 object-cover"
        style={{ filter: 'blur(26px) brightness(.5) saturate(1.1)' }}
      />
    </div>
  )
}
```

- [ ] **Step 5: Run the test, typecheck and lint**

Run: `npx vitest run components/room && npm run typecheck && npm run lint`
Expected: PASS, clean.

- [ ] **Step 6: Commit**

```bash
git add components/room
git commit -m "Add the hotbar, the Résumé link and the room backdrop

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: The overlay host and game cards

**Files:**
- Create: `components/overlays/Overlay.tsx`, `components/overlays/GameCard.tsx`, `app/cards/[id]/page.tsx`
- Test: `components/overlays/__tests__/overlays.test.tsx`

**Interfaces:**
- Consumes: `getCards`, `getCard`, `siblings` (Task 4); `cardPath` (Task 5).
- Produces:
  - `Overlay({ label: string; children: ReactNode })`: a modal `dialog` named `label`; Esc and the backdrop ("Close") push `/`; focus moves into it and Tab stays in it; it flies in (fades under reduced motion)
  - `GameCard({ card: CardView; prev: string | null; next: string | null })` with `interface CardView { id; tag; title; photo; stat?; body: readonly string[] }`; arrow keys, swipe and the "Previous"/"Next" links `replace` to a sibling
  - `FRAME`: the frame's measured panels in px of `public/ui/card-frame.png` (720 × 1099)
  - `/cards/[id]`: a static page per card; unknown ids 404

- [ ] **Step 1: Write the failing test**

`components/overlays/__tests__/overlays.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'

const nav = vi.hoisted(() => {
  const push = vi.fn()
  const replace = vi.fn()
  return { push, replace, router: { push, replace, back: () => {}, prefetch: () => {} } }
})
vi.mock('next/navigation', () => ({ useRouter: () => nav.router, usePathname: () => '/cards/x' }))

import { GameCard, type CardView } from '../GameCard'
import { Overlay } from '../Overlay'

const card: CardView = {
  id: 'school-hkust', tag: 'SCHOOL · HKUST · 2025', title: 'HKUST', photo: '/room/sprites/flags.png',
  stat: 'GPA 3.96', body: ['The second stop.', 'Hong Kong.'],
}

beforeEach(() => { nav.push.mockClear(); nav.replace.mockClear() })

describe('Overlay', () => {
  it('closes to the room on Esc and on a click outside', () => {
    render(<Overlay label="HKUST"><button type="button">inside</button></Overlay>)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(nav.push).toHaveBeenLastCalledWith('/', { scroll: false })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(nav.push).toHaveBeenCalledTimes(2)
  })

  it('takes focus and names itself', () => {
    render(<Overlay label="HKUST"><p>card</p></Overlay>)
    const dialog = screen.getByRole('dialog', { name: 'HKUST' })
    expect(document.activeElement).toBe(dialog)
  })
})

describe('GameCard', () => {
  it('shows the title, tag, story and stat', () => {
    render(<GameCard card={card} prev={null} next={null} />)
    expect(screen.getByRole('heading', { level: 2, name: 'HKUST' })).toBeTruthy()
    for (const text of [card.tag, ...card.body, card.stat!]) expect(screen.getByText(text)).toBeTruthy()
  })

  it('shows only the neighbours that exist', () => {
    const { rerender } = render(<GameCard card={card} prev={null} next="school-bocconi" />)
    expect(screen.queryByRole('link', { name: /Previous/ })).toBeNull()
    expect(screen.getByRole('link', { name: /Next/ }).getAttribute('href')).toBe('/cards/school-bocconi')
    rerender(<GameCard card={card} prev="school-usc" next={null} />)
    expect(screen.getByRole('link', { name: /Previous/ }).getAttribute('href')).toBe('/cards/school-usc')
    expect(screen.queryByRole('link', { name: /Next/ })).toBeNull()
  })

  it('steps through the set with the arrow keys, and not past the end', () => {
    render(<GameCard card={card} prev="school-usc" next={null} />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(nav.replace).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(nav.replace).toHaveBeenCalledWith('/cards/school-usc', { scroll: false })
  })

  it('is in the server HTML', () => {
    const html = renderToString(<GameCard card={card} prev={null} next={null} />)
    expect(html).toContain('The second stop.')
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run components/overlays`
Expected: FAIL, cannot resolve `../GameCard`.

- [ ] **Step 3: Write `components/overlays/Overlay.tsx`**

```tsx
'use client'
import { MotionConfig, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, type ReactNode } from 'react'

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * The overlay host (spec §4, §5): a modal over the room. Every overlay is a
 * route whose page renders one of these, so it is server-rendered and has its
 * own URL; the room stays mounted underneath in the root layout. It closes
 * with Esc, a click outside, or the back button (which is just navigation),
 * and keeps keyboard focus inside while open. The OS root returns focus to
 * the object that opened it.
 */
export function Overlay({ label, children }: { label: string; children: ReactNode }) {
  const router = useRouter()
  const dialog = useRef<HTMLDivElement>(null)
  const close = useCallback(() => router.push('/', { scroll: false }), [router])

  useEffect(() => { dialog.current?.focus() }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.key === 'Escape') { event.preventDefault(); close(); return }
      if (event.key !== 'Tab' || !dialog.current) return
      const focusable = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (focusable.length === 0) { event.preventDefault(); return }
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  return (
    <MotionConfig reducedMotion="user">
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="absolute inset-0 cursor-default"
          style={{ background: 'rgba(12,8,6,.55)' }}
        />
        <motion.div
          ref={dialog}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          className="relative outline-none"
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        >
          {children}
        </motion.div>
      </div>
    </MotionConfig>
  )
}
```

- [ ] **Step 4: Write `components/overlays/GameCard.tsx`**

```tsx
'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { cardPath } from '@/components/os/view'

export interface CardView {
  id: string
  tag: string
  title: string
  photo: string
  stat?: string
  body: readonly string[]
}

/** The frame's transparent photo window and cream panels, in px of
 *  public/ui/card-frame.png (720 × 1099), measured from the file. */
export const FRAME = {
  w: 720,
  h: 1099,
  photo: [77, 74, 644, 541],
  banner: [56, 584, 666, 661],
  text: [56, 703, 666, 938],
  stat: [56, 979, 666, 1026],
} as const

const place = ([x0, y0, x1, y1]: readonly number[]) => ({
  left: `${(x0 / FRAME.w) * 100}%`,
  top: `${(y0 / FRAME.h) * 100}%`,
  width: `${((x1 - x0) / FRAME.w) * 100}%`,
  height: `${((y1 - y0) / FRAME.h) * 100}%`,
})

const SWIPE = 50 // px

/**
 * One trading-card frame for every game card (spec §4): photo, name, type tag,
 * a short story, an optional stat line. Cards in a set (the three schools)
 * step with the arrow keys, a swipe, or the links under the card; each step
 * replaces the URL so the back button still leaves the set in one press.
 */
export function GameCard({ card, prev, next }: { card: CardView; prev: string | null; next: string | null }) {
  const router = useRouter()
  const start = useRef<number | null>(null)
  const go = (id: string | null) => { if (id) router.replace(cardPath(id), { scroll: false }) }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && prev) router.replace(cardPath(prev), { scroll: false })
      if (event.key === 'ArrowRight' && next) router.replace(cardPath(next), { scroll: false })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, router])

  return (
    <div className="flex flex-col items-center gap-[14px]">
      <article
        className="relative w-[min(380px,82vw)] touch-pan-y select-none [container-type:inline-size]"
        style={{ aspectRatio: `${FRAME.w} / ${FRAME.h}` }}
        onPointerDown={(event) => { start.current = event.clientX }}
        onPointerUp={(event) => {
          const from = start.current
          start.current = null
          if (from === null) return
          const dx = event.clientX - from
          if (dx < -SWIPE) go(next)
          if (dx > SWIPE) go(prev)
        }}
      >
        <div className="absolute overflow-hidden bg-[#1f160f]" style={place(FRAME.photo)}>
          <Image src={card.photo} alt="" fill sizes="380px" className="object-contain p-[6%]" style={{ imageRendering: 'pixelated' }} />
        </div>
        <Image src="/ui/card-frame.png" alt="" fill sizes="380px" priority className="pointer-events-none" />
        <h2
          className="absolute flex items-center justify-center px-[4cqw] text-center"
          style={{ ...place(FRAME.banner), fontFamily: 'var(--font-pixel)', fontSize: '4.6cqw', color: '#2a1a0e' }}
        >
          {card.title}
        </h2>
        <div className="absolute overflow-hidden px-[5cqw] py-[3.4cqw]" style={place(FRAME.text)}>
          <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '2.8cqw', letterSpacing: '.12em', color: '#8a5a2b' }}>
            {card.tag}
          </p>
          {card.body.map((paragraph) => (
            <p key={paragraph} className="mt-[2cqw]" style={{ fontFamily: 'var(--font-ui)', fontSize: '3.9cqw', lineHeight: 1.4, color: '#3a2a1c' }}>
              {paragraph}
            </p>
          ))}
        </div>
        {card.stat && (
          <p
            className="absolute flex items-center justify-center"
            style={{ ...place(FRAME.stat), fontFamily: 'var(--font-pixel)', fontSize: '3.2cqw', color: '#3a2a1c' }}
          >
            {card.stat}
          </p>
        )}
      </article>

      {(prev || next) && (
        <nav aria-label="More cards" className="flex w-[min(380px,82vw)] justify-between text-[12px] uppercase tracking-[.2em] text-[#f3e3c4]" style={{ fontFamily: 'var(--font-pixel)' }}>
          {prev ? <Link href={cardPath(prev)} replace scroll={false} className="hover:underline">← Previous</Link> : <span />}
          {next ? <Link href={cardPath(next)} replace scroll={false} className="hover:underline">Next →</Link> : <span />}
        </nav>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Write `app/cards/[id]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GameCard } from '@/components/overlays/GameCard'
import { Overlay } from '@/components/overlays/Overlay'
import { getCard, getCards, siblings } from '@/content/cards'

/** Only the cards in content/cards exist; anything else under /cards is a 404. */
export const dynamicParams = false

export function generateStaticParams() {
  return getCards().map((card) => ({ id: card.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: getCard(id)?.title }
}

/** A game card over the room. The room is drawn by <OS /> in the root layout. */
export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = getCard(id)
  if (!card) notFound()
  const { prev, next } = siblings(card)
  return (
    <Overlay label={card.title}>
      <GameCard
        card={{ id: card.id, tag: card.tag, title: card.title, photo: card.photo, stat: card.stat, body: card.body }}
        prev={prev?.id ?? null}
        next={next?.id ?? null}
      />
    </Overlay>
  )
}
```

- [ ] **Step 6: Run the tests, typecheck, lint and build**

Run: `npx vitest run components/overlays && npm run typecheck && npm run lint && npm run build`
Expected: PASS (6), clean; the build lists twelve `/cards/[id]` pages.

- [ ] **Step 7: Commit**

```bash
git add components/overlays app/cards
git commit -m "Open game cards over the room at their own URLs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Wire the room into the OS

**Files:**
- Modify: `components/os/OS.tsx`, `components/os/intro/useZoom.ts` (drop `hit`), `components/os/intro/__tests__/Laptop.test.tsx` (drop `hit` from the stub)
- Delete: `components/os/RoomChrome.tsx`
- Test: `components/os/__tests__/OS.test.tsx` (rewritten room section)

**Interfaces:**
- Consumes: everything above.
- Produces: the finished room. In it, the hotbar, the Résumé link and the backdrop sit around the layered room. The pan follows the pointer (instantly under reduced motion). Number keys 1–9 pick slots in the room only. Cards open at `/cards/<id>`. While a card is open, the room and hotbar are inert and the wheel does nothing. Closing a card returns focus to the object that opened it.

- [ ] **Step 1: Rewrite the room tests**

In `components/os/__tests__/OS.test.tsx`, replace the whole `describe('the room', ...)` block (all of its tests, including "the laptop hit area…") with the block below. Add `import { HOTBAR } from '@/content/room'`, and leave the other `describe` blocks as they are.

```tsx
describe('the room', () => {
  it('introduces him on the whiteboard and puts the Résumé one click away', () => {
    render(<OS />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(PROFILE.name)
    expect(screen.getByRole('link', { name: 'Résumé' }).getAttribute('href')).toBe('/work/resume')
  })

  it('opens the laptop from the laptop', () => {
    render(<OS />)
    fireEvent.click(screen.getByRole('button', { name: /^Laptop:/ }))
    expect(nav.push).toHaveBeenCalledWith('/work', PUSH_OPTS)
  })

  it('opens a game card from an object', () => {
    render(<OS />)
    fireEvent.click(screen.getByRole('button', { name: 'Photo: My dog' }))
    expect(nav.push).toHaveBeenCalledWith('/cards/dog', PUSH_OPTS)
  })

  it('has hotbar slots that act exactly like their objects', () => {
    render(<OS />)
    fireEvent.click(screen.getByRole('button', { name: '1: Work' }))
    expect(nav.push).toHaveBeenLastCalledWith('/work', PUSH_OPTS)
    fireEvent.click(screen.getByRole('button', { name: '7: Schools' }))
    expect(nav.push).toHaveBeenLastCalledWith('/cards/school-usc', PUSH_OPTS)
  })

  it('lights the objects a hotbar slot names', () => {
    const { container } = render(<OS />)
    fireEvent.mouseEnter(screen.getByRole('button', { name: '9: Photos' }))
    const lit = [...container.querySelectorAll('img[data-lit="true"]')].map((i) => i.getAttribute('data-sprite'))
    expect(lit.sort()).toEqual(['photo-beach', 'photo-dog'])
  })

  it('number keys pick hotbar slots', () => {
    render(<OS />)
    fireEvent.keyDown(window, { key: '2' })
    expect(nav.push).toHaveBeenCalledWith('/cards/journal', PUSH_OPTS)
    expect(HOTBAR[1].objects).toEqual(['journal'])
  })

  it('number keys with a modifier are left to the browser', () => {
    render(<OS />)
    fireEvent.keyDown(window, { key: '1', metaKey: true })
    fireEvent.keyDown(window, { key: '1', ctrlKey: true })
    fireEvent.keyDown(window, { key: '1', altKey: true })
    expect(nav.push).not.toHaveBeenCalled()
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

  it('never hides the focused Résumé link from assistive tech', () => {
    const { rerender } = render(<OS />)
    screen.getByRole('link', { name: 'Résumé' }).focus()
    at('/work/resume')
    rerender(<OS />)
    expect(document.activeElement?.closest('[aria-hidden="true"]')).toBeNull()
  })

  it('falls back to the room on an unknown path', () => {
    at('/work/nope')
    render(<OS />)
    expect(screen.getByRole('button', { name: /^Laptop:/ })).toBeTruthy()
  })

  it('hotbar keys do nothing on the desktop', () => {
    at('/work')
    render(<OS />)
    fireEvent.keyDown(window, { key: '2' })
    expect(nav.push).not.toHaveBeenCalled()
  })
})

describe('a card over the room', () => {
  it('keeps the room still: no wheel, no hotbar keys, no object input', () => {
    at('/cards/dog')
    const { container } = render(<OS />)
    fireEvent.wheel(window, { deltaY: 40 })
    fireEvent.keyDown(window, { key: '1' })
    expect(nav.push).not.toHaveBeenCalled()
    expect(container.querySelector('[data-room-object="laptop"]')?.closest('[inert]')).not.toBeNull()
  })

  it('returns focus to the object that opened it', () => {
    const { rerender } = render(<OS />)
    const dog = screen.getByRole('button', { name: 'Photo: My dog' })
    dog.focus()
    fireEvent.click(dog)
    at('/cards/dog')
    rerender(<OS />)
    dog.blur() // the card took focus
    expect(document.activeElement).not.toBe(dog)
    at('/')
    rerender(<OS />)
    expect(document.activeElement).toBe(dog)
  })
})
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run components/os/__tests__/OS.test.tsx`
Expected: FAIL. The h1 is the old name card, and there are no object buttons, no hotbar and no `/cards` handling.

- [ ] **Step 3: Rewrite `components/os/OS.tsx`**

Replace the imports, everything from `export function OS() {` to the end, and the doc comment above it with:

```tsx
'use client'
import { MotionConfig, motion, useMotionValue, useSpring } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Hotbar } from '@/components/room/Hotbar'
import { RoomBackdrop } from '@/components/room/RoomBackdrop'
import { RoomBar } from '@/components/room/RoomBar'
import { RoomScene } from '@/components/room/RoomScene'
import { WhiteboardIntro } from '@/components/room/WhiteboardIntro'
import { panFor } from '@/components/room/layout'
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
  const openLaptop = useCallback(() => go(pathFor(DESKTOP)), [go])
  const closeApp = useCallback(() => go(pathFor(DESKTOP)), [go])
  const openApp = useCallback((id: AppId) => go(pathFor({ zoomed: true, app: id })), [go])
  const openSpotlight = useCallback(() => setSpotlightAt(pathname), [pathname, setSpotlightAt])
  const closeSpotlight = useCallback(() => setSpotlightAt(null), [setSpotlightAt])

  const activate = useCallback((id: string) => {
    const object = ROOM_OBJECTS.find((o) => o.id === id)
    if (!object) return
    opener.current = id
    if (object.action.kind === 'zoom') openLaptop()
    else go(cardPath(object.action.card))
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
  }, [mode, view.app, view.zoomed, landed, pathname, spotlight, closeSpotlight, go, roomActive, activateSlot])

  // Scrolling is a shortcut both ways: down in the room goes into the laptop,
  // up on the landed desktop comes back out. A trackpad flick is dozens of
  // wheel events, so each direction fires once per visit. Nothing while a card is open.
  useEffect(() => {
    if (mode !== 'os' || overlayOpen) return
    let fired = false
    const onWheel = (event: WheelEvent) => {
      if (fired) return
      if (!view.zoomed) {
        if (!isDownwardWheel(event.deltaY)) return
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
  }, [mode, overlayOpen, view.zoomed, landed, openLaptop, go])

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
            <RoomScene lit={lit} disabled={!roomActive} onActivate={activate}>
              <WhiteboardIntro />
            </RoomScene>
          )}
        >
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
```

- [ ] **Step 4: Remove `RoomChrome` and `hit`**

```bash
git rm components/os/RoomChrome.tsx
```

In `useZoom.ts`, delete the `hit` field from the `Zoom` interface and the `hit:` line from the returned object. In `Laptop.test.tsx`, delete `hit: null,` from `stub`.

- [ ] **Step 5: Run everything**

Run: `npm test && npm run typecheck && npm run lint && npm run build`
Expected: all tests pass; clean; the build lists `/`, `/work`, four `/work/[app]` pages and twelve `/cards/[id]` pages.

- [ ] **Step 6: Commit**

```bash
git add -A components app
git commit -m "Make the room interactive: hover, hotbar, pan and game cards

The layered room replaces the flat picture. Objects glow and name
themselves on hover; the hotbar lights and opens them, with 1-9 as
shortcuts; the room pans with the cursor; cards open at /cards/<id>
over a still room and hand focus back when they close.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Click-through

**Files:** none, unless the click-through finds a bug. A bug gets a failing test first, in the task that owns the code.

- [ ] **Step 1: In a real browser at 1440×900** (dev server; use the one already on :3000 if it is running):

1. `/`: the whole room is visible, the bands are filled by the blurred room, the hotbar is at the bottom, "Résumé" is top right, and the intro is on the whiteboard. Screenshot.
2. Move the pointer to the far left: the surfboard's edge comes into view and no black shows past it. Far right: the window's edge. Leave the page: the room eases back to centre.
3. Hover the laptop, the globe, a flag and a photo: each glows along its own outline and gets a pixel tooltip. Hover the laptop lid where it overlaps the whiteboard: the laptop lights, not the board.
4. Hover hotbar slot 9: both photos glow.
5. Press `7`: the USC card opens at `/cards/school-usc`. Press → twice (HKUST, Bocconi), → again does nothing, Esc returns to `/` and focus is on the flags. Screenshot of a card.
6. Click the dog photo: card. Click outside: closed. Browser Back: the card again.
7. Click the laptop: the zoom flies from wherever the room is panned and lands exactly. `getComputedStyle` up the chain from the dock shows no transform except identity. Esc twice: back in the room, panned where it was.
8. Reduced motion: no pan easing (the room tracks the pointer directly), the laptop cuts, and the card fades instead of flying.
9. Load `/cards/school-hkust` directly: the room renders behind the card; Previous and Next both show.
10. Check the console on `/`, `/cards/dog` and `/work/resume` for errors and hydration warnings.

- [ ] **Step 2: Push**

```bash
git push
```

Phase 3 is done when Rayyan has clicked through it on his localhost.
