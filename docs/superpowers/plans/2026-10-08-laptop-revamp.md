# Laptop Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the laptop into a recruiter-facing portfolio: an Apple-style boot, a Mission Control picker at `/work`, a case-study app per project, and a Finder-style Experience app.

**Architecture:** Projects and roles are typed content modules, the same pattern as `content/resume.ts`. The app registry builds one dock app per project, and `view.ts` derives app IDs from that content, adding `/work/experience/<role>`. The picker replaces the empty desktop at `/work`. The boot is a one-per-session overlay shown when the camera lands from the room.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, framer-motion, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-08-laptop-revamp-design.md`, which extends `docs/superpowers/specs/2026-10-06-personal-website-design.md`.

**Plan-level rulings (deviations from the spec's letter):**
1. **Content is TypeScript, not Markdown.** Projects and roles are TS modules (`content/projects/*.ts`, `content/roles.ts`), not `.md` files with front matter. The OS is a client component that mounts every window, and the existing laptop content (`resume.ts`, `about.ts`, `videos.ts`) is TS. Markdown would need `fs` plus prop-drilling through the root layout, with nothing gained. The fields are the spec's fields.
2. **A project's `role` and `dates` are optional.** The News Digest has neither yet, and the spec forbids inventing them. Each renders only when present.

## Global Constraints

- **No invented numbers.** No "coming soon" sections. A section with no content does not render.
- **The boot mark** is an "RD" monogram, never Apple's logo. The boot is a black screen, the monogram, and a thin progress bar (about 2 s), then a fade. No text.
- **Boot rules:**
  - It plays once per browser session, when the camera lands from the room on `/work`.
  - It is skipped on any click or key, on deep links to `/work/<app>` and deeper, and on cold loads already on the laptop.
  - Under reduced motion it is a short fade.
  - `sessionStorage` access is always inside try/catch; if storage fails, the boot plays.
- **`/work` is the picker.** There is no empty-desktop state. Esc steps window → picker → room. F3 and the dock's Mission Control button return to the picker.
- **Recordings** are muted, looping and `playsInline`. They only get a `src` while their window is the active one; otherwise the poster or image shows. Under reduced motion they show the poster.
- **Dock order:** Mission Control | Résumé | Agent Dynamo | TikTok Platform | News Digest | Experience | Videos | About | Contact.
- **Every route is server-rendered** with its text in the HTML.
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Esc during the boot** must skip the boot only. It must not also step the laptop out to the room. (Task 7, test "Esc skips the boot without reaching the OS")
2. **`sessionStorage` that throws** (private mode, blocked storage) must not crash the laptop; the boot just plays. (Task 7, test "plays when storage throws")
3. **A project with almost no content** (the News Digest today) must render a clean window and a picker tile with no empty sections and no broken image. (Task 3, test "renders only the header when a project has nothing else"; Task 6, test "a tile with no preview shows its glyph")
4. **Esc inside the gallery lightbox** must close only the lightbox, not the window. (Task 3, test "Esc closes the lightbox, not the window")
5. **An unknown role slug** (`/work/experience/nope`) must be outside the laptop's scheme (a 404 overlay), not a frozen or half-open window. (Task 2, test "rejects unknown roles")

---

### Task 1: Project and role content

**Files:**
- Create: `content/projects/types.ts`, `content/projects/dynamo.ts`, `content/projects/tiktok.ts`, `content/projects/digest.ts`, `content/projects/index.ts`, `content/roles.ts`
- Test: `content/__tests__/projects.test.ts`, `content/__tests__/roles.test.ts`

**Interfaces:**
- Produces:
  - `interface Project { slug; name; tagline; role?; dates?; order: number; icon: ProjectIcon; tile: string; liveUrl?; displayUrl?; hero?: ProjectMedia; preview?: string; metrics?: readonly ProjectMetric[]; problem?: readonly string[]; built?: readonly string[]; next?: readonly string[]; gallery?: readonly GalleryItem[]; stack?: readonly string[]; diagram?: { src; alt } }`
  - `type ProjectIcon = 'bolt' | 'phone' | 'news'`
  - `interface ProjectMetric { value: string; label: string; headline?: boolean }`
  - `interface ProjectMedia { kind: 'video' | 'image'; src: string; poster?: string; alt: string }`
  - `interface GalleryItem { src: string; caption: string }`
  - `validateProjects(list): readonly Project[]` (sorted by `order`; throws)
  - `PROJECTS: readonly Project[]`
  - `headlineMetrics(list?): { value; label; app: string }[]`
  - `type RoleTag = 'engineering' | 'product' | 'leadership'`
  - `interface RoleView { slug; org; title; dates; place; bullets: readonly string[]; orgLine?; tags: readonly RoleTag[]; logo?; project?; links?: readonly { label; href }[]; gallery?: readonly GalleryItem[]; expansions?: Readonly<Record<number, string>> }`
  - `joinRoles(extras, resume?): RoleView[]` (throws)
  - `ROLES: readonly RoleView[]` (newest first)
  - `getRole(slug): RoleView | undefined`

- [ ] **Step 1: Write the failing tests**

`content/__tests__/projects.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { PROJECTS, headlineMetrics, validateProjects, type Project } from '../projects'

const base: Project = { slug: 'x', name: 'X', tagline: 'An x.', order: 1, icon: 'bolt', tile: 'linear-gradient(#000,#111)' }

describe('the projects', () => {
  it('are Dynamo, TikTok and the Digest, in dock order', () => {
    expect(PROJECTS.map((p) => p.slug)).toEqual(['dynamo', 'tiktok', 'digest'])
  })

  it('only claim numbers the résumé supports', () => {
    const tiktok = PROJECTS.find((p) => p.slug === 'tiktok')!
    expect(tiktok.metrics?.map((m) => m.value)).toEqual(['~20,000', '~600'])
    expect(PROJECTS.find((p) => p.slug === 'dynamo')!.metrics).toBeUndefined()
    expect(PROJECTS.find((p) => p.slug === 'digest')!.metrics).toBeUndefined()
  })

  it('feed the picker headline strip from flagged metrics', () => {
    expect(headlineMetrics()).toEqual([{ value: '~20,000', label: 'TikTok views in a week', app: 'tiktok' }])
    expect(headlineMetrics([base])).toEqual([])
  })
})

describe('validateProjects', () => {
  it('sorts by order', () => {
    const list = validateProjects([{ ...base, slug: 'b', order: 2 }, { ...base, slug: 'a', order: 1 }])
    expect(list.map((p) => p.slug)).toEqual(['a', 'b'])
  })

  it('rejects a missing name, a bad slug and a duplicate', () => {
    expect(() => validateProjects([{ ...base, name: '' }])).toThrow(/x: needs a name/)
    expect(() => validateProjects([{ ...base, slug: 'Bad Slug' }])).toThrow(/slug/)
    expect(() => validateProjects([base, { ...base, order: 2 }])).toThrow(/duplicate/)
  })
})
```

`content/__tests__/roles.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { RESUME } from '../resume'
import { ROLES, getRole, joinRoles } from '../roles'

describe('the roles', () => {
  it('cover every résumé entry, newest first', () => {
    expect(ROLES.map((r) => r.slug)).toEqual(['superset', 'kana', 'troylabs', 'btg', 'hemut', 'supervisor', 'deca'])
    expect(ROLES).toHaveLength(RESUME.experience.length + RESUME.leadership.length)
  })

  it('take their bullets from the résumé, so the two never disagree', () => {
    const kana = getRole('kana')!
    expect(kana.bullets).toBe(RESUME.experience.find((r) => r.org === 'Kana')!.bullets)
    expect(kana.title).toBe('GTM Engineer')
  })

  it('link super{set} to the TikTok platform it shipped', () => {
    expect(getRole('superset')!.project).toBe('tiktok')
  })

  it('fail loudly on an org the résumé does not have, or an unknown project', () => {
    expect(() => joinRoles([{ slug: 'x', org: 'Nowhere Inc', tags: [] }])).toThrow(/Nowhere Inc/)
    expect(() => joinRoles([{ slug: 'kana', org: 'Kana', tags: [], project: 'nope' }])).toThrow(/nope/)
  })
})
```

- [ ] **Step 2: Run them to watch them fail**

Run: `npx vitest run content/__tests__/projects.test.ts content/__tests__/roles.test.ts`
Expected: FAIL, cannot resolve `../projects` and `../roles`.

- [ ] **Step 3: Write the project content**

`content/projects/types.ts`:

```ts
/** A project case study on the laptop (spec §3.1). Every optional field's
 *  section renders only when it is set: nothing is invented to fill one. */

export type ProjectIcon = 'bolt' | 'phone' | 'news'

export interface ProjectMetric {
  value: string
  label: string
  /** Shown in the picker's headline strip. */
  headline?: boolean
}

export interface ProjectMedia {
  kind: 'video' | 'image'
  /** Under public/work/<slug>/. */
  src: string
  /** First frame, for a video: shown until its window is open. */
  poster?: string
  alt: string
}

export interface GalleryItem {
  src: string
  caption: string
}

export interface Project {
  slug: string
  name: string
  /** One plain line: what it is. Also the picker tile's description. */
  tagline: string
  role?: string
  dates?: string
  /** Dock and picker order among projects. */
  order: number
  icon: ProjectIcon
  /** The dock tile's fill. */
  tile: string
  liveUrl?: string
  /** The address shown in the hero's browser frame. */
  displayUrl?: string
  hero?: ProjectMedia
  /** The picker tile's image; falls back to the hero's image or poster. */
  preview?: string
  metrics?: readonly ProjectMetric[]
  problem?: readonly string[]
  built?: readonly string[]
  next?: readonly string[]
  gallery?: readonly GalleryItem[]
  stack?: readonly string[]
  diagram?: { src: string; alt: string }
}
```

`content/projects/dynamo.ts`:

```ts
import type { Project } from './types'

/** Agent Dynamo. The problem is Rayyan's own framing of it; metrics, media
 *  and the live link come when he sends them. */
export const DYNAMO: Project = {
  slug: 'dynamo',
  name: 'Agent Dynamo',
  tagline: 'The AI agent platform I founded.',
  role: 'Founder',
  order: 1,
  icon: 'bolt',
  tile: 'linear-gradient(#FFB648,#E2561F)',
  problem: [
    'Big companies are racing to build and deploy AI agents, and the way they are doing it is not working. MIT reports that 95% of companies trying this create zero value, an estimated $38 billion lost.',
    'The people who understand the work are not the ones building the agents. Every company runs procurement, finance and operations its own way, and an agent built without that knowledge does not survive contact with it.',
  ],
  built: [
    'Agent Dynamo puts building agents in the hands of the professionals who understand the work. What a company buys with Dynamo is an agent that is actually profitable, and a high chance it succeeds.',
  ],
}
```

`content/projects/tiktok.ts`:

```ts
import type { Project } from './types'

/** Shipped at super{set}; the numbers are the résumé's. */
export const TIKTOK: Project = {
  slug: 'tiktok',
  name: 'TikTok Platform',
  tagline: 'A fully automated B2C social marketing platform.',
  role: 'GTM Engineer, super{set}',
  dates: 'Summer 2026',
  order: 2,
  icon: 'phone',
  tile: 'linear-gradient(#3A3F4B,#101218)',
  metrics: [
    { value: '~20,000', label: 'TikTok views in a week', headline: true },
    { value: '~600', label: 'engagements in a week' },
  ],
  built: [
    'Built and shipped at super{set}: a platform that runs B2C social marketing on TikTok end to end, with no one in the loop.',
  ],
}
```

`content/projects/digest.ts`:

```ts
import type { Project } from './types'

/** The News Digest: a name until Rayyan sends what it does and how it went. */
export const DIGEST: Project = {
  slug: 'digest',
  name: 'News Digest',
  tagline: 'A news digest I built.',
  order: 3,
  icon: 'news',
  tile: 'linear-gradient(#F4F1EA,#C9BFAE)',
}
```

`content/projects/index.ts`:

```ts
import { DIGEST } from './digest'
import { DYNAMO } from './dynamo'
import { TIKTOK } from './tiktok'
import type { Project } from './types'

export type { GalleryItem, Project, ProjectIcon, ProjectMedia, ProjectMetric } from './types'

const SLUG = /^[a-z][a-z0-9-]*$/

/** Sorted by `order`. Throws on anything a window could not render. */
export function validateProjects(list: readonly Project[]): readonly Project[] {
  const seen = new Set<string>()
  for (const p of list) {
    if (!SLUG.test(p.slug)) throw new Error(`content/projects: "${p.slug}": slug must be lowercase letters, digits and dashes`)
    if (seen.has(p.slug)) throw new Error(`content/projects: duplicate slug "${p.slug}"`)
    seen.add(p.slug)
    if (!p.name.trim()) throw new Error(`content/projects: ${p.slug}: needs a name`)
    if (!p.tagline.trim()) throw new Error(`content/projects: ${p.slug}: needs a tagline`)
  }
  return [...list].sort((a, b) => a.order - b.order)
}

/** Every project, in dock order. Adding one is a file here plus this list. */
export const PROJECTS = validateProjects([DYNAMO, TIKTOK, DIGEST])

/** The picker's headline strip: flagged metrics, each with the app it opens. */
export function headlineMetrics(list: readonly Project[] = PROJECTS): { value: string; label: string; app: string }[] {
  return list.flatMap((p) => (p.metrics ?? []).filter((m) => m.headline).map((m) => ({ value: m.value, label: m.label, app: p.slug })))
}
```

- [ ] **Step 4: Write the role content**

`content/roles.ts`:

```ts
import { PROJECTS } from './projects'
import type { GalleryItem } from './projects'
import { RESUME } from './resume'

/** The Experience app's roles (spec §3.2). Title, dates, place and bullets
 *  come from the résumé by org, so the two never disagree; this adds what a
 *  recruiter needs beside them. */

export type RoleTag = 'engineering' | 'product' | 'leadership'

export interface RoleExtra {
  slug: string
  /** Exactly as in content/resume.ts. */
  org: string
  /** One line on what the org is, for the ones a recruiter won't know. */
  orgLine?: string
  tags: readonly RoleTag[]
  logo?: string
  /** A project that came out of this role. */
  project?: string
  links?: readonly { label: string; href: string }[]
  gallery?: readonly GalleryItem[]
  /** A short expansion under a bullet, by the bullet's index. */
  expansions?: Readonly<Record<number, string>>
}

export interface RoleView extends RoleExtra {
  title: string
  dates: string
  place: string
  bullets: readonly string[]
}

/** Newest first. */
const ROLE_EXTRAS: readonly RoleExtra[] = [
  { slug: 'superset', org: 'super{set} Venture Studio', orgLine: 'A San Francisco venture studio that founds and builds companies.', tags: ['engineering', 'product'], project: 'tiktok' },
  { slug: 'kana', org: 'Kana', tags: ['engineering'] },
  { slug: 'troylabs', org: 'TroyLabs', tags: ['product', 'leadership'] },
  { slug: 'btg', org: 'USC Business Technology Group', orgLine: 'A USC student consultancy working with tech companies.', tags: ['product'] },
  { slug: 'hemut', org: 'Hemut (YC X25)', orgLine: 'A Y Combinator (X25) startup.', tags: ['engineering'] },
  { slug: 'supervisor', org: 'Office of Supervisor Joel Anderson', orgLine: 'The District 2 office of San Diego Supervisor Joel Anderson.', tags: ['leadership'] },
  { slug: 'deca', org: 'California DECA', orgLine: 'California’s chapter of DECA, the high-school business and marketing organization.', tags: ['leadership'] },
]

type Resume = Pick<typeof RESUME, 'experience' | 'leadership'>

/** Joins each role to its résumé entry. Throws on an org the résumé lacks or
 *  a project that does not exist. */
export function joinRoles(extras: readonly RoleExtra[], resume: Resume = RESUME): RoleView[] {
  const all = [...resume.experience, ...resume.leadership]
  return extras.map((extra) => {
    const entry = all.find((r) => r.org === extra.org)
    if (!entry) throw new Error(`content/roles: ${extra.slug}: no résumé entry for "${extra.org}"`)
    if (extra.project && !PROJECTS.some((p) => p.slug === extra.project)) {
      throw new Error(`content/roles: ${extra.slug}: unknown project "${extra.project}"`)
    }
    return { ...extra, title: entry.title, dates: entry.dates, place: entry.place, bullets: entry.bullets }
  })
}

export const ROLES: readonly RoleView[] = joinRoles(ROLE_EXTRAS)

export function getRole(slug: string): RoleView | undefined {
  return ROLES.find((r) => r.slug === slug)
}
```

- [ ] **Step 5: Run the tests, typecheck and lint**

Run: `npx vitest run content/__tests__/projects.test.ts content/__tests__/roles.test.ts && npm run typecheck && npm run lint`
Expected: PASS (8 tests), with no type or lint errors.

- [ ] **Step 6: Commit**

```bash
git add content/projects content/roles.ts content/__tests__/projects.test.ts content/__tests__/roles.test.ts
git commit -m "Add project and role content for the laptop revamp

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Routes for projects and roles

**Files:**
- Modify: `components/os/view.ts`, `app/work/[app]/page.tsx`
- Create: `app/work/experience/page.tsx`, `app/work/experience/[role]/page.tsx`
- Test: `components/os/__tests__/view.test.ts` (extend)

**Interfaces:**
- Consumes: `PROJECTS` and `ROLES` (Task 1)
- Produces:
  - `FIXED_APP_IDS` (`resume`, `about`, `videos`, `contact`, `experience`)
  - `APP_IDS: readonly string[]` (fixed plus project slugs)
  - `type AppId = string`
  - `interface View { zoomed: boolean; app: AppId | null; sub?: string }`
  - `rolePath(slug): string`
  - `viewFromPath` accepts `/work/experience/<role>` and returns `{ zoomed: true, app: 'experience', sub: role }`
  - `pathFor` round-trips `sub`

- [ ] **Step 1: Write the failing tests** (append to `components/os/__tests__/view.test.ts`)

```ts
import { rolePath } from '../view'

describe('projects and roles', () => {
  it('open every project as an app', () => {
    expect(viewFromPath('/work/dynamo')).toEqual({ zoomed: true, app: 'dynamo' })
    expect(viewFromPath('/work/digest')).toEqual({ zoomed: true, app: 'digest' })
    expect(isAppId('experience')).toBe(true)
  })

  it('open a role inside Experience', () => {
    expect(viewFromPath('/work/experience')).toEqual({ zoomed: true, app: 'experience' })
    expect(viewFromPath('/work/experience/kana')).toEqual({ zoomed: true, app: 'experience', sub: 'kana' })
    expect(viewFromPath(rolePath('kana'))).toEqual({ zoomed: true, app: 'experience', sub: 'kana' })
    expect(pathFor({ zoomed: true, app: 'experience', sub: 'deca' })).toBe('/work/experience/deca')
  })

  // A mistyped role must be a 404 (an overlay over the room), not a laptop
  // view the OS half-opens.
  it('rejects unknown roles, and sub-paths of other apps', () => {
    expect(viewFromPath('/work/experience/nope')).toBeNull()
    expect(viewFromPath('/work/dynamo/kana')).toBeNull()
  })
})
```

- [ ] **Step 2: Run them to watch them fail**

Run: `npx vitest run components/os/__tests__/view.test.ts`
Expected: FAIL, `rolePath` is not exported and `/work/dynamo` is not an app.

- [ ] **Step 3: Update `components/os/view.ts`**

Replace the top of the file, through `pathFor`, with:

```ts
import { PROJECTS } from '@/content/projects'
import { ROLES } from '@/content/roles'

/**
 * The laptop's URL scheme, as pure functions.
 *
 * The URL is the state. `/` is the room, `/work` is the picker (the laptop's
 * home screen), `/work/<app>` is that app's window open on the desktop, and
 * `/work/experience/<role>` is Experience open on one role. Everything that
 * changes what is on screen does it by navigating, so Esc, the back button
 * and a pasted link all go through the same path.
 */

/** Apps that are not projects. Project apps take their ids from content. */
export const FIXED_APP_IDS = ['resume', 'about', 'videos', 'contact', 'experience'] as const

export const APP_IDS: readonly string[] = [...FIXED_APP_IDS, ...PROJECTS.map((p) => p.slug)]
export type AppId = string

for (const p of PROJECTS) {
  if ((FIXED_APP_IDS as readonly string[]).includes(p.slug)) {
    throw new Error(`content/projects: "${p.slug}" collides with a built-in app`)
  }
}

export interface View {
  zoomed: boolean
  app: AppId | null
  /** Experience's selected role. Absent everywhere else. */
  sub?: string
}

export const ROOM: View = { zoomed: false, app: null }
export const DESKTOP: View = { zoomed: true, app: null }

export function isAppId(value: string): value is AppId {
  return APP_IDS.includes(value)
}

export function rolePath(slug: string): string {
  return `/work/experience/${slug}`
}

/** `null` for any path this scheme does not own: a 404, or a later overlay route. */
export function viewFromPath(pathname: string): View | null {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return ROOM
  if (parts[0] !== 'work') return null
  if (parts.length === 1) return DESKTOP
  if (parts.length === 2 && isAppId(parts[1])) return { zoomed: true, app: parts[1] }
  if (parts.length === 3 && parts[1] === 'experience' && ROLES.some((r) => r.slug === parts[2])) {
    return { zoomed: true, app: 'experience', sub: parts[2] }
  }
  return null
}

export function pathFor(view: View): string {
  if (!view.zoomed) return '/'
  if (!view.app) return '/work'
  return view.sub ? `/work/${view.app}/${view.sub}` : `/work/${view.app}`
}
```

(Keep `ROOM_OVERLAY`, `isRoomOverlay` and `cardPath` below unchanged.)

- [ ] **Step 4: Update the pages**

In `app/work/[app]/page.tsx`, change `generateStaticParams` so `experience` is left to its own folder:

```ts
export function generateStaticParams() {
  // /work/experience has its own folder (for its /<role> children).
  return APPS.filter((app) => app.id !== 'experience').map((app) => ({ app: app.id }))
}
```

`app/work/experience/page.tsx`:

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Experience' }

/** Experience, open on its newest role. Rendered by <OS /> in the root layout. */
export default function ExperiencePage() {
  return null
}
```

`app/work/experience/[role]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ROLES, getRole } from '@/content/roles'

export const dynamicParams = false

export function generateStaticParams() {
  return ROLES.map((r) => ({ role: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const { role } = await params
  const found = getRole(role)
  return { title: found ? `${found.org} · Experience` : undefined }
}

/** Experience, open on one role. Rendered by <OS /> in the root layout. */
export default async function RolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params
  if (!getRole(role)) notFound()
  return null
}
```

- [ ] **Step 5: Run the tests and typecheck**

Run: `npx vitest run components/os && npm run typecheck && npm run lint`
Expected: PASS. The existing round-trip test still passes, because `APP_IDS` now includes the projects and `toEqual` ignores the absent `sub`. (`APPS` gains its projects in Task 5; until then `[app]` serves only the fixed apps.)

- [ ] **Step 6: Commit**

```bash
git add components/os/view.ts components/os/__tests__/view.test.ts app/work
git commit -m "Route projects as apps and roles inside Experience

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The project case-study window

**Files:**
- Modify: `components/os/registry.tsx` (the `AppSceneProps` interface only)
- Create: `components/os/apps/ProjectApp.tsx`, `components/os/apps/Lightbox.tsx`
- Test: `components/os/__tests__/project-app.test.tsx`

**Interfaces:**
- Consumes: `Project` (Task 1)
- Produces:
  - `AppSceneProps { onClose?: () => void; active?: boolean; sub?: string; onNavigate?: (path: string) => void; onOpenApp?: (id: string) => void }`
  - `ProjectApp({ project, onClose, active }: AppSceneProps & { project: Project })`
  - `Lightbox({ items, index, onClose })`

- [ ] **Step 1: Widen `AppSceneProps`** in `components/os/registry.tsx`

```ts
/** Everything an app window is handed. In the stacked fallback there is no
 *  desktop, so none of these are passed: no close, no routing, never active. */
export interface AppSceneProps {
  onClose?: () => void
  /** The window is the one open on the desktop. Heavy media waits for this. */
  active?: boolean
  /** Experience's selected role, from the URL. */
  sub?: string
  /** Replace the URL without adding history (Experience's sidebar). */
  onNavigate?: (path: string) => void
  /** Open another app's window (a role's related project). */
  onOpenApp?: (id: string) => void
}
```

- [ ] **Step 2: Write the failing test**

`components/os/__tests__/project-app.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Project } from '@/content/projects'
import { ProjectApp } from '../apps/ProjectApp'

const full: Project = {
  slug: 'demo', name: 'Demo', tagline: 'A demo product.', role: 'Founder', dates: '2026', order: 1, icon: 'bolt',
  tile: '#000', liveUrl: 'https://demo.example', displayUrl: 'demo.example',
  hero: { kind: 'video', src: '/work/demo/hero.mp4', poster: '/work/demo/hero.jpg', alt: 'Demo in use' },
  metrics: [{ value: '42', label: 'teams' }],
  problem: ['It was slow.'], built: ['I made it fast.'], next: ['More.'],
  gallery: [{ src: '/work/demo/1.png', caption: 'The dashboard' }],
  stack: ['Next.js', 'Postgres'],
}

describe('ProjectApp', () => {
  it('lays out every section it has content for', () => {
    render(<ProjectApp project={full} active />)
    expect(screen.getByRole('heading', { level: 2, name: 'Demo' })).toBeTruthy()
    expect(screen.getByText('A demo product.')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Try it live/ }).getAttribute('href')).toBe('https://demo.example')
    expect(screen.getByText('42')).toBeTruthy()
    for (const heading of ['The problem', 'What I built', 'How it works', 'What’s next']) {
      expect(screen.getByRole('heading', { level: 3, name: heading })).toBeTruthy()
    }
    expect(screen.getByText('Postgres')).toBeTruthy()
    expect(screen.getAllByText('demo.example').length).toBeGreaterThan(0) // the title bar and the browser frame
  })

  it('renders only the header when a project has nothing else', () => {
    render(<ProjectApp project={{ slug: 'bare', name: 'Bare', tagline: 'Just a name.', order: 1, icon: 'news', tile: '#fff' }} active />)
    expect(screen.getByRole('heading', { level: 2, name: 'Bare' })).toBeTruthy()
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
    expect(screen.queryByRole('link', { name: /Try it live/ })).toBeNull()
    expect(document.querySelector('img, video')).toBeNull()
  })

  it('loads the recording only while its window is the open one', () => {
    const { rerender, container } = render(<ProjectApp project={full} active={false} />)
    expect(container.querySelector('video')).toBeNull()
    expect(container.querySelector('img[src*="hero.jpg"]')).not.toBeNull()
    rerender(<ProjectApp project={full} active />)
    expect(container.querySelector('video')?.getAttribute('src')).toBe('/work/demo/hero.mp4')
  })

  it('Esc closes the lightbox, not the window', () => {
    const outer = vi.fn()
    window.addEventListener('keydown', outer)
    render(<ProjectApp project={full} active />)
    fireEvent.click(screen.getByRole('button', { name: /The dashboard/ }))
    const box = screen.getByRole('dialog', { name: 'The dashboard' })
    fireEvent.keyDown(box, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(outer).not.toHaveBeenCalled() // the OS's window listener never sees it
    window.removeEventListener('keydown', outer)
  })
})
```

- [ ] **Step 3: Run it to watch it fail**

Run: `npx vitest run components/os/__tests__/project-app.test.tsx`
Expected: FAIL, cannot resolve `../apps/ProjectApp`.

- [ ] **Step 4: Write `components/os/apps/Lightbox.tsx`**

```tsx
'use client'
import { useEffect } from 'react'
import type { GalleryItem } from '@/content/projects'

/**
 * A gallery image, large, over its window. Esc and a click outside close it.
 * Esc is caught in the capture phase and marked handled, so the OS's own Esc
 * (close the window) never sees it.
 */
export function Lightbox({ items, index, onClose }: { items: readonly GalleryItem[]; index: number; onClose: () => void }) {
  const item = items[index]
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])
  if (!item) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.caption}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-[10px] p-[28px]"
      style={{ background: 'rgba(10,12,16,.82)' }}
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- sized by the window, not known ahead */}
      <img src={item.src} alt={item.caption} className="max-h-[85%] max-w-full rounded-[8px] object-contain" onClick={(e) => e.stopPropagation()} />
      <p className="text-[13px] text-white/80" style={{ fontFamily: 'var(--font-ui)' }}>{item.caption}</p>
    </div>
  )
}
```

- [ ] **Step 5: Write `components/os/apps/ProjectApp.tsx`**

```tsx
'use client'
import { useCallback, useState, type ReactNode } from 'react'
import type { Project, ProjectMedia } from '@/content/projects'
import { OSWindow } from '../OSWindow'
import { INK, TYPE } from '../chrome'
import { Eyebrow, Stat } from '../parts'
import type { AppSceneProps } from '../registry'
import { useReducedMotion } from '../useReducedMotion'
import { Lightbox } from './Lightbox'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-[34px]">
      <h3 className="text-[13px] font-bold uppercase tracking-[.12em]" style={{ color: INK.dim, fontFamily: 'var(--font-ui)' }}>{title}</h3>
      <div className="mt-[12px]">{children}</div>
    </section>
  )
}

function Prose({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <div className="flex max-w-[64ch] flex-col gap-[12px]">
      {paragraphs.map((p) => <p key={p} className={TYPE.lead} style={{ color: INK.body }}>{p}</p>)}
    </div>
  )
}

/** The product in a browser frame, with its real address in the bar. */
function BrowserFrame({ url, media, live }: { url?: string; media: ProjectMedia; live: boolean }) {
  const still = media.kind === 'image' ? media.src : media.poster
  return (
    <figure className="overflow-hidden rounded-[10px]" style={{ boxShadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 12px 30px -10px rgba(16,24,40,.45)', border: '1px solid rgba(20,26,34,.14)' }}>
      <div className="flex items-center gap-[10px] px-[12px] py-[8px]" style={{ background: 'linear-gradient(#F4F6F9,#E3E8EE)' }}>
        <span aria-hidden className="flex gap-[6px]">{['#F5564C', '#F5B32C', '#2FC33F'].map((c) => <span key={c} className="h-[9px] w-[9px] rounded-full" style={{ background: c }} />)}</span>
        {url && <span className="truncate rounded-[6px] bg-white px-[10px] py-[2px] text-[12px]" style={{ color: INK.dim, fontFamily: 'var(--font-ui)' }}>{url}</span>}
      </div>
      {media.kind === 'video' && live ? (
        <video src={media.src} poster={media.poster} autoPlay muted loop playsInline aria-label={media.alt} className="block aspect-video w-full bg-black object-cover" />
      ) : still ? (
        // eslint-disable-next-line @next/next/no-img-element -- content media of unknown size
        <img src={still} alt={media.alt} className="block aspect-video w-full bg-black object-cover" />
      ) : null}
    </figure>
  )
}

/**
 * A project's case study (spec §3.1): hero, numbers, the problem, what was
 * built, how it works, what's next. Each section renders only with content.
 * The recording plays only while this window is the open one (`active`), and
 * never under reduced motion.
 */
export function ProjectApp({ project: p, onClose, active }: AppSceneProps & { project: Project }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState<number | null>(null)
  const closeLightbox = useCallback(() => setShown(null), [])
  const meta = [p.role, p.dates].filter(Boolean).join(' · ')
  const works = (p.stack && p.stack.length > 0) || p.diagram

  return (
    <OSWindow title={p.name} subtitle={p.displayUrl ?? 'Project'} onClose={onClose}>
      <div className="relative h-full overflow-y-auto p-[clamp(24px,2.6vw,42px)]">
        <div className={`grid items-center gap-[clamp(20px,2.4vw,36px)] ${p.hero ? 'lg:grid-cols-[1.25fr_1fr]' : ''}`}>
          {p.hero && <BrowserFrame url={p.displayUrl} media={p.hero} live={Boolean(active) && !reduced} />}
          <div>
            {meta && <Eyebrow>{meta}</Eyebrow>}
            <h2 className={`mt-[10px] ${TYPE.heading}`} style={{ color: INK.strong }}>{p.name}</h2>
            <p className={`mt-[8px] ${TYPE.lead}`} style={{ color: INK.body }}>{p.tagline}</p>
            {p.liveUrl && (
              <a href={p.liveUrl} target="_blank" rel="noopener noreferrer"
                 className="mt-[16px] inline-block rounded-[8px] px-[14px] py-[7px] text-[13px] font-bold text-white"
                 style={{ background: 'linear-gradient(#3B93F0,#1B6FD6)', fontFamily: 'var(--font-ui)' }}>
                Try it live →
              </a>
            )}
          </div>
        </div>

        {p.metrics && p.metrics.length > 0 && (
          <div className="mt-[30px] flex flex-wrap gap-[clamp(20px,3vw,48px)]">
            {p.metrics.map((m) => <Stat key={m.label} value={m.value} caption={m.label} size="hero" />)}
          </div>
        )}

        {p.problem && <Section title="The problem"><Prose paragraphs={p.problem} /></Section>}

        {(p.built || p.gallery) && (
          <Section title="What I built">
            {p.built && <Prose paragraphs={p.built} />}
            {p.gallery && (
              <ul className="mt-[16px] grid grid-cols-2 gap-[12px] lg:grid-cols-3">
                {p.gallery.map((g, i) => (
                  <li key={g.src}>
                    <button type="button" onClick={() => setShown(i)} aria-label={`Enlarge: ${g.caption}`} className="block w-full overflow-hidden rounded-[8px]">
                      {/* eslint-disable-next-line @next/next/no-img-element -- content media of unknown size */}
                      <img src={g.src} alt="" className="aspect-[16/10] w-full object-cover" />
                    </button>
                    <span className="mt-[4px] block text-[12px]" style={{ color: INK.dim }}>{g.caption}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {works && (
          <Section title="How it works">
            {p.stack && (
              <ul className="flex flex-wrap gap-[8px]">
                {p.stack.map((s) => (
                  <li key={s} className="rounded-full px-[10px] py-[3px] text-[12.5px] font-bold" style={{ background: 'rgba(20,26,34,.07)', color: INK.body, fontFamily: 'var(--font-ui)' }}>{s}</li>
                ))}
              </ul>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element -- content media of unknown size */}
            {p.diagram && <img src={p.diagram.src} alt={p.diagram.alt} className="mt-[16px] max-w-full rounded-[8px]" />}
          </Section>
        )}

        {p.next && <Section title="What’s next"><Prose paragraphs={p.next} /></Section>}

        {shown !== null && p.gallery && <Lightbox items={p.gallery} index={shown} onClose={closeLightbox} />}
      </div>
    </OSWindow>
  )
}
```

(The gallery buttons' accessible name is "Enlarge: <caption>", which the test's `/The dashboard/` regex matches.)

- [ ] **Step 6: Run the test, typecheck and lint**

Run: `npx vitest run components/os/__tests__/project-app.test.tsx && npm run typecheck && npm run lint`
Expected: PASS (4 tests). If `TYPE.lead` or `TYPE.heading` don't exist, use the keys `ResumeApp.tsx` uses: `TYPE.heading` and `TYPE.lead` are both used there.

- [ ] **Step 7: Commit**

```bash
git add components/os/registry.tsx components/os/apps/ProjectApp.tsx components/os/apps/Lightbox.tsx components/os/__tests__/project-app.test.tsx
git commit -m "Add the project case-study window, with a lightbox gallery

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The Experience window

**Files:**
- Create: `components/os/apps/ExperienceApp.tsx`
- Test: `components/os/__tests__/experience-app.test.tsx`

**Interfaces:**
- Consumes:
  - `ROLES`, `RoleView` and `RoleTag` (Task 1)
  - `rolePath` (Task 2)
  - `AppSceneProps` (Task 3)
  - `PROJECTS` (Task 1, for the related-project card's name)
- Produces: `ExperienceApp({ onClose, sub, onNavigate, onOpenApp }: AppSceneProps)`

- [ ] **Step 1: Write the failing test**

`components/os/__tests__/experience-app.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ROLES } from '@/content/roles'
import { ExperienceApp } from '../apps/ExperienceApp'

const detail = () => screen.getByRole('region', { name: 'Role' })

describe('ExperienceApp', () => {
  it('opens on the newest role', () => {
    render(<ExperienceApp />)
    expect(within(detail()).getByRole('heading', { level: 2 }).textContent).toBe(ROLES[0].org)
  })

  it('shows the role in the URL and moves the URL when another is picked', () => {
    const onNavigate = vi.fn()
    render(<ExperienceApp sub="kana" onNavigate={onNavigate} />)
    expect(within(detail()).getByRole('heading', { level: 2 }).textContent).toBe('Kana')
    fireEvent.click(screen.getByRole('button', { name: /California DECA/ }))
    expect(onNavigate).toHaveBeenCalledWith('/work/experience/deca')
  })

  it('picks locally where there is no URL to move (the stacked layout)', () => {
    render(<ExperienceApp />)
    fireEvent.click(screen.getByRole('button', { name: /Hemut/ }))
    expect(within(detail()).getByRole('heading', { level: 2 }).textContent).toBe('Hemut (YC X25)')
  })

  it('filters the list by kind of work', () => {
    render(<ExperienceApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Leadership' }))
    const list = screen.getByRole('list', { name: 'Roles' })
    expect(within(list).getAllByRole('button').map((b) => b.textContent)).toEqual(
      ROLES.filter((r) => r.tags.includes('leadership')).map((r) => expect.stringContaining(r.org)),
    )
  })

  it('links a role to the project that came out of it', () => {
    const onOpenApp = vi.fn()
    render(<ExperienceApp sub="superset" onNavigate={() => {}} onOpenApp={onOpenApp} />)
    fireEvent.click(within(detail()).getByRole('button', { name: /TikTok Platform/ }))
    expect(onOpenApp).toHaveBeenCalledWith('tiktok')
  })
})
```

- [ ] **Step 2: Run it to watch it fail**

Run: `npx vitest run components/os/__tests__/experience-app.test.tsx`
Expected: FAIL, cannot resolve `../apps/ExperienceApp`.

- [ ] **Step 3: Write `components/os/apps/ExperienceApp.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { PROJECTS } from '@/content/projects'
import { ROLES, type RoleTag, type RoleView } from '@/content/roles'
import { OSWindow } from '../OSWindow'
import { INK, TYPE } from '../chrome'
import { Eyebrow } from '../parts'
import type { AppSceneProps } from '../registry'
import { rolePath } from '../view'

type Filter = 'all' | RoleTag
const FILTERS: readonly { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'product', label: 'Product' },
  { id: 'leadership', label: 'Leadership' },
]

function Detail({ role, onOpenApp }: { role: RoleView; onOpenApp?: (id: string) => void }) {
  const project = role.project ? PROJECTS.find((p) => p.slug === role.project) : undefined
  return (
    <section aria-label="Role" className="h-full overflow-y-auto p-[clamp(22px,2.4vw,36px)]">
      <Eyebrow>{role.dates} · {role.place}</Eyebrow>
      <h2 className={`mt-[10px] ${TYPE.heading}`} style={{ color: INK.strong }}>{role.org}</h2>
      <p className="mt-[4px] text-[15px] italic" style={{ color: INK.body }}>{role.title}</p>
      {role.orgLine && <p className="mt-[8px] text-[13.5px]" style={{ color: INK.dim }}>{role.orgLine}</p>}

      <h3 className="mt-[26px] text-[13px] font-bold uppercase tracking-[.12em]" style={{ color: INK.dim, fontFamily: 'var(--font-ui)' }}>What I did</h3>
      <ul className="mt-[10px] flex list-disc flex-col gap-[8px] pl-[18px]">
        {role.bullets.map((b, i) => (
          <li key={b} className={TYPE.body} style={{ color: INK.body }}>
            {b}
            {role.expansions?.[i] && <span className="mt-[3px] block text-[13px]" style={{ color: INK.dim }}>{role.expansions[i]}</span>}
          </li>
        ))}
      </ul>

      {role.links && role.links.length > 0 && (
        <ul className="mt-[18px] flex flex-wrap gap-[14px]">
          {role.links.map((l) => <li key={l.href}><a href={l.href} target="_blank" rel="noopener noreferrer" className="text-[13.5px] font-bold text-[#1B6FD6] hover:underline">{l.label} →</a></li>)}
        </ul>
      )}

      {role.gallery && role.gallery.length > 0 && (
        <ul className="mt-[18px] grid grid-cols-2 gap-[12px]">
          {role.gallery.map((g) => (
            <li key={g.src}>
              {/* eslint-disable-next-line @next/next/no-img-element -- content media of unknown size */}
              <img src={g.src} alt={g.caption} className="aspect-[16/10] w-full rounded-[8px] object-cover" />
            </li>
          ))}
        </ul>
      )}

      {project && (
        <div className="mt-[24px]">
          <h3 className="text-[13px] font-bold uppercase tracking-[.12em]" style={{ color: INK.dim, fontFamily: 'var(--font-ui)' }}>What came out of it</h3>
          {onOpenApp ? (
            <button type="button" onClick={() => onOpenApp(project.slug)} className="mt-[10px] block rounded-[10px] px-[16px] py-[12px] text-left" style={{ background: 'rgba(20,26,34,.05)', border: '1px solid rgba(20,26,34,.1)' }}>
              <b className="block text-[15px]" style={{ color: INK.strong }}>{project.name}</b>
              <span className="text-[13px]" style={{ color: INK.body }}>{project.tagline}</span>
            </button>
          ) : (
            <a href={`#${project.slug}`} className="mt-[10px] block text-[14px] font-bold text-[#1B6FD6]">{project.name} →</a>
          )}
        </div>
      )}
    </section>
  )
}

/**
 * Experience (spec §3.2): a Finder-style list of roles and the selected one's
 * detail. On the desktop the selection lives in the URL (`sub`, moved with
 * `onNavigate`); in the stacked layout, with no URL to move, it is local.
 */
export function ExperienceApp({ onClose, sub, onNavigate, onOpenApp }: AppSceneProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [picked, setPicked] = useState<string | null>(null)
  const shown = ROLES.filter((r) => filter === 'all' || r.tags.includes(filter))
  const selected = (onNavigate ? sub : picked) ?? ROLES[0].slug
  const role = ROLES.find((r) => r.slug === selected) ?? ROLES[0]
  const pick = (slug: string) => (onNavigate ? onNavigate(rolePath(slug)) : setPicked(slug))

  return (
    <OSWindow title="Experience" subtitle={`${ROLES.length} roles`} onClose={onClose}>
      <div className="grid h-full grid-cols-[minmax(220px,30%)_1fr]">
        <aside className="flex h-full flex-col overflow-y-auto" style={{ background: 'rgba(232,236,241,.7)', borderRight: '1px solid rgba(20,26,34,.1)' }}>
          <div className="flex flex-wrap gap-[4px] p-[10px]" role="group" aria-label="Filter">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}
                      className="rounded-[6px] px-[9px] py-[3px] text-[12px] font-bold"
                      style={{ fontFamily: 'var(--font-ui)', background: filter === f.id ? '#fff' : 'transparent', color: filter === f.id ? INK.strong : INK.dim }}>
                {f.label}
              </button>
            ))}
          </div>
          <ul aria-label="Roles" className="flex flex-col px-[6px] pb-[10px]">
            {shown.map((r) => (
              <li key={r.slug}>
                <button type="button" onClick={() => pick(r.slug)} aria-current={r.slug === role.slug ? 'true' : undefined}
                        className="block w-full rounded-[7px] px-[10px] py-[8px] text-left"
                        style={{ background: r.slug === role.slug ? '#2E7FE0' : 'transparent', color: r.slug === role.slug ? '#fff' : INK.strong }}>
                  <b className="block truncate text-[13.5px]">{r.org}</b>
                  <span className="block truncate text-[11.5px] opacity-75">{r.dates}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <Detail role={role} onOpenApp={onOpenApp} />
      </div>
    </OSWindow>
  )
}
```

- [ ] **Step 4: Run the test, typecheck and lint**

Run: `npx vitest run components/os/__tests__/experience-app.test.tsx && npm run typecheck && npm run lint`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add components/os/apps/ExperienceApp.tsx components/os/__tests__/experience-app.test.tsx
git commit -m "Add the Experience window: roles, filters and related projects

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Register the new apps on the laptop

**Files:**
- Modify: `components/os/registry.tsx`, `components/os/icons.tsx`, `components/os/OS.tsx`, `components/os/DesktopItems.tsx`
- Test: `components/os/__tests__/OS.test.tsx` (extend)

**Interfaces:**
- Consumes:
  - `PROJECTS` (Task 1)
  - `ProjectApp` (Task 3)
  - `ExperienceApp` (Task 4)
  - `View.sub` (Task 2)
- Produces:
  - `AppDef` gains `blurb: string` and `preview?: string`
  - `APPS` in dock order: Résumé, the projects, Experience, Videos, About, Contact
  - New glyphs in `icons.tsx`: `BoltGlyph`, `PhoneGlyph`, `NewsGlyph`, `BriefcaseGlyph`, `GridGlyph`

- [ ] **Step 1: Write the failing tests** (append to `components/os/__tests__/OS.test.tsx`)

```tsx
describe('the revamped laptop', () => {
  it('docks the projects and Experience in order', () => {
    at('/work')
    render(<OS />)
    const dock = screen.getByRole('navigation', { name: 'Apps' })
    const names = within(dock).getAllByRole('button').map((b) => b.textContent?.trim())
    expect(names).toEqual(['Résumé', 'Agent Dynamo', 'TikTok Platform', 'News Digest', 'Experience', 'Videos', 'About', 'Contact'])
  })

  it('serves a project and a role with their text in the HTML', () => {
    at('/work/dynamo')
    expect(renderToString(<OS />)).toContain('MIT reports that 95%')
    at('/work/experience/kana')
    // The Résumé also carries Kana's bullets; the h2 is Experience's alone.
    expect(renderToString(<OS />)).toMatch(/<h2[^>]*>Kana<\/h2>/)
  })

  it('moves Experience’s role by replacing the URL', () => {
    at('/work/experience/kana')
    render(<OS />)
    fireEvent.click(screen.getByRole('button', { name: /California DECA/ }))
    expect(nav.router.replace).toHaveBeenCalledWith('/work/experience/deca', PUSH_OPTS)
  })
})
```

In this file's `nav` mock, make `replace` a spy so the last test can assert on it: change `replace: () => {}` to `replace: vi.fn()`. In `beforeEach`, clear it with `(nav.router.replace as ReturnType<typeof vi.fn>).mockClear()`.

- [ ] **Step 2: Run them to watch them fail**

Run: `npx vitest run components/os/__tests__/OS.test.tsx`
Expected: FAIL, the dock has only the four old apps.

- [ ] **Step 3: Add the glyphs to `components/os/icons.tsx`**

```tsx
/** Agent Dynamo: a bolt. */
export function BoltGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path d="M13.6 2.5 5.2 13.4h5.6l-1.4 8.1 8.4-10.9h-5.6l1.4-8.1Z" fill="#fff" stroke="rgba(120,40,0,.35)" strokeWidth=".8" strokeLinejoin="round" />
    </svg>
  )
}

/** The TikTok platform: a phone playing something. Not TikTok's mark. */
export function PhoneGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <rect x="6.2" y="2.4" width="11.6" height="19.2" rx="2.4" stroke="#fff" strokeWidth="1.6" />
      <path d="M10.4 9.2v5.6l4.6-2.8-4.6-2.8Z" fill="#FF3B6B" />
      <rect x="10.2" y="18.2" width="3.6" height="1.2" rx=".6" fill="#fff" />
    </svg>
  )
}

/** The News Digest: a folded paper. */
export function NewsGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <rect x="3.4" y="4.4" width="17.2" height="15.2" rx="1.6" fill="#fff" stroke="rgba(60,48,30,.45)" strokeWidth="1" />
      <rect x="5.6" y="6.8" width="12.8" height="2.6" rx=".6" fill="#2B2620" />
      <rect x="5.6" y="11" width="6" height="5.8" rx=".5" fill="#C9BFAE" />
      {[11.4, 13.6, 15.8].map((y) => <rect key={y} x="12.8" y={y} width="5.6" height="1.1" rx=".55" fill="rgba(43,38,32,.55)" />)}
    </svg>
  )
}

/** Experience: a briefcase. */
export function BriefcaseGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path d="M9 6.4V5a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 5v1.4" stroke="#fff" strokeWidth="1.6" />
      <rect x="3" y="6.6" width="18" height="13" rx="2.2" fill="#fff" />
      <path d="M3 12h18" stroke="#9A6A2E" strokeWidth="1.2" />
      <rect x="10.6" y="10.8" width="2.8" height="2.6" rx=".6" fill="#9A6A2E" />
    </svg>
  )
}

/** Mission Control: four windows. */
export function GridGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      {[[3, 4], [13, 4], [3, 13.4], [13, 13.4]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="8" height="6.6" rx="1.4" fill="#fff" fillOpacity=".92" />
      ))}
    </svg>
  )
}
```

- [ ] **Step 4: Rebuild `APPS` in `components/os/registry.tsx`**

Replace the imports, the `AppDef` interface and `APPS` with the following. Keep `AppSceneProps` from Task 3 and `appIndex` as they are.

```tsx
import type { ComponentType } from 'react'
import { PROJECTS, type Project, type ProjectIcon } from '@/content/projects'
import { ROLES } from '@/content/roles'
import { AboutApp } from './apps/AboutApp'
import { ContactApp } from './apps/ContactApp'
import { ExperienceApp } from './apps/ExperienceApp'
import { ProjectApp } from './apps/ProjectApp'
import { ResumeApp } from './apps/ResumeApp'
import { VideosApp } from './apps/VideosApp'
import { BoltGlyph, BriefcaseGlyph, DocGlyph, FilmGlyph, MailGlyph, NewsGlyph, PhoneGlyph, SunGlyph } from './icons'
import type { WindowFrame } from './stage'
import type { AppId } from './view'
```

```tsx
export interface AppDef {
  id: AppId
  /** Shown in the menu bar, the dock tooltip, Spotlight and the picker. */
  name: string
  /** The picker tile's one plain line: what this is. */
  blurb: string
  /** The picker tile's image. Without one the tile shows the glyph. */
  preview?: string
  Glyph: ComponentType
  /** The dock tile's fill. */
  tile: string
  /** Inset between the tile edge and the glyph, in px. */
  inset: number
  /** Size and position on the stage. See stage.ts. */
  frame: WindowFrame
  Scene: ComponentType<AppSceneProps>
}

const PROJECT_GLYPHS: Record<ProjectIcon, ComponentType> = { bolt: BoltGlyph, phone: PhoneGlyph, news: NewsGlyph }

/** A project's dock app: its case study, framed large. */
function projectApp(p: Project): AppDef {
  function ProjectScene(props: AppSceneProps) {
    return <ProjectApp project={p} {...props} />
  }
  return {
    id: p.slug, name: p.name, blurb: p.tagline, Glyph: PROJECT_GLYPHS[p.icon], inset: 11, tile: p.tile,
    preview: p.preview ?? (p.hero?.kind === 'image' ? p.hero.src : p.hero?.poster),
    frame: { w: 1180, h: 0.9, dx: 0, dy: 0 },
    Scene: ProjectScene,
  }
}

const RESUME_APP: AppDef = {
  id: 'resume', name: 'Résumé', blurb: 'The one-page version, with the PDF.', Glyph: DocGlyph, inset: 10,
  frame: { w: 980, h: 0.9, dx: -0.04, dy: 0 },
  tile: 'linear-gradient(#FFFFFF,#C9D3DF)',
  Scene: ResumeApp,
}

/**
 * The laptop's apps, in dock order: the résumé, every project (from
 * content/projects), then Experience, Videos, About and Contact. A new
 * project is a content file; it needs nothing here.
 */
export const APPS: readonly AppDef[] = [
  RESUME_APP,
  ...PROJECTS.map(projectApp),
  {
    id: 'experience', name: 'Experience', blurb: `${ROLES.length} roles, from GTM engineering to politics.`, Glyph: BriefcaseGlyph, inset: 11,
    frame: { w: 1080, h: 0.86, dx: 0.02, dy: 0 },
    tile: 'linear-gradient(#D9A35E,#8C5A22)',
    Scene: ExperienceApp,
  },
  {
    id: 'videos', name: 'Videos', blurb: 'Films I shot and cut.', Glyph: FilmGlyph, inset: 11,
    frame: { w: 1240, h: 0.9, dx: -0.02, dy: -0.01 },
    tile: 'linear-gradient(#4E5560,#22262D)',
    Scene: VideosApp,
  },
  {
    id: 'about', name: 'About', blurb: 'Why I build: making the world more beautiful.', Glyph: SunGlyph, inset: 11,
    frame: { w: 880, h: 0.82, dx: 0.05, dy: 0.01 },
    tile: 'linear-gradient(#FFC36E,#E0682C)',
    Scene: AboutApp,
  },
  {
    id: 'contact', name: 'Contact', blurb: 'Email and links.', Glyph: MailGlyph, inset: 10,
    frame: { w: 760, h: 0.7, dx: 0.06, dy: 0.02 },
    tile: 'linear-gradient(#63C4FF,#1B7FE0)',
    Scene: ContactApp,
  },
]
```

- [ ] **Step 5: Hand the windows their props in `components/os/OS.tsx`**

Add a replace-navigation beside `go`:

```tsx
  const replace = useCallback((path: string) => router.replace(path, { scroll: false }), [router])
```

Then change the window render to:

```tsx
                <app.Scene
                  onClose={closeApp}
                  active={i === active}
                  sub={i === active ? view.sub : undefined}
                  onNavigate={replace}
                  onOpenApp={openApp}
                />
```

- [ ] **Step 6: Put the projects on the wallpaper** (spec §2.3)

In `components/os/DesktopItems.tsx`, import `PROJECTS` from `@/content/projects` and replace the `ITEMS` constant, so the desktop reads as full of work wherever it shows around a window. They stay scenery: the picker and the dock are how you open things.

```tsx
/** The disk, a folder per project, and a file. */
const ITEMS: readonly Item[] = [
  { name: 'Macintosh HD', kind: 'disk' },
  ...PROJECTS.map((p) => ({ name: p.name, kind: 'folder' as const })),
  { name: 'notes.txt', kind: 'doc' },
]
```

Update the file's top comment to "a disk, a folder per project and a file". If `desktop.test.tsx` asserts the old three items, change it to expect `['Macintosh HD', 'Agent Dynamo', 'TikTok Platform', 'News Digest', 'notes.txt']`.

- [ ] **Step 7: Run the whole suite, typecheck and lint**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: PASS. If an older test counted dock buttons or apps, update its count to the new order and note it in the ledger.

- [ ] **Step 8: Commit**

```bash
git add components/os/registry.tsx components/os/icons.tsx components/os/OS.tsx components/os/DesktopItems.tsx components/os/__tests__
git commit -m "Put the projects and Experience on the laptop's dock

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: The picker, Mission Control and F3

**Files:**
- Create: `components/os/picker/Picker.tsx`
- Modify: `components/os/Dock.tsx` (a leading Mission Control button), `components/os/OS.tsx`
- Test: `components/os/__tests__/picker.test.tsx`, `components/os/__tests__/OS.test.tsx` (extend)

**Interfaces:**
- Consumes:
  - `APPS` and `AppDef` (Task 5)
  - `headlineMetrics` (Task 1)
  - `GridGlyph` (Task 5)
- Produces:
  - `Picker({ apps, headlines, onOpen }: { apps: readonly AppDef[]; headlines: readonly { value; label; app }[]; onOpen: (id: string) => void })`
  - `Dock` gains `onHome?: () => void` and `homeActive?: boolean`

- [ ] **Step 1: Write the failing tests**

`components/os/__tests__/picker.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { Picker } from '../picker/Picker'
import { APPS } from '../registry'

describe('Picker', () => {
  it('shows every app as a tile that says what it is', () => {
    render(<Picker apps={APPS} headlines={[]} onOpen={() => {}} />)
    const home = screen.getByRole('region', { name: 'Mission Control' })
    for (const app of APPS) {
      const tile = within(home).getByRole('button', { name: new RegExp(`^${app.name}`) })
      expect(tile.textContent).toContain(app.blurb)
    }
  })

  it('opens the app a tile names', () => {
    const onOpen = vi.fn()
    render(<Picker apps={APPS} headlines={[]} onOpen={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: /^Agent Dynamo/ }))
    expect(onOpen).toHaveBeenCalledWith('dynamo')
  })

  it('a tile with no preview shows its glyph, not a broken image', () => {
    const { container } = render(<Picker apps={APPS.filter((a) => a.id === 'digest')} headlines={[]} onOpen={() => {}} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('lists headline numbers that open their app, and hides the strip with none', () => {
    const onOpen = vi.fn()
    const { rerender } = render(<Picker apps={APPS} headlines={[{ value: '~20,000', label: 'TikTok views in a week', app: 'tiktok' }]} onOpen={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: /~20,000 TikTok views/ }))
    expect(onOpen).toHaveBeenCalledWith('tiktok')
    rerender(<Picker apps={APPS} headlines={[]} onOpen={onOpen} />)
    expect(screen.queryByRole('list', { name: 'Highlights' })).toBeNull()
  })
})
```

Append to `components/os/__tests__/OS.test.tsx`:

```tsx
describe('the picker', () => {
  it('is the laptop’s home screen at /work, server-rendered', () => {
    at('/work')
    expect(renderToString(<OS />)).toContain('aria-label="Mission Control"')
    render(<OS />)
    fireEvent.click(within(screen.getByRole('region', { name: 'Mission Control' })).getByRole('button', { name: /^Experience/ }))
    expect(nav.push).toHaveBeenCalledWith('/work/experience', PUSH_OPTS)
  })

  it('is not shown over an open window', () => {
    at('/work/resume')
    render(<OS />)
    expect(screen.queryByRole('region', { name: 'Mission Control' })).toBeNull()
  })

  it('comes back from the dock and from F3', () => {
    at('/work/resume')
    render(<OS />)
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Apps' })).getByRole('button', { name: 'Mission Control' }))
    expect(nav.push).toHaveBeenLastCalledWith('/work', PUSH_OPTS)
    nav.push.mockClear()
    fireEvent.keyDown(window, { key: 'F3' })
    expect(nav.push).toHaveBeenCalledWith('/work', PUSH_OPTS)
  })
})
```

In the Task 5 test "docks the projects and Experience in order", the dock now leads with Mission Control. Change its expected list to start with `'Mission Control'`.

- [ ] **Step 2: Run them to watch them fail**

Run: `npx vitest run components/os/__tests__/picker.test.tsx components/os/__tests__/OS.test.tsx`
Expected: FAIL, cannot resolve `../picker/Picker`, and there is no Mission Control button.

- [ ] **Step 3: Write `components/os/picker/Picker.tsx`**

```tsx
'use client'
import type { AppDef } from '../registry'

/**
 * The laptop's home screen (spec §2.2), Mission Control style: every app as a
 * large tile with a preview and one plain line on what it is, under a strip of
 * headline numbers. It is `/work`, so it is what a recruiter sees first.
 */
export function Picker({
  apps, headlines, onOpen,
}: {
  apps: readonly AppDef[]
  headlines: readonly { value: string; label: string; app: string }[]
  onOpen: (id: string) => void
}) {
  return (
    <section
      aria-label="Mission Control"
      className="absolute inset-x-0 bottom-[118px] top-[34px] z-[40] overflow-y-auto px-[clamp(20px,4vw,64px)] py-[clamp(16px,2.4vh,30px)]"
      style={{ background: 'rgba(8,10,20,.42)', backdropFilter: 'blur(14px) saturate(1.2)', WebkitBackdropFilter: 'blur(14px) saturate(1.2)' }}
    >
      {headlines.length > 0 && (
        <ul aria-label="Highlights" className="mb-[clamp(16px,2.4vh,28px)] flex flex-wrap justify-center gap-[10px]">
          {headlines.map((h) => (
            <li key={`${h.app}-${h.label}`}>
              <button type="button" onClick={() => onOpen(h.app)}
                      className="rounded-full px-[14px] py-[6px] text-[13px] text-white"
                      style={{ background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.22)', fontFamily: 'var(--font-ui)' }}>
                <b className="tabular">{h.value}</b> {h.label} →
              </button>
            </li>
          ))}
        </ul>
      )}

      <ul className="mx-auto grid max-w-[1200px] grid-cols-2 gap-[clamp(14px,1.6vw,24px)] lg:grid-cols-4">
        {apps.map((app) => (
          <li key={app.id}>
            <button type="button" onClick={() => onOpen(app.id)}
                    className="group block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <span className="block aspect-[16/10] overflow-hidden rounded-[12px] transition-transform duration-200 group-hover:-translate-y-[3px] group-hover:scale-[1.02]"
                    style={{ boxShadow: '0 14px 34px -12px rgba(0,0,0,.7), inset 0 0 0 1px rgba(255,255,255,.18)' }}>
                {app.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- content media of unknown size
                  <img src={app.preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center" style={{ background: app.tile }}>
                    <span className="block h-[38%] w-[38%]"><app.Glyph /></span>
                  </span>
                )}
              </span>
              <b className="mt-[10px] block text-[15px] text-white" style={{ fontFamily: 'var(--font-ui)', textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>{app.name}</b>
              <span className="mt-[2px] block text-[12.5px] leading-[1.35] text-white/75" style={{ fontFamily: 'var(--font-ui)' }}>{app.blurb}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

The tile's accessible name is its text content: the name, then the blurb. That's what the tests' `^Name` regexes match.

- [ ] **Step 4: Add the Mission Control button to `components/os/Dock.tsx`**

Add these props to the destructuring and the type:

```tsx
  /** Mission Control: back to the picker. */
  onHome?: () => void
  /** The picker is showing. */
  homeActive?: boolean
```

Import `GridGlyph` from `./icons`. Inside the `<nav>`, after `<style>{ASSEMBLE_CSS}</style>` and before `{apps.map(...)}`, add:

```tsx
        {onHome && (
          <>
            <button
              type="button"
              onClick={onHome}
              aria-current={homeActive ? 'true' : undefined}
              className="group relative flex flex-col items-center rounded-[16px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-white"
            >
              <span
                className="pointer-events-none absolute bottom-[calc(100%+12px)] whitespace-nowrap rounded-[7px] px-[10px] py-[5px] text-[12px] font-bold opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                style={{ fontFamily: 'var(--font-ui)', background: 'rgba(28,20,42,.86)', color: '#fff', border: '1px solid rgba(255,255,255,.16)', boxShadow: '0 10px 24px rgba(0,0,0,.4)' }}
              >
                Mission Control
              </span>
              <span className="relative block" style={{ width: TILE, height: TILE, borderRadius: 15, padding: 12, background: 'linear-gradient(#5B6475,#2A3040)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4), 0 10px 20px -6px rgba(6,8,24,.6)' }}>
                <GridGlyph />
              </span>
              <span aria-hidden className="mt-[5px] block h-[4px] w-[4px] rounded-full" style={{ background: '#fff', opacity: homeActive ? 1 : 0 }} />
            </button>
            <span aria-hidden className="mx-[2px] mb-[12px] block h-[46px] w-px self-end" style={{ background: 'rgba(255,255,255,.35)' }} />
          </>
        )}
```

- [ ] **Step 5: Wire the picker, the dock button and F3 into `components/os/OS.tsx`**

Imports:

```tsx
import { headlineMetrics } from '@/content/projects'
import { Picker } from './picker/Picker'
```

Module level, under the constants:

```tsx
const HEADLINES = headlineMetrics()
```

Inside the component, beside `closeApp`:

```tsx
  const goHome = useCallback(() => go(pathFor(DESKTOP)), [go])
```

In the keydown handler, right after the Esc block's `return }`:

```tsx
      if (landed && event.key === 'F3') {
        event.preventDefault()
        goHome()
        return
      }
```

Add `goHome` to that effect's dependency list.

After `<DesktopItems />`:

```tsx
          {/* /work is the picker: the laptop's home screen, never an empty desktop. */}
          {view.zoomed && !view.app && <Picker apps={APPS} headlines={HEADLINES} onOpen={openApp} />}
```

On the `<Dock ...>`, add:

```tsx
            onHome={goHome}
            homeActive={!view.app}
```

- [ ] **Step 6: Run the whole suite, typecheck and lint**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: PASS. The old test "opens an app from the dock" still passes, because it scopes to the dock.

- [ ] **Step 7: Commit**

```bash
git add components/os/picker components/os/Dock.tsx components/os/OS.tsx components/os/__tests__/picker.test.tsx components/os/__tests__/OS.test.tsx
git commit -m "Open the laptop on a Mission Control picker, with a dock button and F3

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: The boot

**Files:**
- Create: `components/os/boot/boot.ts`, `components/os/boot/Boot.tsx`
- Modify: `components/os/OS.tsx`, `app/globals.css`
- Test: `components/os/__tests__/boot.test.tsx`

**Interfaces:**
- Consumes: `landed` and `view.app` in OS
- Produces:
  - `BOOT_KEY = 'rd-booted'`
  - `hasBooted(): boolean`
  - `markBooted(): void`
  - `useBoot(landed: boolean, app: string | null): { booting: boolean; done: () => void }`
  - `Boot({ reduced, onDone })`
  - `BOOT_MS = 2000`
  - `BOOT_REDUCED_MS = 300`

- [ ] **Step 1: Write the failing test**

`components/os/__tests__/boot.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { BOOT_KEY, BOOT_MS, hasBooted, markBooted, useBoot } from '../boot/boot'
import { Boot } from '../boot/Boot'

beforeEach(() => { sessionStorage.clear(); vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

describe('useBoot', () => {
  it('boots when the camera lands from the room on the picker', () => {
    const { result, rerender } = renderHook(({ landed, app }) => useBoot(landed, app), { initialProps: { landed: false, app: null as string | null } })
    expect(result.current.booting).toBe(false)
    rerender({ landed: true, app: null })
    expect(result.current.booting).toBe(true)
    expect(sessionStorage.getItem(BOOT_KEY)).toBe('1')
  })

  it('only once per session', () => {
    markBooted()
    const { result, rerender } = renderHook(({ landed }) => useBoot(landed, null), { initialProps: { landed: false } })
    rerender({ landed: true })
    expect(result.current.booting).toBe(false)
  })

  it('never on a deep link, or a cold load already on the laptop', () => {
    const deep = renderHook(({ landed }) => useBoot(landed, 'resume'), { initialProps: { landed: false } })
    deep.rerender({ landed: true })
    expect(deep.result.current.booting).toBe(false)
    const cold = renderHook(() => useBoot(true, null))
    expect(cold.result.current.booting).toBe(false)
  })

  it('plays when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    expect(hasBooted()).toBe(false)
    expect(() => markBooted()).not.toThrow()
    const { result, rerender } = renderHook(({ landed }) => useBoot(landed, null), { initialProps: { landed: false } })
    rerender({ landed: true })
    expect(result.current.booting).toBe(true)
  })
})

describe('Boot', () => {
  it('shows the monogram and a progress bar, then finishes on its own', () => {
    const onDone = vi.fn()
    render(<Boot reduced={false} onDone={onDone} />)
    expect(screen.getByRole('img', { name: 'RD' })).toBeTruthy()
    expect(screen.getByRole('progressbar')).toBeTruthy()
    act(() => { vi.advanceTimersByTime(BOOT_MS) })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('a click skips it', () => {
    const onDone = vi.fn()
    render(<Boot reduced={false} onDone={onDone} />)
    fireEvent.click(screen.getByTestId('boot'))
    expect(onDone).toHaveBeenCalled()
  })

  it('Esc skips the boot without reaching the OS', () => {
    const onDone = vi.fn()
    const os = vi.fn((e: KeyboardEvent) => e.defaultPrevented)
    window.addEventListener('keydown', os)
    render(<Boot reduced={false} onDone={onDone} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onDone).toHaveBeenCalled()
    expect(os.mock.results[0]?.value).toBe(true)
    window.removeEventListener('keydown', os)
  })

  it('under reduced motion is a short fade with no bar', () => {
    const onDone = vi.fn()
    render(<Boot reduced onDone={onDone} />)
    expect(screen.queryByRole('progressbar')).toBeNull()
    act(() => { vi.advanceTimersByTime(300) })
    expect(onDone).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run it to watch it fail**

Run: `npx vitest run components/os/__tests__/boot.test.tsx`
Expected: FAIL, cannot resolve `../boot/boot`.

- [ ] **Step 3: Write `components/os/boot/boot.ts`**

```ts
'use client'
import { useCallback, useState } from 'react'

/** Session flag: the boot has played. Storage can throw (private mode,
 *  blocked site data); then the boot just plays again. */
export const BOOT_KEY = 'rd-booted'
export const BOOT_MS = 2000
export const BOOT_REDUCED_MS = 300

export function hasBooted(): boolean {
  try {
    return sessionStorage.getItem(BOOT_KEY) === '1'
  } catch {
    return false
  }
}

export function markBooted(): void {
  try {
    sessionStorage.setItem(BOOT_KEY, '1')
  } catch {
    // Nothing to remember it in: it plays again next time.
  }
}

/**
 * Whether the boot is showing. It starts when the camera lands (`landed`
 * goes false → true after mount) on the picker (`app` null), once per
 * session. A cold load already on the laptop never lands, so it never boots,
 * and nor does a deep link to an app. Derived during render (React's
 * "adjust state when a prop changes"), not in an effect.
 */
export function useBoot(landed: boolean, app: string | null): { booting: boolean; done: () => void } {
  const [prev, setPrev] = useState(landed)
  const [booting, setBooting] = useState(false)
  if (landed !== prev) {
    setPrev(landed)
    if (landed && app === null && !hasBooted()) {
      markBooted()
      setBooting(true)
    } else if (!landed) {
      setBooting(false)
    }
  }
  const done = useCallback(() => setBooting(false), [])
  return { booting, done }
}
```

- [ ] **Step 4: Write `components/os/boot/Boot.tsx`**

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { BOOT_MS, BOOT_REDUCED_MS } from './boot'

/**
 * A plain Apple-style boot (spec §2.1): black, Rayyan's RD monogram (never
 * Apple's logo), and a thin bar filling beneath it, then the picker. Any click
 * or key skips it. Keys are caught in the capture phase and marked handled,
 * so an Esc meant to skip the boot doesn't also leave the laptop.
 */
export function Boot({ reduced, onDone }: { reduced: boolean; onDone: () => void }) {
  const finished = useRef(false)
  const finish = useRef(onDone)
  useEffect(() => { finish.current = onDone }, [onDone])

  useEffect(() => {
    const end = () => {
      if (finished.current) return
      finished.current = true
      finish.current()
    }
    const timer = window.setTimeout(end, reduced ? BOOT_REDUCED_MS : BOOT_MS)
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()
      end()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [reduced])

  return (
    <div
      data-testid="boot"
      className={`absolute inset-0 z-[90] flex flex-col items-center justify-center bg-black ${reduced ? 'boot-fade' : ''}`}
      onClick={() => { if (!finished.current) { finished.current = true; finish.current() } }}
    >
      <svg role="img" aria-label="RD" viewBox="0 0 120 80" className="h-[clamp(56px,7vw,92px)] w-auto">
        <text x="60" y="58" textAnchor="middle" fill="#fff" fontSize="56" fontWeight="800" letterSpacing="-2" style={{ fontFamily: 'var(--font-archivo)' }}>RD</text>
      </svg>
      {!reduced && (
        <div role="progressbar" aria-label="Starting up" className="mt-[clamp(28px,4vh,44px)] h-[5px] w-[clamp(150px,14vw,210px)] overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,.22)' }}>
          <div className="boot-fill h-full rounded-full bg-white" />
        </div>
      )}
    </div>
  )
}
```

Append to `app/globals.css`, above the reduced-motion block:

```css
/* The boot's progress bar fills once, then the picker fades in. */
@keyframes boot-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.boot-fill { transform-origin: left center; animation: boot-fill 1.8s cubic-bezier(.4,.1,.3,1) forwards; }
@keyframes boot-fade { from { opacity: 1; } to { opacity: 0; } }
.boot-fade { animation: boot-fade .3s ease-out forwards; }
```

- [ ] **Step 5: Mount it in `components/os/OS.tsx`**

Imports:

```tsx
import { Boot } from './boot/Boot'
import { useBoot } from './boot/boot'
```

After `const landed = ...`:

```tsx
  const boot = useBoot(landed, view.app)
```

In the Esc branch of the keydown handler there's nothing to add: the boot's capture listener has already marked the key handled, and the handler returns on `defaultPrevented`.

As the last child inside `<Laptop>`, after `<Dock ... />`:

```tsx
          {boot.booting && <Boot reduced={reduced} onDone={boot.done} />}
```

- [ ] **Step 6: Run the whole suite, typecheck and lint**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: PASS (8 new tests).

- [ ] **Step 7: Commit**

```bash
git add components/os/boot components/os/OS.tsx app/globals.css components/os/__tests__/boot.test.tsx
git commit -m "Boot the laptop once per visit with an RD monogram and a progress bar

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Click-through and push

- [ ] **Step 1: On a fresh production server** (`npm run build && npx next start -p 3124`), at 1440×900, check:
  1. **Boot:** room → click the laptop → the camera lands → boot (black, RD, bar) → the picker. Leave and re-enter: no boot. Reload `/` and enter: no boot (same session). A new tab: boot. A click during the boot skips it. Esc during the boot skips it and stays on the laptop.
  2. **Picker:** every tile names its app and says what it is. The headline strip shows "~20,000 TikTok views in a week" and opens TikTok. Each tile opens its window.
  3. **Project windows:** Dynamo shows the problem and what was built. TikTok shows its two numbers. The Digest shows only its header. No empty sections anywhere.
  4. **Experience:** opens on super{set}. Picking a role changes the URL (`/work/experience/<role>`) without adding history. The filters work. super{set} → TikTok Platform opens TikTok.
  5. **Getting around:** Esc from a window goes to the picker, then to the room. The dock's Mission Control button and F3 bring the picker back.
  6. **Deep links:** `/work/dynamo` and `/work/experience/deca` load straight into their window with no boot. `/work/experience/nope` is the 404 overlay.
  7. **Reduced motion:** the boot is a short fade with no bar.
  8. **Console:** no errors (the favicon 404 is known).
- [ ] **Step 2: Push**

```bash
git push
```
