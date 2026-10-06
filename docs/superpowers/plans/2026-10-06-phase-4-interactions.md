# Phase 4 (Interactions) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the record player, bookshelf, journal, globe and window their own interactions at their own URLs. The window and the whole room follow San Diego's real time of day.

**Architecture:** Each interaction is a route whose page renders an `Overlay` (phase 3) over the still room. Content lives in `content/` (Markdown for books, journal and places; JSON for records). Song previews and album art are resolved once, by a script against the iTunes Search API, into a generated JSON file and local pixelated art. Playback lives in a provider in the root layout, so a "now playing" chip keeps going while you explore. Time of day comes from suncalc at San Diego's coordinates. It switches the room between the sunset, day and night art produced in phase 2.

**Tech Stack:** Next.js 16 App Router, React 19, framer-motion 12, Vitest + Testing Library. New dependencies: `suncalc`, `d3-geo`, `topojson-client`, `world-atlas`, plus their type packages.

**Spec:** `docs/superpowers/specs/2026-10-06-personal-website-design.md`, §4 (record player, bookshelf, journal, globe and window rows), §5, §7 phase 4, §8 (time-of-day tests).

## Global Constraints

- Every overlay has its own URL, closes with Esc, a click outside, or Back, and is server-rendered (spec §4).
- Record previews come from the **iTunes Search API**, resolved at build time into generated JSON, with a link to Apple Music for attribution. Playback starts only on the user's click (spec §4).
- Window time of day is **San Diego's** (`America/Los_Angeles`), with sunrise and sunset from **suncalc** at SD's coordinates (spec §2, §4).
- Globe: **d3-geo** orthographic + world-atlas TopoJSON, drawn on a low-resolution canvas scaled up with `image-rendering: pixelated` (spec §4).
- Adding a book, a trip or a post means adding a file (spec §5).
- Reduced motion: no spinning globe, no spinning record; overlays fade (spec §3).
- Nothing imports from `reference/`. Every commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Deliberate scope choices

- **Draft content.** Rayyan hasn't sent his songs, reviews, journal posts or places yet (spec §9), so this phase ships clearly marked drafts:
  - one well-known song per artist the spec names;
  - the eight books, with a one-line "review on its way";
  - one journal entry written from what he said about beauty;
  - five places from his résumé.
  Each is a file to edit.
- **Simpler choreography.** The spec describes a book sliding off the shelf and a sleeve sliding onto the platter. Here the overlay flies in, the record spins on a platter, and the book opens to its spread. The full in-room motion can follow once the content is real.
- **Day and night use their full art.** No day or night base layer exists (phase 2 built only the sunset one). The room draws the variant's full picture as the base, with the variant's sprites on top, which are identical pixels. That's enough while nothing in the room moves.
- **Nested overlays go back one level.** For example, a book closes to the shelf and the shelf closes to the room. Overlay history becomes a depth counter that is reset whenever the room is showing.

## Review Focus

1. **Time of day near the boundaries**, from sunset into dusk and from dawn into sunrise, must classify consistently and never throw. (Task 2, tests built from suncalc's own times for a fixed date)
2. **Nested overlay history.** Room → shelf → book, then Esc, Esc: book → shelf → room, and Back afterwards leaves. A cold deep link to a book closes to the room. (Task 1 history tests; Task 8 click-through)
3. **A song with no preview, or an iTunes search that finds the wrong artist,** must not ship a wrong or broken track. The resolver matches on artist and fails loudly. (Task 3, test "every record resolved to its own artist")
4. **Pins on the far side of the globe** must not be clickable or visible. (Task 7, test "hides a pin on the far side")
5. **Playing a second record while one plays** switches tracks cleanly. Closing the record player keeps the music and the chip. (Task 3, test "switches tracks"; Task 8)

---

### Task 1: Overlay routes, history depth and the manifest

**Files:**
- Modify: `components/overlays/history.ts` (depth counter), `components/os/view.ts` (`isRoomOverlay`), `content/room.ts` (`overlay` action), `components/os/OS.tsx` (overlay actions; reset depth in the room)
- Create: `components/overlays/InAppLink.tsx`
- Delete: `content/cards/{music,books,journal,travel,san-diego}.md`
- Test: `components/overlays/__tests__/history.test.ts`, `components/os/__tests__/view.test.ts`, `content/__tests__/{room,cards}.test.ts`, `components/os/__tests__/OS.test.tsx`

**Interfaces:**
- Produces:
  - `markOverlayOpenedInApp()`, `consumeOpenedInApp(): boolean`, `resetOverlayDepth()`
  - `InAppLink(props: LinkProps & { children; className?; style?; 'aria-label'? })`: a `next/link` that marks an in-app overlay step on click
  - `RoomAction` gains `{ kind: 'overlay'; href: string }`
  - `isRoomOverlay` covers `/cards/:id`, `/music`, `/books`, `/books/:slug`, `/journal`, `/journal/:slug`, `/places`, `/places/:slug`, `/san-diego`

- [ ] **Step 1: Write the failing tests**

`components/overlays/__tests__/history.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { consumeOpenedInApp, markOverlayOpenedInApp, resetOverlayDepth } from '../history'

beforeEach(() => resetOverlayDepth())

describe('overlay history', () => {
  it('goes back once per in-app step, then stops', () => {
    markOverlayOpenedInApp() // room → shelf
    markOverlayOpenedInApp() // shelf → book
    expect(consumeOpenedInApp()).toBe(true) // book → shelf
    expect(consumeOpenedInApp()).toBe(true) // shelf → room
    expect(consumeOpenedInApp()).toBe(false) // nothing left: push the room
  })

  it('forgets everything once the room is showing', () => {
    markOverlayOpenedInApp()
    resetOverlayDepth()
    expect(consumeOpenedInApp()).toBe(false)
  })
})
```

In `components/os/__tests__/view.test.ts`, replace the body of "are the card paths and nothing else" with:

```ts
  it('are the overlay paths and nothing else', () => {
    for (const p of ['/cards/dog', '/cards/dog/', '/music', '/books', '/books/contact', '/journal',
      '/journal/on-beauty', '/places', '/places/milan', '/san-diego']) expect(isRoomOverlay(p), p).toBe(true)
    for (const p of ['/cards', '/', '/work/resume', '/books/a/b', '/musics']) expect(isRoomOverlay(p), p).toBe(false)
  })
```

(rename the test accordingly). In `content/__tests__/room.test.ts` add (and `import { isRoomOverlay } from '@/components/os/view'`):

```ts
  it('points every overlay action at a room overlay path', () => {
    const overlays = ROOM_OBJECTS.filter((o) => o.action.kind === 'overlay')
    expect(overlays.map((o) => o.id).sort()).toEqual(['bookshelf', 'globe', 'journal', 'record-player', 'window'])
    for (const o of overlays) if (o.action.kind === 'overlay') expect(isRoomOverlay(o.action.href), o.id).toBe(true)
  })
```

In `content/__tests__/cards.test.ts` change `expect(cards.length).toBe(12)` to `toBe(7)`.

In `components/os/__tests__/OS.test.tsx`, in "number keys pick hotbar slots", change the expected push to `'/journal'`, and add to `describe('the room')`:

```tsx
  it('opens an interaction from its object, marked as opened in the site', () => {
    consumeOpenedInApp()
    render(<OS />)
    fireEvent.click(screen.getByRole('button', { name: /^Record player:/ }))
    expect(nav.push).toHaveBeenCalledWith('/music', PUSH_OPTS)
    expect(consumeOpenedInApp()).toBe(true)
  })
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run components/overlays content components/os/__tests__/view.test.ts components/os/__tests__/OS.test.tsx`
Expected: FAIL. `resetOverlayDepth` is not exported, the overlay paths aren't recognised, there are no overlay actions, and the card count is 12.

- [ ] **Step 3: Implement**

`components/overlays/history.ts`, replace the module body with:

```ts
/**
 * How many overlay steps were taken inside the site since the room last
 * showed: room → shelf is one, shelf → book another. Closing an overlay goes
 * back while there are steps to undo, so Back afterwards leaves the room
 * instead of reopening what was just closed; with none (a pasted link) it
 * pushes the room. The OS root resets it whenever the room is showing.
 */

let depth = 0

export function markOverlayOpenedInApp(): void {
  depth += 1
}

/** True (and one step fewer) when closing should go back. */
export function consumeOpenedInApp(): boolean {
  if (depth === 0) return false
  depth -= 1
  return true
}

export function resetOverlayDepth(): void {
  depth = 0
}
```

`components/overlays/InAppLink.tsx`:

```tsx
'use client'
import Link, { type LinkProps } from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { markOverlayOpenedInApp } from './history'

/** A link from one overlay to a deeper one (shelf → book), so Esc steps back one level. */
export function InAppLink({
  children, className, style, 'aria-label': ariaLabel, ...props
}: LinkProps & { children: ReactNode; className?: string; style?: CSSProperties; 'aria-label'?: string }) {
  return (
    <Link {...props} scroll={false} className={className} style={style} aria-label={ariaLabel}
          onClick={() => markOverlayOpenedInApp()}>
      {children}
    </Link>
  )
}
```

`components/os/view.ts`: replace `isRoomOverlay` with:

```ts
const ROOM_OVERLAY =
  /^\/(?:cards\/[^/]+|music|books(?:\/[^/]+)?|journal(?:\/[^/]+)?|places(?:\/[^/]+)?|san-diego)\/?$/

/** Paths the room opens over itself: game cards and the five interactions. */
export function isRoomOverlay(pathname: string): boolean {
  return ROOM_OVERLAY.test(pathname)
}
```

`content/room.ts`:
- Change `RoomAction` to `{ kind: 'zoom' } | { kind: 'card'; card: string } | { kind: 'overlay'; href: string }`.
- Change the five actions: journal `{ kind: 'overlay', href: '/journal' }`, record-player `'/music'`, bookshelf `'/books'`, globe `'/places'`, window `'/san-diego'`.
- In the header comment, replace the "Phase 3: …" paragraph with "The record player, bookshelf, journal, globe and window open their own overlays (phase 4)."

`components/os/OS.tsx`:
- In `activate`, replace the `if/else` with:

```tsx
    if (object.action.kind === 'zoom') { openLaptop(); return }
    markOverlayOpenedInApp()
    go(object.action.kind === 'card' ? cardPath(object.action.card) : object.action.href)
```

- Next to the focus-return effect, add:

```tsx
  // The room is showing: no overlay steps are left to undo.
  useEffect(() => { if (!overlayOpen) resetOverlayDepth() }, [overlayOpen])
```

- Import `resetOverlayDepth` alongside `markOverlayOpenedInApp`.

Delete the five placeholder cards:

```bash
git rm -q content/cards/music.md content/cards/books.md content/cards/journal.md content/cards/travel.md content/cards/san-diego.md
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: all pass. The build will fail until the five routes exist; that's Tasks 2–7.

- [ ] **Step 5: Commit**

```bash
git add -A components content
git commit -m "Route the five interactions as overlays, with nested history

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: San Diego's time of day, and the window

**Files:**
- Create: `components/room/timeOfDay.ts`, `components/room/useTimeOfDay.ts`, `components/overlays/SanDiegoCard.tsx`, `app/san-diego/page.tsx`
- Modify: `components/room/RoomScene.tsx` (`variant`), `components/room/WhiteboardIntro.tsx` (`variant`), `components/os/OS.tsx`, `package.json`
- Test: `components/room/__tests__/timeOfDay.test.ts`, `components/room/__tests__/RoomScene.test.tsx`

**Interfaces:**
- Produces:
  - `type Variant = 'day' | 'sunset' | 'night'`, `SAN_DIEGO = { lat, lon, tz }`
  - `timeOfDay(at: Date): Variant`, `sanDiegoClock(at: Date): string` (e.g. "12:00 PM")
  - `useTimeOfDay(): { variant: Variant; now: Date | null }`: `sunset`/`null` on the server and the first render, then live, refreshed every minute
  - `RoomScene({ …, variant?: Variant })`, `WhiteboardIntro({ variant?: Variant })`
  - `/san-diego`: an overlay card with the live SD time

- [ ] **Step 1: Install**

Run: `npm install suncalc && npm install -D @types/suncalc`

- [ ] **Step 2: Write the failing tests**

`components/room/__tests__/timeOfDay.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import SunCalc from 'suncalc'
import { SAN_DIEGO, sanDiegoClock, timeOfDay } from '../timeOfDay'

// Times come from suncalc itself for a fixed day, so the test pins the
// classification, not suncalc's astronomy.
const day = new Date('2026-06-21T19:00:00Z') // noon in San Diego
const t = SunCalc.getTimes(day, SAN_DIEGO.lat, SAN_DIEGO.lon)
const mid = (a: Date, b: Date) => new Date((a.getTime() + b.getTime()) / 2)

describe('timeOfDay', () => {
  it('is day around solar noon', () => {
    expect(timeOfDay(t.solarNoon)).toBe('day')
  })

  it('is sunset through the evening golden hour, and through the morning one', () => {
    expect(timeOfDay(mid(t.goldenHour, t.dusk))).toBe('sunset')
    expect(timeOfDay(mid(t.dawn, t.goldenHourEnd))).toBe('sunset')
  })

  it('is night after dusk and before dawn', () => {
    expect(timeOfDay(new Date(t.dusk.getTime() + 60_000))).toBe('night')
    expect(timeOfDay(t.nadir)).toBe('night')
  })

  it('never throws across a whole day, minute by minute', () => {
    for (let m = 0; m < 24 * 60; m += 1) {
      expect(['day', 'sunset', 'night']).toContain(timeOfDay(new Date(day.getTime() + m * 60_000)))
    }
  })
})

describe('sanDiegoClock', () => {
  it('tells San Diego time, whatever the visitor\'s zone', () => {
    expect(sanDiegoClock(day)).toBe('12:00 PM')
  })
})
```

Append to `components/room/__tests__/RoomScene.test.tsx`:

```tsx
describe('RoomScene at night', () => {
  it('draws the night art', () => {
    const { container } = render(<RoomScene lit={[]} disabled={false} onActivate={() => {}} variant="night" />)
    const srcs = [...container.querySelectorAll('img')].map((i) => decodeURIComponent(i.getAttribute('src') ?? ''))
    expect(srcs.some((s) => s.includes('/room/night.png'))).toBe(true)
    expect(srcs.some((s) => s.includes('/room/sprites/laptop.night.png'))).toBe(true)
  })
})
```

- [ ] **Step 3: Run them to make sure they fail**

Run: `npx vitest run components/room`
Expected: FAIL, cannot resolve `../timeOfDay`, and RoomScene ignores `variant`.

- [ ] **Step 4: Write `components/room/timeOfDay.ts` and `useTimeOfDay.ts`**

```ts
import SunCalc from 'suncalc'

/** The three lightings the room is drawn in (phase 2 art). */
export type Variant = 'day' | 'sunset' | 'night'

/** Spec §2: the window shows San Diego's time, not the visitor's. */
export const SAN_DIEGO = { lat: 32.7157, lon: -117.1611, tz: 'America/Los_Angeles' } as const

/**
 * Night before dawn and after dusk; sunset through either golden hour (the
 * warm art suits dawn too); day otherwise. suncalc works on absolute
 * instants, so the visitor's time zone never enters into it.
 */
export function timeOfDay(at: Date): Variant {
  const t = SunCalc.getTimes(at, SAN_DIEGO.lat, SAN_DIEGO.lon)
  const ms = at.getTime()
  if (ms < t.dawn.getTime() || ms >= t.dusk.getTime()) return 'night'
  if (ms >= t.goldenHour.getTime() || ms < t.goldenHourEnd.getTime()) return 'sunset'
  return 'day'
}

export function sanDiegoClock(at: Date): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: SAN_DIEGO.tz, hour: 'numeric', minute: '2-digit' }).format(at)
}
```

`components/room/useTimeOfDay.ts`:

```ts
'use client'
import { useEffect, useState } from 'react'
import { timeOfDay, type Variant } from './timeOfDay'

/**
 * San Diego's time of day, live. `sunset` (the master art) and `now: null` on
 * the server and the first client render, so they agree; the real value
 * arrives in an effect and is refreshed every minute.
 */
export function useTimeOfDay(): { variant: Variant; now: Date | null } {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [])
  return { variant: now ? timeOfDay(now) : 'sunset', now }
}
```

- [ ] **Step 5: Draw the variants**

`components/room/RoomScene.tsx`:
- Add `variant = 'sunset'` (type `Variant`, imported from `./timeOfDay`) to the props.
- Base `src`: `variant === 'sunset' ? '/room/base.png' : \`/room/${variant}.png\``.
- Sprite `src`: `variant === 'sunset' ? \`/room/sprites/${s.id}.png\` : \`/room/sprites/${s.id}.${variant}.png\``.
- Add to the doc comment: "`variant` is the lighting. There are no day or night base layers, so those use their full picture as the base, with their own sprites on top (identical pixels)."

`components/room/WhiteboardIntro.tsx`: take `{ variant = 'sunset' }: { variant?: Variant }` and use the board colour per variant (sampled from the art at the board's surface):

```ts
const BOARD: Record<Variant, string> = { sunset: '190,161,131', day: '204,198,188', night: '152,120,102' }
```

in the gradient: `radial-gradient(closest-side, rgba(${BOARD[variant]},.97) 74%, rgba(${BOARD[variant]},0) 100%)`.

`components/os/OS.tsx`: `const { variant } = useTimeOfDay()`, then pass `variant={variant}` to `RoomScene` and `WhiteboardIntro`.

- [ ] **Step 6: Write `components/overlays/SanDiegoCard.tsx` and `app/san-diego/page.tsx`**

```tsx
'use client'
import { sanDiegoClock } from '@/components/room/timeOfDay'
import { useTimeOfDay } from '@/components/room/useTimeOfDay'
import { GameCard } from './GameCard'

const LINE = {
  day: 'Sun up over the Pacific.',
  sunset: 'Golden hour. The best part of the day.',
  night: 'Dark out, city lights along the water.',
} as const

/** The window's card (spec §4): San Diego right now, in its own light. The
 *  server and first render show the timeless line; the clock arrives after. */
export function SanDiegoCard() {
  const { variant, now } = useTimeOfDay()
  const photo = variant === 'sunset' ? '/room/sprites/window.png' : `/room/sprites/window.${variant}.png`
  return (
    <GameCard
      card={{
        id: 'san-diego',
        tag: 'PLACE · SAN DIEGO · NOW',
        title: 'San Diego',
        photo,
        stat: now ? `${sanDiegoClock(now)} in San Diego` : undefined,
        body: now ? ['Where I am, right now.', LINE[variant]] : ['Where I am, right now.'],
      }}
      prev={null}
      next={null}
    />
  )
}
```

```tsx
import type { Metadata } from 'next'
import { Overlay } from '@/components/overlays/Overlay'
import { SanDiegoCard } from '@/components/overlays/SanDiegoCard'

export const metadata: Metadata = { title: 'San Diego' }

/** The window: San Diego, right now. The room is drawn by <OS /> in the root layout. */
export default function SanDiegoPage() {
  return <Overlay label="San Diego"><SanDiegoCard /></Overlay>
}
```

- [ ] **Step 7: Run tests, typecheck, lint**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: PASS (6 new tests).

- [ ] **Step 8: Commit**

```bash
git add -A package.json package-lock.json components app/san-diego
git commit -m "Light the room by San Diego's real time of day, and open the window

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Records, previews and the now-playing chip

**Files:**
- Create: `content/records.json`, `scripts/content/resolve-records.mjs`, `content/records.generated.json` (script output), `public/records/*.png` (script output), `content/records.ts`, `components/music/NowPlaying.tsx`
- Modify: `app/layout.tsx` (provider), `package.json` (`content:records` script)
- Test: `content/__tests__/records.test.ts`, `components/music/__tests__/NowPlaying.test.tsx`

**Interfaces:**
- Produces:
  - `interface Track { id; artist; song; album; previewUrl; appleMusicUrl; art }`, `RECORDS: readonly Track[]`
  - `NowPlayingProvider({ children })` (renders the `<audio>` and the chip), `useNowPlaying(): { current: Track | null; playing: boolean; play(r: Track): void; toggle(): void; stop(): void }`

- [ ] **Step 1: Write the source list**

`content/records.json` (draft picks for the artists in spec §9; Rayyan replaces the songs):

```json
[
  { "id": "malcolm-todd", "artist": "Malcolm Todd", "song": "Chest Pain (I Love)" },
  { "id": "the-strokes", "artist": "The Strokes", "song": "Last Nite" },
  { "id": "daniel-caesar", "artist": "Daniel Caesar", "song": "Best Part" },
  { "id": "kendrick-lamar", "artist": "Kendrick Lamar", "song": "Money Trees" },
  { "id": "sade", "artist": "Sade", "song": "No Ordinary Love" },
  { "id": "kanye-west", "artist": "Kanye West", "song": "Runaway" },
  { "id": "marvin-gaye", "artist": "Marvin Gaye", "song": "What's Going On" }
]
```

- [ ] **Step 2: Write `scripts/content/resolve-records.mjs`**

```js
// Resolves content/records.json against the iTunes Search API (spec §4): a
// 30-second preview URL and an Apple Music link per record, plus the album
// art downsampled to 40 px so it reads as pixel art when scaled up. Run when
// the list changes: npm run content:records
//
// A search can return the song by someone else first (a feature, a cover), so
// a result must match the artist; anything unresolved fails the run rather
// than shipping a wrong track.

import sharp from 'sharp'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const records = JSON.parse(readFileSync('content/records.json', 'utf8'))
mkdirSync('public/records', { recursive: true })
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '')

const out = []
for (const r of records) {
  const url = `https://itunes.apple.com/search?${new URLSearchParams({ term: `${r.artist} ${r.song}`, entity: 'song', limit: '25', country: 'US' })}`
  const { results } = await (await fetch(url)).json()
  const byArtist = results.filter((x) => norm(x.artistName).includes(norm(r.artist)) && x.previewUrl)
  const hit = byArtist.find((x) => norm(x.trackName).startsWith(norm(r.song))) ?? byArtist[0]
  if (!hit) throw new Error(`no iTunes preview for ${r.artist} – ${r.song}`)
  const art = await (await fetch(hit.artworkUrl100.replace('100x100bb', '300x300bb'))).arrayBuffer()
  await sharp(Buffer.from(art)).resize(40, 40).png().toFile(`public/records/${r.id}.png`)
  out.push({
    id: r.id,
    artist: r.artist,
    song: r.song,
    album: hit.collectionName,
    previewUrl: hit.previewUrl,
    appleMusicUrl: hit.trackViewUrl,
    art: `/records/${r.id}.png`,
  })
  console.log(`${r.artist} – ${r.song}: ${hit.artistName} / ${hit.trackName} (${hit.collectionName})`)
}
writeFileSync('content/records.generated.json', JSON.stringify(out, null, 2) + '\n')
```

Add to `package.json` scripts: `"content:records": "node scripts/content/resolve-records.mjs"`.

- [ ] **Step 3: Write the failing test**

`content/__tests__/records.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import source from '../records.json'
import { RECORDS } from '../records'

describe('the records', () => {
  it('every record resolved to its own artist, with a preview and an Apple Music link', () => {
    expect(RECORDS.map((r) => r.id)).toEqual(source.map((r) => r.id))
    for (const r of RECORDS) {
      expect(r.previewUrl, r.id).toMatch(/^https:\/\//)
      expect(r.appleMusicUrl, r.id).toMatch(/^https:\/\/music\.apple\.com\//)
      expect(fs.existsSync(path.join(process.cwd(), 'public', r.art)), r.art).toBe(true)
    }
  })
})
```

Run: `npx vitest run content/__tests__/records.test.ts`
Expected: FAIL, cannot resolve `../records`.

- [ ] **Step 4: Resolve and write the loader**

Run: `npm run content:records`
Expected: seven lines, each naming the right artist. If a line shows the wrong song or the run throws, adjust that entry in `content/records.json` (song spelling) and re-run.

`content/records.ts`:

```ts
import generated from './records.generated.json'

/** A record in the crate (spec §4). Generated by `npm run content:records`
 *  from content/records.json; edit that file, not the generated one. */
export interface Track {
  id: string
  artist: string
  song: string
  album: string
  previewUrl: string
  appleMusicUrl: string
  /** Pixel album art under /public. */
  art: string
}

export const RECORDS: readonly Track[] = generated
```

Run: `npx vitest run content/__tests__/records.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing NowPlaying test**

`components/music/__tests__/NowPlaying.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { RECORDS } from '@/content/records'
import { NowPlayingProvider, useNowPlaying } from '../NowPlaying'

function Picker() {
  const { play } = useNowPlaying()
  return (
    <>
      <button type="button" onClick={() => play(RECORDS[0])}>first</button>
      <button type="button" onClick={() => play(RECORDS[1])}>second</button>
    </>
  )
}

let play: ReturnType<typeof vi.fn>
let pause: ReturnType<typeof vi.fn>
beforeEach(() => {
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause)
})
afterEach(() => vi.restoreAllMocks())

describe('NowPlaying', () => {
  it('shows nothing until something plays', () => {
    render(<NowPlayingProvider><Picker /></NowPlayingProvider>)
    expect(screen.queryByRole('region', { name: 'Now playing' })).toBeNull()
  })

  it('plays on click and shows the chip with attribution', async () => {
    const { container } = render(<NowPlayingProvider><Picker /></NowPlayingProvider>)
    await act(async () => { fireEvent.click(screen.getByText('first')) })
    expect(play).toHaveBeenCalled()
    expect(container.querySelector('audio')?.getAttribute('src')).toBe(RECORDS[0].previewUrl)
    const chip = screen.getByRole('region', { name: 'Now playing' })
    expect(chip.textContent).toContain(RECORDS[0].song)
    expect(screen.getByRole('link', { name: /Apple Music/ }).getAttribute('href')).toBe(RECORDS[0].appleMusicUrl)
  })

  it('switches tracks when another record is picked', async () => {
    const { container } = render(<NowPlayingProvider><Picker /></NowPlayingProvider>)
    await act(async () => { fireEvent.click(screen.getByText('first')) })
    await act(async () => { fireEvent.click(screen.getByText('second')) })
    expect(container.querySelector('audio')?.getAttribute('src')).toBe(RECORDS[1].previewUrl)
    expect(screen.getByRole('region', { name: 'Now playing' }).textContent).toContain(RECORDS[1].song)
  })

  it('pauses and stops from the chip', async () => {
    render(<NowPlayingProvider><Picker /></NowPlayingProvider>)
    await act(async () => { fireEvent.click(screen.getByText('first')) })
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(pause).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(screen.queryByRole('region', { name: 'Now playing' })).toBeNull()
  })
})
```

Run: `npx vitest run components/music`
Expected: FAIL, cannot resolve `../NowPlaying`.

- [ ] **Step 6: Write `components/music/NowPlaying.tsx`**

```tsx
'use client'
import Image from 'next/image'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Track } from '@/content/records'

interface NowPlaying {
  current: Track | null
  playing: boolean
  play: (record: Track) => void
  toggle: () => void
  stop: () => void
}

const Ctx = createContext<NowPlaying | null>(null)

export function useNowPlaying(): NowPlaying {
  const value = useContext(Ctx)
  if (!value) throw new Error('useNowPlaying outside NowPlayingProvider')
  return value
}

/**
 * The record player's audio (spec §4). It lives in the root layout, not in the
 * /music overlay, so a preview keeps playing while you explore and the chip
 * stays in the corner. Playback only ever starts from a click.
 */
export function NowPlayingProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [current, setCurrent] = useState<Track | null>(null)
  const [playing, setPlaying] = useState(false)

  const play = useCallback((record: Track) => {
    const el = audio.current
    if (!el) return
    if (el.getAttribute('src') !== record.previewUrl) el.src = record.previewUrl
    setCurrent(record)
    Promise.resolve(el.play()).then(() => setPlaying(true)).catch(() => setPlaying(false))
  }, [])

  const toggle = useCallback(() => {
    const el = audio.current
    if (!el || !current) return
    if (playing) { el.pause(); setPlaying(false) }
    else Promise.resolve(el.play()).then(() => setPlaying(true)).catch(() => setPlaying(false))
  }, [current, playing])

  const stop = useCallback(() => {
    audio.current?.pause()
    setPlaying(false)
    setCurrent(null)
  }, [])

  const value = useMemo(() => ({ current, playing, play, toggle, stop }), [current, playing, play, toggle, stop])

  return (
    <Ctx.Provider value={value}>
      {children}
      <audio ref={audio} preload="none" onEnded={() => setPlaying(false)} />
      {current && (
        <section
          aria-label="Now playing"
          className="fixed bottom-[16px] left-[16px] z-[95] flex items-center gap-[10px] rounded-[12px] py-[8px] pl-[8px] pr-[12px] text-[#f3e3c4]"
          style={{ background: 'rgba(22,14,9,.82)', border: '1px solid rgba(255,214,140,.25)', fontFamily: 'var(--font-pixel)' }}
        >
          <Image src={current.art} alt="" width={40} height={40} className={playing ? 'vinyl-spin rounded-full' : 'rounded-full'} style={{ imageRendering: 'pixelated' }} />
          <span className="min-w-0">
            <span className="block text-[10px] uppercase tracking-[.16em] text-[#d9b98a]">Now playing</span>
            <span className="block max-w-[220px] truncate text-[12px]">{current.song} · {current.artist}</span>
            <a href={current.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] underline-offset-2 hover:underline">
              Listen on Apple Music
            </a>
          </span>
          <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="ml-[4px] rounded-[6px] px-[8px] py-[4px] text-[12px] hover:bg-white/10">
            {playing ? '❚❚' : '▶'}
          </button>
          <button type="button" onClick={stop} aria-label="Stop" className="rounded-[6px] px-[6px] py-[4px] text-[12px] hover:bg-white/10">×</button>
        </section>
      )}
    </Ctx.Provider>
  )
}
```

Add to `app/globals.css` (after the room-sprite rules):

```css
@keyframes vinyl-spin { to { transform: rotate(360deg); } }
.vinyl-spin { animation: vinyl-spin 1.8s linear infinite; }
```

`app/layout.tsx`: import `NowPlayingProvider` and wrap the body's contents: `<body><NowPlayingProvider><OS />{children}</NowPlayingProvider></body>`.

- [ ] **Step 7: Run tests, typecheck, lint**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: PASS (5 new tests).

- [ ] **Step 8: Commit**

```bash
git add -A content scripts/content public/records components/music app package.json
git commit -m "Resolve record previews from iTunes and add a now-playing chip

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The record player overlay

**Files:**
- Create: `components/music/RecordCrate.tsx`, `app/music/page.tsx`
- Test: `components/music/__tests__/RecordCrate.test.tsx`

**Interfaces:**
- Consumes: `RECORDS`, `useNowPlaying` (Task 3); `Overlay` (phase 3).
- Produces: `RecordCrate({ records })`: the crate of sleeves and the platter; `/music`.
- Sleeve window: px 91–418 × 79–420 of `public/ui/record-sleeve.png` (512 × 504), measured from the file.

- [ ] **Step 1: Write the failing test**

`components/music/__tests__/RecordCrate.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { RECORDS } from '@/content/records'
import { NowPlayingProvider } from '../NowPlaying'
import { RecordCrate } from '../RecordCrate'

afterEach(() => vi.restoreAllMocks())

describe('RecordCrate', () => {
  it('fans out every record as a sleeve', () => {
    render(<NowPlayingProvider><RecordCrate records={RECORDS} /></NowPlayingProvider>)
    for (const r of RECORDS) expect(screen.getByRole('button', { name: `${r.song}, ${r.artist}` })).toBeTruthy()
  })

  it('puts a picked record on the platter and plays it', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    render(<NowPlayingProvider><RecordCrate records={RECORDS} /></NowPlayingProvider>)
    const sleeve = screen.getByRole('button', { name: `${RECORDS[2].song}, ${RECORDS[2].artist}` })
    await act(async () => { fireEvent.click(sleeve) })
    expect(play).toHaveBeenCalled()
    expect(sleeve.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByTestId('platter').textContent).toContain(RECORDS[2].song)
  })

  it('lists every song in the server HTML', () => {
    const html = renderToString(<NowPlayingProvider><RecordCrate records={RECORDS} /></NowPlayingProvider>)
    for (const r of RECORDS) expect(html).toContain(r.artist)
  })
})
```

Run: `npx vitest run components/music/__tests__/RecordCrate.test.tsx`
Expected: FAIL, cannot resolve `../RecordCrate`.

- [ ] **Step 2: Write `components/music/RecordCrate.tsx`**

```tsx
'use client'
import Image from 'next/image'
import type { Track } from '@/content/records'
import { useNowPlaying } from './NowPlaying'

const PIXELATED = { imageRendering: 'pixelated' } as const
/** The sleeve's transparent art window, % of record-sleeve.png (512 × 504). */
const WINDOW = { left: '17.8%', top: '15.7%', width: '63.9%', height: '67.7%' }
const PIXEL_TEXT = { fontFamily: 'var(--font-pixel)' }

/**
 * The record player (spec §4): the crate opens into a fan of sleeves with
 * pixel album art; pick one and it goes on the platter and its 30-second
 * preview plays. Playback lives in NowPlaying, so it carries on after this
 * closes.
 */
export function RecordCrate({ records }: { records: readonly Track[] }) {
  const { current, playing, play } = useNowPlaying()
  const mid = (records.length - 1) / 2

  return (
    <div className="flex w-[min(820px,92vw)] flex-col items-center gap-[22px] text-[#f3e3c4]">
      <h2 className="text-[14px] uppercase tracking-[.24em]" style={PIXEL_TEXT}>Seven records I love</h2>

      <div data-testid="platter" className="flex items-center gap-[18px] rounded-[14px] px-[20px] py-[14px]" style={{ background: 'rgba(22,14,9,.75)', border: '1px solid rgba(255,214,140,.22)' }}>
        <div className="relative h-[120px] w-[120px]">
          <Image src="/ui/vinyl.png" alt="" fill sizes="120px" className={current && playing ? 'vinyl-spin' : ''} style={PIXELATED} />
          {current && (
            <Image src={current.art} alt="" width={40} height={40} className={`absolute left-[40px] top-[40px] h-[40px] w-[40px] rounded-full ${playing ? 'vinyl-spin' : ''}`} style={PIXELATED} />
          )}
        </div>
        <div className="min-w-[200px]" style={PIXEL_TEXT}>
          {current ? (
            <>
              <p className="text-[11px] uppercase tracking-[.16em] text-[#d9b98a]">On the platter</p>
              <p className="mt-[4px] text-[15px]">{current.song}</p>
              <p className="text-[12px] text-[#d9b98a]">{current.artist} · {current.album}</p>
              <a href={current.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="mt-[6px] inline-block text-[11px] underline-offset-2 hover:underline">
                Listen on Apple Music
              </a>
            </>
          ) : (
            <p className="text-[12px] text-[#d9b98a]">Pick a record to put it on.</p>
          )}
        </div>
      </div>

      <ul className="flex items-end justify-center" style={{ height: 190 }}>
        {records.map((r, i) => {
          const on = current?.id === r.id
          return (
            <li key={r.id} style={{ marginLeft: i === 0 ? 0 : -34 }}>
              <button
                type="button"
                aria-label={`${r.song}, ${r.artist}`}
                aria-pressed={on}
                onClick={() => play(r)}
                className="relative block h-[150px] w-[152px] origin-bottom transition-transform duration-200 hover:z-10 hover:-translate-y-[16px] focus-visible:z-10 focus-visible:-translate-y-[16px] focus-visible:outline-none"
                style={{ transform: `rotate(${(i - mid) * 6}deg) translateY(${on ? -24 : 0}px)`, zIndex: on ? 20 : undefined }}
              >
                <span className="absolute overflow-hidden bg-[#1f160f]" style={WINDOW}>
                  <Image src={r.art} alt="" fill sizes="100px" style={PIXELATED} />
                </span>
                <Image src="/ui/record-sleeve.png" alt="" fill sizes="152px" className="pointer-events-none" style={PIXELATED} />
              </button>
            </li>
          )
        })}
      </ul>

      <ol className="sr-only">
        {records.map((r) => <li key={r.id}>{r.song} by {r.artist}</li>)}
      </ol>
    </div>
  )
}
```

- [ ] **Step 3: Write `app/music/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { RecordCrate } from '@/components/music/RecordCrate'
import { Overlay } from '@/components/overlays/Overlay'
import { RECORDS } from '@/content/records'

export const metadata: Metadata = { title: 'Records' }

/** The record player. The room is drawn by <OS /> in the root layout. */
export default function MusicPage() {
  return <Overlay label="Records"><RecordCrate records={RECORDS} /></Overlay>
}
```

- [ ] **Step 4: Run tests, typecheck, lint**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: PASS (3 new tests).

- [ ] **Step 5: Commit**

```bash
git add components/music app/music
git commit -m "Open the record crate and play a record on the platter

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The bookshelf

**Files:**
- Create: `content/books/{contact,red-rising,percy-jackson,three-body-problem,sapiens,zero-to-one,enders-game,old-mans-war}.md`, `content/books.ts`, `components/books/Bookshelf.tsx`, `components/books/BookSpread.tsx`, `app/books/page.tsx`, `app/books/[slug]/page.tsx`
- Test: `content/__tests__/books.test.ts`, `components/books/__tests__/books.test.tsx`

**Interfaces:**
- Produces:
  - `interface Book { slug; title; author; order; rating?: number; spine: string; special?: 'percy'; review: string[] }`
  - `getBooks()`, `getBook(slug)`, `reviewPages(review: string[], budget = 520): string[][]`
  - `Bookshelf({ books })`, `BookSpread({ book })`; `/books`, `/books/[slug]` (static; unknown slugs 404)
- Spread pages: left px 102–666, right px 734–1296, y 30–719 of `public/ui/book-spread.png` (1400 × 906), measured from the file.

- [ ] **Step 1: Write the eight books**

Each `content/books/<slug>.md` (draft: the reviews are Rayyan's to write):

```md
---
title: Contact
author: Carl Sagan
order: 1
spine: "#2f4a6b"
---
Rayyan's review is on its way.
```

The others, same shape. Body for all: "Rayyan's review is on its way."

| slug | title | author | order | spine | extra |
|---|---|---|---|---|---|
| red-rising | Red Rising | Pierce Brown | 2 | "#8a2b22" | |
| percy-jackson | Percy Jackson | Rick Riordan | 3 | "#1f6f6b" | `special: percy` |
| three-body-problem | The Three-Body Problem | Cixin Liu | 4 | "#3b3b4f" | |
| sapiens | Sapiens | Yuval Noah Harari | 5 | "#c9a227" | |
| zero-to-one | Zero to One | Peter Thiel | 6 | "#e7e2d6" | |
| enders-game | Ender's Game | Orson Scott Card | 7 | "#4a5d2f" | |
| old-mans-war | Old Man's War | John Scalzi | 8 | "#6b3f2a" | |

- [ ] **Step 2: Write the failing tests**

`content/__tests__/books.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getBook, getBooks, reviewPages } from '../books'

describe('the books', () => {
  it('are the eight from the spec, in shelf order, with the fields a spine needs', () => {
    const books = getBooks()
    expect(books.map((b) => b.title)).toEqual([
      'Contact', 'Red Rising', 'Percy Jackson', 'The Three-Body Problem', 'Sapiens', 'Zero to One', "Ender's Game", "Old Man's War",
    ])
    for (const b of books) expect(b.spine).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('gives Percy Jackson its special spine', () => {
    expect(getBook('percy-jackson')?.special).toBe('percy')
  })
})

describe('reviewPages', () => {
  it('keeps a short review on one page', () => {
    expect(reviewPages(['Short.'])).toEqual([['Short.']])
  })

  it('turns a long review into several pages without splitting a paragraph', () => {
    const para = 'x'.repeat(300)
    const pages = reviewPages([para, para, para, para])
    expect(pages.length).toBeGreaterThan(1)
    expect(pages.flat()).toEqual([para, para, para, para])
  })
})
```

`components/books/__tests__/books.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }), usePathname: () => '/books' }))
import { getBooks } from '@/content/books'
import { Bookshelf } from '../Bookshelf'
import { BookSpread } from '../BookSpread'

const books = getBooks()

describe('Bookshelf', () => {
  it('shelves every book as a link to it', () => {
    render(<Bookshelf books={books} />)
    for (const b of books) {
      expect(screen.getByRole('link', { name: `${b.title} by ${b.author}` }).getAttribute('href')).toBe(`/books/${b.slug}`)
    }
  })
})

describe('BookSpread', () => {
  const long = { ...books[0], review: ['a'.repeat(400), 'b'.repeat(400), 'c'.repeat(400)] }

  it('opens to the cover and the first page of the review', () => {
    render(<BookSpread book={books[0]} />)
    expect(screen.getByRole('heading', { level: 2, name: books[0].title })).toBeTruthy()
    expect(screen.getByText(books[0].author)).toBeTruthy()
    expect(screen.getByText(books[0].review[0])).toBeTruthy()
  })

  it('turns pages of a long review', () => {
    render(<BookSpread book={long} />)
    expect(screen.queryByText(long.review[2])).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText(long.review[2])).toBeTruthy()
  })

  it('is in the server HTML', () => {
    expect(renderToString(<BookSpread book={books[0]} />)).toContain(books[0].review[0])
  })
})
```

Run: `npx vitest run content/__tests__/books.test.ts components/books`
Expected: FAIL, cannot resolve `../books`.

- [ ] **Step 3: Write `content/books.ts`**

```ts
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

/** The bookshelf (spec §4): one Markdown file per book; the body is the review. */
export interface Book {
  slug: string
  title: string
  author: string
  order: number
  /** 1–5, shown as stars when present. */
  rating?: number
  /** The spine's colour on the shelf. */
  spine: string
  special?: 'percy'
  review: string[]
}

const DIR = path.join(process.cwd(), 'content', 'books')
let cache: Book[] | null = null

export function getBooks(): Book[] {
  if (cache) return cache
  cache = fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).map((file) => {
    const { data, content } = matter(fs.readFileSync(path.join(DIR, file), 'utf8'))
    for (const key of ['title', 'author', 'spine']) {
      if (typeof data[key] !== 'string' || !data[key]) throw new Error(`content/books/${file}: missing "${key}"`)
    }
    return {
      slug: file.replace(/\.md$/, ''),
      title: data.title,
      author: data.author,
      order: typeof data.order === 'number' ? data.order : 0,
      rating: typeof data.rating === 'number' ? data.rating : undefined,
      spine: data.spine,
      special: data.special === 'percy' ? 'percy' : undefined,
      review: content.trim().split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean),
    } satisfies Book
  }).sort((a, b) => a.order - b.order)
  return cache
}

export function getBook(slug: string): Book | undefined {
  return getBooks().find((b) => b.slug === slug)
}

/** Splits a review into pages of about `budget` characters, never inside a paragraph. */
export function reviewPages(review: string[], budget = 520): string[][] {
  const pages: string[][] = [[]]
  let used = 0
  for (const p of review) {
    if (used > 0 && used + p.length > budget) { pages.push([]); used = 0 }
    pages[pages.length - 1].push(p)
    used += p.length
  }
  return pages
}
```

- [ ] **Step 4: Write `components/books/Bookshelf.tsx`**

```tsx
import type { Book } from '@/content/books'
import { InAppLink } from '@/components/overlays/InAppLink'

const PIXEL_TEXT = { fontFamily: 'var(--font-pixel)' }

/** Light or dark lettering, whichever reads on the spine. */
function ink(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const lum = 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)
  return lum > 150 ? '#2a1a0e' : '#f3e3c4'
}

/**
 * The bookshelf (spec §4): the eight books as spines on a wooden shelf. Each
 * spine opens the book. Percy Jackson gets its special spine: sea green with
 * a gold trident and gilt bands.
 */
export function Bookshelf({ books }: { books: readonly { slug: string; title: string; author: string; spine: string; special?: 'percy' }[] }) {
  return (
    <div className="flex flex-col items-center gap-[14px] text-[#f3e3c4]">
      <h2 className="text-[14px] uppercase tracking-[.24em]" style={PIXEL_TEXT}>Books I&apos;d recommend</h2>
      <div className="rounded-[10px] px-[22px] pt-[22px]" style={{ background: 'linear-gradient(#5a3a22,#3d2616)', boxShadow: 'inset 0 0 0 6px #6e4a2c, 0 20px 40px rgba(0,0,0,.5)' }}>
        <ul className="flex items-end gap-[6px]">
          {books.map((b, i) => {
            const percy = b.special === 'percy'
            return (
              <li key={b.slug}>
                <InAppLink
                  href={`/books/${b.slug}`}
                  aria-label={`${b.title} by ${b.author}`}
                  className="group relative flex w-[46px] items-center justify-center rounded-t-[3px] transition-transform duration-150 hover:-translate-y-[10px] focus-visible:-translate-y-[10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd36e]"
                  style={{
                    height: 210 + ((i * 37) % 50),
                    background: percy ? 'linear-gradient(90deg,#14504d,#1f6f6b 40%,#14504d)' : b.spine,
                    boxShadow: 'inset -4px 0 0 rgba(0,0,0,.25), inset 4px 0 0 rgba(255,255,255,.12)',
                    borderTop: percy ? '6px solid #d9b03c' : undefined,
                    borderBottom: percy ? '6px solid #d9b03c' : '4px solid rgba(0,0,0,.25)',
                  }}
                >
                  {percy && <span aria-hidden className="absolute top-[12px] text-[16px] text-[#e8c25a]">Ψ</span>}
                  <span className="whitespace-nowrap text-[11px] uppercase tracking-[.12em]" style={{ ...PIXEL_TEXT, color: percy ? '#f3e3c4' : ink(b.spine), writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    {b.title}
                  </span>
                </InAppLink>
              </li>
            )
          })}
        </ul>
        <div className="h-[14px]" style={{ background: '#2a1a0e', margin: '0 -22px', borderRadius: '0 0 10px 10px' }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write `components/books/BookSpread.tsx`**

```tsx
'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { Book } from '@/content/books'
import { reviewPages } from '@/content/books'

/** The spread's two pages, px of public/ui/book-spread.png (1400 × 906), measured from the file. */
const LEFT = [102, 30, 667, 719] as const
const RIGHT = [734, 30, 1297, 719] as const
const place = ([x0, y0, x1, y1]: readonly number[]) => ({
  left: `${(x0 / 1400) * 100}%`, top: `${(y0 / 906) * 100}%`, width: `${((x1 - x0) / 1400) * 100}%`, height: `${((y1 - y0) / 906) * 100}%`,
})
const INK = '#3a2a1c'

function Stars({ rating }: { rating: number }) {
  return (
    <p aria-label={`${rating} out of 5`} className="mt-[1.5cqw] text-[2.2cqw] tracking-[.2em] text-[#b07a1e]" style={{ fontFamily: 'var(--font-pixel)' }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </p>
  )
}

/**
 * A book, open (spec §4): cover, title and author on the left; the review and
 * rating on the right; a long review turns pages (buttons or ←/→).
 */
export function BookSpread({ book }: { book: Book }) {
  const pages = reviewPages(book.review)
  const [page, setPage] = useState(0)
  const last = pages.length - 1

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'ArrowRight') setPage((p) => Math.min(last, p + 1))
      if (event.key === 'ArrowLeft') setPage((p) => Math.max(0, p - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [last])

  return (
    <article className="relative w-[min(900px,92vw)] [container-type:inline-size]" style={{ aspectRatio: '1400 / 906' }}>
      <Image src="/ui/book-spread.png" alt="" fill sizes="900px" priority className="pointer-events-none" />

      <div className="absolute flex flex-col items-center justify-center gap-[2cqw] px-[3cqw] text-center" style={place(LEFT)}>
        <div className="flex aspect-[2/3] w-[46%] flex-col items-center justify-center rounded-[4px] p-[1.5cqw]" style={{ background: book.special === 'percy' ? 'linear-gradient(#1f6f6b,#14504d)' : book.spine, boxShadow: 'inset 0 0 0 4px rgba(0,0,0,.2), 0 6px 14px rgba(0,0,0,.3)' }}>
          <span className="text-[2.1cqw] uppercase tracking-[.1em] text-[#f3e3c4]" style={{ fontFamily: 'var(--font-pixel)' }}>{book.title}</span>
        </div>
        <h2 className="text-[3cqw] leading-[1.1]" style={{ color: INK, fontFamily: 'var(--font-display)', fontWeight: 800 }}>{book.title}</h2>
        <p className="text-[1.9cqw]" style={{ color: '#7a5a3a', fontFamily: 'var(--font-ui)' }}>{book.author}</p>
        {book.rating !== undefined && <Stars rating={book.rating} />}
      </div>

      <div className="absolute flex flex-col px-[3.5cqw] py-[3cqw]" style={place(RIGHT)}>
        <div className="flex-1 overflow-y-auto">
          {pages[page].map((p) => (
            <p key={p} className="mb-[1.6cqw] text-[1.85cqw] leading-[1.55]" style={{ color: INK, fontFamily: 'var(--font-ui)' }}>{p}</p>
          ))}
        </div>
        {pages.length > 1 && (
          <div className="flex items-center justify-between text-[1.5cqw] uppercase tracking-[.16em]" style={{ color: '#7a5a3a', fontFamily: 'var(--font-pixel)' }}>
            <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-30">←</button>
            <span>{page + 1} / {pages.length}</span>
            <button type="button" aria-label="Next page" disabled={page === last} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-30">→</button>
          </div>
        )}
      </div>
    </article>
  )
}
```

- [ ] **Step 6: Write the pages**

`app/books/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Bookshelf } from '@/components/books/Bookshelf'
import { Overlay } from '@/components/overlays/Overlay'
import { getBooks } from '@/content/books'

export const metadata: Metadata = { title: 'Books' }

/** The bookshelf. The room is drawn by <OS /> in the root layout. */
export default function BooksPage() {
  const books = getBooks().map(({ slug, title, author, spine, special }) => ({ slug, title, author, spine, special }))
  return <Overlay label="Bookshelf"><Bookshelf books={books} /></Overlay>
}
```

`app/books/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BookSpread } from '@/components/books/BookSpread'
import { Overlay } from '@/components/overlays/Overlay'
import { getBook, getBooks } from '@/content/books'

export const dynamicParams = false

export function generateStaticParams() {
  return getBooks().map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return { title: getBook(slug)?.title }
}

/** One book, open. The room is drawn by <OS /> in the root layout. */
export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const book = getBook(slug)
  if (!book) notFound()
  return <Overlay label={book.title}><BookSpread book={book} /></Overlay>
}
```

- [ ] **Step 7: Run tests, typecheck, lint**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: PASS (7 new tests).

- [ ] **Step 8: Commit**

```bash
git add content/books content/books.ts content/__tests__/books.test.ts components/books app/books
git commit -m "Add the bookshelf and the open-book review spread

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: The journal

**Files:**
- Create: `content/journal/on-beauty.md`, `content/journal.ts`, `components/journal/Journal.tsx`, `app/journal/page.tsx`, `app/journal/[slug]/page.tsx`
- Test: `content/__tests__/journal.test.ts`, `components/journal/__tests__/journal.test.tsx`

**Interfaces:**
- Produces: `interface Entry { slug; title; date: string /* YYYY-MM-DD */; summary; body: string[] }`, `getEntries()` (newest first), `getEntry(slug)`; `JournalContents({ entries })`, `JournalEntry({ entry, prev, next })`; `/journal`, `/journal/[slug]`.

- [ ] **Step 1: Write the first entry**

`content/journal/on-beauty.md`, in Rayyan's voice, from what he said about his goal (draft):

```md
---
title: What I mean by beautiful
date: 2026-10-06
summary: Three months of chasing the things that hit hardest, and why.
---
For the past three months I've been chasing the things that give me an overpowering feeling. Incredibly artistic cinema. Sunsets. Deep conversations with friends. Tech so impactful it doesn't feel real.

I've had over a dozen conversations with people about where they feel it and what beauty means to them. Everyone describes it differently, and I haven't gotten tired of asking.

The goal is to take what I learn and use it across invention, marketing, politics and art, to create more of that feeling in myself and in other people.
```

- [ ] **Step 2: Write the failing tests**

`content/__tests__/journal.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getEntries, getEntry } from '../journal'

describe('the journal', () => {
  it('parses every entry, newest first, with a real date', () => {
    const entries = getEntries()
    expect(entries.length).toBeGreaterThan(0)
    for (const e of entries) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(e.title && e.summary).toBeTruthy()
      expect(e.body.length).toBeGreaterThan(0)
    }
    const dates = entries.map((e) => e.date)
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it('finds an entry by slug', () => {
    expect(getEntry('on-beauty')?.title).toBe('What I mean by beautiful')
  })
})
```

`components/journal/__tests__/journal.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }), usePathname: () => '/journal' }))
import { getEntries } from '@/content/journal'
import { JournalContents, JournalEntry } from '../Journal'

const entries = getEntries()

describe('JournalContents', () => {
  it('lists every entry, dated, linking to it', () => {
    render(<JournalContents entries={entries} />)
    for (const e of entries) {
      expect(screen.getByRole('link', { name: new RegExp(e.title) }).getAttribute('href')).toBe(`/journal/${e.slug}`)
    }
  })
})

describe('JournalEntry', () => {
  it('shows the entry and a way back to the contents', () => {
    render(<JournalEntry entry={entries[0]} prev={null} next={null} />)
    expect(screen.getByRole('heading', { level: 2, name: entries[0].title })).toBeTruthy()
    expect(screen.getByText(entries[0].body[0])).toBeTruthy()
    expect(screen.getByRole('link', { name: /Contents/ }).getAttribute('href')).toBe('/journal')
  })
})
```

Run: `npx vitest run content/__tests__/journal.test.ts components/journal`
Expected: FAIL, cannot resolve `../journal`.

- [ ] **Step 3: Write `content/journal.ts`**

```ts
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

/** The journal (spec §4, "the journal" is the blog): one Markdown file per entry. */
export interface Entry {
  slug: string
  title: string
  /** YYYY-MM-DD. */
  date: string
  summary: string
  body: string[]
}

const DIR = path.join(process.cwd(), 'content', 'journal')
let cache: Entry[] | null = null

export function getEntries(): Entry[] {
  if (cache) return cache
  cache = fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).map((file) => {
    const { data, content } = matter(fs.readFileSync(path.join(DIR, file), 'utf8'))
    // gray-matter turns an unquoted date into a Date.
    const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? '')
    for (const [key, value] of [['title', data.title], ['summary', data.summary], ['date', date]] as const) {
      if (typeof value !== 'string' || !value) throw new Error(`content/journal/${file}: missing "${key}"`)
    }
    return {
      slug: file.replace(/\.md$/, ''),
      title: data.title,
      date,
      summary: data.summary,
      body: content.trim().split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean),
    }
  }).sort((a, b) => b.date.localeCompare(a.date))
  return cache
}

export function getEntry(slug: string): Entry | undefined {
  return getEntries().find((e) => e.slug === slug)
}
```

- [ ] **Step 4: Write `components/journal/Journal.tsx`**

```tsx
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Entry } from '@/content/journal'
import { InAppLink } from '@/components/overlays/InAppLink'

const INK = '#3a2a1c'
const PIXEL = { fontFamily: 'var(--font-pixel)' }
const pretty = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** One journal page: the Minecraft-style book-and-quill page (public/ui/journal-page.png, 900 × 1277). */
function Page({ children }: { children: ReactNode }) {
  return (
    <article className="relative w-[min(460px,88vw)] [container-type:inline-size]" style={{ aspectRatio: '900 / 1277' }}>
      <Image src="/ui/journal-page.png" alt="" fill sizes="460px" priority className="pointer-events-none" />
      <div className="absolute inset-[9%_10%_12%] overflow-y-auto">{children}</div>
    </article>
  )
}

/** The journal's contents page (spec §4): dated entries, newest first. */
export function JournalContents({ entries }: { entries: readonly Entry[] }) {
  return (
    <Page>
      <h2 className="text-[5cqw] uppercase tracking-[.2em]" style={{ ...PIXEL, color: INK }}>Contents</h2>
      <ol className="mt-[5cqw] flex flex-col gap-[4cqw]">
        {entries.map((e) => (
          <li key={e.slug}>
            <InAppLink href={`/journal/${e.slug}`} className="block hover:underline">
              <span className="block text-[2.8cqw] uppercase tracking-[.14em] text-[#8a5a2b]" style={PIXEL}>{pretty(e.date)}</span>
              <span className="block text-[4.4cqw] leading-[1.2]" style={{ color: INK, fontFamily: 'var(--font-display)', fontWeight: 700 }}>{e.title}</span>
              <span className="mt-[1cqw] block text-[3.2cqw] leading-[1.4]" style={{ color: '#6b5440', fontFamily: 'var(--font-ui)' }}>{e.summary}</span>
            </InAppLink>
          </li>
        ))}
      </ol>
    </Page>
  )
}

/** One entry, with the way back to the contents and to its neighbours. */
export function JournalEntry({ entry, prev, next }: { entry: Entry; prev: string | null; next: string | null }) {
  return (
    <Page>
      <Link href="/journal" replace scroll={false} className="text-[2.8cqw] uppercase tracking-[.14em] text-[#8a5a2b] hover:underline" style={PIXEL}>← Contents</Link>
      <p className="mt-[4cqw] text-[2.8cqw] uppercase tracking-[.14em] text-[#8a5a2b]" style={PIXEL}>{pretty(entry.date)}</p>
      <h2 className="mt-[1cqw] text-[5.4cqw] leading-[1.15]" style={{ color: INK, fontFamily: 'var(--font-display)', fontWeight: 800 }}>{entry.title}</h2>
      {entry.body.map((p) => (
        <p key={p} className="mt-[3.5cqw] text-[3.6cqw] leading-[1.55]" style={{ color: INK, fontFamily: 'var(--font-ui)' }}>{p}</p>
      ))}
      {(prev || next) && (
        <nav aria-label="More entries" className="mt-[5cqw] flex justify-between text-[2.8cqw] uppercase tracking-[.14em] text-[#8a5a2b]" style={PIXEL}>
          {prev ? <Link href={`/journal/${prev}`} replace scroll={false} className="hover:underline">← Newer</Link> : <span />}
          {next ? <Link href={`/journal/${next}`} replace scroll={false} className="hover:underline">Older →</Link> : <span />}
        </nav>
      )}
    </Page>
  )
}
```

- [ ] **Step 5: Write the pages**

`app/journal/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { JournalContents } from '@/components/journal/Journal'
import { Overlay } from '@/components/overlays/Overlay'
import { getEntries } from '@/content/journal'

export const metadata: Metadata = { title: 'Journal' }

/** The journal's contents. The room is drawn by <OS /> in the root layout. */
export default function JournalPage() {
  return <Overlay label="Journal"><JournalContents entries={getEntries()} /></Overlay>
}
```

`app/journal/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JournalEntry } from '@/components/journal/Journal'
import { Overlay } from '@/components/overlays/Overlay'
import { getEntries, getEntry } from '@/content/journal'

export const dynamicParams = false

export function generateStaticParams() {
  return getEntries().map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return { title: getEntry(slug)?.title }
}

/** One journal entry. The room is drawn by <OS /> in the root layout. */
export default async function EntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = getEntry(slug)
  if (!entry) notFound()
  const all = getEntries()
  const i = all.findIndex((e) => e.slug === slug)
  return (
    <Overlay label={entry.title}>
      <JournalEntry entry={entry} prev={all[i - 1]?.slug ?? null} next={all[i + 1]?.slug ?? null} />
    </Overlay>
  )
}
```

- [ ] **Step 6: Run tests, typecheck, lint**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: PASS (4 new tests).

- [ ] **Step 7: Commit**

```bash
git add content/journal content/journal.ts content/__tests__/journal.test.ts components/journal app/journal
git commit -m "Add the journal: a dated contents page and entries

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: The globe

**Files:**
- Create: `content/places/{san-diego,los-angeles,hong-kong,milan,san-francisco}.md`, `content/places.ts`, `components/globe/project.ts`, `components/globe/Globe.tsx`, `app/places/page.tsx`, `app/places/[slug]/page.tsx`
- Modify: `package.json` (d3-geo, topojson-client, world-atlas, types)
- Test: `content/__tests__/places.test.ts`, `components/globe/__tests__/globe.test.tsx`

**Interfaces:**
- Produces:
  - `interface Place { slug; name; lat; lon; date: string; photo: string; story: string[] }`, `getPlaces()`, `getPlace(slug)`
  - `projectPin(lon: number, lat: number, rotate: [number, number], size: number): { x: number; y: number; visible: boolean }`
  - `Globe({ places: { slug; name; lat; lon }[] })`; `/places`, `/places/[slug]` (a game card)

- [ ] **Step 1: Install**

Run: `npm install d3-geo topojson-client world-atlas && npm install -D @types/d3-geo @types/topojson-client`

- [ ] **Step 2: Write the five places**

Draft, from the résumé; photos are the globe sprite until Rayyan sends his own. Each `content/places/<slug>.md`:

```md
---
name: San Diego
lat: 32.7157
lon: -117.1611
date: Home
photo: /room/sprites/globe.png
---
Home. Where I grew up, surfed, and learned to boogie board.
```

| slug | name | lat | lon | date | story |
|---|---|---|---|---|---|
| los-angeles | Los Angeles | 34.0224 | -118.2851 | 2025 | USC, the first stop in the World Bachelor in Business. |
| hong-kong | Hong Kong | 22.3364 | 114.2655 | 2025 | HKUST, the second stop. |
| milan | Milan | 45.4507 | 9.1890 | Next | Bocconi, the third stop. |
| san-francisco | San Francisco | 37.7749 | -122.4194 | Summer 2026 | A summer of GTM engineering at super{set} and Kana. |

- [ ] **Step 3: Write the failing tests**

`content/__tests__/places.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getPlaces } from '../places'

describe('the places', () => {
  it('parse with real coordinates', () => {
    const places = getPlaces()
    expect(places.length).toBe(5)
    for (const p of places) {
      expect(p.lat).toBeGreaterThanOrEqual(-90); expect(p.lat).toBeLessThanOrEqual(90)
      expect(p.lon).toBeGreaterThanOrEqual(-180); expect(p.lon).toBeLessThanOrEqual(180)
      expect(p.story.length).toBeGreaterThan(0)
    }
  })
})
```

`components/globe/__tests__/globe.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }), usePathname: () => '/places' }))
import { projectPin } from '../project'
import { Globe } from '../Globe'

describe('projectPin', () => {
  it('puts the point the globe faces at its centre, visible', () => {
    const p = projectPin(-117, 32, [117, -32], 160)
    expect(p.x).toBeCloseTo(80, 0)
    expect(p.y).toBeCloseTo(80, 0)
    expect(p.visible).toBe(true)
  })

  it('hides a pin on the far side', () => {
    expect(projectPin(63, -32, [117, -32], 160).visible).toBe(false)
  })
})

describe('Globe', () => {
  it('pins the places that face you, as links to their cards', () => {
    render(<Globe places={[
      { slug: 'san-diego', name: 'San Diego', lat: 32.7, lon: -117.2 },
      { slug: 'hong-kong', name: 'Hong Kong', lat: 22.3, lon: 114.3 },
    ]} />)
    expect(screen.getByRole('link', { name: 'San Diego' }).getAttribute('href')).toBe('/places/san-diego')
    expect(screen.queryByRole('link', { name: 'Hong Kong' })).toBeNull()
  })
})
```

Run: `npx vitest run content/__tests__/places.test.ts components/globe`
Expected: FAIL, cannot resolve `../places`.

- [ ] **Step 4: Write `content/places.ts` and `components/globe/project.ts`**

```ts
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

/** Places on the globe (spec §4): one Markdown file each; the body is the story. */
export interface Place {
  slug: string
  name: string
  lat: number
  lon: number
  /** When, loosely: "2025", "Summer 2026", "Home". */
  date: string
  photo: string
  story: string[]
}

const DIR = path.join(process.cwd(), 'content', 'places')
let cache: Place[] | null = null

export function getPlaces(): Place[] {
  if (cache) return cache
  cache = fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).sort().map((file) => {
    const { data, content } = matter(fs.readFileSync(path.join(DIR, file), 'utf8'))
    if (typeof data.name !== 'string' || typeof data.lat !== 'number' || typeof data.lon !== 'number') {
      throw new Error(`content/places/${file}: needs name, lat and lon`)
    }
    return {
      slug: file.replace(/\.md$/, ''),
      name: data.name,
      lat: data.lat,
      lon: data.lon,
      date: String(data.date ?? ''),
      photo: typeof data.photo === 'string' ? data.photo : '/room/sprites/globe.png',
      story: content.trim().split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean),
    }
  })
  return cache
}

export function getPlace(slug: string): Place | undefined {
  return getPlaces().find((p) => p.slug === slug)
}
```

```ts
import { geoDistance, geoOrthographic } from 'd3-geo'

/** The globe's projection at a rotation, sized to a `size` px canvas. */
export function projection(rotate: [number, number], size: number) {
  return geoOrthographic().scale(size / 2 - 1).translate([size / 2, size / 2]).rotate([rotate[0], rotate[1]])
}

/** Where a pin lands on the canvas, and whether it is on the side facing you. */
export function projectPin(lon: number, lat: number, rotate: [number, number], size: number): { x: number; y: number; visible: boolean } {
  const [x, y] = projection(rotate, size)([lon, lat]) ?? [0, 0]
  const visible = geoDistance([lon, lat], [-rotate[0], -rotate[1]]) < Math.PI / 2 - 0.05
  return { x, y, visible }
}
```

- [ ] **Step 5: Write `components/globe/Globe.tsx`**

```tsx
'use client'
import { geoGraticule10, geoPath } from 'd3-geo'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import land110 from 'world-atlas/land-110m.json'
import { InAppLink } from '@/components/overlays/InAppLink'
import { useReducedMotion } from '@/components/os/useReducedMotion'
import { projectPin, projection } from './project'

/** Canvas resolution: small on purpose, then scaled up pixelated (spec §4). */
const SIZE = 160
const SPIN = 0.12 // degrees per frame
const START: [number, number] = [117, -25] // facing San Diego, tilted a little

const land = feature(land110 as unknown as Topology, (land110 as unknown as Topology).objects.land as GeometryCollection)
const graticule = geoGraticule10()

/**
 * A pixel globe (spec §4): d3-geo orthographic over world-atlas land, drawn
 * on a 160 px canvas and scaled up with `image-rendering: pixelated`. It
 * spins slowly (not under reduced motion), drags to rotate, and carries a pin
 * per place; pins on the far side are hidden. A pin opens that place's card.
 */
export function Globe({ places }: { places: readonly { slug: string; name: string; lat: number; lon: number }[] }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [rotate, setRotate] = useState<[number, number]>(START)
  const drag = useRef<{ x: number; y: number; r: [number, number] } | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const path = geoPath(projection(rotate, SIZE), ctx)
    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = '#2f5d8a'; ctx.fill()
    ctx.beginPath(); path(graticule); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 0.5; ctx.stroke()
    ctx.beginPath(); path(land); ctx.fillStyle = '#7fb26a'; ctx.fill()
    ctx.strokeStyle = '#3f6b33'; ctx.lineWidth = 0.6; ctx.stroke()
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.strokeStyle = '#1b2f45'; ctx.lineWidth = 1.5; ctx.stroke()
  }, [rotate])

  useEffect(() => {
    if (reduced) return
    let frame = 0
    const tick = () => {
      if (!drag.current) setRotate(([l, t]) => [(l + SPIN) % 360, t])
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduced])

  return (
    <div className="flex flex-col items-center gap-[14px] text-[#f3e3c4]">
      <h2 className="text-[14px] uppercase tracking-[.24em]" style={{ fontFamily: 'var(--font-pixel)' }}>Places I&apos;ve been</h2>
      <div
        className="relative h-[min(480px,80vw)] w-[min(480px,80vw)] cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, r: rotate }; e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          const k = 180 / e.currentTarget.clientWidth
          setRotate([d.r[0] + (e.clientX - d.x) * k, Math.max(-60, Math.min(60, d.r[1] - (e.clientY - d.y) * k))])
        }}
        onPointerUp={() => { drag.current = null }}
        onPointerCancel={() => { drag.current = null }}
      >
        <canvas ref={canvas} width={SIZE} height={SIZE} aria-hidden className="h-full w-full" style={{ imageRendering: 'pixelated' }} />
        {places.map((p) => {
          const pin = projectPin(p.lon, p.lat, rotate, SIZE)
          if (!pin.visible) return null
          return (
            <InAppLink
              key={p.slug}
              href={`/places/${p.slug}`}
              aria-label={p.name}
              className="group absolute -translate-x-1/2 -translate-y-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd36e]"
              style={{ left: `${(pin.x / SIZE) * 100}%`, top: `${(pin.y / SIZE) * 100}%` }}
            >
              <Image src="/ui/globe-pin.png" alt="" width={22} height={36} style={{ imageRendering: 'pixelated' }} />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-[4px] -translate-x-1/2 whitespace-nowrap rounded-[3px] bg-[rgba(28,18,12,.9)] px-[6px] py-[2px] text-[11px] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" style={{ fontFamily: 'var(--font-pixel)' }}>
                {p.name}
              </span>
            </InAppLink>
          )
        })}
      </div>
      <ul className="flex flex-wrap justify-center gap-x-[14px] gap-y-[4px] text-[11px] uppercase tracking-[.14em] text-[#d9b98a]" style={{ fontFamily: 'var(--font-pixel)' }}>
        {places.map((p) => <li key={p.slug}><InAppLink href={`/places/${p.slug}`} aria-label={`${p.name} (list)`} className="hover:underline">{p.name}</InAppLink></li>)}
      </ul>
    </div>
  )
}
```

Install `topojson-specification` types if `topojson-client`'s types don't re-export them: `npm install -D topojson-specification` (types-only package). The list under the globe names its links "<place> (list)", so they don't collide with the pins' names.

- [ ] **Step 6: Write the pages**

`app/places/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Globe } from '@/components/globe/Globe'
import { Overlay } from '@/components/overlays/Overlay'
import { getPlaces } from '@/content/places'

export const metadata: Metadata = { title: 'Places' }

/** The globe. The room is drawn by <OS /> in the root layout. */
export default function PlacesPage() {
  const places = getPlaces().map(({ slug, name, lat, lon }) => ({ slug, name, lat, lon }))
  return <Overlay label="Places"><Globe places={places} /></Overlay>
}
```

`app/places/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GameCard } from '@/components/overlays/GameCard'
import { Overlay } from '@/components/overlays/Overlay'
import { getPlace, getPlaces } from '@/content/places'

export const dynamicParams = false

export function generateStaticParams() {
  return getPlaces().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return { title: getPlace(slug)?.name }
}

/** A place's game card (spec §4). The room is drawn by <OS /> in the root layout. */
export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const place = getPlace(slug)
  if (!place) notFound()
  return (
    <Overlay label={place.name}>
      <GameCard
        card={{ id: place.slug, tag: `PLACE · ${place.name.toUpperCase()} · ${place.date.toUpperCase()}`, title: place.name, photo: place.photo, body: place.story }}
        prev={null}
        next={null}
      />
    </Overlay>
  )
}
```

- [ ] **Step 7: Run tests, typecheck, lint, build**

Run: `npx vitest run && npm run typecheck && npm run lint && npm run build`
Expected: PASS (4 new tests); the build lists `/music`, `/books` (+8), `/journal` (+1), `/places` (+5), `/san-diego`, and 7 cards.

- [ ] **Step 8: Commit**

```bash
git add -A package.json package-lock.json content/places content/places.ts content/__tests__/places.test.ts components/globe app/places
git commit -m "Add the pixel globe with pins that open each place's card

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Click-through

- [ ] **Step 1: On a fresh production server** (`npm run build && npx next start -p 3124`), at 1440×900:

1. Room in the current SD light (check the time; day, sunset or night art). Hover each of the five objects; click each and confirm its overlay opens at the right URL.
2. Record player: click a sleeve; the record spins and the preview plays; the chip appears bottom-left. Pick another: the track switches. Esc: the room, with the chip still playing. Pause/stop from the chip.
3. Bookshelf → Percy Jackson (special spine) → spread. Esc → shelf, Esc → room, then Back leaves the room rather than reopening anything.
4. Journal → entry → "Contents" → Esc → room.
5. Globe spins; drag rotates; a pin opens its card; Esc → globe; far-side pins aren't visible.
6. Window → San Diego card with the live time.
7. Direct loads of `/books/percy-jackson`, `/places/milan`, `/journal/on-beauty`, `/music`, `/san-diego`: each renders over the room; Esc closes to the room.
8. Reduced motion: the globe and record don't spin.
9. No console errors.

- [ ] **Step 2: Push**

```bash
git push
```
