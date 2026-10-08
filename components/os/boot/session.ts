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
