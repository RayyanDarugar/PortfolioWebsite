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

const ROOM_OVERLAY =
  /^\/(?:cards\/[^/]+|music|books(?:\/[^/]+)?|journal(?:\/[^/]+)?|places(?:\/[^/]+)?|san-diego)\/?$/

/** Paths the room opens over itself: game cards and the five interactions. */
export function isRoomOverlay(pathname: string): boolean {
  return ROOM_OVERLAY.test(pathname)
}

export function cardPath(id: string): string {
  return `/cards/${id}`
}
