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
