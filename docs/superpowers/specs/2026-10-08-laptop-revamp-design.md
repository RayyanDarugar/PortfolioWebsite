# The laptop, revamped: design

Approved in conversation on 2026-10-08. It extends `2026-10-06-personal-website-design.md`, and that spec still governs everything this one doesn't change. It comes before Phase 5 (the phone layout).

## 1. Intent

**Who it is for:** recruiters and hiring managers for GTM engineering, product and VC roles.

**What they should take away:** this person ships real things, fast, and can prove it.

**What "working" means:**
- Within one click of the laptop opening, a recruiter can see what each app is.
- Within two clicks they reach proof: numbers, a recording of the real product, and a live link.

**Today's laptop falls short.** It has four apps (Résumé, About, Videos, Contact), and the career exists only as résumé bullets.

Rayyan can supply, per project, all of:
- screenshots and screen recordings
- live links and demos
- metrics
- write-ups and decks

Until that material arrives, each piece shows only what the résumé supports. Rule: **no invented numbers, and no "coming soon" sections.** A section with no content does not render.

## 2. The flow into the laptop

The flow is room → zoom → **boot** → **picker** → desktop.

### 2.1 Boot

- **Look:** a plain Apple-style boot. A black screen, a white **RD** monogram centred (Rayyan's own mark, never Apple's logo), and a thin progress bar beneath it that fills over about 2 s. Then a fade to the picker. No text, no jokes.
- **Plays:** once per browser session, the first time the camera lands on the screen from the room.
- **Skipped:**
  - on any click or key press
  - on a later entry in the same session (remembered in `sessionStorage`, wrapped in try/catch; if storage fails, it plays)
  - on any deep link to `/work/<app>` or deeper
- **Reduced motion:** a single short fade from black to the picker.

### 2.2 The picker (`/work`)

The picker is the laptop's home screen, Mission Control style. It replaces the empty desktop: `/work` *is* the picker, and there is no "desktop with nothing open" state.

- **Layout:** a full-screen grid of large tiles, one per app, over the dimmed wallpaper. Each tile has:
  - a preview image: a real screenshot from the app's content, with a pixel-styled fallback when there is none
  - the app name
  - one plain line saying what it is, for example "Agent Dynamo: the AI agent platform I founded" or "Experience: 7 roles, from GTM engineering to politics"
- **Headline strip:** three to five headline numbers across the top. Each links to the app it came from. Only numbers present in content are shown; if there are none, the strip is hidden.
- **Opening an app:** clicking a tile zooms it into that app's window (`/work/<app>`).
- **Entry:** it shows every time you enter from the room. Deep links go straight to their window.
- **Getting back to it:** a Mission Control button at the left of the dock, plus the **F3** key, returns to `/work`.
- **Esc:** steps out one level at a time, from window → picker → room (the existing behaviour, one level per Esc). Scrolling up anywhere on the laptop still zooms out to the room.

### 2.3 The desktop

The desktop is unchanged in kind: windows, the dock, Spotlight, the menu bar, and scroll up to leave.

- **Dock order:** Mission Control | Résumé | Agent Dynamo | TikTok Platform | News Digest | Experience | Videos | About | Contact.
- **Desktop icons:** the project apps also appear as icons on the wallpaper, so the screen reads as full of work.

## 3. Apps

### 3.1 Project case studies

The project apps are Agent Dynamo, the TikTok marketing platform, the News Digest, and any project added later. All use one template.

**Source:** `content/projects/<slug>.md`. The front matter holds the data and the body holds prose sections. The order of entries in the dock and picker comes from an `order` field.

**Front matter:** `name`, `tagline`, `role`, `dates`, `order`, `liveUrl?`, `displayUrl?` (the URL shown in the browser frame), `hero?`, `metrics?: {value, label}[]`, `gallery?: {src, caption}[]`, `stack?: string[]`, `diagram?`, `headline?` (the metric indices that feed the picker's strip).

**Media:** `public/work/<slug>/`. Recordings are short, muted, looping `.mp4` files, loaded only when their window opens (`preload="none"`, mounted with the window). Under reduced motion they show the poster frame.

**The window scrolls through these sections, in order:**
1. **Hero:** the recording or screenshot inside a browser frame showing `displayUrl` in the address bar. Beside it: name, tagline, role, dates, and a **Try it live →** button when `liveUrl` is set (opens in a new tab).
2. **Numbers:** `metrics` as three or four large figures.
3. **The problem:** the body's `## Problem` section, two or three sentences, problem first.
4. **What I built:** the body's `## Built` section plus the `gallery`, which opens into a lightbox.
5. **How it works:** `stack` as chips, plus `diagram` (an image) when given.
6. **What I learned / what's next:** the body's `## Next` section.

Any section whose data is missing does not render.

**Routes:** `/work/<slug>`, for example `/work/dynamo`, `/work/tiktok` and `/work/digest`.

### 3.2 Experience

The Experience app is a Finder-style window.

**Source:** `content/roles/<slug>.md`, one per role. The roles are super{set}, Kana, TroyLabs, USC BTG, Hemut, the Office of Supervisor Joel Anderson, and California DECA.

**Front matter:** `org`, `title`, `dates`, `location`, `orgLine` (one line on what the org is), `logo?`, `tags: ('engineering'|'product'|'leadership')[]`, `project?` (the slug of a related project), `links?`, `gallery?`.

**Bullets:** the role's bullets come from `content/resume.ts`, the same data as the Résumé, so the two never disagree. The role file's body may add a short expansion under any bullet, keyed by the bullet's order.

**Window layout:**
- **Sidebar:** All / Engineering / Product / Leadership filters on top, then roles newest first, each with logo, org and dates.
- **Detail pane:** a header (org, title, dates, location, `orgLine`), "What I did" (the bullets and their expansions), proof (`gallery` and `links`), and a related-project card when `project` is set.

**Routes:** `/work/experience` (the newest role selected) and `/work/experience/<role>`.

**Role-to-project links are not yet known.** They stay empty until Rayyan provides them.

### 3.3 Unchanged

Résumé (including the PDF), Videos, About and Contact are unchanged, apart from their picker tiles and descriptions.

## 4. Architecture

- **App IDs become content-driven.** The fixed IDs (`resume`, `about`, `videos`, `contact`, `experience`) are joined by one ID per project file.
  - `view.ts` keeps its pure path functions. It takes the project slugs as data and accepts `/work/experience/<role>`.
  - Project and role files are read on the server: the root layout, a server component, passes the parsed list to `<OS/>` as props, so no `fs` reaches the client.
  - A slug that collides with a fixed ID fails the build.
- **New units:**
  - `content/projects.ts` and `content/roles.ts`: loaders with validation that fails the build on missing required fields.
  - `components/os/boot/Boot.tsx`: the monogram, progress bar and skip rules.
  - `components/os/picker/Picker.tsx`: tiles and the headline strip.
  - `components/os/apps/ProjectApp.tsx`: the case-study template.
  - `components/os/apps/ExperienceApp.tsx`.
  - A `Lightbox` for galleries.
- **Server rendering:** every route is server-rendered with its text in the HTML, so a recruiter's link preview and search engines see real content.
- **Phone:** the stacked layout (Phase 5) shows the same content as plain sections, and nothing here depends on hover. The boot and picker are desktop-only; on the phone, the stacked layout starts at the content.

## 5. Testing

- **Unit tests:**
  - project and role parsing, including validation failures and slug collisions
  - each case-study section renders only when it has data
  - the boot's skip rules: session, deep link, reduced motion, key or click
  - picker tile → route
  - the headline strip hidden with no metrics
  - Experience filters and selection, and role bullets matching the Résumé
  - `view.ts` paths for projects and roles
  - server-rendered text on every new route
  - recordings not requested before their window opens
- **Click-through** on a production build at 1440×900: zoom → boot → picker → each app → Esc out level by level; skip the boot; deep links; reduced motion; no console errors.

## 6. Content needed from Rayyan

- **For each project:**
  - screenshots and recordings
  - the live link
  - three or four metrics
  - a problem, built and next paragraph each (or a deck to draw them from)
  - the stack
- **For each role:** a logo, a one-line description of the org, any proof (screenshots or links), and which project, if any, came from it.
- **For the picker strip:** which headline numbers to use.

## 7. Not in scope

- Bespoke per-product mock UIs (approach C). A browser frame around a recording stands in for them.
- Live iframes of products. Most sites refuse to be framed.
- Changes to the room, the phone layout, or the Résumé, Videos, About and Contact apps.
