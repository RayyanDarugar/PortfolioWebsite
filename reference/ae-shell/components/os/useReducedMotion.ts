'use client'
import { useCallback, useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Whether the visitor has asked for less motion.
 *
 * Subscribed rather than read once into state, for two reasons. It is a live
 * setting — someone who turns it on mid-page should have the drifting cursor
 * stop, not carry on until they reload — and reading it into state from an
 * effect means one render of the un-asked-for animation before the effect
 * corrects it.
 *
 * The server snapshot is `true`: nothing rendered on the server knows what
 * the visitor asked for, and the safe assumption about motion is always that
 * it is unwelcome.
 *
 * `matchMedia` is checked for rather than assumed. jsdom does not implement
 * it, so a component that only reaches this hook indirectly — the hero
 * window, through the auction beside it — would otherwise throw inside a
 * render in any test that had no reason to know a media query was involved.
 * A missing `matchMedia` is answered the same way the server is.
 */
export function useReducedMotion(): boolean {
  const subscribe = useCallback((notify: () => void) => {
    if (typeof window.matchMedia !== 'function') return () => {}
    const query = window.matchMedia(QUERY)
    query.addEventListener('change', notify)
    return () => query.removeEventListener('change', notify)
  }, [])

  return useSyncExternalStore(
    subscribe,
    () => typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches,
    () => true,
  )
}
