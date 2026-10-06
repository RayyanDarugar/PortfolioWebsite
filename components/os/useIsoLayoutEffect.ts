import { useEffect, useLayoutEffect } from 'react'

/**
 * `useLayoutEffect` on the client, `useEffect` on the server.
 *
 * Client components are still server-rendered for the initial HTML in this
 * app, and React logs a warning for every `useLayoutEffect` in that pass. The
 * layout timing is load-bearing here — the boot overlay and the OS/stacked
 * decision both have to commit before the browser paints, or the visitor sees
 * a frame of the wrong thing — so the hook is kept and the server branch is
 * swapped instead. Same shape `components/Reveal.tsx` already uses.
 */
export const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
