'use client'
import { sanDiegoClock } from '@/components/room/timeOfDay'
import { useTimeOfDay } from '@/components/room/useTimeOfDay'
import { GameCard } from './GameCard'

const LINE = {
  day: 'Sun up over the Pacific.',
  sunset: 'Golden hour. The best part of the day.',
  night: 'Dark out, city lights along the water.',
} as const

/** The window's card (spec §4): San Diego right now, in its own light. The
 *  server and first render show the timeless line; the clock arrives after. */
export function SanDiegoCard() {
  const { variant, now } = useTimeOfDay()
  const photo = variant === 'sunset' ? '/room/sprites/window.png' : `/room/sprites/window.${variant}.png`
  return (
    <GameCard
      card={{
        id: 'san-diego',
        tag: 'PLACE · SAN DIEGO · NOW',
        title: 'San Diego',
        photo,
        stat: now ? `${sanDiegoClock(now)} in San Diego` : undefined,
        body: now ? ['Where I am, right now.', LINE[variant]] : ['Where I am, right now.'],
      }}
      prev={null}
      next={null}
    />
  )
}
