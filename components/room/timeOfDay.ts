import * as SunCalc from 'suncalc'

/** The three lightings the room is drawn in (phase 2 art). */
export type Variant = 'day' | 'sunset' | 'night'

/** Spec §2: the window shows San Diego's time, not the visitor's. */
export const SAN_DIEGO = { lat: 32.7157, lon: -117.1611, tz: 'America/Los_Angeles' } as const

/**
 * Night before dawn and after dusk; sunset through either golden hour (the
 * warm art suits dawn too); day otherwise. suncalc works on absolute
 * instants, so the visitor's time zone never enters into it.
 *
 * suncalc types its event times as nullable (an event that does not happen
 * that day, which cannot occur at San Diego's latitude); if one ever is
 * missing, fall back to the sun's altitude, which suncalc 2 gives in degrees.
 */
export function timeOfDay(at: Date): Variant {
  const t = SunCalc.getTimes(at, SAN_DIEGO.lat, SAN_DIEGO.lon)
  const ms = at.getTime()
  if (t.dawn && t.dusk && t.goldenHour && t.goldenHourEnd) {
    if (ms < t.dawn.getTime() || ms >= t.dusk.getTime()) return 'night'
    if (ms >= t.goldenHour.getTime() || ms < t.goldenHourEnd.getTime()) return 'sunset'
    return 'day'
  }
  const altitude = SunCalc.getPosition(at, SAN_DIEGO.lat, SAN_DIEGO.lon).altitude
  return altitude < -6 ? 'night' : altitude < 6 ? 'sunset' : 'day'
}

export function sanDiegoClock(at: Date): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: SAN_DIEGO.tz, hour: 'numeric', minute: '2-digit' }).format(at)
}
