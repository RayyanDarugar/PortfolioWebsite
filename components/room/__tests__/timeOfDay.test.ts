import { describe, it, expect } from 'vitest'
import * as SunCalc from 'suncalc'
import { SAN_DIEGO, sanDiegoClock, timeOfDay } from '../timeOfDay'

// Times come from suncalc itself for a fixed day, so the test pins the
// classification, not suncalc's astronomy.
const day = new Date('2026-06-21T19:00:00Z') // noon in San Diego
const t = SunCalc.getTimes(day, SAN_DIEGO.lat, SAN_DIEGO.lon)
const mid = (a: Date | null, b: Date | null) => new Date((a!.getTime() + b!.getTime()) / 2)

describe('timeOfDay', () => {
  it('is day around solar noon', () => {
    expect(timeOfDay(t.solarNoon!)).toBe('day')
  })

  it('is sunset through the evening golden hour, and through the morning one', () => {
    expect(timeOfDay(mid(t.goldenHour, t.dusk))).toBe('sunset')
    expect(timeOfDay(mid(t.dawn, t.goldenHourEnd))).toBe('sunset')
  })

  it('is night after dusk and before dawn', () => {
    expect(timeOfDay(new Date(t.dusk!.getTime() + 60_000))).toBe('night')
    expect(timeOfDay(t.nadir!)).toBe('night')
  })

  it('never throws across a whole day, minute by minute', () => {
    for (let m = 0; m < 24 * 60; m += 1) {
      expect(['day', 'sunset', 'night']).toContain(timeOfDay(new Date(day.getTime() + m * 60_000)))
    }
  })
})

describe('sanDiegoClock', () => {
  it('tells San Diego time, whatever the visitor\'s zone', () => {
    expect(sanDiegoClock(day)).toBe('12:00 PM')
  })
})
