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
