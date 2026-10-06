# rayyandarugar.com: design spec

**Date:** 2026-10-06 · **Status:** approved in brainstorming, awaiting written-spec review · **Owner:** Rayyan Darugar

## 1. What this is

A personal site for Rayyan built as a pixel-art room you can explore. The personal half of him lives in the room (music, books, travel, surfing, his dog, his schools). The professional half lives in a laptop on the desk. Clicking the laptop zooms into a desktop holding his résumé, projects and The Attention Exchange.

It reuses the "computer" shell from the benched Attention Exchange site (the pixel room → zoom into the laptop → windowed desktop). It replaces the current site at rayyandarugar.com.

### Audience and success

- **Audience:** a mix. Recruiters, hiring managers, investors and operators on the professional side; people who meet him or find him online on the personal side.
- **When the two conflict, personality wins.** One professional floor is never cut: the **résumé, his work and a way to contact him are always one click from landing**, before anyone touches the room.
- **Success:** a visitor leaves knowing who Rayyan is as a person *and* able to find his résumé in under 30 seconds. The writing has to carry the personality; the copy gets written in his voice (`rayyan-voice` skill) once he provides material.

### Why the old design was benched, and how this avoids it

It was benched for The Attention Exchange because the immersive intro stood between visitors and the content. Here the room *is* the content, entry is by click (not a scroll distance), and a fixed hotbar and a Résumé link are on screen from the first frame.

## 2. Decisions (settled; don't re-open without a new reason)

| Decision | Choice | Why |
|---|---|---|
| Overall concept | Explorable room (personal) + laptop (professional) | Gives the "mix" audience two clear spaces with no menu choosing between them |
| Room width | Canvas ≈ **110.9%** of the viewport width; cursor X pans it | Everything is visible at rest; the cursor reveals only the edge slivers. Rayyan rejected a wide room with hidden areas |
| Intro text | Written **on the whiteboard** in marker, sharing the board with a half-erased sketch | The room introduces him itself, instead of text laid over the art |
| Nav | **Minecraft-style hotbar** at the bottom; each slot = an object; hovering a slot lights that object | Labels are visible without hovering; it works as nav, legend and keyboard access at once; it matches the Minecraft journal |
| Entering the laptop | **Click** (scroll is also allowed as a shortcut); Esc / back zooms out | Scroll-to-enter was the old friction; in a room you explore, scroll is ambiguous |
| Object interaction depth | **Mixed:** record player, bookshelf, journal, globe and window get bespoke interactions; everything else gets a pixel game card | Spends build effort where the personality is |
| Window time of day | **San Diego's** local time, not the visitor's | "Where I am, right now" says more than mirroring the visitor's clock |
| Blog format | Markdown files in the repo, written as "the journal" | Rayyan works in Claude Code daily; no external CMS |
| Repo strategy | New repo; **copy** the shell in once. No fork, no shared package | The AE site moved to a scroll page, so the OS code has only one consumer now |
| Art method | Higgsfield, **compose then split into layers** (§6) | Separately generated sprites never match in lighting and pixel size |
| Fallback art tool | GPT image for **text and likeness only** (flag lettering, surfboard from his photo) | Better at legible text and matching a reference photo |

## 3. The room

Reference mockup: `docs/mockups/room-layout-v2.html` (open in a browser next to `scene.png`; it's a fragment, so the option styling won't render, but the room, the pan and the hotspots will). The approved choice is **text option 1 (whiteboard) + nav option 2 (hotbar)**.

### Composition (canvas %; the canvas is 110.9% of the viewport and rests at translateX(-4.9%))

| Object | Left | Top | Width | Height | Behaviour |
|---|---|---|---|---|---|
| Flags (USC · HKUST · Bocconi), strung across the wall | 2.5 | 3 | 56 | 7 | Card (one per school, swipeable) |
| Surfboard, leaning far left | 5.5 | 13 | 4.5 | 63 | Card |
| Photo: dog | 11.5 | 14 | 7.5 | 15 | Card |
| Photo: San Diego beach | 11.5 | 32 | 7.5 | 15 | Card |
| Record player + vinyl crate on low cabinet | 10 | 57 | 11.5 | 18 | Interactive |
| Whiteboard (intro + half-erased sketch) | 24.5 | 12 | 28 | 34 | Card ("what I'm building") |
| Laptop | 28.2 | 54 | 21.3 | 29 | Zoom to desktop |
| Journal (book and quill) on desk | 50.9 | 71 | 9 | 8 | Interactive |
| Bookshelf | 64.1 | 1 | 9.5 | 75 | Interactive |
| Globe on side desk | 76.8 | 56 | 7.7 | 25 | Interactive |
| Window (San Diego) | 85.5 | 1 | 14 | 71 | Interactive (time of day) + card |

These are placement targets for the art. The final positions come from the generated master and get recorded in the room manifest (§5).

### Room behaviour

- **Pan:** cursor X maps linearly to translateX between 0 and -(10.9/110.9)·100%, with easing. Optional: layers get a depth value so nearer objects move slightly more (parallax). On mouse leave, return to rest.
- **Hover:** the hovered object's sprite gets a glow outline, and a pixel tooltip appears (font: VT323, or the DepartureMono already in the AE repo).
- **Hotbar:** 9 slots: work (laptop), journal, music, books, travel, building (whiteboard), schools, surf, photos. Hover lights the matching object(s). Click acts exactly like clicking the object. Number keys 1–9 select slots. A fixed **Résumé** link sits in a corner from the first frame.
- **Phones:** the room fills the screen height and is drag-to-pan; the hotbar stays pinned to the bottom (it may scroll horizontally).
- **Reduced motion:** no pan easing, no camera zoom (cut straight to the desktop), and overlays fade instead of flying.

## 4. Interactions

Every overlay has its own URL, closes with Esc, a click outside it, or the browser back button, and is **server-rendered**, so the text is in the HTML for Google and screen readers. Visiting the URL directly loads the room with that overlay already open.

| Object | Route | Behaviour |
|---|---|---|
| Record player | `/music` | The crate opens; 7 sleeves fan out with pixelated album art. Pick one → it slides onto the platter, the needle drops, and a 30-second preview plays. A "now playing" chip stays in a corner while exploring. Previews come from the **iTunes Search API**, with preview URLs resolved at build time into generated JSON, and a link to Apple Music for attribution. Playback starts on the user's click, so autoplay rules aren't an issue. |
| Bookshelf | `/books/[slug]` | The book slides off the shelf, flies to the middle of the screen and opens into a two-page spread: cover, title and author on the left; Rayyan's review and rating on the right; long reviews turn pages. Percy Jackson gets a special spine on the shelf. |
| Journal | `/journal`, `/journal/[slug]` | Opens to a dated contents page; clicking an entry turns the pages to it. Modeled on the Minecraft book and quill. |
| Globe | `/places`, `/places/[slug]` | A large pixel globe in the middle of the screen, slowly spinning, drag to rotate, with pins. **d3-geo** orthographic projection + world-atlas TopoJSON, drawn on a low-resolution canvas and scaled up with `image-rendering: pixelated`. Clicking a pin opens a game card (photo + story). |
| Window | `/san-diego` | Day / sunset / night art chosen from San Diego's current time (`America/Los_Angeles`; sunrise and sunset from **suncalc** at SD's coordinates). Clicking opens a card. |
| Game cards | `/cards/[id]` | One trading-card frame for all of them: photo, name, type tag (e.g. `SCHOOL · HKUST · 2025`), a short story, an optional stat line. The flags open a swipeable set of three. |
| Laptop | `/work`, `/work/[app]` | Camera zoom into the screen → the re-skinned AE desktop with these apps: **Résumé, Projects, The Attention Exchange, About/Mission, Contact**. Projects open at `/projects/[slug]`. |

## 5. Architecture

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, framer-motion, Vitest + Testing Library. The same stack as the AE site, so the copied shell drops in. Deploy on Vercel, then point rayyandarugar.com at it in phase 5.

### Units

- **Room manifest** (`content/room.ts`): one entry per object: id, sprite path, position, depth, hotbar slot, and `action` (`card | overlay route | zoom`). The single source of truth for what's in the room.
- **Room engine** (`components/room/`): renders the base layer and sprites from the manifest, handles the pan, the hover glow and tooltips, keyboard focus, and dispatches actions. Knows nothing about books or records.
- **Hotbar** (`components/room/Hotbar.tsx`): reads the manifest; manages the slot ↔ object highlight.
- **Overlay host** (`components/overlays/`): maps the route to an overlay component; handles open/close, focus trap, Esc and back. Each overlay (`RecordPlayer`, `Book`, `Journal`, `Globe`, `Window`, `GameCard`) is self-contained and receives only its own content.
- **Computer shell** (`components/os/`): copied from AE (below), with its app registry rewritten to the five portfolio apps.
- **Content** (`content/`): all text and data live here, not in components:
  - `books/*.md` (frontmatter: title, author, rating, cover, featured, order)
  - `records.json` (artist, song, album, art; previewUrl filled in by a build script)
  - `journal/*.md` (title, date, summary)
  - `places/*.md` (name, lat, lon, date, photo)
  - `cards/*.md` (id, type tag, title, photo, stat)
  - `projects/*.md`, `about.md`, `resume.pdf`

Adding a book, a trip or a post means adding a file. No component changes.

### What to copy from the AE repo

Source: **`reference/ae-shell/`** in this repo, a frozen snapshot of AE commit `aa41566` (see its README). The original lives at `~/Coding Projects/AttentionExchange/site/`, but don't depend on it.

The shell imports AE code (`profiles`, `campaign`, `slots`, `data`, `@/lib/model/*`, `@/components/shell/routes`), and the advertiser/user two-account model runs through `OS.tsx`. Phase 1 has to **untangle** this into a single desktop. Deleting files alone won't compile.

- **Copy (the shell, ~3,500 lines):** `components/os/intro/` (Hero, Laptop, geometry, useIntro + tests), `OS.tsx`, `OSWindow.tsx`, `LaunchedWindow.tsx`, `Dock.tsx`, `OSMenuBar.tsx`, `Spotlight.tsx`, `Notifications.tsx`, `GhostCursor.tsx`, `Wallpaper.tsx`, `DesktopItems.tsx`, `OSButton.tsx`, `parts.tsx`, `icons.tsx`, `stage.ts`, `chrome.ts`, `useReducedMotion.ts`, `useIsoLayoutEffect.ts`, `Stacked.tsx`, and `public/fonts/` (DepartureMono, with its license).
- **Drop:** `apps/*`, `ad*.ts(x)`, `AdSlot`, `Auction`, `campaign`, `slots`, `profiles`, `AccountMenu`, `LoginScreen`, `companions`, and the AE-specific tests. Rewrite `registry.tsx`.
- **Watch for:** `Hero.tsx` and `OSMenuBar.tsx` mention the AE brand. The snapshot holds the committed `Hero.tsx`; a small uncommitted change in the AE working tree was deliberately left out.
- **Ownership check:** some of the typography came from Landon's system ("re-typeset the hero on cofounder's system"). Ask Landon before shipping anything that came from him.

## 6. Art pipeline

1. **Master:** generate one finished room in Higgsfield with every object from §3 in place, using `docs/mockups/scene.png` as the style reference (same warm pixel style, the same desk and shelf where possible, the wall extended left for the record cabinet and the surfboard). **Rayyan approves the master before anything is cut from it.**
2. **Base layer:** an edit of the master with every interactive object removed.
3. **Sprites:** each object cut out of the master with background removal, as a transparent PNG with a recorded position. They match because they come from the same image.
4. **Window variants:** day / sunset / night as edits of the window region of the master.
5. **GPT image** for the flag lettering (USC, HKUST, Bocconi must be legible) and the surfboard (from Rayyan's reference photo); then match them into the master.
6. **UI art:** the game-card frame, the hotbar slots, the book spread, the journal pages, the record sleeves (pixelated album art) and the globe pin.

Higgsfield costs credits. Check the balance before generating, and show Rayyan options rather than burning credits on retries.

## 7. Build order

Each phase ends with something working that you can click through on a Vercel preview URL.

1. **Skeleton:** repo, shell copied in, AE removed; the current room art, the laptop zoom, and a desktop with Résumé + Contact. Not on rayyandarugar.com yet.
2. **Art:** master → base layer + sprites → window variants → UI art.
3. **Room engine:** manifest, layered render, pan, glow and tooltips, the hotbar, the whiteboard intro, game cards, overlay routing.
4. **Interactions:** record player, bookshelf, journal, globe, window.
5. **Polish and launch:** real content in the laptop apps, the phone layout, reduced motion, metadata and OG images, accessibility pass, then the domain switch.

Estimate honestly: phases 3–4 are the bulk. Plan in weeks.

## 8. Testing

- Unit tests for the room manifest (no overlapping hotspots, every hotbar slot maps to an object), the pan math, the time-of-day selection (fixed timestamps → expected variant), and the content loaders (every file parses, required frontmatter is present).
- Component tests for the overlay host: open via route, close via Esc and back, focus returns to the object.
- Rayyan's own click-through on the preview URL at the end of each phase, on desktop and his phone.

## 9. Content needed from Rayyan

None of this blocks phases 1–3.

- Résumé (PDF + text), projects (name, one-liner, link, images), mission statement
- One song for each of: Malcolm Todd, The Strokes, Daniel Caesar, Kendrick Lamar, Sade, Kanye West, Marvin Gaye
- A review + rating for each of: *Contact*, *Red Rising*, *Percy Jackson*, *The Three-Body Problem*, *Sapiens*, *Zero to One*, *Ender's Game*, *Old Man's War*
- At least 3 journal takes before launch
- Places for the globe: photo + a few lines each
- Photos: surfboard, dog (and their name), San Diego beach; dates + a story for each school (USC, HKUST, Bocconi)
- The whiteboard intro line and what the half-erased sketch shows
- Contact links; where rayyandarugar.com is registered now

## 10. Not in scope

- A CMS or admin panel (Markdown in the repo is the CMS)
- Comments, analytics beyond Vercel's, newsletter signup
- Users dragging or rearranging objects
- Any Attention Exchange product code
